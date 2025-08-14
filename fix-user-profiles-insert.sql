-- Add missing INSERT policy for user_profiles
-- This allows new users to create their own profile during signup

-- Add policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);
