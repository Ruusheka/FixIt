-- UNIFIED CHAT INFRASTRUCTURE FIX
-- Standardizes report_messages for both Admin-Citizen and Admin-Worker channels

DO $$ 
BEGIN 
    -- 1. Standardization: Rename 'message' to 'message_text' if it exists (fixes conflict between v6 and citizen hub)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='report_messages' AND column_name='message') THEN
        ALTER TABLE public.report_messages RENAME COLUMN message TO message_text;
    END IF;

    -- 2. Schema Expansion: Add 'sender_role' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='report_messages' AND column_name='sender_role') THEN
        ALTER TABLE public.report_messages ADD COLUMN sender_role text;
    END IF;

    -- 3. Multi-Channel Support: Add 'channel' column ('citizen' or 'worker')
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='report_messages' AND column_name='channel') THEN
        ALTER TABLE public.report_messages ADD COLUMN channel text DEFAULT 'citizen';
    END IF;

    -- 4. Constraint Refinement: Allow all roles
    ALTER TABLE public.report_messages DROP CONSTRAINT IF EXISTS report_messages_sender_role_check;
    ALTER TABLE public.report_messages ADD CONSTRAINT report_messages_sender_role_check 
    CHECK (sender_role IN ('admin', 'worker', 'citizen'));

    -- 5. Data Recovery: Ensure existing messages are categorized
    -- Assume messages with no channel are 'citizen' unless sent by a 'worker'
    UPDATE public.report_messages SET channel = 'citizen' WHERE channel IS NULL;
    UPDATE public.report_messages SET sender_role = 'citizen' WHERE sender_role IS NULL;

    -- 6. Realtime & Indices
    CREATE INDEX IF NOT EXISTS idx_report_messages_channel ON public.report_messages(channel);
    CREATE INDEX IF NOT EXISTS idx_report_messages_report_id ON public.report_messages(report_id);

END $$;

-- 7. Policy Hardening (Ensure everyone can see relevant messages)
DROP POLICY IF EXISTS "Access report messages" ON public.report_messages;
CREATE POLICY "Access report messages" ON public.report_messages FOR ALL USING (true);

-- 8. Enable Realtime if not enabled
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

NOTIFY pgrst, 'reload schema';
