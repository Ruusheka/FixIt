-- 20260227_worker_portal.sql
-- Schema updates for the new Worker Portal System

-- 1. Extend Worker Metrics
ALTER TABLE public.worker_metrics
ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS rework_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_level TEXT DEFAULT 'Probation Worker';

-- 2. Add 'awaiting_verification' string to issues status enum if not already there constraint-wise
-- Our recent migration 20260226_ops_fix_final.sql added 'awaiting_verification' to the constraint,
-- so we are good to use it for 'WORK_SUBMITTED'.

-- 3. Worker Ratings Table
CREATE TABLE IF NOT EXISTS public.worker_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    remark TEXT,
    rated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(report_id, worker_id) -- Only one rating per worker per report
);

-- 4. Private Worker-Admin Chat
CREATE TABLE IF NOT EXISTS public.worker_admin_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL, -- 'admin' or 'worker'
    message TEXT NOT NULL,
    read_status BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Automate Badge Level & Average Rating Calculation
CREATE OR REPLACE FUNCTION public.update_worker_rating_and_badge()
RETURNS TRIGGER AS $$
DECLARE
    v_avg NUMERIC;
    v_badge TEXT;
    v_total_completed INTEGER;
BEGIN
    -- Calculate New Average Rating
    SELECT COALESCE(AVG(rating), 0) INTO v_avg
    FROM public.worker_ratings
    WHERE worker_id = NEW.worker_id;

    -- Fetch total completed to factor into badge optionally (for now relying strictly on user's rating ranges)
    SELECT total_resolved INTO v_total_completed
    FROM public.worker_metrics
    WHERE worker_id = NEW.worker_id;

    -- Determine Badge Level (User criteria: 4.8+=Real Hero, 4.0+=Field Champion, 3.0+=Active Operative, <3=Probation)
    IF v_avg >= 4.8 THEN
        v_badge := 'Real Hero';
    ELSIF v_avg >= 4.0 THEN
        v_badge := 'Field Champion';
    ELSIF v_avg >= 3.0 THEN
        v_badge := 'Active Operative';
    ELSE
        v_badge := 'Probation Worker';
    END IF;

    -- Update Metrics Table
    UPDATE public.worker_metrics
    SET rating_avg = ROUND(v_avg, 2),
        badge_level = v_badge,
        last_updated = now()
    WHERE worker_id = NEW.worker_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_worker_rating_update ON public.worker_ratings;
CREATE TRIGGER tr_worker_rating_update
    AFTER INSERT OR UPDATE ON public.worker_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_worker_rating_and_badge();

-- 6. Automate Rework Tracking
CREATE OR REPLACE FUNCTION public.handle_worker_rework_count()
RETURNS TRIGGER AS $$
DECLARE
    v_worker_id UUID;
BEGIN
    -- If status transitions to 'reopened' (the backend equivalent for REWORK)
    IF NEW.status = 'reopened' AND (OLD.status IS NULL OR OLD.status != 'reopened') THEN
        -- Find the active worker for this report
        SELECT worker_id INTO v_worker_id 
        FROM public.report_assignments 
        WHERE report_id = NEW.id AND is_active = true;

        IF v_worker_id IS NOT NULL THEN
            UPDATE public.worker_metrics
            SET rework_count = rework_count + 1,
                last_updated = now()
            WHERE worker_id = v_worker_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_worker_rework_count_update ON public.issues;
CREATE TRIGGER tr_worker_rework_count_update
    AFTER UPDATE OF status ON public.issues
    FOR EACH ROW EXECUTE FUNCTION public.handle_worker_rework_count();


-- 7. RLS Enhancements
ALTER TABLE public.worker_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_admin_messages ENABLE ROW LEVEL SECURITY;

-- Worker Ratings RLS: Anyone can read, only admin can insert
CREATE POLICY "Everyone reads ratings" ON public.worker_ratings FOR SELECT USING (true);
CREATE POLICY "Admins insert ratings" ON public.worker_ratings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Worker Admin Chat RLS: Viewable/Insertable by the assigned worker and any admin
CREATE POLICY "Worker Admin Chat Access" ON public.worker_admin_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM public.report_assignments WHERE report_id = worker_admin_messages.report_id AND worker_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Worker Admin Chat Insert" ON public.worker_admin_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM public.report_assignments WHERE report_id = worker_admin_messages.report_id AND worker_id = auth.uid() AND is_active = true)
);

-- 8. Enable Realtime Delivery
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'worker_ratings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_ratings;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'worker_admin_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.worker_admin_messages;
    END IF;
END $$;
