-- 0. Ensure issues.user_id is linked to profiles for joining
ALTER TABLE public.issues 
ADD CONSTRAINT issues_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
ON DELETE SET NULL;

-- 1. Report Assignments (Linked to Issues)
CREATE TABLE public.report_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(report_id, worker_id)
);

-- 2. Report Updates (Timeline for Issues)
CREATE TABLE public.report_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    update_text TEXT NOT NULL,
    status_after_update TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Report Comments (Discussions for Issues)
CREATE TABLE public.report_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Read assignments" ON public.report_assignments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read updates" ON public.report_updates FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Read comments" ON public.report_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Insert comments" ON public.report_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Insert updates" ON public.report_updates FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (role = 'worker' OR role = 'admin'))
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_assignments;
