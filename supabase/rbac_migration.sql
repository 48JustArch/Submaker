-- ============================================
-- ROLE-BASED ACCESS CONTROL (RBAC) MIGRATION
-- Replaces hardcoded email checks with proper database roles
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create role enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
    END IF;
END$$;

-- Step 2: Add typed role column if it doesn't exist (or alter existing)
-- First check if role column exists and is text type
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role' AND data_type = 'text'
    ) THEN
        -- Convert existing text role to enum
        ALTER TABLE public.users 
        ALTER COLUMN role DROP DEFAULT;
        
        ALTER TABLE public.users 
        ALTER COLUMN role TYPE user_role USING (
            CASE 
                WHEN role = 'admin' THEN 'admin'::user_role
                WHEN role = 'moderator' THEN 'moderator'::user_role
                WHEN role = 'super_admin' THEN 'super_admin'::user_role
                ELSE 'user'::user_role
            END
        );
        
        ALTER TABLE public.users 
        ALTER COLUMN role SET DEFAULT 'user';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        -- Add new role column
        ALTER TABLE public.users 
        ADD COLUMN role user_role DEFAULT 'user';
    END IF;
END$$;

-- Step 3: Create admin_users table for explicit admin designation
-- This allows multiple admins and audit trail
CREATE TABLE IF NOT EXISTS public.admin_designations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'admin',
    designated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    designated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    notes text
);

-- Enable RLS on admin_designations
ALTER TABLE public.admin_designations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create helper functions for role checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM public.users
    WHERE id = user_id;
    
    RETURN COALESCE(user_role_val, 'user'::user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_role(user_id) IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
    RETURN public.get_user_role(user_id) = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN public.is_admin(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Update RLS policies to use role-based checks

-- Drop old hardcoded email policies
DROP POLICY IF EXISTS "Admins can view banned ips" ON banned_ips;
DROP POLICY IF EXISTS "Admins can insert banned ips" ON banned_ips;
DROP POLICY IF EXISTS "Admins can delete banned ips" ON banned_ips;
DROP POLICY IF EXISTS "Admins can view banned devices" ON banned_devices;
DROP POLICY IF EXISTS "Admins can insert banned devices" ON banned_devices;
DROP POLICY IF EXISTS "Admins can delete banned devices" ON banned_devices;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;

-- Create new role-based policies for banned_ips
CREATE POLICY "Admins can view banned ips" ON banned_ips
    FOR SELECT USING (public.current_user_is_admin());

CREATE POLICY "Admins can insert banned ips" ON banned_ips
    FOR INSERT WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Admins can delete banned ips" ON banned_ips
    FOR DELETE USING (public.current_user_is_admin());

CREATE POLICY "Admins can update banned ips" ON banned_ips
    FOR UPDATE USING (public.current_user_is_admin());

-- Create new role-based policies for banned_devices
CREATE POLICY "Admins can view banned devices" ON banned_devices
    FOR SELECT USING (public.current_user_is_admin());

CREATE POLICY "Admins can insert banned devices" ON banned_devices
    FOR INSERT WITH CHECK (public.current_user_is_admin());

CREATE POLICY "Admins can delete banned devices" ON banned_devices
    FOR DELETE USING (public.current_user_is_admin());

CREATE POLICY "Admins can update banned devices" ON banned_devices
    FOR UPDATE USING (public.current_user_is_admin());

-- Create role-based policies for users table (admin access)
CREATE POLICY "Admins can view all profiles" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR public.current_user_is_admin()
    );

CREATE POLICY "Admins can update any user" ON public.users
    FOR UPDATE USING (
        auth.uid() = id OR public.current_user_is_admin()
    );

-- Fix activity_logs policies (was too permissive)
DROP POLICY IF EXISTS "Service role can manage activity_logs" ON public.activity_logs;

CREATE POLICY "Only admins can view activity logs" ON public.activity_logs
    FOR SELECT USING (public.current_user_is_admin());

CREATE POLICY "System can insert activity logs" ON public.activity_logs
    FOR INSERT WITH CHECK (true); -- Allow service role and triggers to insert

-- Step 6: Create policies for admin_designations
CREATE POLICY "Super admins can manage admin designations" ON public.admin_designations
    FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Admins can view admin designations" ON public.admin_designations
    FOR SELECT USING (public.current_user_is_admin());

-- Step 7: Create function to promote user to admin (callable from app)
CREATE OR REPLACE FUNCTION public.promote_to_admin(
    target_user_id uuid,
    target_role user_role DEFAULT 'admin',
    notes_text text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    caller_role user_role;
BEGIN
    -- Get caller's role
    caller_role := public.get_user_role(auth.uid());
    
    -- Only super_admin can promote to admin or super_admin
    IF caller_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can promote users';
    END IF;
    
    -- Cannot promote to super_admin (must be done manually in DB)
    IF target_role = 'super_admin' THEN
        RAISE EXCEPTION 'Cannot promote to super_admin via this function';
    END IF;
    
    -- Update user role
    UPDATE public.users 
    SET role = target_role
    WHERE id = target_user_id;
    
    -- Record the designation
    INSERT INTO public.admin_designations (user_id, role, designated_by, notes)
    VALUES (target_user_id, target_role, auth.uid(), notes_text)
    ON CONFLICT (user_id) 
    DO UPDATE SET role = target_role, designated_by = auth.uid(), designated_at = now(), notes = notes_text;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create function to demote admin (callable from app)
CREATE OR REPLACE FUNCTION public.demote_from_admin(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
    caller_role user_role;
    target_role user_role;
BEGIN
    caller_role := public.get_user_role(auth.uid());
    target_role := public.get_user_role(target_user_id);
    
    -- Only super_admin can demote
    IF caller_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can demote users';
    END IF;
    
    -- Cannot demote super_admin
    IF target_role = 'super_admin' THEN
        RAISE EXCEPTION 'Cannot demote super_admin via this function';
    END IF;
    
    -- Update user role back to user
    UPDATE public.users 
    SET role = 'user'
    WHERE id = target_user_id;
    
    -- Remove designation record
    DELETE FROM public.admin_designations 
    WHERE user_id = target_user_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Set up initial super_admin (replace with your user ID after first login)
-- You need to run this manually with your actual user ID:
-- UPDATE public.users SET role = 'super_admin' WHERE email = 'your-email@example.com';

-- For now, set the existing admin email as super_admin
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'damon66.op@gmail.com';

-- Step 10: Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Step 11: Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_admin(uuid, user_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.demote_from_admin(uuid) TO authenticated;

-- Done!
SELECT 'RBAC migration complete! Your initial super_admin has been set.' as status;
