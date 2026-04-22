-- RUN THIS SCRIPT TO VERIFY AND FIX THE SCHEMA

-- 1. Check if profiles table exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        
        -- Create Table if missing
        create table public.profiles (
          id uuid not null references auth.users(id) on delete cascade primary key,
          email text not null,
          full_name text,
          role text not null default 'citizen' check (role in ('citizen', 'worker', 'admin')),
          created_at timestamp with time zone default timezone('utc'::text, now()) not null
        );

        -- Enable RLS
        alter table public.profiles enable row level security;

        -- RLS Policy
        create policy "Authenticated users can read profiles"
          on public.profiles for select
          to authenticated
          using ( true );

        create policy "Users can update own profile"
          on public.profiles for update
          using ( auth.uid() = id );

        RAISE NOTICE 'Profiles table created.';
    ELSE
        RAISE NOTICE 'Profiles table already exists.';
    END IF;
END $$;

-- 2. Ensure Trigger exists
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    case
        when new.email = 'ruuakilavarshini@gmail.com' then 'admin'
        else 'citizen'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger to be safe
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. BACKFILL: Create profiles for existing users who don't have one
insert into public.profiles (id, email, role)
select id, email, 
  case when email = 'ruuakilavarshini@gmail.com' then 'admin' else 'citizen' end
from auth.users
where id not in (select id from public.profiles)
on conflict (id) do nothing;

-- 4. RELOAD SCHEMA (Fixes 406 Errors)
NOTIFY pgrst, 'reload schema';
