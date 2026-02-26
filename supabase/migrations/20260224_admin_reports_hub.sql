-- Admin Reports Hub Schema Updates

-- 1. Extend issues table with new columns
ALTER TABLE public.issues 
ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS assigned_worker UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Private Discussion Threads
CREATE TABLE IF NOT EXISTS public.report_private_threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    citizen_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(report_id) -- One private thread per report
);

-- 3. Private Messages
CREATE TABLE IF NOT EXISTS public.report_private_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.report_private_threads(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Notifications System
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- 'assignment', 'status_update', 'message', 'escalation', 'resolution'
    link TEXT, -- Link to the report or thread
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_private_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Private Threads: Only Admin and the Reporter can see the thread
CREATE POLICY "Admin and Reporter can view private thread" ON public.report_private_threads
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') OR
    citizen_id = auth.uid()
);

-- Private Messages: Only members of the thread can see/send messages
CREATE POLICY "Thread members can view messages" ON public.report_private_messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.report_private_threads 
        WHERE id = thread_id AND (citizen_id = auth.uid() OR admin_id = auth.uid())
    ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Thread members can insert messages" ON public.report_private_messages
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.report_private_threads 
        WHERE id = thread_id AND (citizen_id = auth.uid() OR admin_id = auth.uid())
    ) OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Notifications: Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (user_id = auth.uid());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_private_threads;

-- 6. Trigger to log "Resolved At"
CREATE OR REPLACE FUNCTION public.handle_report_resolution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'resolved' AND (OLD.status IS NULL OR OLD.status != 'resolved') THEN
        NEW.resolved_at = now();
    ELSIF NEW.status != 'resolved' THEN
        NEW.resolved_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_report_status_change
    BEFORE UPDATE ON public.issues
    FOR EACH ROW EXECUTE PROCEDURE public.handle_report_resolution();
