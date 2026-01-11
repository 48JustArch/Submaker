-- Create a table for public profiles if it doesn't exist
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  email text,
  name text,
  avatar_url text,
  plan text default 'free',
  generations_used integer default 0,
  generations_limit integer default 3,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Turn on Row Level Security
alter table public.users enable row level security;

-- Allow users to view their own profile
create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

-- Create a table for audio generations
create table if not exists public.audio_generations (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references public.users(id) on delete cascade not null,
    title text,
    intention text,
    file_path text, -- Path in Storage
    duration_seconds integer,
    status text default 'draft', -- draft, processing, completed, failed
    metadata jsonb,
    audio_type text, -- mp3, mp4
    audio_url text, -- Download URL
    is_closed boolean default false -- True after export, cannot reopen
);

-- RLS for Audio Generations
alter table public.audio_generations enable row level security;

create policy "Users can view own audio" on public.audio_generations
    for select using (auth.uid() = user_id);

create policy "Users can insert own audio" on public.audio_generations
    for insert with check (auth.uid() = user_id);

create policy "Users can update own audio" on public.audio_generations
    for update using (auth.uid() = user_id);

-- Function to handle new user signup automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, avatar_url, plan, generations_used, generations_limit, created_at)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'free',
    0,
    3,
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function on new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
