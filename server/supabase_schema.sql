-- Enable PostGIS for geospatial queries
create extension if not exists postgis;

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('citizen', 'admin', 'worker')) default 'citizen',
  department text, -- for workers/admins
  created_at timestamptz default now()
);

-- Issues table
create table public.issues (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  title text not null,
  description text,
  status text check (status in ('reported', 'in_progress', 'resolved', 'rejected')) default 'reported',
  severity integer check (severity between 1 and 10),
  risk_score float,
  image_url text,
  category text, -- pothole, garbage, etc.
  assigned_to uuid references public.users(id),
  location geography(POINT),
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for geospatial search
create index issues_geo_index on public.issues using GIST (location);

-- Comments on issues
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references public.issues(id) on delete cascade,
  user_id uuid references public.users(id),
  content text not null,
  created_at timestamptz default now()
);

-- Upvotes/Downvotes
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  issue_id uuid references public.issues(id) on delete cascade,
  user_id uuid references public.users(id),
  vote_type integer check (vote_type in (1, -1)), -- 1 for upvote
  created_at timestamptz default now(),
  unique(issue_id, user_id)
);

-- Row Level Security (RLS) Policies
alter table public.users enable row level security;
alter table public.issues enable row level security;
alter table public.comments enable row level security;
alter table public.votes enable row level security;

-- Policies (simplified for initial setup)
create policy "Public issues are viewable by everyone" on public.issues for select using (true);
create policy "Users can insert their own issues" on public.issues for insert with check (auth.uid() = user_id);
create policy "Admins/Workers can update issues" on public.issues for update using (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'worker'))
);

create policy "Public profiles are viewable by everyone" on public.users for select using (true);
create policy "Users can update their own profile" on public.users for update using (auth.uid() = id);

