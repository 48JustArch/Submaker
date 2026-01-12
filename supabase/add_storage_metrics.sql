-- =============================================
-- ADD STORAGE METRICS TABLE
-- Run this in Supabase SQL Editor
-- =============================================

-- Create storage_metrics table for tracking file uploads
CREATE TABLE IF NOT EXISTS public.storage_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('audio', 'video', 'image')),
    file_size BIGINT NOT NULL,
    file_name TEXT NOT NULL,
    session_id UUID REFERENCES public.audio_generations(id) ON DELETE SET NULL
);

-- Turn on Row Level Security
ALTER TABLE public.storage_metrics ENABLE ROW LEVEL SECURITY;

-- Users can view their own storage metrics
CREATE POLICY "Users can view own storage metrics" ON public.storage_metrics
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own storage metrics
CREATE POLICY "Users can insert own storage metrics" ON public.storage_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own storage metrics
CREATE POLICY "Users can delete own storage metrics" ON public.storage_metrics
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_storage_metrics_user_id ON public.storage_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_metrics_session_id ON public.storage_metrics(session_id);

SELECT 'storage_metrics table created successfully!' as status;
