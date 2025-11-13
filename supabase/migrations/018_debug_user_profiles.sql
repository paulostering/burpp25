-- Debug script to check user_profiles table and policies

-- 1. Check if the user exists in auth.users
SELECT 
    'Auth User Check' as check_type,
    id, 
    email, 
    raw_user_meta_data
FROM auth.users 
WHERE id = '9b179ae8-21d2-4b05-91c4-d6e597b9626b';

-- 2. Check if the user has a profile (bypassing RLS with admin access)
SELECT 
    'User Profile Check' as check_type,
    *
FROM public.user_profiles 
WHERE id = '9b179ae8-21d2-4b05-91c4-d6e597b9626b';

-- 3. List all policies on user_profiles
SELECT 
    'Policies Check' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 4. Check table structure
SELECT 
    'Column Check' as check_type,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 5. Check if there's a user_role type
SELECT 
    'Type Check' as check_type,
    typname, 
    typtype
FROM pg_type 
WHERE typname = 'user_role';

-- 6. Check for any is_admin functions
SELECT 
    'Function Check' as check_type,
    proname,
    oidvectortypes(proargtypes) as argtypes,
    prosrc
FROM pg_proc 
WHERE proname = 'is_admin';

