-- 1. Create Profiles Table
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  avatar_url text,
  role text not null default 'citizen' check (role in ('citizen', 'worker', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. RLS Policies

-- Public Read (Needed for Admin to see all users, and for self to see self)
-- Ideally: Users can read their own profile. Admins can read all.
-- For simplicity in this demo: Allow authenticated users to read profiles.
create policy "Authenticated users can read profiles"
  on public.profiles for select
  to authenticated
  using ( true );

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- 4. Auto-create Profile on Signup (Trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case
        when new.email = 'admin@fixit.com' then 'admin'
        else 'citizen'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Trigger Definition
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
