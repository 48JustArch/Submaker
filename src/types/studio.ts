import { LucideIcon } from 'lucide-react';

export type TrackType = 'audio' | 'video' | 'image';

export interface BaseTrack {
    id: string;
    name: string;
    locked: boolean;
    hidden: boolean;
    start: number; // Start time on timeline execution (in seconds)
    duration: number; // Length of the clip
    type: TrackType;
    layer: number; // Visual layering (Z-index equivalent)
}

export interface AudioTrack extends BaseTrack {
    type: 'audio';
    url: string;
    volume: number;
    speed: number;
    pan: number;
    muted: boolean;
    solo: boolean;
    color: string;
    icon: LucideIcon;
}

export interface VisualProperties {
    x: number;
    y: number;
    width: number; // in pixels or percentage? Let's assume percentage 0-100 relative to stage
    height: number;
    scale: number;
    highlight: boolean; // Selected state
    opacity: number;
    zIndex: number;
}

export interface VideoTrack extends BaseTrack, VisualProperties {
    type: 'video';
    url: string;
    volume: number; // Videos have audio too
    muted: boolean;
    speed: number;
    thumbnail?: string; // Optional generated thumbnail
}

export interface ImageTrack extends BaseTrack, VisualProperties {
    type: 'image';
    url: string;
}

export type Track = AudioTrack | VideoTrack | ImageTrack;

export type SessionMode = 'audio' | 'video';
