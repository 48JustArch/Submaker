'use client';

import { useState, useEffect } from 'react';
import { X, Download, FileAudio, CheckCircle2, ChevronRight, Video, Loader2, AlertCircle } from 'lucide-react';
import { Track } from '@/components/studio/types';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
// Helper functions assumed to stay the same or be imported
const writeWavHeader = (samples: Float32Array, sampleRate: number, numChannels: number) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    const writeString = (view: DataView, offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };
    floatTo16BitPCM(view, 44, samples);
    return buffer;
};

import { createEffectChain, EffectType } from '@/lib/audio/effects';
import { closeSession, incrementGenerationCount } from '@/lib/supabase/sessions';

interface ExportModalProps {
    onClose: () => void;
    isOpen: boolean;
    tracks: Track[];
    sessionId?: string;
    userId?: string;
    onExportComplete?: () => void;
}

export default function ExportModal({ onClose, isOpen, tracks, sessionId, userId, onExportComplete }: ExportModalProps) {
    const router = useRouter();
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing...');
    const [step, setStep] = useState<'settings' | 'exporting' | 'complete'>('settings');
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [format, setFormat] = useState<'wav' | 'mp4'>('wav');
    const [fileExtension, setFileExtension] = useState<string>('wav');

    useEffect(() => {
        if (!isOpen) {
            setStep('settings');
            setIsExporting(false);
            setProgress(0);
            setDownloadUrl(null);
            setError(null);
            setStatusMessage('Initializing...');
            setFormat('wav');
            setFileExtension('wav');
        } else {
            // Auto-select format based on content
            const hasVisuals = tracks.some(t => t.type === 'video' || t.type === 'image');
            if (hasVisuals) setFormat('mp4');
        }
    }, [isOpen, tracks]);

    const finishExport = async (url: string) => {
        try {
            setDownloadUrl(url);
            setProgress(100);

            // Finalize session immediately
            if (sessionId && userId) {
                // Non-blocking DB update
                try {
                    const audioType = format === 'wav' ? 'wav' : 'mp4';
                    await closeSession(sessionId, url, audioType);
                    await incrementGenerationCount(userId);
                } catch (e) {
                    console.error("Failed to save session state:", e);
                }
            }
        } catch (err) {
            console.error("Critical export error:", err);
        } finally {
            // Always show completion screen
            setStep('complete');
            setIsExporting(false);
        }
    };

    const performExport = async () => {
        try {
            setStep('exporting');
            setIsExporting(true);
            setProgress(1);

            const audioTracks = tracks.filter(t => t.type === 'audio');
            const visualTrack = tracks.find(t => t.type === 'video' || t.type === 'image');
            const duration = Math.max(...tracks.map(t => t.duration)) || 10;

            if (tracks.length === 0) throw new Error("No tracks to export.");

            // --- AUDIO RENDERING ---
            setStatusMessage('Rendering audio mix...');
            const sampleRate = 44100;
            const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

            const bufferPromises = audioTracks.map(async (track) => {
                if (!track.url) return null;
                try {
                    const response = await fetch(track.url);
                    const buf = await response.arrayBuffer();
                    const audioBuf = await offlineCtx.decodeAudioData(buf);
                    return { buffer: audioBuf, track };
                } catch { return null; }
            });

            const buffers = (await Promise.all(bufferPromises)).filter(b => b !== null);
            buffers.forEach(({ buffer, track }) => {
                if (!buffer) return;
                const source = offlineCtx.createBufferSource();
                source.buffer = buffer;

                const gain = offlineCtx.createGain();
                gain.gain.value = (track.volume || 100) / 100;

                const trackEffects = (track.effects || [])
                    .filter(e => e.active)
                    .map(e => ({
                        type: e.name.toLowerCase().replace(/\s+/g, '-') as EffectType,
                        active: e.active,
                        params: e.params
                    }));

                const effectChain = createEffectChain(offlineCtx, trackEffects);
                source.connect(effectChain.input);
                effectChain.output.connect(gain);
                gain.connect(offlineCtx.destination);
                source.start(track.startTime);
            });

            const renderedBuffer = await offlineCtx.startRendering();
            setProgress(30);

            if (format === 'wav') {
                setStatusMessage('Encoding WAV...');
                const interleaved = new Float32Array(renderedBuffer.length * 2);
                const left = renderedBuffer.getChannelData(0);
                const right = renderedBuffer.getChannelData(1);
                for (let i = 0; i < renderedBuffer.length; i++) {
                    interleaved[i * 2] = left[i];
                    interleaved[i * 2 + 1] = right[i];
                }
                const wavBuffer = writeWavHeader(interleaved, sampleRate, 2);
                const blob = new Blob([wavBuffer], { type: 'audio/wav' });
                await finishExport(URL.createObjectURL(blob));
                return;
            }

            if (format === 'mp4') {
                setStatusMessage('Initializing video recorder...');

                let mimeType = 'video/webm;codecs=vp9';
                let ext = 'webm';
                if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/mp4')) {
                    mimeType = 'video/mp4';
                    ext = 'mp4';
                }
                setFileExtension(ext);

                const canvas = document.createElement('canvas');
                canvas.width = 1920;
                canvas.height = 1080;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error("Canvas init failed");

                // Setup Visuals
                let videoEl: HTMLVideoElement | null = null;
                let imgEl: HTMLImageElement | null = null;

                if (visualTrack?.type === 'video' && visualTrack.url) {
                    videoEl = document.createElement('video');
                    videoEl.src = visualTrack.url;
                    videoEl.muted = true;
                    videoEl.loop = true;
                    videoEl.crossOrigin = 'anonymous';
                    await new Promise((r, j) => {
                        videoEl!.onloadeddata = () => r(true);
                        videoEl!.onerror = e => j(e);
                        videoEl!.load();
                    });
                } else if (visualTrack?.type === 'image' && visualTrack.url) {
                    imgEl = new Image();
                    imgEl.crossOrigin = 'anonymous';
                    imgEl.src = visualTrack.url;
                    await new Promise((r, j) => {
                        imgEl!.onload = () => r(true);
                        imgEl!.onerror = e => j(e);
                    });
                }

                const actx = new AudioContext();
                const source = actx.createBufferSource();
                source.buffer = renderedBuffer;
                const dest = actx.createMediaStreamDestination();
                source.connect(dest);

                const canvasStream = canvas.captureStream(30);
                const combinedStream = new MediaStream([
                    ...canvasStream.getVideoTracks(),
                    ...dest.stream.getAudioTracks()
                ]);

                const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 8000000 });
                const chunks: Blob[] = [];
                recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };

                recorder.start(100);
                source.start(0);
                if (videoEl) { videoEl.currentTime = 0; await videoEl.play(); }

                const startTime = Date.now();
                const totalDurMs = duration * 1000;

                await new Promise<void>((resolve) => {
                    const draw = () => {
                        const elapsed = Date.now() - startTime;
                        setProgress(Math.min(99, 30 + (elapsed / totalDurMs) * 70));

                        ctx.fillStyle = '#000';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        if (videoEl) ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
                        else if (imgEl) ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);

                        if (elapsed < totalDurMs) requestAnimationFrame(draw);
                        else resolve();
                    };
                    draw();
                });

                recorder.stop();
                source.stop();
                if (videoEl) { videoEl.pause(); videoEl.src = ''; }
                await new Promise(r => recorder.onstop = r);
                actx.close();

                await finishExport(URL.createObjectURL(new Blob(chunks, { type: mimeType })));
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Export failed");
            setIsExporting(false);
            setStep('settings');
        }
    };

    const handleDownload = async () => {
        if (downloadUrl) {
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = format === 'wav' ? 'subliminal_mix.wav' : `subliminal_video.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            onExportComplete?.();
            router.push('/dashboard');
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-[500px] bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden font-sans"
                    >
                        {/* Header */}
                        <div className="h-16 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#0f0f0f]">
                            <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-3">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${step === 'exporting' ? 'bg-amber-500/20 text-amber-500' : step === 'complete' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                    {step === 'exporting' ? <Loader2 className="w-4 h-4 animate-spin" /> : step === 'complete' ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                                </span>
                                {step === 'settings' ? 'Export Configuration' : step === 'exporting' ? 'Rendering Project' : 'Export Complete'}
                            </h2>
                            {!isExporting && (
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {step === 'settings' && (
                                <div className="space-y-6">
                                    {error && (
                                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-xs text-red-200">
                                            <AlertCircle className="w-5 h-5 text-red-400" /> {error}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Format</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => setFormat('wav')}
                                                className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group ${format === 'wav' ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-[#141414] border-white/5 text-gray-400 hover:border-white/10'}`}
                                            >
                                                <FileAudio className={`w-6 h-6 mb-3 ${format === 'wav' ? 'text-blue-400' : 'text-gray-600'}`} />
                                                <div className="text-sm font-bold mb-0.5">WAV Audio</div>
                                                <div className="text-[10px] opacity-60">High Quality .wav</div>
                                            </button>

                                            <button
                                                onClick={() => setFormat('mp4')}
                                                className={`p-4 rounded-xl border transition-all text-left relative overflow-hidden group ${format === 'mp4' ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-[#141414] border-white/5 text-gray-400 hover:border-white/10'}`}
                                            >
                                                <Video className={`w-6 h-6 mb-3 ${format === 'mp4' ? 'text-blue-400' : 'text-gray-600'}`} />
                                                <div className="text-sm font-bold mb-0.5">MP4 Video</div>
                                                <div className="text-[10px] opacity-60">Video + Audio Mix</div>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-[#141414] rounded-xl p-4 border border-white/[0.04]">
                                        <div className="flex justify-between items-center text-xs mb-2">
                                            <span className="text-gray-500">Estimated Size</span>
                                            <span className="text-white font-mono">{format === 'wav' ? '~45 MB' : '~150 MB'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500">Duration</span>
                                            <span className="text-white font-mono">
                                                {Math.floor(Math.max(...tracks.map(t => t.duration) || [0]) / 60)}:{(Math.max(...tracks.map(t => t.duration) || [0]) % 60).toFixed(0).padStart(2, '0')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 'exporting' && (
                                <div className="py-10 flex flex-col items-center justify-center text-center">
                                    <div className="relative w-32 h-32 mb-8">
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="60" fill="none" stroke="#1a1a1a" strokeWidth="6" />
                                            <motion.circle
                                                cx="64" cy="64" r="60" fill="none" stroke='#3b82f6'
                                                strokeWidth="6" strokeLinecap="round"
                                                initial={{ pathLength: 0 }}
                                                animate={{ pathLength: progress / 100 }}
                                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white font-mono">
                                            {Math.round(progress)}%
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">{statusMessage}</h3>
                                    <p className="text-sm text-gray-500">Please wait while we render your masterpiece.</p>
                                </div>
                            )}

                            {step === 'complete' && (
                                <div className="py-8 text-center">
                                    <motion.div
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20"
                                    >
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-white mb-2">Export Successful!</h3>
                                    <p className="text-sm text-gray-500">Your files are ready to download.</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0">
                            {step === 'settings' && (
                                <button
                                    onClick={performExport}
                                    className={`w-full py-4 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 shadow-blue-900/20`}
                                >
                                    Start Rendering <ChevronRight className="w-4 h-4" />
                                </button>
                            )}

                            {step === 'complete' && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={onClose}
                                        className="flex-1 py-4 bg-[#141414] hover:bg-[#1a1a1a] text-gray-400 hover:text-white font-semibold rounded-xl transition-colors border border-white/5"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={handleDownload}
                                        className="flex-1 py-4 bg-green-600 text-white hover:bg-green-500 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
