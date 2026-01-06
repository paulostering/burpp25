-- Seed Vendors Script
-- Creates 15 vendors per category in 3 locations (360 total vendors)
-- Locations: NY 11219, AZ 85001, Tampa 33545

-- Helper function to generate random phone numbers
CREATE OR REPLACE FUNCTION random_phone() RETURNS TEXT AS $$
BEGIN
  RETURN '+1' || LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::TEXT, 10, '0');
END;
$$ LANGUAGE plpgsql;

-- Helper functions to resolve category IDs by name (parent + optional child)
-- and to pick a random sibling subcategory (for 1-2 subcategory seeding).
CREATE OR REPLACE FUNCTION public.get_category_id(parent_name text, child_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT c.id
  FROM public.categories c
  WHERE
    (
      child_name IS NULL
      AND c.parent_id IS NULL
      AND c.name = parent_name
    )
    OR
    (
      child_name IS NOT NULL
      AND c.parent_id = (
        SELECT p.id
        FROM public.categories p
        WHERE p.parent_id IS NULL AND p.name = parent_name
        LIMIT 1
      )
      AND c.name = child_name
    )
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.random_subcategory_id(parent_name text, exclude_child_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE sql
VOLATILE
AS $$
  SELECT c.id
  FROM public.categories c
  WHERE c.parent_id = public.get_category_id(parent_name)
    AND (exclude_child_name IS NULL OR c.name <> exclude_child_name)
  ORDER BY random()
  LIMIT 1;
$$;

-- CATERING - NY 11219
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'catering.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb
FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'catering.ny.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  'Delicious Catering ' || SUBSTRING(u.email FROM 'catering\.ny\.(\d+)'),
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Events & Hospitality'),
    public.get_category_id('Events & Hospitality', 'Catering'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Events & Hospitality', 'Catering') END
  ], NULL::uuid)::uuid[],
  'Professional Catering Services',
  'Experienced catering professional specializing in kosher and traditional cuisine. Perfect for weddings, corporate events, and family celebrations.',
  '11219',
  40.6323,
  -73.9967,
  25,
  'John',
  'Caterer' || SUBSTRING(u.email FROM 'catering\.ny\.(\d+)'),
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false
FROM auth.users u WHERE u.email LIKE 'catering.ny.%@burpp.com' ORDER BY u.email;

-- CATERING - AZ 85001
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'catering.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb
FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'catering.az.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  'Phoenix Catering ' || SUBSTRING(u.email FROM 'catering\.az\.(\d+)'),
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Events & Hospitality'),
    public.get_category_id('Events & Hospitality', 'Catering'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Events & Hospitality', 'Catering') END
  ], NULL::uuid)::uuid[],
  'Premier Phoenix Catering',
  'Top-rated catering service in Phoenix. From corporate events to intimate gatherings, we bring exceptional food and service.',
  '85001',
  33.4484,
  -112.0740,
  30,
  'Maria',
  'Chef' || SUBSTRING(u.email FROM 'catering\.az\.(\d+)'),
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false
FROM auth.users u WHERE u.email LIKE 'catering.az.%@burpp.com' ORDER BY u.email;

-- CATERING - Tampa 33545
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'catering.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb
FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'catering.fl.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  'Tampa Bay Catering ' || SUBSTRING(u.email FROM 'catering\.fl\.(\d+)'),
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Events & Hospitality'),
    public.get_category_id('Events & Hospitality', 'Catering'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Events & Hospitality', 'Catering') END
  ], NULL::uuid)::uuid[],
  'Florida Style Catering',
  'Fresh Florida cuisine with local seafood and tropical flavors. Perfect for beach weddings and outdoor events.',
  '33545',
  28.2314,
  -82.3270,
  25,
  'Carlos',
  'Rodriguez' || SUBSTRING(u.email FROM 'catering\.fl\.(\d+)'),
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false
FROM auth.users u WHERE u.email LIKE 'catering.fl.%@burpp.com' ORDER BY u.email;

