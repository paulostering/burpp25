-- Create user profile for admin user
-- Replace the user_id with the actual ID from your auth.users table
-- The ID from your JSON is: c0b3e4a3-40c7-40e2-ab53-fd888072b660

INSERT INTO public.user_profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'c0b3e4a3-40c7-40e2-ab53-fd888072b660',
    'admin@burpp.com',
    'Paul',
    'Ostering',
    'administrator',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'administrator',
    first_name = 'Paul',
    last_name = 'Ostering',
    is_active = true,
    updated_at = NOW();
