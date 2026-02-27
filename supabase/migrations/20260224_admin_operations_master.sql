-- ZAPFLUX OPERATIONS MASTER SCHEMA
-- Enables Workforce Management, Escalations, SLA Rules, and Audit Systems

-- 1. Departments
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Worker Profiles (Extends profiles)
CREATE TABLE IF NOT EXISTS public.workers (
    id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    phone TEXT,
    status TEXT CHECK (status IN ('available', 'busy', 'on_leave')) DEFAULT 'available',
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Report Assignments (Refined for Audit)
-- Note: We already have a report_assignments table in previous migrations.
-- We'll adjust it to include assigned_by and is_active.
ALTER TABLE public.report_assignments 
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 4. Escalations Center
CREATE TABLE IF NOT EXISTS public.escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    escalated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SLA Rules Configuration
CREATE TABLE IF NOT EXISTS public.sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    priority TEXT UNIQUE CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    max_hours INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Worker Performance Metrics
CREATE TABLE IF NOT EXISTS public.worker_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id UUID REFERENCES public.workers(id) ON DELETE CASCADE,
    total_assigned INTEGER DEFAULT 0,
    total_resolved INTEGER DEFAULT 0,
    total_overdue INTEGER DEFAULT 0,
    avg_resolution_time INTERVAL,
    performance_score NUMERIC DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT now(),
    UNIQUE(worker_id)
);

-- 7. Internal Announcements
CREATE TABLE IF NOT EXISTS public.internal_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('normal', 'important', 'emergency')) DEFAULT 'normal',
    department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ
);

-- 8. Admin Activity Logs (Audit System)
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Seed Default Departments
INSERT INTO public.departments (name, description) VALUES
('Sanitation', 'Public waste management and hygiene'),
('Infrastructure', 'Roads, bridges, and structural maintenance'),
('Utilities', 'Water, electricity, and sewage services'),
('Public Safety', 'Security and emergency response coordination')
ON CONFLICT (name) DO NOTHING;

-- 10. Seed Default SLA Rules
INSERT INTO public.sla_rules (priority, max_hours) VALUES
('Low', 72),
('Medium', 48),
('High', 24),
('Urgent', 12)
ON CONFLICT (priority) DO NOTHING;

-- 11. Security (RLS)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Admins have full access, others have limited)
CREATE POLICY "Admins full access departments" ON public.departments FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Public read departments" ON public.departments FOR SELECT USING (true);

CREATE POLICY "Admins full access workers" ON public.workers FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Workers view self" ON public.workers FOR SELECT USING (id = auth.uid());

CREATE POLICY "Operational personnel view escalations" ON public.escalations FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'worker')));
CREATE POLICY "Admins manage escalations" ON public.escalations FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public read SLA" ON public.sla_rules FOR SELECT USING (true);
CREATE POLICY "Admins manage SLA" ON public.sla_rules FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Metrics viewable by authenticated" ON public.worker_metrics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Internal announcements viewable by workers/admins" ON public.internal_announcements FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'worker')));
CREATE POLICY "Admins can view all audit logs" ON public.admin_activity_logs FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 13. Automatic Worker Provisioning Trigger
CREATE OR REPLACE FUNCTION public.handle_worker_provisioning()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'worker' THEN
        -- Create worker record if it doesn't exist
        INSERT INTO public.workers (id, status)
        VALUES (NEW.id, 'available')
        ON CONFLICT (id) DO NOTHING;

        -- Initialize metrics if they don't exist
        INSERT INTO public.worker_metrics (worker_id)
        VALUES (NEW.id)
        ON CONFLICT (worker_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_worker_role_assigned ON public.profiles;
CREATE TRIGGER on_worker_role_assigned
    AFTER INSERT OR UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_worker_provisioning();

-- 14. Robust Realtime Publication Management
DO $$
BEGIN
    -- Ensure the publication exists
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add tables safely (checking for existing membership)
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'workers') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.workers;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'escalations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.escalations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'internal_announcements') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.internal_announcements;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'admin_activity_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_activity_logs;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'worker_metrics') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_metrics;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'sla_rules') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.sla_rules;
    END IF;
END $$;
