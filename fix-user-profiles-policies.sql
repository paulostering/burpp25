-- Fix RLS policies for user_profiles table
-- This allows new users to create their own profile during signup

-- Drop existing policies that might be blocking inserts
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- Create a policy that allows users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a policy that allows users to update their own profile (except role)
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        -- Prevent users from changing their own role unless they're admin
        (
            role = (SELECT role FROM public.user_profiles WHERE id = auth.uid()) OR
            (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'administrator'
        )
    );

-- Administrators can read all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'administrator'
    );

-- Administrators can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
    FOR UPDATE USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'administrator'
    );

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);
