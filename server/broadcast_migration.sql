-- Broadcast System Migration

-- 1. Broadcasts Table
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_role TEXT CHECK (target_role IN ('citizen', 'worker', 'admin', 'all')) DEFAULT 'all',
    target_department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    priority TEXT CHECK (priority IN ('normal', 'important', 'emergency')) DEFAULT 'normal',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    scheduled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- 2. Broadcast Read Status Table
CREATE TABLE IF NOT EXISTS public.broadcast_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broadcast_id UUID NOT NULL REFERENCES public.broadcasts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(broadcast_id, user_id)
);

-- 3. RLS Policies
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_reads ENABLE ROW LEVEL SECURITY;

-- Admins can do anything with broadcasts
CREATE POLICY "Admins have full access to broadcasts" ON public.broadcasts
    FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Users can view broadcasts targeted at them
CREATE POLICY "Users can view relevant broadcasts" ON public.broadcasts
    FOR SELECT USING (
        target_role = 'all' OR 
        target_role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Read status policies
CREATE POLICY "Users can manage their own read status" ON public.broadcast_reads
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Admins can view all read statuses" ON public.broadcast_reads
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
