-- FINAL INFRASTRUCTURE FIX: BROADCAST & IDENTITY SYNC

-- 1. Ensure Profiles table is robust and correctly indexed
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('citizen', 'worker', 'admin')) DEFAULT 'citizen',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Auth Sync Trigger (The "Standard Supabase Way")
-- This ensures that every time a user signs up, they get a profile entry automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'citizen')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger the function every time a user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Broadcast Table Refinent (Ensure all columns exist)
DO $$ 
BEGIN
    ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
    ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
    ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.broadcasts ADD COLUMN IF NOT EXISTS geotag_radius INTEGER;
EXCEPTION
    WHEN undefined_table THEN
        -- Create table if it doesn't exist at all
        CREATE TABLE public.broadcasts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            target_role TEXT CHECK (target_role IN ('citizen', 'worker', 'admin', 'all')) DEFAULT 'all',
            target_department_id UUID,
            priority TEXT CHECK (priority IN ('normal', 'important', 'emergency')) DEFAULT 'normal',
            is_active BOOLEAN DEFAULT true,
            created_by UUID REFERENCES public.profiles(id),
            created_at TIMESTAMPTZ DEFAULT now(),
            scheduled_at TIMESTAMPTZ,
            expires_at TIMESTAMPTZ,
            location_lat DOUBLE PRECISION,
            location_lng DOUBLE PRECISION,
            address TEXT,
            geotag_radius INTEGER
        );
END $$;

-- 4. Re-establish RLS Policies for Transmission
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to broadcasts" ON public.broadcasts;
CREATE POLICY "Admins have full access to broadcasts" ON public.broadcasts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Users can view relevant broadcasts" ON public.broadcasts;
CREATE POLICY "Users can view relevant broadcasts" ON public.broadcasts
    FOR SELECT USING (
        target_role = 'all' OR 
        target_role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 5. Seed Admin (Run this manually for your account if needed)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
