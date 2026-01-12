-- =============================================
-- FIX: Update audio_type constraint to allow 'wav'
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. DROP the old constraint
ALTER TABLE public.audio_generations DROP CONSTRAINT IF EXISTS audio_generations_audio_type_check;

-- 2. Add the NEW constraint that includes 'wav'
ALTER TABLE public.audio_generations 
  ADD CONSTRAINT audio_generations_audio_type_check 
  CHECK (audio_type IS NULL OR audio_type IN ('mp3', 'mp4', 'wav', 'webm'));

SELECT 'audio_type constraint fixed! Now allows: mp3, mp4, wav, webm' as status;