-- POKER DEALER - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'poker.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'poker.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'poker.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'poker.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'poker.ny.%' THEN 'Brooklyn Poker Pro ' || SUBSTRING(u.email FROM 'poker\.ny\.(\d+)')
    WHEN u.email LIKE 'poker.az.%' THEN 'Phoenix Card Shark ' || SUBSTRING(u.email FROM 'poker\.az\.(\d+)')
    ELSE 'Tampa Poker Dealer ' || SUBSTRING(u.email FROM 'poker\.fl\.(\d+)')
  END,
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Events & Hospitality'),
    public.get_category_id('Events & Hospitality', 'Poker Dealer'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Events & Hospitality', 'Poker Dealer') END
  ], NULL::uuid)::uuid[],
  'Professional Poker Dealer',
  'Experienced poker dealer for private games and events. Texas Hold''em, Omaha, and tournament-style games.',
  CASE 
    WHEN u.email LIKE 'poker.ny.%' THEN '11219'
    WHEN u.email LIKE 'poker.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'poker.ny.%' THEN 40.6323
    WHEN u.email LIKE 'poker.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'poker.ny.%' THEN -73.9967
    WHEN u.email LIKE 'poker.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  20,
  'Mike',
  CASE 
    WHEN u.email LIKE 'poker.ny.%' THEN 'Brooklyn' || SUBSTRING(u.email FROM 'poker\.ny\.(\d+)')
    WHEN u.email LIKE 'poker.az.%' THEN 'Phoenix' || SUBSTRING(u.email FROM 'poker\.az\.(\d+)')
    ELSE 'Tampa' || SUBSTRING(u.email FROM 'poker\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  true
FROM auth.users u WHERE u.email LIKE 'poker.%@burpp.com' ORDER BY u.email;

-- DOG WALKER - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'dogwalker.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'dogwalker.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'dogwalker.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'dogwalker.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'dogwalker.ny.%' THEN 'Paws & Walks ' || SUBSTRING(u.email FROM 'dogwalker\.ny\.(\d+)')
    WHEN u.email LIKE 'dogwalker.az.%' THEN 'Desert Dogs ' || SUBSTRING(u.email FROM 'dogwalker\.az\.(\d+)')
    ELSE 'Sunshine Dog Walking ' || SUBSTRING(u.email FROM 'dogwalker\.fl\.(\d+)')
  END,
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Pet Care'),
    public.get_category_id('Pet Care', 'Dog Walking'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Pet Care', 'Dog Walking') END
  ], NULL::uuid)::uuid[],
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
  false
FROM auth.users u WHERE u.email LIKE 'dogwalker.%@burpp.com' ORDER BY u.email;

-- PERSONAL TRAINER - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'trainer.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'trainer.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'trainer.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'trainer.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'trainer.ny.%' THEN 'FitLife NYC ' || SUBSTRING(u.email FROM 'trainer\.ny\.(\d+)')
    WHEN u.email LIKE 'trainer.az.%' THEN 'Phoenix Fitness Pro ' || SUBSTRING(u.email FROM 'trainer\.az\.(\d+)')
    ELSE 'Tampa Strength Coach ' || SUBSTRING(u.email FROM 'trainer\.fl\.(\d+)')
  END,
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Health & Wellness'),
    public.get_category_id('Health & Wellness', 'Personal Trainer'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Health & Wellness', 'Personal Trainer') END
  ], NULL::uuid)::uuid[],
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
  true
FROM auth.users u WHERE u.email LIKE 'trainer.%@burpp.com' ORDER BY u.email;

