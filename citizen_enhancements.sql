-- CITIZEN DASHBOARD ENHANCEMENTS MIGRATION
-- Adds support for testimonials and contact messages

-- 1. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  citizen_name text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL,
  before_image_url text,
  after_image_url text,
  report_id uuid REFERENCES public.issues(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Contact Messages Table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. RLS for Testimonials (Publicly readable, Admin manageable)
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view testimonials" ON public.testimonials;
CREATE POLICY "Anyone can view testimonials" ON public.testimonials FOR SELECT USING (true);

-- 4. RLS for Contact Messages (Authenticated insertion, Admin readable)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can send contact messages" ON public.contact_messages;
CREATE POLICY "Public can send contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- 5. Seed some data if table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.testimonials) THEN
        INSERT INTO public.testimonials (citizen_name, rating, message)
        VALUES 
        ('Local Resident', 5, 'My area pothole was fixed in just 2 days. Amazing system!'),
        ('Rahul S.', 4, 'Really impressive response time on the street light issue.'),
        ('Anita B.', 5, 'FixIt is exactly what our city needed. Transparent and efficient.');
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
