-- Seed Vendors Script - New Categories
-- Creates 10 vendors per category in 3 locations (varies by category)
-- Locations: NY 11219, AZ 85001, Tampa 33545

-- Helper function to generate random phone numbers
CREATE OR REPLACE FUNCTION random_phone() RETURNS TEXT AS $$
BEGIN
  RETURN '+1' || LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::TEXT, 10, '0');
END;
$$ LANGUAGE plpgsql;

-- Helper function to get category ID by name
CREATE OR REPLACE FUNCTION get_category_by_name(category_name text)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM public.categories WHERE name = category_name LIMIT 1;
$$;

-- HOME CLEANING - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'cleaning.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'cleaning.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'cleaning.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'cleaning.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'cleaning.ny.%' THEN 'Sparkle Clean Brooklyn ' || SUBSTRING(u.email FROM 'cleaning\.ny\.(\d+)')
    WHEN u.email LIKE 'cleaning.az.%' THEN 'Desert Clean Pro ' || SUBSTRING(u.email FROM 'cleaning\.az\.(\d+)')
    ELSE 'Sunshine Cleaning ' || SUBSTRING(u.email FROM 'cleaning\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Home Cleaning')],
  'Professional Home Cleaning Services',
  'Trusted home cleaning professional with eco-friendly products. Weekly, bi-weekly, or one-time deep cleans. Satisfaction guaranteed!',
  CASE 
    WHEN u.email LIKE 'cleaning.ny.%' THEN '11219'
    WHEN u.email LIKE 'cleaning.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'cleaning.ny.%' THEN 40.6323
    WHEN u.email LIKE 'cleaning.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'cleaning.ny.%' THEN -73.9967
    WHEN u.email LIKE 'cleaning.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  25,
  'Maria',
  CASE 
    WHEN u.email LIKE 'cleaning.ny.%' THEN 'Sparkle' || SUBSTRING(u.email FROM 'cleaning\.ny\.(\d+)')
    WHEN u.email LIKE 'cleaning.az.%' THEN 'Clean' || SUBSTRING(u.email FROM 'cleaning\.az\.(\d+)')
    ELSE 'Shine' || SUBSTRING(u.email FROM 'cleaning\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  45.00
FROM auth.users u WHERE u.email LIKE 'cleaning.%@burpp.com' ORDER BY u.email;

-- PERSONAL TRAINING - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'trainer.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'trainer.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'trainer.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'trainer.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'trainer.ny.%' THEN 'FitLife NYC ' || SUBSTRING(u.email FROM 'trainer\.ny\.(\d+)')
    WHEN u.email LIKE 'trainer.az.%' THEN 'Phoenix Fitness Pro ' || SUBSTRING(u.email FROM 'trainer\.az\.(\d+)')
    ELSE 'Tampa Strength Coach ' || SUBSTRING(u.email FROM 'trainer\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Personal Training')],
  'Certified Personal Trainer',
  'NASM certified personal trainer specializing in strength training, weight loss, and athletic performance. Transform your body and life!',
  CASE 
    WHEN u.email LIKE 'trainer.ny.%' THEN '11219'
    WHEN u.email LIKE 'trainer.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'trainer.ny.%' THEN 40.6323
    WHEN u.email LIKE 'trainer.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'trainer.ny.%' THEN -73.9967
    WHEN u.email LIKE 'trainer.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  20,
  'Alex',
  CASE 
    WHEN u.email LIKE 'trainer.ny.%' THEN 'Fitness' || SUBSTRING(u.email FROM 'trainer\.ny\.(\d+)')
    WHEN u.email LIKE 'trainer.az.%' THEN 'Strong' || SUBSTRING(u.email FROM 'trainer\.az\.(\d+)')
    ELSE 'Coach' || SUBSTRING(u.email FROM 'trainer\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  true,
  75.00
FROM auth.users u WHERE u.email LIKE 'trainer.%@burpp.com' ORDER BY u.email;

-- DOG WALKING - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'dogwalker.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'dogwalker.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'dogwalker.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'dogwalker.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'dogwalker.ny.%' THEN 'Paws & Walks ' || SUBSTRING(u.email FROM 'dogwalker\.ny\.(\d+)')
    WHEN u.email LIKE 'dogwalker.az.%' THEN 'Desert Dogs ' || SUBSTRING(u.email FROM 'dogwalker\.az\.(\d+)')
    ELSE 'Sunshine Dog Walking ' || SUBSTRING(u.email FROM 'dogwalker\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Dog Walking')],
  'Reliable Dog Walking Services',
  'Trusted dog walker with years of experience. Daily walks, pet sitting, and playtime. Insured and bonded.',
  CASE 
    WHEN u.email LIKE 'dogwalker.ny.%' THEN '11219'
    WHEN u.email LIKE 'dogwalker.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'dogwalker.ny.%' THEN 40.6323
    WHEN u.email LIKE 'dogwalker.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'dogwalker.ny.%' THEN -73.9967
    WHEN u.email LIKE 'dogwalker.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  15,
  'Sarah',
  CASE 
    WHEN u.email LIKE 'dogwalker.ny.%' THEN 'Walker' || SUBSTRING(u.email FROM 'dogwalker\.ny\.(\d+)')
    WHEN u.email LIKE 'dogwalker.az.%' THEN 'Desert' || SUBSTRING(u.email FROM 'dogwalker\.az\.(\d+)')
    ELSE 'Sunshine' || SUBSTRING(u.email FROM 'dogwalker\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  30.00
FROM auth.users u WHERE u.email LIKE 'dogwalker.%@burpp.com' ORDER BY u.email;

-- MAKEUP ARTIST - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'makeup.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'makeup.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'makeup.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'makeup.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'makeup.ny.%' THEN 'Glam Squad Brooklyn ' || SUBSTRING(u.email FROM 'makeup\.ny\.(\d+)')
    WHEN u.email LIKE 'makeup.az.%' THEN 'Desert Beauty ' || SUBSTRING(u.email FROM 'makeup\.az\.(\d+)')
    ELSE 'Beauty by the Bay ' || SUBSTRING(u.email FROM 'makeup\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Makeup Artist')],
  'Professional Makeup Artist',
  'Award-winning makeup artist specializing in weddings, special events, and photoshoots. Making you look stunning!',
  CASE 
    WHEN u.email LIKE 'makeup.ny.%' THEN '11219'
    WHEN u.email LIKE 'makeup.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'makeup.ny.%' THEN 40.6323
    WHEN u.email LIKE 'makeup.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'makeup.ny.%' THEN -73.9967
    WHEN u.email LIKE 'makeup.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  25,
  'Jessica',
  CASE 
    WHEN u.email LIKE 'makeup.ny.%' THEN 'Glam' || SUBSTRING(u.email FROM 'makeup\.ny\.(\d+)')
    WHEN u.email LIKE 'makeup.az.%' THEN 'Beauty' || SUBSTRING(u.email FROM 'makeup\.az\.(\d+)')
    ELSE 'Style' || SUBSTRING(u.email FROM 'makeup\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  85.00
FROM auth.users u WHERE u.email LIKE 'makeup.%@burpp.com' ORDER BY u.email;

-- YOGA INSTRUCTOR - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'yoga.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'yoga.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'yoga.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'yoga.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'yoga.ny.%' THEN 'Zen Yoga Brooklyn ' || SUBSTRING(u.email FROM 'yoga\.ny\.(\d+)')
    WHEN u.email LIKE 'yoga.az.%' THEN 'Desert Flow Yoga ' || SUBSTRING(u.email FROM 'yoga\.az\.(\d+)')
    ELSE 'Tampa Zen Studio ' || SUBSTRING(u.email FROM 'yoga\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Yoga Instructor')],
  'Certified Yoga Instructor',
  'RYT-500 certified yoga instructor. Specializing in vinyasa, yin, and restorative yoga. Private and group sessions available.',
  CASE 
    WHEN u.email LIKE 'yoga.ny.%' THEN '11219'
    WHEN u.email LIKE 'yoga.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'yoga.ny.%' THEN 40.6323
    WHEN u.email LIKE 'yoga.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'yoga.ny.%' THEN -73.9967
    WHEN u.email LIKE 'yoga.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  20,
  'Emma',
  CASE 
    WHEN u.email LIKE 'yoga.ny.%' THEN 'Zen' || SUBSTRING(u.email FROM 'yoga\.ny\.(\d+)')
    WHEN u.email LIKE 'yoga.az.%' THEN 'Flow' || SUBSTRING(u.email FROM 'yoga\.az\.(\d+)')
    ELSE 'Peace' || SUBSTRING(u.email FROM 'yoga\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  true,
  65.00
FROM auth.users u WHERE u.email LIKE 'yoga.%@burpp.com' ORDER BY u.email;

-- HANDYMAN - All Locations  
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'handyman.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'handyman.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'handyman.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'handyman.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'handyman.ny.%' THEN 'Brooklyn Fix-It ' || SUBSTRING(u.email FROM 'handyman\.ny\.(\d+)')
    WHEN u.email LIKE 'handyman.az.%' THEN 'Phoenix Handyman Pro ' || SUBSTRING(u.email FROM 'handyman\.az\.(\d+)')
    ELSE 'Tampa Home Repair ' || SUBSTRING(u.email FROM 'handyman\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Handyman')],
  'Professional Handyman Services',
  'Licensed and insured handyman with 15+ years experience. Repairs, installations, maintenance, and home improvements. No job too small!',
  CASE 
    WHEN u.email LIKE 'handyman.ny.%' THEN '11219'
    WHEN u.email LIKE 'handyman.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'handyman.ny.%' THEN 40.6323
    WHEN u.email LIKE 'handyman.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'handyman.ny.%' THEN -73.9967
    WHEN u.email LIKE 'handyman.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  25,
  'Tom',
  CASE 
    WHEN u.email LIKE 'handyman.ny.%' THEN 'Handy' || SUBSTRING(u.email FROM 'handyman\.ny\.(\d+)')
    WHEN u.email LIKE 'handyman.az.%' THEN 'Fixit' || SUBSTRING(u.email FROM 'handyman\.az\.(\d+)')
    ELSE 'Repair' || SUBSTRING(u.email FROM 'handyman\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  55.00
FROM auth.users u WHERE u.email LIKE 'handyman.%@burpp.com' ORDER BY u.email;

-- MASSAGE - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'massage.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'massage.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'massage.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'massage.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'massage.ny.%' THEN 'Tranquil Touch ' || SUBSTRING(u.email FROM 'massage\.ny\.(\d+)')
    WHEN u.email LIKE 'massage.az.%' THEN 'Desert Serenity Massage ' || SUBSTRING(u.email FROM 'massage\.az\.(\d+)')
    ELSE 'Relaxation Station ' || SUBSTRING(u.email FROM 'massage\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Massage')],
  'Licensed Massage Therapist',
  'Licensed massage therapist with 10+ years experience. Swedish, deep tissue, sports massage, hot stone, and aromatherapy.',
  CASE 
    WHEN u.email LIKE 'massage.ny.%' THEN '11219'
    WHEN u.email LIKE 'massage.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'massage.ny.%' THEN 40.6323
    WHEN u.email LIKE 'massage.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'massage.ny.%' THEN -73.9967
    WHEN u.email LIKE 'massage.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  20,
  'David',
  CASE 
    WHEN u.email LIKE 'massage.ny.%' THEN 'Touch' || SUBSTRING(u.email FROM 'massage\.ny\.(\d+)')
    WHEN u.email LIKE 'massage.az.%' THEN 'Serenity' || SUBSTRING(u.email FROM 'massage\.az\.(\d+)')
    ELSE 'Relax' || SUBSTRING(u.email FROM 'massage\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  90.00
FROM auth.users u WHERE u.email LIKE 'massage.%@burpp.com' ORDER BY u.email;

-- PRIVATE CHEF - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'chef.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'chef.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'chef.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'chef.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'chef.ny.%' THEN 'Culinary Kings ' || SUBSTRING(u.email FROM 'chef\.ny\.(\d+)')
    WHEN u.email LIKE 'chef.az.%' THEN 'Phoenix Private Chef ' || SUBSTRING(u.email FROM 'chef\.az\.(\d+)')
    ELSE 'Chef Tampa Bay ' || SUBSTRING(u.email FROM 'chef\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Private Chef')],
  'Professional Private Chef',
  'Culinary school trained private chef offering personalized meal prep, dinner parties, and cooking lessons in your home.',
  CASE 
    WHEN u.email LIKE 'chef.ny.%' THEN '11219'
    WHEN u.email LIKE 'chef.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'chef.ny.%' THEN 40.6323
    WHEN u.email LIKE 'chef.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'chef.ny.%' THEN -73.9967
    WHEN u.email LIKE 'chef.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  30,
  'Marco',
  CASE 
    WHEN u.email LIKE 'chef.ny.%' THEN 'Chef' || SUBSTRING(u.email FROM 'chef\.ny\.(\d+)')
    WHEN u.email LIKE 'chef.az.%' THEN 'Cuisine' || SUBSTRING(u.email FROM 'chef\.az\.(\d+)')
    ELSE 'Cook' || SUBSTRING(u.email FROM 'chef\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  95.00
FROM auth.users u WHERE u.email LIKE 'chef.%@burpp.com' ORDER BY u.email;

-- TUTORING – ACADEMIC - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'tutor.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'tutor.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'tutor.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'tutor.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'tutor.ny.%' THEN 'Brooklyn Tutoring ' || SUBSTRING(u.email FROM 'tutor\.ny\.(\d+)')
    WHEN u.email LIKE 'tutor.az.%' THEN 'Phoenix Learning Center ' || SUBSTRING(u.email FROM 'tutor\.az\.(\d+)')
    ELSE 'Tampa Tutors ' || SUBSTRING(u.email FROM 'tutor\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Tutoring – Academic')],
  'Experienced Academic Tutor',
  'Certified teacher with expertise in math, science, and English. SAT/ACT prep specialist. Helping students achieve academic excellence.',
  CASE 
    WHEN u.email LIKE 'tutor.ny.%' THEN '11219'
    WHEN u.email LIKE 'tutor.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'tutor.ny.%' THEN 40.6323
    WHEN u.email LIKE 'tutor.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'tutor.ny.%' THEN -73.9967
    WHEN u.email LIKE 'tutor.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  15,
  'Rachel',
  CASE 
    WHEN u.email LIKE 'tutor.ny.%' THEN 'Scholar' || SUBSTRING(u.email FROM 'tutor\.ny\.(\d+)')
    WHEN u.email LIKE 'tutor.az.%' THEN 'Learn' || SUBSTRING(u.email FROM 'tutor\.az\.(\d+)')
    ELSE 'Teach' || SUBSTRING(u.email FROM 'tutor\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  true,
  55.00
FROM auth.users u WHERE u.email LIKE 'tutor.%@burpp.com' ORDER BY u.email;

-- PET SITTING - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'petsitter.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'petsitter.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'petsitter.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'petsitter.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'petsitter.ny.%' THEN 'Pet Paradise Brooklyn ' || SUBSTRING(u.email FROM 'petsitter\.ny\.(\d+)')
    WHEN u.email LIKE 'petsitter.az.%' THEN 'Desert Pet Care ' || SUBSTRING(u.email FROM 'petsitter\.az\.(\d+)')
    ELSE 'Tampa Pet Sitters ' || SUBSTRING(u.email FROM 'petsitter\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Pet Sitting')],
  'Professional Pet Sitting Services',
  'Experienced pet sitter providing loving care for your furry friends. Overnight stays, daily visits, and medication administration available.',
  CASE 
    WHEN u.email LIKE 'petsitter.ny.%' THEN '11219'
    WHEN u.email LIKE 'petsitter.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'petsitter.ny.%' THEN 40.6323
    WHEN u.email LIKE 'petsitter.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'petsitter.ny.%' THEN -73.9967
    WHEN u.email LIKE 'petsitter.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  20,
  'Lisa',
  CASE 
    WHEN u.email LIKE 'petsitter.ny.%' THEN 'Paradise' || SUBSTRING(u.email FROM 'petsitter\.ny\.(\d+)')
    WHEN u.email LIKE 'petsitter.az.%' THEN 'Care' || SUBSTRING(u.email FROM 'petsitter\.az\.(\d+)')
    ELSE 'Love' || SUBSTRING(u.email FROM 'petsitter\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  35.00
FROM auth.users u WHERE u.email LIKE 'petsitter.%@burpp.com' ORDER BY u.email;

-- PARTY PLANNER - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'party.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'party.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'party.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'party.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'party.ny.%' THEN 'Brooklyn Bash Planners ' || SUBSTRING(u.email FROM 'party\.ny\.(\d+)')
    WHEN u.email LIKE 'party.az.%' THEN 'Phoenix Party Pro ' || SUBSTRING(u.email FROM 'party\.az\.(\d+)')
    ELSE 'Tampa Celebrations ' || SUBSTRING(u.email FROM 'party\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Party Planner')],
  'Professional Event & Party Planner',
  'Full-service party and event planning. From birthdays to corporate events, we handle every detail for unforgettable celebrations!',
  CASE 
    WHEN u.email LIKE 'party.ny.%' THEN '11219'
    WHEN u.email LIKE 'party.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'party.ny.%' THEN 40.6323
    WHEN u.email LIKE 'party.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'party.ny.%' THEN -73.9967
    WHEN u.email LIKE 'party.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  30,
  'Sophie',
  CASE 
    WHEN u.email LIKE 'party.ny.%' THEN 'Bash' || SUBSTRING(u.email FROM 'party\.ny\.(\d+)')
    WHEN u.email LIKE 'party.az.%' THEN 'Party' || SUBSTRING(u.email FROM 'party\.az\.(\d+)')
    ELSE 'Celebrate' || SUBSTRING(u.email FROM 'party\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  70.00
FROM auth.users u WHERE u.email LIKE 'party.%@burpp.com' ORDER BY u.email;

-- PERSONAL ASSISTANT - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'assistant.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'assistant.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'assistant.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'assistant.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'assistant.ny.%' THEN 'Executive Assistant NYC ' || SUBSTRING(u.email FROM 'assistant\.ny\.(\d+)')
    WHEN u.email LIKE 'assistant.az.%' THEN 'Phoenix VA Services ' || SUBSTRING(u.email FROM 'assistant\.az\.(\d+)')
    ELSE 'Tampa Personal Assistant ' || SUBSTRING(u.email FROM 'assistant\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Personal Assistant')],
  'Professional Personal Assistant',
  'Experienced personal assistant handling scheduling, errands, travel planning, and administrative tasks. Make your life easier!',
  CASE 
    WHEN u.email LIKE 'assistant.ny.%' THEN '11219'
    WHEN u.email LIKE 'assistant.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'assistant.ny.%' THEN 40.6323
    WHEN u.email LIKE 'assistant.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'assistant.ny.%' THEN -73.9967
    WHEN u.email LIKE 'assistant.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  25,
  'Jennifer',
  CASE 
    WHEN u.email LIKE 'assistant.ny.%' THEN 'Executive' || SUBSTRING(u.email FROM 'assistant\.ny\.(\d+)')
    WHEN u.email LIKE 'assistant.az.%' THEN 'Assist' || SUBSTRING(u.email FROM 'assistant\.az\.(\d+)')
    ELSE 'Helper' || SUBSTRING(u.email FROM 'assistant\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  true,
  50.00
FROM auth.users u WHERE u.email LIKE 'assistant.%@burpp.com' ORDER BY u.email;

-- BARTENDING - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'bartender.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'bartender.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'bartender.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'bartender.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'bartender.ny.%' THEN 'Brooklyn Mixology ' || SUBSTRING(u.email FROM 'bartender\.ny\.(\d+)')
    WHEN u.email LIKE 'bartender.az.%' THEN 'Phoenix Bar Service ' || SUBSTRING(u.email FROM 'bartender\.az\.(\d+)')
    ELSE 'Tampa Cocktails ' || SUBSTRING(u.email FROM 'bartender\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Bartending')],
  'Professional Bartender & Mixologist',
  'Licensed bartender and certified mixologist. Specializing in craft cocktails, weddings, and private events. TIPS certified.',
  CASE 
    WHEN u.email LIKE 'bartender.ny.%' THEN '11219'
    WHEN u.email LIKE 'bartender.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'bartender.ny.%' THEN 40.6323
    WHEN u.email LIKE 'bartender.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'bartender.ny.%' THEN -73.9967
    WHEN u.email LIKE 'bartender.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  30,
  'Jake',
  CASE 
    WHEN u.email LIKE 'bartender.ny.%' THEN 'Mix' || SUBSTRING(u.email FROM 'bartender\.ny\.(\d+)')
    WHEN u.email LIKE 'bartender.az.%' THEN 'Bar' || SUBSTRING(u.email FROM 'bartender\.az\.(\d+)')
    ELSE 'Cocktail' || SUBSTRING(u.email FROM 'bartender\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  60.00
FROM auth.users u WHERE u.email LIKE 'bartender.%@burpp.com' ORDER BY u.email;

-- SOCIAL MEDIA MANAGER - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'socialmedia.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'socialmedia.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'socialmedia.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'socialmedia.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'socialmedia.ny.%' THEN 'NYC Social Growth ' || SUBSTRING(u.email FROM 'socialmedia\.ny\.(\d+)')
    WHEN u.email LIKE 'socialmedia.az.%' THEN 'Phoenix Digital Marketing ' || SUBSTRING(u.email FROM 'socialmedia\.az\.(\d+)')
    ELSE 'Tampa Social Media Pro ' || SUBSTRING(u.email FROM 'socialmedia\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Social Media Manager')],
  'Expert Social Media Manager',
  'Professional social media strategist helping businesses grow their online presence. Content creation, scheduling, and analytics included.',
  CASE 
    WHEN u.email LIKE 'socialmedia.ny.%' THEN '11219'
    WHEN u.email LIKE 'socialmedia.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'socialmedia.ny.%' THEN 40.6323
    WHEN u.email LIKE 'socialmedia.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'socialmedia.ny.%' THEN -73.9967
    WHEN u.email LIKE 'socialmedia.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  50,
  'Taylor',
  CASE 
    WHEN u.email LIKE 'socialmedia.ny.%' THEN 'Growth' || SUBSTRING(u.email FROM 'socialmedia\.ny\.(\d+)')
    WHEN u.email LIKE 'socialmedia.az.%' THEN 'Digital' || SUBSTRING(u.email FROM 'socialmedia\.az\.(\d+)')
    ELSE 'Social' || SUBSTRING(u.email FROM 'socialmedia\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  false,
  true,
  65.00
FROM auth.users u WHERE u.email LIKE 'socialmedia.%@burpp.com' ORDER BY u.email;

-- MEAL PREP - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'mealprep.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'mealprep.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10)
UNION ALL
SELECT gen_random_uuid(), 'mealprep.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 10);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'mealprep.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services, hourly_rate)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'mealprep.ny.%' THEN 'Brooklyn Meal Prep ' || SUBSTRING(u.email FROM 'mealprep\.ny\.(\d+)')
    WHEN u.email LIKE 'mealprep.az.%' THEN 'Phoenix Meal Solutions ' || SUBSTRING(u.email FROM 'mealprep\.az\.(\d+)')
    ELSE 'Tampa Prep Kitchen ' || SUBSTRING(u.email FROM 'mealprep\.fl\.(\d+)')
  END,
  ARRAY[get_category_by_name('Meal Prep')],
  'Professional Meal Prep Service',
  'Custom meal prep service with healthy, delicious options. Specialized in fitness nutrition, dietary restrictions, and family meals.',
  CASE 
    WHEN u.email LIKE 'mealprep.ny.%' THEN '11219'
    WHEN u.email LIKE 'mealprep.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'mealprep.ny.%' THEN 40.6323
    WHEN u.email LIKE 'mealprep.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'mealprep.ny.%' THEN -73.9967
    WHEN u.email LIKE 'mealprep.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  20,
  'Chris',
  CASE 
    WHEN u.email LIKE 'mealprep.ny.%' THEN 'Prep' || SUBSTRING(u.email FROM 'mealprep\.ny\.(\d+)')
    WHEN u.email LIKE 'mealprep.az.%' THEN 'Kitchen' || SUBSTRING(u.email FROM 'mealprep\.az\.(\d+)')
    ELSE 'Chef' || SUBSTRING(u.email FROM 'mealprep\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false,
  55.00
FROM auth.users u WHERE u.email LIKE 'mealprep.%@burpp.com' ORDER BY u.email;

-- Drop helper functions
DROP FUNCTION IF EXISTS random_phone();
DROP FUNCTION IF EXISTS get_category_by_name(text);

-- Summary
DO $$
DECLARE
  vendor_count INT;
BEGIN
  SELECT COUNT(*) INTO vendor_count FROM vendor_profiles;
  
  RAISE NOTICE '✅ Successfully seeded vendors with new category structure!';
  RAISE NOTICE '   - Total vendors: %', vendor_count;
  RAISE NOTICE '   - Categories: Home Cleaning, Personal Training, Dog Walking, Makeup Artist, Yoga, Handyman, Massage, Private Chef, Tutoring, Pet Sitting, Party Planner, Personal Assistant, Bartending, Social Media Manager, Meal Prep';
  RAISE NOTICE '   - Locations: Brooklyn NY 11219, Phoenix AZ 85001, Wesley Chapel FL 33545';
  RAISE NOTICE '   - Password for all test accounts: password123';
END $$;

