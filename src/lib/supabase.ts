import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your Supabase project credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (to be generated from Supabase schema)
export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    plan: 'free' | 'pro' | 'unlimited';
    generations_used: number;
    generations_limit: number;
    created_at: string;
}

export interface AudioGeneration {
    id: string;
    user_id: string;
    title: string;
    intention: string;
    audio_type: 'subliminal' | 'morphic' | 'supraliminal';
    audio_url: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: string;
}

// Helper to get current user's generation usage
export async function getUserUsage(userId: string) {
    const { data, error } = await supabase
        .from('users')
        .select('generations_used, generations_limit, plan')
        .eq('id', userId)
        .single();

    if (error) throw error;
    return data;
}

// Helper to increment usage
export async function incrementUsage(userId: string) {
    const { error } = await supabase.rpc('increment_usage', { user_id: userId });
    if (error) throw error;
}
