-- =============================================
-- FINAL FIX: DROP RULE FIRST, THEN UPDATE
-- =============================================

-- 1. DROP the strict rule FIRST (unlock the door)
ALTER TABLE public.audio_generations DROP CONSTRAINT IF EXISTS audio_generations_status_check;

-- 2. NOW we can change the data to 'draft' (because the rule is gone)
UPDATE public.audio_generations
SET status = 'draft'
WHERE status NOT IN ('draft', 'processing', 'completed', 'failed');

-- 3. Add the NEW rule that allows 'draft'
ALTER TABLE public.audio_generations 
  ADD CONSTRAINT audio_generations_status_check 
  CHECK (status IN ('draft', 'processing', 'completed', 'failed'));

-- 4. Set default
ALTER TABLE public.audio_generations ALTER COLUMN status SET DEFAULT 'draft';

SELECT 'Constraints and data fixed successfully!' as status;
