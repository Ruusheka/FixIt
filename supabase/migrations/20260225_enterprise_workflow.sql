-- Phase 1: Final Report Closure & Locking System

-- 1. Update issue status constraints
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_status_check 
CHECK (status IN ('reported', 'assigned', 'in_progress', 'awaiting_verification', 'reopened', 'closed'));

-- 2. Work Proof Table
CREATE TABLE IF NOT EXISTS public.work_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    description TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ
);

-- 3. Verification Log Table
CREATE TABLE IF NOT EXISTS public.report_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('approved', 'rejected')),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    comment TEXT, 
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Strict Locking Rule: Once status = 'closed', it can NEVER transition to any other state.
CREATE OR REPLACE FUNCTION public.enforce_issue_lock()
RETURNS TRIGGER AS $$
BEGIN
    -- If the old status was 'closed', prevent any change
    IF OLD.status = 'closed' THEN
        RAISE EXCEPTION 'This report is closed and permanently locked.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_enforce_issue_lock ON public.issues;
CREATE TRIGGER tr_enforce_issue_lock
    BEFORE UPDATE ON public.issues
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_issue_lock();

-- 5. Disable Uploads if closed
CREATE OR REPLACE FUNCTION public.check_proof_upload_allowed()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.issues WHERE id = NEW.report_id AND status = 'closed') THEN
        RAISE EXCEPTION 'Cannot upload proof for a closed report.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_check_proof_upload_allowed ON public.work_proofs;
CREATE TRIGGER tr_check_proof_upload_allowed
    BEFORE INSERT ON public.work_proofs
    FOR EACH ROW
    EXECUTE FUNCTION public.check_proof_upload_allowed();

-- 6. RLS for new tables
ALTER TABLE public.work_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_verification_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to be safe)
DROP POLICY IF EXISTS "View work proofs" ON public.work_proofs;
DROP POLICY IF EXISTS "Workers insert proof" ON public.work_proofs;
DROP POLICY IF EXISTS "View verification logs" ON public.report_verification_logs;
DROP POLICY IF EXISTS "Admins manage verification logs" ON public.report_verification_logs;

CREATE POLICY "View work proofs" ON public.work_proofs FOR SELECT USING (true);
CREATE POLICY "Workers insert proof" ON public.work_proofs FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'worker')
);

CREATE POLICY "View verification logs" ON public.report_verification_logs FOR SELECT USING (true);
CREATE POLICY "Admins manage verification logs" ON public.report_verification_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 7. Enable Realtime safely
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'work_proofs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.work_proofs;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'report_verification_logs') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.report_verification_logs;
    END IF;
END $$;
