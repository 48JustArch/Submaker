-- ============================================
-- DATABASE PERFORMANCE & MAINTENANCE IMPROVEMENTS
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create missing performance indexes
-- These indexes are critical for query performance at scale

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON public.users(is_banned) WHERE is_banned = true;

-- Audio generations indexes
CREATE INDEX IF NOT EXISTS idx_audio_generations_status ON public.audio_generations(status);
CREATE INDEX IF NOT EXISTS idx_audio_generations_user_status ON public.audio_generations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_audio_generations_is_closed ON public.audio_generations(is_closed);
CREATE INDEX IF NOT EXISTS idx_audio_generations_created_at ON public.audio_generations(created_at DESC);

-- Security table indexes
CREATE INDEX IF NOT EXISTS idx_banned_ips_ip ON public.banned_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_banned_devices_hash ON public.banned_devices(device_hash);

-- Rate limits index (for cleanup operations)
CREATE INDEX IF NOT EXISTS idx_rate_limits_last_request ON public.rate_limits(last_request);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON public.activity_logs(user_id, created_at DESC);

-- Step 2: Create updated_at trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at column if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;
ALTER TABLE public.audio_generations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- Create triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_audio_generations_updated_at ON public.audio_generations;
CREATE TRIGGER update_audio_generations_updated_at
    BEFORE UPDATE ON public.audio_generations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Step 3: Create cleanup functions for maintenance

-- Function to clean old rate limit entries (call periodically via cron or Edge Function)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits(older_than_hours int DEFAULT 24)
RETURNS int AS $$
DECLARE
    deleted_count int;
BEGIN
    DELETE FROM public.rate_limits
    WHERE last_request < NOW() - (older_than_hours || ' hours')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean old activity logs (keep 90 days by default)
CREATE OR REPLACE FUNCTION public.cleanup_activity_logs(keep_days int DEFAULT 90)
RETURNS int AS $$
DECLARE
    deleted_count int;
BEGIN
    DELETE FROM public.activity_logs
    WHERE created_at < NOW() - (keep_days || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean abandoned draft sessions (older than 30 days with no updates)
CREATE OR REPLACE FUNCTION public.cleanup_abandoned_drafts(older_than_days int DEFAULT 30)
RETURNS int AS $$
DECLARE
    deleted_count int;
BEGIN
    DELETE FROM public.audio_generations
    WHERE status = 'draft'
    AND is_closed = false
    AND (
        (updated_at IS NOT NULL AND updated_at < NOW() - (older_than_days || ' days')::interval)
        OR (updated_at IS NULL AND created_at < NOW() - (older_than_days || ' days')::interval)
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create a master cleanup function that admins can call
CREATE OR REPLACE FUNCTION public.run_maintenance_cleanup()
RETURNS jsonb AS $$
DECLARE
    rate_limits_cleaned int;
    logs_cleaned int;
    drafts_cleaned int;
BEGIN
    -- Only allow admins to run this
    IF NOT public.current_user_is_admin() THEN
        RAISE EXCEPTION 'Only admins can run maintenance cleanup';
    END IF;
    
    rate_limits_cleaned := public.cleanup_rate_limits(24);
    logs_cleaned := public.cleanup_activity_logs(90);
    drafts_cleaned := public.cleanup_abandoned_drafts(30);
    
    -- Log the cleanup action
    INSERT INTO public.activity_logs (user_id, activity_type, details)
    VALUES (
        auth.uid(),
        'maintenance_cleanup',
        jsonb_build_object(
            'rate_limits_cleaned', rate_limits_cleaned,
            'activity_logs_cleaned', logs_cleaned,
            'drafts_cleaned', drafts_cleaned,
            'run_at', now()
        )
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'rate_limits_cleaned', rate_limits_cleaned,
        'activity_logs_cleaned', logs_cleaned,
        'drafts_cleaned', drafts_cleaned
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_activity_logs(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_abandoned_drafts(int) TO service_role;
GRANT EXECUTE ON FUNCTION public.run_maintenance_cleanup() TO authenticated;

-- Step 6: Add constraints for data integrity

-- Ensure status values are valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'audio_generations_status_check'
    ) THEN
        ALTER TABLE public.audio_generations
        ADD CONSTRAINT audio_generations_status_check
        CHECK (status IN ('draft', 'processing', 'completed', 'failed'));
    END IF;
END$$;

-- Ensure plan values are valid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_plan_check'
    ) THEN
        ALTER TABLE public.users
        ADD CONSTRAINT users_plan_check
        CHECK (plan IN ('free', 'pro', 'scale', 'enterprise'));
    END IF;
END$$;

-- Step 7: Create view for admin dashboard stats
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.users WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_24h,
    (SELECT COUNT(*) FROM public.users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d,
    (SELECT COUNT(*) FROM public.audio_generations) as total_generations,
    (SELECT COUNT(*) FROM public.audio_generations WHERE status = 'completed') as completed_generations,
    (SELECT COUNT(*) FROM public.audio_generations WHERE status = 'draft' AND is_closed = false) as active_drafts,
    (SELECT COUNT(*) FROM public.banned_ips) as banned_ips_count,
    (SELECT COUNT(*) FROM public.banned_devices) as banned_devices_count,
    (SELECT COUNT(*) FROM public.users WHERE is_banned = true) as banned_users_count;

-- Grant read access to admin stats view
GRANT SELECT ON public.admin_stats TO authenticated;

-- Done!
SELECT 'Database performance and maintenance improvements complete!' as status;
