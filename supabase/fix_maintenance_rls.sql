-- FIX: Drop policies if they already exist to prevent "policy already exists" error
DROP POLICY IF EXISTS "Allow public read access" ON system_settings;
DROP POLICY IF EXISTS "Allow admin update access" ON system_settings;

-- Ensure table exists (just in case, though duplicate error implies it does)
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy (Public)
CREATE POLICY "Allow public read access" 
ON system_settings FOR SELECT 
TO public 
USING (true);

-- 2. Update Policy (Admins Only)
-- Includes your email: damon66.op@gmail.com
CREATE POLICY "Allow admin update access" 
ON system_settings FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'email' IN (
    '48justarch@gmail.com', 
    'damon66.op@gmail.com'
))
WITH CHECK (auth.jwt() ->> 'email' IN (
    '48justarch@gmail.com', 
    'damon66.op@gmail.com'
));

-- Insert default value if missing
INSERT INTO system_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false}')
ON CONFLICT (key) DO NOTHING;
