-- =============================================
-- ADD ADMIN ROLE COLUMN TO USERS
-- Run this in Supabase SQL Editor
-- =============================================

-- Add role column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'));

-- Add is_banned column if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Update admin user (update with your actual admin user ID if known)
-- You can find your user ID in Supabase Auth > Users
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'damon66.op@gmail.com';

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

SELECT 'Admin role column added successfully!' as status;
