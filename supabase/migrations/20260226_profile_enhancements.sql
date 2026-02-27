-- Add enhancement columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS ward TEXT;

-- Update RLS policies to allow users to update their own extra fields
CREATE POLICY "Users can update their own extra profile fields" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
