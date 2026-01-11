export interface Track {
    id: string;
    name: string;
    type: 'audio' | 'video' | 'image';
    duration: number; // in seconds (original media duration)
    volume: number;
    isMuted: boolean;
    isSolo: boolean;
    color: string;
    url?: string;
    file?: File;
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
}

export interface Effect {
    id: string;
    name: string;
    active: boolean;
    params?: Record<string, number>;
}

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