-- BEAUTY - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'beauty.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'beauty.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'beauty.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'beauty.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'beauty.ny.%' THEN 'Glam Squad Brooklyn ' || SUBSTRING(u.email FROM 'beauty\.ny\.(\d+)')
    WHEN u.email LIKE 'beauty.az.%' THEN 'Desert Beauty ' || SUBSTRING(u.email FROM 'beauty\.az\.(\d+)')
    ELSE 'Beauty by the Bay ' || SUBSTRING(u.email FROM 'beauty\.fl\.(\d+)')
  END,
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Beauty & Personal Care'),
    public.get_category_id('Beauty & Personal Care', 'Makeup Artist'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Beauty & Personal Care', 'Makeup Artist') END
  ], NULL::uuid)::uuid[],
  'Professional Makeup Artist & Hairstylist',
  'Award-winning makeup artist and hairstylist. Specializing in weddings, special events, and photoshoots. Making you look stunning!',
  CASE 
    WHEN u.email LIKE 'beauty.ny.%' THEN '11219'
    WHEN u.email LIKE 'beauty.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'beauty.ny.%' THEN 40.6323
    WHEN u.email LIKE 'beauty.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'beauty.ny.%' THEN -73.9967
    WHEN u.email LIKE 'beauty.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  25,
  'Jessica',
  CASE 
    WHEN u.email LIKE 'beauty.ny.%' THEN 'Glam' || SUBSTRING(u.email FROM 'beauty\.ny\.(\d+)')
    WHEN u.email LIKE 'beauty.az.%' THEN 'Beauty' || SUBSTRING(u.email FROM 'beauty\.az\.(\d+)')
    ELSE 'Style' || SUBSTRING(u.email FROM 'beauty\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false
FROM auth.users u WHERE u.email LIKE 'beauty.%@burpp.com' ORDER BY u.email;

-- HEALTH - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'health.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'health.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'health.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'health.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'health.ny.%' THEN 'Wellness Brooklyn ' || SUBSTRING(u.email FROM 'health\.ny\.(\d+)')
    WHEN u.email LIKE 'health.az.%' THEN 'Phoenix Health Coach ' || SUBSTRING(u.email FROM 'health\.az\.(\d+)')
    ELSE 'Tampa Wellness Center ' || SUBSTRING(u.email FROM 'health\.fl\.(\d+)')
  END,
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Health & Wellness'),
    public.get_category_id('Health & Wellness', 'Wellness Coaching'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Health & Wellness', 'Wellness Coaching') END
  ], NULL::uuid)::uuid[],
  'Certified Health Coach & Nutritionist',
  'Board certified health coach and registered nutritionist. Personalized wellness plans and lifestyle coaching for optimal health.',
  CASE 
    WHEN u.email LIKE 'health.ny.%' THEN '11219'
    WHEN u.email LIKE 'health.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'health.ny.%' THEN 40.6323
    WHEN u.email LIKE 'health.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'health.ny.%' THEN -73.9967
    WHEN u.email LIKE 'health.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  30,
  'Emma',
  CASE 
    WHEN u.email LIKE 'health.ny.%' THEN 'Wellness' || SUBSTRING(u.email FROM 'health\.ny\.(\d+)')
    WHEN u.email LIKE 'health.az.%' THEN 'Health' || SUBSTRING(u.email FROM 'health\.az\.(\d+)')
    ELSE 'Vitality' || SUBSTRING(u.email FROM 'health\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  true
FROM auth.users u WHERE u.email LIKE 'health.%@burpp.com' ORDER BY u.email;

-- MASSAGE - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'massage.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'massage.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'massage.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'massage.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'massage.ny.%' THEN 'Tranquil Touch ' || SUBSTRING(u.email FROM 'massage\.ny\.(\d+)')
    WHEN u.email LIKE 'massage.az.%' THEN 'Desert Serenity Massage ' || SUBSTRING(u.email FROM 'massage\.az\.(\d+)')
    ELSE 'Relaxation Station ' || SUBSTRING(u.email FROM 'massage\.fl\.(\d+)')
  END,
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Health & Wellness'),
    public.get_category_id('Health & Wellness', 'Massage'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Health & Wellness', 'Massage') END
  ], NULL::uuid)::uuid[],
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
  false
FROM auth.users u WHERE u.email LIKE 'massage.%@burpp.com' ORDER BY u.email;

