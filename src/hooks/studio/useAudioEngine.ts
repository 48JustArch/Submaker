/**
 * useAudioEngine - Custom hook for Web Audio API management
 * 
 * Handles:
 * - AudioContext initialization and lifecycle
 * - Audio nodes creation and management
 * - Effects chain (Reverb, Delay, Chorus, Subliminal)
 * - Volume/pan synchronization
 */

import { useRef, useCallback, useEffect } from 'react';
import {
    Track,
    Effect,
    ReverbEffect,
    DelayEffect,
    ChorusEffect,
    SubliminalEffect
} from '@/components/studio/types';

// Audio nodes stored per track
export interface AudioNodes {
    source: MediaElementAudioSourceNode;
    gain: GainNode;
    panner: StereoPannerNode;
    audio: HTMLAudioElement;
    effectNodes: Map<string, AudioNode[]>;
    chainInput: AudioNode;
    chainOutput: AudioNode;
}

interface UseAudioEngineReturn {
    audioContextRef: React.MutableRefObject<AudioContext | null>;
    audioNodesRef: React.MutableRefObject<Map<string, AudioNodes>>;
    initAudioContext: () => void;
    updateAudioGraph: (track: Track) => void;
    syncTrackProperties: (trackId: string, updates: Partial<Track>) => void;
    cleanupTrack: (trackId: string) => void;
    pauseAll: () => void;
}

