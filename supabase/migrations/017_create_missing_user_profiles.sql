-- Create missing user profiles for auth users that don't have profiles yet
-- This fixes the issue where auth.users exist but user_profiles rows are missing

INSERT INTO public.user_profiles (id, email, first_name, last_name, role, is_active)
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'first_name' as first_name,
    au.raw_user_meta_data->>'last_name' as last_name,
    COALESCE(au.raw_user_meta_data->>'role', 'customer') as role,
    true as is_active
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

