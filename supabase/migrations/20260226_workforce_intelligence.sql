-- 1. Enforce single active assignment per report (Mission Exclusivity)
CREATE UNIQUE INDEX IF NOT EXISTS idx_report_assignments_single_active 
ON public.report_assignments (report_id) 
WHERE (is_active = true);

-- 2. Automated Worker Metrics System
-- Ensure worker_metrics entry exists for every worker
CREATE OR REPLACE FUNCTION public.ensure_worker_metrics(w_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.worker_metrics (worker_id)
    VALUES (w_id)
    ON CONFLICT (worker_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update metrics when a new active assignment is created
CREATE OR REPLACE FUNCTION public.handle_worker_metrics_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true THEN
        PERFORM public.ensure_worker_metrics(NEW.worker_id);
        UPDATE public.worker_metrics 
        SET total_assigned = total_assigned + 1,
            last_updated = now()
        WHERE worker_id = NEW.worker_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_worker_metrics_on_assign ON public.report_assignments;
CREATE TRIGGER tr_worker_metrics_on_assign
    AFTER INSERT ON public.report_assignments
    FOR EACH ROW EXECUTE FUNCTION public.handle_worker_metrics_on_assignment();

-- Trigger: Update metrics when an issue is resolved
CREATE OR REPLACE FUNCTION public.handle_worker_metrics_on_resolution()
RETURNS TRIGGER AS $$
DECLARE
    v_worker_id UUID;
BEGIN
    -- Check if status transitioned to resolved
    IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
        -- Locate the active worker for this mission
        SELECT worker_id INTO v_worker_id 
        FROM public.report_assignments 
        WHERE report_id = NEW.id AND is_active = true;

        IF v_worker_id IS NOT NULL THEN
            PERFORM public.ensure_worker_metrics(v_worker_id);
            UPDATE public.worker_metrics 
            SET total_resolved = total_resolved + 1,
                last_updated = now()
            WHERE worker_id = v_worker_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_worker_metrics_on_resolve ON public.issues;
CREATE TRIGGER tr_worker_metrics_on_resolve
    AFTER UPDATE OF status ON public.issues
    FOR EACH ROW EXECUTE FUNCTION public.handle_worker_metrics_on_resolution();
