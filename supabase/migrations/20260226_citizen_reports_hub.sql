-- 1. Report Messages (Private Admin-Citizen Chat)
CREATE TABLE IF NOT EXISTS public.report_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Report Activity Logs (Ops Log / Tactical Timeline)
CREATE TABLE IF NOT EXISTS public.report_activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- e.g., 'status_change', 'assignment', 'risk_update'
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Resolution Proofs
CREATE TABLE IF NOT EXISTS public.resolution_proofs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    before_image_url TEXT,
    after_image_url TEXT,
    admin_notes TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolution_proofs ENABLE ROW LEVEL SECURITY;

-- Policies for Messages (Citizen can see their own report messages)
CREATE POLICY "Users can view messages for their own reports"
ON public.report_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.issues
        WHERE issues.id = report_messages.report_id
        AND (issues.user_id = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (role = 'admin' OR role = 'worker')))
    )
);

CREATE POLICY "Users can send messages to their own reports"
ON public.report_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.issues
        WHERE issues.id = report_messages.report_id
        AND (issues.user_id = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (role = 'admin' OR role = 'worker')))
    )
);

-- Policies for Activity Logs (Viewable by report owner and staff)
CREATE POLICY "Viewable by owner and staff"
ON public.report_activity_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.issues
        WHERE issues.id = report_activity_logs.report_id
        AND (issues.user_id = auth.uid() OR 
             EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (role = 'admin' OR role = 'worker')))
    )
);

-- Policies for Resolution Proofs
CREATE POLICY "Viewable by everyone for transparency"
ON public.resolution_proofs FOR SELECT
USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.resolution_proofs;
