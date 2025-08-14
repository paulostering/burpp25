-- =====================================================
-- SUPABASE ADMIN ROLE SETUP SQL
-- =====================================================
-- This script sets up the Administrator role system and creates an admin user

-- 1. First, create user_roles enum type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'administrator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add role column to auth.users metadata or create a separate user_profiles table if it doesn't exist
-- Note: We'll use a separate table approach for better control and RLS

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role - only admins can change roles)
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

-- Administrators can insert new profiles
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid()) = 'administrator'
    );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- Create trigger to automatically create user profile on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- CREATE FIRST ADMINISTRATOR USER
-- =====================================================
-- Replace 'admin@yourcompany.com' with your desired admin email
-- Replace 'your-secure-password' with a strong password

-- Note: You need to run this in the Supabase dashboard or via the management API
-- This creates the auth user and sets up the profile

-- Step 1: Create the auth user (run this in Supabase Dashboard > Authentication > Users > Invite User)
-- OR use this SQL if you have admin access to auth schema:

/*
-- Uncomment and modify these lines to create admin user:

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@yourcompany.com',
    crypt('your-secure-password', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Admin", "last_name": "User", "role": "administrator"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);
*/

-- Step 2: After creating the auth user, update their profile to administrator role
-- Replace the email below with your admin email
UPDATE public.user_profiles 
SET 
    role = 'administrator',
    first_name = 'Admin',
    last_name = 'User'
WHERE email = 'admin@yourcompany.com';

-- =====================================================
-- ADMIN HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = user_id AND role = 'administrator' AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS user_role AS $$
DECLARE
    user_role_value user_role;
BEGIN
    SELECT role INTO user_role_value
    FROM public.user_profiles 
    WHERE id = user_id AND is_active = true;
    
    RETURN COALESCE(user_role_value, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- UPDATE EXISTING TABLES FOR ADMIN FEATURES
-- =====================================================

-- Add admin-relevant columns to vendor_profiles if needed
ALTER TABLE public.vendor_profiles 
ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- Add admin columns to categories
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create admin activity log table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on admin_activity_log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read activity log
CREATE POLICY "Admins can view activity log" ON public.admin_activity_log
    FOR SELECT USING (public.is_admin());

-- Create indexes for admin tables
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON public.admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON public.admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_table_name ON public.admin_activity_log(table_name);

-- =====================================================
-- INSTRUCTIONS FOR SETUP
-- =====================================================

/*
SETUP INSTRUCTIONS:

1. Run this entire SQL script in your Supabase SQL Editor

2. Create your first admin user:
   Option A (Recommended): 
   - Go to Supabase Dashboard > Authentication > Users
   - Click "Invite User"
   - Enter admin email and temporary password
   - After user confirms email, run this SQL:
     UPDATE public.user_profiles SET role = 'administrator' WHERE email = 'your-admin-email@domain.com';

   Option B (Direct SQL):
   - Uncomment and modify the INSERT INTO auth.users section above
   - Replace email and password with your values
   - Run the UPDATE query to set administrator role

3. Test admin access:
   - Log in with the admin user
   - Navigate to /admin (once you implement the admin routes)
   - Verify admin functions work correctly

4. Security Notes:
   - Always use strong passwords for admin accounts
   - Consider enabling MFA for admin users
   - Regularly review admin activity logs
   - Limit number of administrator accounts

5. Next Steps:
   - Implement admin middleware in your Next.js app
   - Create admin dashboard pages
   - Build management interfaces for vendors, clients, categories
   - Implement activity logging in your application code
*/


