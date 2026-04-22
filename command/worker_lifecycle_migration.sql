-- COMPREHENSIVE WORKER LIFECYCLE MIGRATION (V5 - FINAL FIX)
-- Run this in your Supabase SQL Editor

-- 1. Ensure Profile roles are correct
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'worker', 'admin'));
    END IF;
END $$;

-- 2. Core Issues Table updates
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_worker uuid REFERENCES public.profiles(id);
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent', 'Critical'));
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- 3. Core Operational Tables
-- Create table and add columns if missing
CREATE TABLE IF NOT EXISTS public.report_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(report_id, worker_id)
);

-- Explicitly ensure columns exist even if table was created before
ALTER TABLE public.report_assignments ADD COLUMN IF NOT EXISTS deadline timestamptz;
ALTER TABLE public.report_assignments ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
ALTER TABLE public.report_assignments ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.report_assignments ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.report_assignments ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.report_assignments ADD COLUMN IF NOT EXISTS assigned_at timestamptz DEFAULT now();

CREATE TABLE IF NOT EXISTS public.work_proofs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  before_image_url text,
  after_image_url text,
  worker_notes text,
  admin_notes text,
  status text DEFAULT 'pending',
  verified boolean DEFAULT false,
  verified_by uuid REFERENCES public.profiles(id),
  verified_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 4. Logging & Feedback Tables
CREATE TABLE IF NOT EXISTS public.report_verification_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.profiles(id),
  action text NOT NULL, -- 'approved', 'rejected'
  comment text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.worker_ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  worker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  remark text,
  rated_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_activity_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id),
  action text NOT NULL, -- e.g., 'worker_assigned', 'status_changed'
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- 5. Metrics System
CREATE TABLE IF NOT EXISTS public.worker_metrics (
  worker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  total_assigned int DEFAULT 0,
  total_resolved int DEFAULT 0,
  rework_count int DEFAULT 0,
  rating_avg decimal(3,2) DEFAULT 0.0,
  badge_level text DEFAULT 'Probation Worker',
  last_updated timestamptz DEFAULT now()
);

-- 6. Messaging & Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 7. Views (Robust Rebuild)
DO $$ 
BEGIN
    DROP VIEW IF EXISTS public.resolution_proofs CASCADE;
    DROP TABLE IF EXISTS public.resolution_proofs CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE VIEW public.resolution_proofs AS
SELECT * FROM public.work_proofs;

-- 8. Enable RLS
ALTER TABLE public.report_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_activity_logs ENABLE ROW LEVEL SECURITY;

-- 9. Basic Policies (Ensure for all tables)
DO $$ 
DECLARE
    tbl_name TEXT;
    all_tables TEXT[] := ARRAY['report_assignments', 'work_proofs', 'notifications', 'report_verification_logs', 'worker_ratings', 'worker_metrics', 'report_activity_logs'];
BEGIN
    FOREACH tbl_name IN ARRAY all_tables LOOP
        EXECUTE 'DROP POLICY IF EXISTS "Enable access for everyone" ON public.' || tbl_name;
        EXECUTE 'CREATE POLICY "Enable access for everyone" ON public.' || tbl_name || ' FOR ALL USING (true)';
    END LOOP;
END $$;

-- 10. Enable Realtime
DO $$
DECLARE
    tbl_name TEXT;
    target_tables TEXT[] := ARRAY['notifications', 'issues', 'work_proofs', 'report_assignments'];
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
END $$;

-- 11. CRITICAL: FORCE SCHEMA RELOAD
NOTIFY pgrst, 'reload schema';