export function useAudioEngine(tracks: Track[]): UseAudioEngineReturn {
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioNodesRef = useRef<Map<string, AudioNodes>>(new Map());

    // Initialize Audio Context on first interaction
    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    // Helper: Generate Impulse Response for Reverb
    const createImpulseResponse = useCallback((ctx: AudioContext, duration: number, decay: number) => {
        const rate = ctx.sampleRate;
        const length = rate * duration;
        const impulse = ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = i / length;
            const noise = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
            left[i] = noise;
            right[i] = noise;
        }
        return impulse;
    }, []);

    // Build audio graph for a track including all effects
    const updateAudioGraph = useCallback((track: Track) => {
        const ctx = audioContextRef.current;
        if (!ctx) return;

        let nodes = audioNodesRef.current.get(track.id);

        // 1. Create Base Nodes if missing
        if (!nodes) {
            const audio = new Audio(track.url);
            const source = ctx.createMediaElementSource(audio);
            const gain = ctx.createGain();
            const panner = ctx.createStereoPanner();

            nodes = {
                source,
                gain,
                panner,
                audio,
                effectNodes: new Map(),
                chainInput: source,
                chainOutput: gain
            };
            audioNodesRef.current.set(track.id, nodes);

            audio.onerror = () => console.error(`Audio playback error for track ${track.name}:`, audio.error);
        }

        // Disconnect all existing connections
        nodes.gain.disconnect();
        nodes.panner.disconnect();

        // Disconnect and clear old effect nodes
        nodes.effectNodes.forEach(nodeArray => {
            nodeArray.forEach(node => {
                if (node instanceof AudioNode) {
                    try { node.disconnect(); } catch { /* already disconnected */ }
                }
                if (node instanceof OscillatorNode) {
                    try { node.stop(); } catch { /* already stopped */ }
                }
            });
        });
        nodes.effectNodes.clear();

        let currentNode: AudioNode = nodes.source;

        // Process Effects
        track.effects?.forEach(effect => {
            if (!effect.active) return;

            const effectNodeList: AudioNode[] = [];

            if (effect.type === 'reverb') {
                const { decay, mix, preDelay } = effect.params as ReverbEffect['params'];
                const convolver = ctx.createConvolver();
                convolver.buffer = createImpulseResponse(ctx, decay, 2);

                const wet = ctx.createGain(); wet.gain.value = mix;
                const dry = ctx.createGain(); dry.gain.value = 1 - mix;

                const delayNode = ctx.createDelay();
                delayNode.delayTime.value = preDelay;

                currentNode.connect(delayNode);
                delayNode.connect(convolver);
                convolver.connect(wet);
                currentNode.connect(dry);

                const output = ctx.createGain();
                wet.connect(output);
                dry.connect(output);

                currentNode = output;
                effectNodeList.push(convolver, wet, dry, delayNode, output);
            }
            else if (effect.type === 'delay') {
                const { time, feedback, mix } = effect.params as DelayEffect['params'];
                const delay = ctx.createDelay(1.0);
                delay.delayTime.value = time;

                const fbGain = ctx.createGain();
                fbGain.gain.value = feedback;

                const wet = ctx.createGain(); wet.gain.value = mix;
                const dry = ctx.createGain(); dry.gain.value = 1 - mix;

                currentNode.connect(delay);
                delay.connect(fbGain);
                fbGain.connect(delay);

                delay.connect(wet);
                currentNode.connect(dry);

                const output = ctx.createGain();
                wet.connect(output);
                dry.connect(output);
                currentNode = output;
                effectNodeList.push(delay, fbGain, wet, dry, output);
            }
            else if (effect.type === 'chorus') {
                const { rate, depth, mix } = effect.params as ChorusEffect['params'];
                const delay = ctx.createDelay();
                delay.delayTime.value = 0.03;

                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = rate;

                const lfoGain = ctx.createGain();
                lfoGain.gain.value = depth * 0.005;

                lfo.connect(lfoGain);
                lfoGain.connect(delay.delayTime);
                lfo.start(0);

                const wet = ctx.createGain(); wet.gain.value = mix;
                const dry = ctx.createGain(); dry.gain.value = 1 - mix;

                currentNode.connect(delay);
                delay.connect(wet);
                currentNode.connect(dry);

                const output = ctx.createGain();
                wet.connect(output);
                dry.connect(output);
                currentNode = output;
                effectNodeList.push(delay, lfo, lfoGain, wet, dry, output);
            }
            else if (effect.type === 'subliminal') {
                const { frequency, volume } = effect.params as SubliminalEffect['params'];

                const carrier = ctx.createOscillator();
                carrier.type = 'sine';
                carrier.frequency.value = frequency;
                carrier.start(0);

                const ringMod = ctx.createGain();
                ringMod.gain.value = 0;

                currentNode.connect(ringMod.gain);
                carrier.connect(ringMod);

                const outGain = ctx.createGain();
                outGain.gain.value = volume;

                ringMod.connect(outGain);
                currentNode = outGain;
                effectNodeList.push(carrier, ringMod, outGain);
            }
            nodes.effectNodes.set(effect.id, effectNodeList);
        });

        // Final Chain: Effect Output -> Gain -> Panner -> Destination
        currentNode.connect(nodes.gain);
        nodes.gain.connect(nodes.panner);
        nodes.panner.connect(ctx.destination);

        // Update volume and pan
        nodes.gain.gain.value = track.volume / 100;
        nodes.panner.pan.value = track.pan || 0;
    }, [createImpulseResponse]);

    // Efficiently update volume/pan without rebuilding graph
    const syncTrackProperties = useCallback((trackId: string, updates: Partial<Track>) => {
        const nodes = audioNodesRef.current.get(trackId);
        if (nodes) {
            if (updates.volume !== undefined) {
                nodes.gain.gain.setValueAtTime(updates.volume / 100, audioContextRef.current?.currentTime || 0);
            }
            if (updates.pan !== undefined) {
                nodes.panner.pan.setValueAtTime(updates.pan, audioContextRef.current?.currentTime || 0);
            }
        }
    }, []);

    // Cleanup a specific track
    const cleanupTrack = useCallback((trackId: string) => {
        const nodes = audioNodesRef.current.get(trackId);
        if (nodes) {
            nodes.audio.pause();
            nodes.audio.src = '';
            nodes.source.disconnect();
            nodes.gain.disconnect();
            nodes.panner.disconnect();
            nodes.effectNodes.forEach(nodeArray => {
                nodeArray.forEach(node => {
                    if (node instanceof AudioNode) {
                        try { node.disconnect(); } catch { /* already disconnected */ }
                    }
                    if (node instanceof OscillatorNode) {
                        try { node.stop(); } catch { /* already stopped */ }
                    }
                });
            });
            audioNodesRef.current.delete(trackId);
        }
    }, []);

    // Pause all audio
    const pauseAll = useCallback(() => {
        audioNodesRef.current.forEach(nodes => nodes.audio.pause());
    }, []);

    // Cleanup removed tracks when tracks array changes
    useEffect(() => {
        if (!audioContextRef.current) return;

        // Update graphs for existing tracks
        tracks.forEach(track => {
            if (track.type === 'audio' && track.url) {
                updateAudioGraph(track);
            }
        });

        // Cleanup removed tracks
        audioNodesRef.current.forEach((_, id) => {
            if (!tracks.find(t => t.id === id)) {
                cleanupTrack(id);
            }
        });
    }, [tracks, updateAudioGraph, cleanupTrack]);

    return {
        audioContextRef,
        audioNodesRef,
        initAudioContext,
        updateAudioGraph,
        syncTrackProperties,
        cleanupTrack,
        pauseAll
    };
}
