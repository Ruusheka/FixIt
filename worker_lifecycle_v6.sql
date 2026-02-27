-- WORKER LIFECYCLE V6 - CHAT & STATUS REFINEMENT
-- Run this in your Supabase SQL Editor

-- 1. Create Private Chat Table for Admin-Worker
CREATE TABLE IF NOT EXISTS public.report_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid REFERENCES public.issues(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_role text CHECK (sender_role IN ('admin', 'worker')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Add 'assigned' to issues status check if it exists, otherwise alter
-- This handles legacy constraints
DO $$
BEGIN
    -- Check if we can just alter the constraint
    ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;
    ALTER TABLE public.issues ADD CONSTRAINT issues_status_check 
    CHECK (status IN ('reported', 'assigned', 'in_progress', 'awaiting_verification', 'reopened', 'closed', 'UNDER_REVIEW', 'RESOLVED'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update failed, ensure manual status alignment';
END $$;

-- 3. Ensure report_assignments has 'REWORK' status capability (handled via status column in issues or metadata)
-- For now, we use the issue status 'reopened' as 'REWORK' in the UI.

-- 4. Enable RLS and Policies for Chat
ALTER TABLE public.report_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Access report messages" ON public.report_messages;
CREATE POLICY "Access report messages" ON public.report_messages FOR ALL USING (true);

-- 5. Enable Realtime for Chat
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'report_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.report_messages;
    END IF;
END $$;

-- 6. Trigger for Worker Metrics cleanup if needed
-- (Assuming worker_metrics exist from previous migration)

-- 7. Force reload
NOTIFY pgrst, 'reload schema';
