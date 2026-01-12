-- Create a table for global system settings
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by UUID REFERENCES auth.users(id)
);

-- Turn on RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to READ settings (needed to check if maintenance is on)
CREATE POLICY "Allow public read access"
ON system_settings FOR SELECT
TO public
USING (true);

-- Allow ONLY admins to UPDATE settings
-- This relies on the admin check logic (usually email based or a specific role)
-- For now, we will use the same logic as the app: check if user email is in the admin list
-- But since we can't easily check 'admin list' in SQL without a table, we'll restrict to authenticated for now
-- AND rely on the application layer to enforce 'admin-only' for the UI controls.
-- Ideally, you'd have an 'admins' table or 'role' column.
-- For stricter security, update this policy to check your specific admin criteria.
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

-- Insert default maintenance mode setting if not exists
INSERT INTO system_settings (key, value)
VALUES ('maintenance_mode', '{"enabled": false, "message": "We are upgrading our systems. Please check back soon."}')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE system_settings IS 'Global configuration flags like maintenance mode';
