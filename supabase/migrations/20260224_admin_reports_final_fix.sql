-- ZAPFLUX RECOVERY & SCHEMA SYNCHRONIZATION SCRIPT
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX 404/403 ERRORS

-- 1. Ensure Profile System is Correct
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT NOT NULL,
            full_name TEXT,
            role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'worker', 'admin')),
            created_at TIMESTAMPTZ DEFAULT now() NOT NULL
        );
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. Ensure Core Issues Table is Up-to-Date
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_worker UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Create Operational Tables (If Missing)
CREATE TABLE IF NOT EXISTS public.report_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(report_id, worker_id)
);

CREATE TABLE IF NOT EXISTS public.report_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    status_after_update TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_private_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(report_id)
);

CREATE TABLE IF NOT EXISTS public.report_private_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.report_private_threads(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Re-Apply RLS Safely (Fixes 403 Errors)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_private_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('profiles', 'report_assignments', 'report_updates', 'report_comments', 'report_private_threads', 'report_private_messages', 'notifications')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.' || pol.tablename;
    END LOOP;
END $$;

-- 5. Deployment of New Policies
CREATE POLICY "Profiles are viewable by authenticated" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Read assignments" ON public.report_assignments FOR SELECT USING (true);
CREATE POLICY "Insert updates/assignments" ON public.report_assignments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'worker')));

CREATE POLICY "Read updates" ON public.report_updates FOR SELECT USING (true);
CREATE POLICY "Insert updates" ON public.report_updates FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'worker')));

CREATE POLICY "Read/Write comments" ON public.report_comments FOR ALL USING (true);

CREATE POLICY "Private Thread Access" ON public.report_private_threads FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR citizen_id = auth.uid()
);
CREATE POLICY "Private Thread Creation" ON public.report_private_threads FOR INSERT WITH CHECK (true);

CREATE POLICY "Private Message Access" ON public.report_private_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR 
    EXISTS (SELECT 1 FROM public.report_private_threads WHERE id = thread_id AND citizen_id = auth.uid())
);
CREATE POLICY "Private Message Send" ON public.report_private_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR 
    EXISTS (SELECT 1 FROM public.report_private_threads WHERE id = thread_id AND citizen_id = auth.uid())
);

CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- 6. Enable Realtime Safely
DO $$
DECLARE
    tbl_name TEXT;
    target_tables TEXT[] := ARRAY['report_private_messages', 'notifications', 'report_private_threads', 'report_updates', 'report_comments', 'report_assignments'];
BEGIN
    FOREACH tbl_name IN ARRAY target_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = tbl_name
        ) THEN
            EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.' || tbl_name;
        END IF;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Publication updates encountered an issue: %', SQLERRM;
END $$;

-- 7. Reload
NOTIFY pgrst, 'reload schema';
