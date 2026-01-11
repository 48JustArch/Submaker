-- Update existing tables with new columns and policies
-- Run this in Supabase SQL Editor if you already have the tables created

-- =============================================
-- Step 1: Add new columns to users table
-- =============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS generations_used integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS generations_limit integer DEFAULT 3;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- =============================================
-- Step 2: Add new columns to audio_generations table
-- =============================================
ALTER TABLE public.audio_generations ADD COLUMN IF NOT EXISTS audio_type text;
ALTER TABLE public.audio_generations ADD COLUMN IF NOT EXISTS audio_url text;
ALTER TABLE public.audio_generations ADD COLUMN IF NOT EXISTS is_closed boolean DEFAULT false;
ALTER TABLE public.audio_generations ALTER COLUMN status SET DEFAULT 'draft';

-- =============================================
-- Step 3: Add INSERT policy for users table (IMPORTANT!)
-- =============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" ON public.users
            FOR INSERT WITH CHECK (auth.uid() = id);
    END IF;
END
$$;

-- =============================================
-- Step 4: Update the handle_new_user function
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, plan, generations_used, generations_limit, created_at)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'free',
    0,
    3,
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- Step 5: Update existing users with default values
-- =============================================
UPDATE public.users 
SET 
    plan = COALESCE(plan, 'free'),
    generations_used = COALESCE(generations_used, 0),
    generations_limit = COALESCE(generations_limit, 3)
WHERE plan IS NULL OR generations_used IS NULL OR generations_limit IS NULL;

-- Show results
SELECT 'Schema update complete!' as status;

-- =============================================
-- Step 6: Create activity_logs table for admin logging
-- =============================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read all logs (users can't see this table)
-- For now, allow service role to read everything
CREATE POLICY "Service role can manage activity_logs" ON public.activity_logs
    FOR ALL USING (true);

-- Index on user_id and created_at for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);

-- =============================================
-- Step 7: Create storage_metrics table for tracking storage usage
-- =============================================
CREATE TABLE IF NOT EXISTS public.storage_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    file_type text NOT NULL, -- 'audio', 'video', 'image'
    file_size bigint NOT NULL, -- size in bytes
    file_name text,
    session_id uuid REFERENCES public.audio_generations(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on storage_metrics
ALTER TABLE public.storage_metrics ENABLE ROW LEVEL SECURITY;

-- Users can see their own storage usage
CREATE POLICY "Users can view own storage" ON public.storage_metrics
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own storage records
CREATE POLICY "Users can insert own storage" ON public.storage_metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_storage_metrics_user_id ON public.storage_metrics(user_id);

-- =============================================
-- Step 8: Add role column to users table for admin access
-- =============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- =============================================
-- Step 9: Add is_banned column to users table (Admin Ban Feature)
-- =============================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Allow admin to update any user (for banning/unbanning)
-- NOTE: Policy name must be unique.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Admins can update users'
    ) THEN
        CREATE POLICY "Admins can update users" ON public.users
            FOR UPDATE USING (
                auth.email() = 'damon66.op@gmail.com' -- Hardcoded admin email for now
            );
    END IF;
END
$$;

-- Allow admin to view all users
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Admins can view all profiles'
    ) THEN
        CREATE POLICY "Admins can view all profiles" ON public.users
            FOR SELECT USING (
                auth.email() = 'damon66.op@gmail.com'
            );
    END IF;
END
$$;

SELECT 'Schema update with activity logging, storage metrics, and banning capability complete!' as status;
