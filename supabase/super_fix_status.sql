-- =============================================
-- SUPER FIX: CORRECT DATA BEFORE UPDATING CONSTRAINT
-- =============================================

-- 1. First, we MUST update any existing rows that have the old 'pending' status
--    or any other invalid status, converting them to 'draft'.
--    This fixes the "violated by some row" error.

UPDATE public.audio_generations
SET status = 'draft'
WHERE status NOT IN ('draft', 'processing', 'completed', 'failed');

-- 2. NOW we can safely drop the old constraint
ALTER TABLE public.audio_generations DROP CONSTRAINT IF EXISTS audio_generations_status_check;

-- 3. And add the new constraint
ALTER TABLE public.audio_generations 
  ADD CONSTRAINT audio_generations_status_check 
  CHECK (status IN ('draft', 'processing', 'completed', 'failed'));

-- 4. Set default to draft
ALTER TABLE public.audio_generations ALTER COLUMN status SET DEFAULT 'draft';

-- 5. Enable RLS (Recommended based on your sidebar warnings)
ALTER TABLE public.audio_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

SELECT 'Fixed data and updated constraints successfully!' as status;
