-- Create table for Banned IPs
create table if not exists banned_ips (
  id uuid default gen_random_uuid() primary key,
  ip_address text not null unique,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for Banned Devices (Fingerprints)
create table if not exists banned_devices (
  id uuid default gen_random_uuid() primary key,
  device_hash text not null unique,
  user_id uuid references auth.users(id), -- Optional link to user who used this device
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table banned_ips enable row level security;
alter table banned_devices enable row level security;

-- Policies: Only Admins can view/insert/delete (assuming admin check logic exists or handled via service key in middleware)
-- For Middleware usage (Service Role), RLS is bypassed, so these policies are for Frontend/Admin UI access.

create policy "Admins can view banned ips"
  on banned_ips for select
  using ( auth.jwt() ->> 'email' = 'damon66.op@gmail.com' ); -- Replace with your admin check logic

create policy "Admins can insert banned ips"
  on banned_ips for insert
  with check ( auth.jwt() ->> 'email' = 'damon66.op@gmail.com' );

create policy "Admins can delete banned ips"
  on banned_ips for delete
  using ( auth.jwt() ->> 'email' = 'damon66.op@gmail.com' );

-- Same for Devices
create policy "Admins can view banned devices"
  on banned_devices for select
  using ( auth.jwt() ->> 'email' = 'damon66.op@gmail.com' );

create policy "Admins can insert banned devices"
  on banned_devices for insert
  with check ( auth.jwt() ->> 'email' = 'damon66.op@gmail.com' );

create policy "Admins can delete banned devices"
  on banned_devices for delete
  using ( auth.jwt() ->> 'email' = 'damon66.op@gmail.com' );
