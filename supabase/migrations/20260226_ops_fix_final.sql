-- 1. Fix Status Constraints in Issues
ALTER TABLE public.issues DROP CONSTRAINT IF EXISTS issues_status_check;
ALTER TABLE public.issues ADD CONSTRAINT issues_status_check 
CHECK (status IN ('reported', 'assigned', 'in_progress', 'awaiting_verification', 'resolved', 'reopened', 'closed'));

-- 2. Fix Escalations Schema (Add missing columns used in code)
ALTER TABLE public.escalations ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- 3. Fix Permission Gaps (RLS)
-- Ensure Admins and Workers can log their actions

-- For Admin Activity Logs
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.admin_activity_logs;
CREATE POLICY "Admins can insert audit logs" ON public.admin_activity_logs 
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- For Report Activity Logs
DROP POLICY IF EXISTS "Admins/Workers can insert activity logs" ON public.report_activity_logs;
CREATE POLICY "Admins/Workers can insert activity logs" ON public.report_activity_logs 
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'worker')));

-- Extra Safety: Ensure Issues and Escalations migrations are solid for Admins
DROP POLICY IF EXISTS "Admins can update issues" ON public.issues;
CREATE POLICY "Admins can update issues" ON public.issues 
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. Enable Realtime for any missed links
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_activity_logs;
ON CONFLICT DO NOTHING; -- This is just a reminder, ALTER PUBLICATION doesn't support ON CONFLICT
