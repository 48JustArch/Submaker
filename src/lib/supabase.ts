import { createClient } from '@supabase/supabase-js';

// Supabase project credentials - loaded from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types - matches schema.sql
export interface User {
    id: string;
    email: string | null;
    name: string | null;
    avatar_url: string | null;
    updated_at: string | null;
}

export interface AudioGeneration {
    id: string;
    user_id: string;
    title: string | null;
    intention: string | null;
    file_path: string | null;
    duration_seconds: number | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    metadata: Record<string, unknown> | null;
    created_at: string;
}

// Helper to get user profile
export async function getUserProfile(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data as User;
}

// Helper to create audio generation record
export async function createAudioGeneration(userId: string, title: string, intention: string) {
    const { data, error } = await supabase
        .from('audio_generations')
        .insert({
            user_id: userId,
            title,
            intention,
            status: 'processing'
        })
        .select()
        .single();

    if (error) throw error;
    return data as AudioGeneration;
}

// Helper to update audio generation status
export async function updateAudioGeneration(id: string, updates: Partial<AudioGeneration>) {
    const { error } = await supabase
        .from('audio_generations')
        .update(updates)
        .eq('id', id);

    if (error) throw error;
}
