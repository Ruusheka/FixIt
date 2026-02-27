-- WORKFORCE COOLDOWN & LOGISTICS ENHANCEMENT
-- Implements a 3-day cooldown for workers after assignment

-- 1. Add last_assigned_at to workers
ALTER TABLE public.workers 
ADD COLUMN IF NOT EXISTS last_assigned_at TIMESTAMPTZ;

-- 2. Ensure report_assignments has worker name availability (via join, but we check schema)
-- No changes needed to report_assignments if it already links to workers/profiles.

-- 3. (Optional) Function to check worker availability including 3-day cooldown
-- We will handle the filtering in the frontend for now for better UX (showing why they are unavailable),
-- but we could add a DB level check if needed.

-- 4. Enable Realtime for report_assignments to track reassignments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'report_assignments') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.report_assignments;
    END IF;
END $$;