-- HOME - All Locations
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
SELECT gen_random_uuid(), 'home.ny.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'home.az.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15)
UNION ALL
SELECT gen_random_uuid(), 'home.fl.' || generate_series || '@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "vendor"}'::jsonb FROM generate_series(1, 15);

INSERT INTO user_profiles (id, email, role, is_active, created_at, updated_at)
SELECT id, email, 'vendor', true, NOW(), NOW()
FROM auth.users WHERE email LIKE 'home.%@burpp.com';

INSERT INTO vendor_profiles (user_id, business_name, service_categories, profile_title, about, zip_code, latitude, longitude, service_radius, first_name, last_name, email, phone_number, admin_approved, approved_at, created_at, updated_at, offers_in_person_services, offers_virtual_services)
SELECT 
  u.id,
  CASE 
    WHEN u.email LIKE 'home.ny.%' THEN 'Brooklyn Home Services ' || SUBSTRING(u.email FROM 'home\.ny\.(\d+)')
    WHEN u.email LIKE 'home.az.%' THEN 'Phoenix Handyman Pro ' || SUBSTRING(u.email FROM 'home\.az\.(\d+)')
    ELSE 'Tampa Home Repair ' || SUBSTRING(u.email FROM 'home\.fl\.(\d+)')
  END,
  ARRAY_REMOVE(ARRAY[
    public.get_category_id('Home & Living'),
    public.get_category_id('Home & Living', 'Handyman Tasks'),
    CASE WHEN random() < 0.5 THEN public.random_subcategory_id('Home & Living', 'Handyman Tasks') END
  ], NULL::uuid)::uuid[],
  'Professional Handyman Services',
  'Licensed and insured handyman with 15+ years experience. Repairs, installations, maintenance, and home improvements. No job too small!',
  CASE 
    WHEN u.email LIKE 'home.ny.%' THEN '11219'
    WHEN u.email LIKE 'home.az.%' THEN '85001'
    ELSE '33545'
  END,
  CASE 
    WHEN u.email LIKE 'home.ny.%' THEN 40.6323
    WHEN u.email LIKE 'home.az.%' THEN 33.4484
    ELSE 28.2314
  END,
  CASE 
    WHEN u.email LIKE 'home.ny.%' THEN -73.9967
    WHEN u.email LIKE 'home.az.%' THEN -112.0740
    ELSE -82.3270
  END,
  25,
  'Tom',
  CASE 
    WHEN u.email LIKE 'home.ny.%' THEN 'Handy' || SUBSTRING(u.email FROM 'home\.ny\.(\d+)')
    WHEN u.email LIKE 'home.az.%' THEN 'Fixit' || SUBSTRING(u.email FROM 'home\.az\.(\d+)')
    ELSE 'Repair' || SUBSTRING(u.email FROM 'home\.fl\.(\d+)')
  END,
  u.email,
  random_phone(),
  true,
  NOW(),
  NOW(),
  NOW(),
  true,
  false
FROM auth.users u WHERE u.email LIKE 'home.%@burpp.com' ORDER BY u.email;

-- Drop the helper function
DROP FUNCTION IF EXISTS random_phone();

-- Drop category helper functions
DROP FUNCTION IF EXISTS public.random_subcategory_id(text, text);
DROP FUNCTION IF EXISTS public.get_category_id(text, text);

-- Summary
DO $$
DECLARE
  vendor_count INT;
BEGIN
  SELECT COUNT(*) INTO vendor_count FROM vendor_profiles;
  
  RAISE NOTICE '✅ Successfully seeded 360 vendors!';
  RAISE NOTICE '   - % vendors across 8 categories and 3 locations', vendor_count;
  RAISE NOTICE '   - Locations: Brooklyn NY 11219, Phoenix AZ 85001, Wesley Chapel FL 33545';
  RAISE NOTICE '   - Password for all test accounts: password123';
  RAISE NOTICE '   - Run migration 023_seed_reviews.sql to add reviews';
END $$;
