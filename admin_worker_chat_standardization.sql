-- Admin-Worker Chat Standardization
-- Standardizes the report_messages table for multi-channel communication

DO $$ 
BEGIN 
    -- 1. Standardization: Rename 'message' to 'message_text' if it exists (v6.sql used 'message')
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

    -- 4. Standardize Role Enumeration: Relax constraints to include citizen
    ALTER TABLE public.report_messages DROP CONSTRAINT IF EXISTS report_messages_sender_role_check;
    ALTER TABLE public.report_messages ADD CONSTRAINT report_messages_sender_role_check 
    CHECK (sender_role IN ('admin', 'worker', 'citizen'));

    -- 5. Data Migration: Set defaults for existing messages
    UPDATE public.report_messages SET sender_role = 'citizen' WHERE sender_role IS NULL AND sender_id IN (SELECT id FROM profiles WHERE role = 'citizen');
    UPDATE public.report_messages SET sender_role = 'admin' WHERE sender_role IS NULL AND sender_id IN (SELECT id FROM profiles WHERE role = 'admin');
    UPDATE public.report_messages SET channel = 'worker' WHERE sender_role = 'worker';

    -- 6. Indices for performance
    CREATE INDEX IF NOT EXISTS idx_report_messages_channel ON public.report_messages(channel);
    CREATE INDEX IF NOT EXISTS idx_report_messages_report_id ON public.report_messages(report_id);

END $$;

-- Policies update (Transparent for now, could be hardened)
DROP POLICY IF EXISTS "Access report messages" ON public.report_messages;
CREATE POLICY "Access report messages" ON public.report_messages FOR ALL USING (true);

NOTIFY pgrst, 'reload schema';
