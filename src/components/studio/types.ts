export interface Track {
    id: string;
    name: string;
    type: 'audio' | 'video' | 'image';
    duration: number; // in seconds (original media duration)
    volume: number;
    pan?: number; // -1 (Left) to 1 (Right), default 0
    isMuted: boolean;
    isSolo: boolean;
    color: string;
    url?: string;
    file?: File;
    waveform?: number[]; // Pre-computed peaks for visualization
    effects?: Effect[];
    transform?: {
        x: number;
        y: number;
        scale: number;
        rotation: number;
    };
    // Timeline positioning and trimming
    startTime?: number; // When this clip starts on the timeline (default 0)
    inPoint?: number;   // Where playback starts within the media (trim start)
    outPoint?: number;  // Where playback ends within the media (trim end)
    isCollapsed?: boolean; // Whether track is minimized in timeline
}

export type EffectType = 'reverb' | 'delay' | 'chorus' | 'subliminal';

export interface BaseEffect {
    id: string;
    active: boolean;
}

export interface ReverbEffect extends BaseEffect {
    type: 'reverb';
    params: {
        decay: number; // 0.1 to 10 seconds
        mix: number; // 0 to 1 (wet/dry)
        preDelay: number; // 0 to 0.1s
    };
}

export interface DelayEffect extends BaseEffect {
    type: 'delay';
    params: {
        time: number; // 0 to 1s
        feedback: number; // 0 to 0.95
        mix: number; // 0 to 1
    };
}

export interface ChorusEffect extends BaseEffect {
    type: 'chorus';
    params: {
        rate: number; // 0.1 to 10 Hz
        depth: number; // 0 to 1
        mix: number; // 0 to 1
    };
}

export interface SubliminalEffect extends BaseEffect {
    type: 'subliminal';
    params: {
        frequency: number; // 10000 to 20000 Hz (Carrier)
        depth: number; // 0 to 1 (Modulation)
        volume: number; // Output gain
    };
}

export type Effect = ReverbEffect | DelayEffect | ChorusEffect | SubliminalEffect;

export const DEFAULT_EFFECTS: Record<EffectType, Omit<Effect, 'id' | 'active'>> = {
    reverb: { type: 'reverb', params: { decay: 2.0, mix: 0.5, preDelay: 0.01 } },
    delay: { type: 'delay', params: { time: 0.3, feedback: 0.4, mix: 0.4 } },
    chorus: { type: 'chorus', params: { rate: 1.5, depth: 0.002, mix: 0.5 } },
    subliminal: { type: 'subliminal', params: { frequency: 17500, depth: 1.0, volume: 1.0 } }
};

export const INITIAL_TRACKS: Track[] = [];

export const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
}

/**
 * Get the effective duration of a track (considering trim points)
 */
export const getEffectiveDuration = (track: Track): number => {
    const inPoint = track.inPoint ?? 0;
    const outPoint = track.outPoint ?? track.duration;
    return outPoint - inPoint;
}

/**
 * Get the timeline bounds of a track
 */
export const getTrackBounds = (track: Track): { start: number; end: number } => {
    const start = track.startTime ?? 0;
    const effectiveDuration = getEffectiveDuration(track);
    return {
        start,
        end: start + effectiveDuration
    };
}
