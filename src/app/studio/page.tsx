'use client';

import { useState, useEffect, Suspense } from 'react';
import { Sliders } from 'lucide-react';
import StudioHeader from '@/components/studio/StudioHeader';
import MediaLibrary from '@/components/studio/MediaLibrary';
import AudioGenerators from '@/components/studio/AudioGenerators';
import AffirmationGenerator from '@/components/studio/AffirmationGenerator';
import VideoPreview from '@/components/studio/VideoPreview';
import Timeline from '@/components/studio/Timeline';
import PropertiesPanel from '@/components/studio/PropertiesPanel';
import UploadedAssets, { UploadedAsset } from '@/components/studio/UploadedAssets';
import { motion, AnimatePresence } from 'framer-motion';
import { Track } from '@/components/studio/types';
import ExportModal from '@/components/studio/ExportModal';
import SettingsModal from '@/components/studio/SettingsModal';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import KeyboardShortcutsModal, { useKeyboardShortcuts } from '@/components/studio/KeyboardShortcutsModal';
import StudioSkeleton from '@/components/studio/StudioSkeleton';

// Hooks
import { useAudioEngine, useSession, usePlayback, useTracks } from '@/hooks/studio';

// Mobile detection imports
import { useIsMobile, useIsTablet } from '@/hooks/useMediaQuery';
import MobileWarning from '@/components/studio/MobileWarning';

// Mobile View State
import MobileNavBar from '@/components/studio/MobileNavBar';

