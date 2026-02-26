-- Broadcast Location & Geotagging Support

-- 1. Add location and address to broadcasts
ALTER TABLE public.broadcasts 
ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS geotag_radius INTEGER; -- Radius in meters for geo-fencing (optional)

-- 2. Ensure profiles table exists (if missing or renamed)
-- The code uses 'profiles' but the schema shows 'users'. 
-- Let's create an alias or ensure profiles table exists for compatibility.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- If 'users' exists, we can create a view or rename it. 
        -- Given the project consistency, we'll create the table if it doesn't exist.
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            role TEXT DEFAULT 'citizen',
            avatar_url TEXT,
            created_at TIMESTAMPTZ DEFAULT now()
        );
        -- Enable RLS
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
        CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
END $$;
