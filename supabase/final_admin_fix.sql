-- FINAL FIX: Reset all policies for system_settings to ensure clean state
DROP POLICY IF EXISTS "Allow public read access" ON system_settings;
DROP POLICY IF EXISTS "Allow admin update access" ON system_settings;
DROP POLICY IF EXISTS "Allow admin all access" ON system_settings;

-- Ensure table exists
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- 1. Public Read (Essential for app to check status)
CREATE POLICY "Allow public read access" 
ON system_settings FOR SELECT 
TO public 
USING (true);

-- 2. Admin FULL Access (Update AND Insert)
-- This grants SELECT, INSERT, UPDATE, DELETE to the specified email
CREATE POLICY "Allow admin all access" 
ON system_settings FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'email' = 'damon66.op@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'damon66.op@gmail.com');

-- Ensure the row exists so Upsert works smoothly as an Update
INSERT INTO system_settings (key, value) 
VALUES ('maintenance_mode', '{"enabled": false}') 
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value
    WHERE system_settings.value IS NULL; -- Just to ensure it executes only if needed or no-op
