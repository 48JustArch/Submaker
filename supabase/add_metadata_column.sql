-- Add metadata column to audio_generations table for storing project state (tracks, effects, etc.)
ALTER TABLE audio_generations 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add updated_at column if it doesn't exist, for tracking save times
ALTER TABLE audio_generations 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Comment on column
COMMENT ON COLUMN audio_generations.metadata IS 'Stores the full JSON state of the studio session (tracks, effects, settings)';
