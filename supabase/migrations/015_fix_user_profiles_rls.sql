-- Fix recursive RLS policies on user_profiles table
-- The issue: admin policies were querying user_profiles from within user_profiles policies,
-- causing infinite recursion and 500 errors

-- Drop ALL existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Administrators can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Administrators can update all profiles" ON public.user_profiles;

-- Drop all versions of is_admin function if they exist
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc 
        WHERE proname = 'is_admin' AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.is_admin(' || r.argtypes || ') CASCADE';
    END LOOP;
END $$;

-- Create simple, non-recursive policies
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: Users can insert their own profile (needed for signup)
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Note: Admin access will be handled at the application level using service role key
-- This avoids the recursive RLS issue entirely