function StudioContent() {
    const router = useRouter();
    const { showToast } = useToast();

    // Mobile View State
    const [mobileView, setMobileView] = useState<'editor' | 'assets' | 'properties'>('editor');

    // UI State
    const [mode, setMode] = useState<'audio' | 'video'>('audio');
    const [showAffirmations, setShowAffirmations] = useState(false);
    const [showGenerators, setShowGenerators] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
    const [rightPanelTab, setRightPanelTab] = useState<'uploads' | 'properties'>('uploads');
    const [zoom, setZoom] = useState(5); // pixels per second (5 = ~60s visible at once)

    // Uploaded Assets State (kept local for now)
    const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);

    // 1. Initialize Tracks Hook
    const {
        tracks,
        setTracks,
        selectedTrackId,
        selectedTrack,
        selectTrack,
        addTrack,
        updateTrack,
        deleteTrack, // Use this for timeline deletion
        duplicateTrack,
        moveTrackUp,
        moveTrackDown,
        undo,
        redo,
        canUndo,
        canRedo
    } = useTracks();

    // Auto-switch mobile view when events happen
    useEffect(() => {
        // Find if we are on mobile to limit effects
        const isSmallScreen = window.innerWidth < 768;
        if (!isSmallScreen) return;

        // If a track is selected, switch to properties
        if (selectedTrackId) {
            setMobileView('properties');
        }
    }, [selectedTrackId]);

    // Handle uploaded assets auto-switch
    useEffect(() => {
        const isSmallScreen = window.innerWidth < 768;
        if (!isSmallScreen) return;

        if (uploadedAssets.length > 0) {
            // Check if this was a recent addition by comparing length or timestamp
            // For now, simple logic: if rightPanelTab changes to uploads, switch view
            if (rightPanelTab === 'uploads') {
                setMobileView('assets');
            }
        }
    }, [uploadedAssets.length, rightPanelTab]);

    // 2. Initialize Audio Engine Hook

    // 2. Initialize Audio Engine Hook
    const {
        audioContextRef,
        audioNodesRef,
        initAudioContext,
        syncTrackProperties
    } = useAudioEngine(tracks);

    // 3. Initialize Playback Hook
    const {
        isPlaying,
        currentTime,
        setCurrentTime,
        togglePlayPause,
        stop,
        seek
    } = usePlayback({
        tracks,
        audioContextRef,
        audioNodesRef,
        initAudioContext
    });

    // 4. Initialize Session Hook
    const {
        userId,
        sessionId,
        sessionName,
        setSessionName,
        lastSaved,
        isSaving,
        isLoading,
        saveSession
    } = useSession({
        tracks,
        mode,
        zoom,
        setTracks,
        setMode,
        setZoom,
        clearAssets: () => setUploadedAssets([])
    });

    // Helper to format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Handle file upload - adds to uploaded assets library
    // Renamed from handleAddTrack to avoid confusion with timeline tracks
    const handleUploadAsset = async (file: File) => {
        // Create object URL for the file
        const url = URL.createObjectURL(file);

        // Determine file type
        const fileType = file.type.startsWith('video/') ? 'video'
            : file.type.startsWith('image/') ? 'image'
                : 'audio';

        // Get duration for audio/video files
        let duration = 60; // Default 1 minute for images
        let thumbnail: string | undefined;

        if (fileType === 'audio' || fileType === 'video') {
            try {
                const media = fileType === 'audio' ? new Audio(url) : document.createElement('video');
                if (fileType === 'video') (media as HTMLVideoElement).src = url;

                await new Promise<void>((resolve) => {
                    media.onloadedmetadata = () => resolve();
                    media.onerror = () => resolve();
                    setTimeout(resolve, 3000); // Timeout fallback
                });

                duration = media.duration && isFinite(media.duration) ? media.duration : 60;

                // Check 5-minute limit for audio files
                if (fileType === 'audio' && duration > 300) {
                    showToast('warning', 'Audio files must be 5 minutes or less. Please trim your audio.');
                    URL.revokeObjectURL(url);
                    return;
                }

                // Generate thumbnail for video
                if (fileType === 'video') {
                    const videoEl = media as HTMLVideoElement;
                    try {
                        await new Promise<void>((resolve) => {
                            videoEl.currentTime = 1;
                            videoEl.onseeked = () => resolve();
                            setTimeout(resolve, 1000);
                        });
                        const canvas = document.createElement('canvas');
                        canvas.width = 160;
                        canvas.height = 90;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(videoEl, 0, 0, 160, 90);
                            thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                        }
                    } catch { }
                }
            } catch {
                duration = 60;
            }
        }

        // Generate thumbnail for images
        if (fileType === 'image') {
            thumbnail = url;
        }

        // Create uploaded asset
        const newAsset: UploadedAsset = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, "") || "New Asset",
            type: fileType,
            file: file,
            url: url,
            duration: fileType !== 'image' ? duration : undefined,
            size: formatFileSize(file.size),
            uploadedAt: new Date(),
            thumbnail: thumbnail
        };

        // Add to uploaded assets
        setUploadedAssets(prev => [...prev, newAsset]);

        // Auto-switch to uploads tab to show the new asset
        setRightPanelTab('uploads');
    };

    // Add asset from library to timeline
    const handleAddAssetToTimeline = async (asset: UploadedAsset) => {
        const newTrack: Track = {
            id: Date.now().toString(),
            name: (asset.name && !asset.name.includes('-')) ? asset.name : (asset.type === 'audio' ? 'Audio Track' : 'Visual Track'),
            type: asset.type,
            duration: asset.duration || 60,
            volume: 75,
            isMuted: false,
            isSolo: false,
            color: ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500'][Math.floor(Math.random() * 4)],
            url: asset.url,
            file: asset.file
        };

        // Use hook function
        addTrack(newTrack);
        setRightPanelTab('properties');
    };

    // Delete asset from library
    const handleDeleteAsset = (id: string) => {
        setUploadedAssets(prev => prev.filter(a => a.id !== id));
    };

    // Handle drop on timeline - parses JSON asset data and adds to timeline
    const handleDropAsset = (assetData: string) => {
        try {
            const droppedAsset = JSON.parse(assetData) as Partial<UploadedAsset>;

            // Look up the full asset from our state (includes File reference)
            const fullAsset = uploadedAssets.find(a => a.id === droppedAsset.id);

            if (fullAsset) {
                // Use the full asset with File reference
                handleAddAssetToTimeline(fullAsset);
            } else if (droppedAsset.url) {
                // Fallback: use the serialized data (won't have File, but has URL)
                handleAddAssetToTimeline(droppedAsset as UploadedAsset);
            } else {
                console.error('Dropped asset not found in library:', droppedAsset.id);
            }
        } catch (e) {
            console.error('Failed to parse dropped asset:', e);
        }
    };

    // Handler wrappers for components
    const handleTrackUpdate = (id: string, updates: Partial<Track>) => {
        updateTrack(id, updates);
        syncTrackProperties(id, updates);
    };

    // Keyboard shortcuts
    useKeyboardShortcuts({
        handleUndo: () => canUndo && undo(),
        handleRedo: () => canRedo && redo(),
        handleDelete: () => selectedTrackId && deleteTrack(selectedTrackId),
        handlePlayPause: togglePlayPause,
        handleSave: saveSession,
        canUndo,
        canRedo,
        isPlaying
    });

    // Helper to format time for display
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return <StudioSkeleton />;
    }

    return (
        <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden relative">
            {/* Header */}
            <StudioHeader
                mode={mode}
                setMode={setMode}
                isPlaying={isPlaying}
                setIsPlaying={() => togglePlayPause()}
                currentTime={formatTime(currentTime)}
                onStop={stop}
                sessionName={sessionName}
                onSessionNameChange={setSessionName}
                lastSaved={lastSaved}
                isSaving={isSaving}
                onExport={() => setShowExportModal(true)}
                onSettings={() => setShowSettingsModal(true)}
                onShortcuts={() => setShowKeyboardShortcuts(true)}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
            />

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden mb-20 md:mb-0 relative">

                {/* Left Panel: Assets */}
                <div className={`
                    w-full md:w-[320px] bg-[#0a0a0a] border-r border-white/10 flex flex-col absolute md:relative inset-0 z-20 
                    ${mobileView === 'assets' ? 'flex' : 'hidden md:flex'}
                `}>
                    <div className="flex items-center p-1 border-b border-white/10">
                        <button
                            onClick={() => { setShowGenerators(false); setShowAffirmations(false); }}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${!showGenerators && !showAffirmations ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Assets
                        </button>
                        <button
                            onClick={() => { setShowGenerators(true); setShowAffirmations(false); return; }}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${showGenerators ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Sliders className="w-3 h-3 inline mr-1" />
                            Generators
                        </button>
                        <button
                            onClick={() => { setShowAffirmations(true); setShowGenerators(false); }}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${showAffirmations ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Writer
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {showAffirmations ? (
                            <AffirmationGenerator onAddAudio={(asset) => {
                                setUploadedAssets(prev => [...prev, asset]);
                                setRightPanelTab('uploads');
                                setShowAffirmations(false);
                            }} />
                        ) : showGenerators ? (
                            <AudioGenerators onGenerate={(asset) => {
                                setUploadedAssets(prev => [...prev, asset]);
                                setRightPanelTab('uploads');
                                setShowGenerators(false);
                            }} />
                        ) : (
                            <MediaLibrary
                                onAddTrack={handleUploadAsset}
                                uploadedAssets={uploadedAssets}
                                onAddAssetToTimeline={handleAddAssetToTimeline}
                                onDeleteAsset={handleDeleteAsset}
                            />
                        )}
                    </div>
                </div>

                {/* Center Panel: Preview & Timeline */}
                <div className={`
                    flex-1 flex flex-col min-w-0 bg-[#0a0a0a] absolute md:relative inset-0 z-10
                    ${mobileView === 'editor' ? 'flex' : 'hidden md:flex'}
                `}>
                    {/* Visual Preview Area */}
                    <div className="h-[40%] bg-[#020202] relative border-b border-white/10 group">
                        <div className="absolute inset-0 flex items-center justify-center">
                            {mode === 'video' ? (
                                <VideoPreview
                                    tracks={tracks}
                                    currentTime={currentTime}
                                    isPlaying={isPlaying}
                                />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-white/10 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 animate-pulse" />
                                    </div>
                                    <p className="text-sm font-medium">Audio Mode Active</p>
                                    <p className="text-xs text-gray-600 mt-1">Video preview hidden</p>
                                </div>
                            )}
                        </div>

                        {/* Mode Toggles */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <button
                                onClick={() => setMode('audio')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'audio' ? 'bg-white text-black' : 'bg-black/50 text-gray-400 hover:bg-black/70'}`}
                            >
                                Audio
                            </button>
                            <button
                                onClick={() => setMode('video')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'video' ? 'bg-white text-black' : 'bg-black/50 text-gray-400 hover:bg-black/70'}`}
                            >
                                Video
                            </button>
                        </div>
                    </div>

                    {/* Timeline Area */}
                    <div className="flex-1 overflow-hidden relative">
                        <div className="absolute inset-0 flex flex-col">
                            <Timeline
                                tracks={tracks}
                                currentTime={currentTime}
                                isPlaying={isPlaying}
                                onPlayPause={togglePlayPause}
                                onStop={stop}
                                onSeek={seek}
                                onUpdateTrack={handleTrackUpdate}
                                onDeleteTrack={deleteTrack}
                                onSelectTrack={selectTrack}
                                selectedTrackId={selectedTrackId}
                                zoom={zoom}
                                onZoomChange={setZoom}
                                onDropAsset={handleDropAsset}
                                onDuplicateTrack={duplicateTrack}
                                onMoveTrackUp={moveTrackUp}
                                onMoveTrackDown={moveTrackDown}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Properties */}
                <div className={`
                    w-full md:w-[300px] bg-[#0a0a0a] border-l border-white/10 flex flex-col absolute md:relative inset-0 z-20
                    ${mobileView === 'properties' ? 'flex' : 'hidden md:flex'}
                `}>
                    <div className="flex items-center p-1 border-b border-white/10">
                        <button
                            onClick={() => setRightPanelTab('uploads')}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${rightPanelTab === 'uploads' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Uploads
                        </button>
                        <button
                            onClick={() => setRightPanelTab('properties')}
                            className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors ${rightPanelTab === 'properties' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Properties
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {rightPanelTab === 'uploads' ? (
                            <UploadedAssets
                                assets={uploadedAssets}
                                onAdd={handleAddAssetToTimeline}
                                onDelete={handleDeleteAsset}
                            />
                        ) : (
                            selectedTrack ? (
                                <PropertiesPanel
                                    track={selectedTrack}
                                    onUpdate={(updates) => handleTrackUpdate(selectedTrack.id, updates)}
                                />
                            ) : (
                                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                                        <Sliders className="w-6 h-6 opacity-50" />
                                    </div>
                                    <p className="text-sm">Select a track to edit properties</p>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            <MobileNavBar
                currentView={mobileView}
                onChangeView={setMobileView}
            />

            {/* Modals */}
            <AnimatePresence>
                {showExportModal && (
                    <ExportModal
                        isOpen={showExportModal}
                        onClose={() => setShowExportModal(false)}
                        tracks={tracks}
                        sessionName={sessionName}
                        sessionId={sessionId || undefined}
                        userId={userId || undefined}
                    />
                )}
            </AnimatePresence>

            <AffirmationGenerator
                isOpen={false}
                onAddAudio={() => { }}
                onClose={() => { }}
            />

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />

            <KeyboardShortcutsModal
                isOpen={showKeyboardShortcuts}
                onClose={() => setShowKeyboardShortcuts(false)}
            />
        </div>
    );
}

export default function StudioPage() {
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();
    const [bypassWarning, setBypassWarning] = useState(false);

    // Show mobile warning on phones (not tablets)
    // User requested to keep the warning but allow working on mobile
    if (isMobile && !bypassWarning) {
        return (
            <MobileWarning
                title="Desktop Recommended"
                message="The Studio editor works best on desktop devices. We are currently optimizing the mobile experience."
                allowContinue={true}
                onContinue={() => setBypassWarning(true)}
            />
        );
    }

    // Show tablet warning with option to continue
    if (isTablet && !bypassWarning) {
        return (
            <MobileWarning
                title="Tablet Support Limited"
                message="While basic features work on tablets, the full Studio experience is optimized for desktop. Some features may be harder to use."
                allowContinue={true}
                onContinue={() => setBypassWarning(true)}
            />
        );
    }

    return (
        <Suspense fallback={<StudioSkeleton />}>
            <StudioContent />
        </Suspense>
    );
}
