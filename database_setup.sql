-- 1. Enable PostGIS extension (Required for 'geometry' type)
create extension if not exists postgis schema extensions;

-- 2. Create the issues table
create table public.issues (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  status text default 'reported' check (status in ('reported', 'in_progress', 'resolved')),
  severity int default 0,
  category text,
  location geometry(Point, 4326), 
  latitude float,
  longitude float,
  image_url text,
  risk_score float default 0,
  user_id uuid, -- Link to auth.users if authenticated, null if anonymous
  address text
);

-- 3. Enable Row Level Security
alter table public.issues enable row level security;

-- 4. Create policies
-- Allow public read access to all issues
create policy "Public issues are viewable by everyone"
  on public.issues for select
  using ( true );

-- Allow public/anonymous to insert issues
create policy "Anyone can upload an issue"
  on public.issues for insert
  with check ( true );

-- Allow updates (status changes)
create policy "Anyone can update specific fields"
  on public.issues for update
  using ( true );

-- 5. Set up storage bucket (if not exists)
insert into storage.buckets (id, name, public)
values ('issues', 'issues', true)
on conflict (id) do nothing;

-- 6. Storage Policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'issues' );

create policy "Public Upload"
  on storage.objects for insert
  with check ( bucket_id = 'issues' );
