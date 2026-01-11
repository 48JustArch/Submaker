-- =============================================
-- FIX CHECK CONSTRAINT FOR AUDIO GENERATIONS STATUS
-- =============================================

-- 1. Drop the existing check constraint
ALTER TABLE public.audio_generations DROP CONSTRAINT IF EXISTS audio_generations_status_check;

-- 2. Add the correct check constraint including 'draft'
ALTER TABLE public.audio_generations 
  ADD CONSTRAINT audio_generations_status_check 
  CHECK (status IN ('draft', 'processing', 'completed', 'failed'));

-- 3. Ensure the default value is correct
ALTER TABLE public.audio_generations ALTER COLUMN status SET DEFAULT 'draft';

-- 4. Verify the change by selecting constraint definition (optional, just for visual confirmation if run in editor)
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.audio_generations'::regclass 
AND conname = 'audio_generations_status_check';

SELECT 'Check constraint fixed!' as status;
