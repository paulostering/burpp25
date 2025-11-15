-- Seed Reviews Script
-- Creates client users and reviews for existing vendors

-- Create client users for writing reviews (only if they don't exist)
DO $$
DECLARE
  i INT;
  new_user_id UUID;
  user_email TEXT;
BEGIN
  FOR i IN 1..20 LOOP
    user_email := 'client.' || i || '@burpp.com';
    
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
      new_user_id := gen_random_uuid();
      
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
      VALUES (new_user_id, user_email, crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "customer"}'::jsonb);
      
      INSERT INTO user_profiles (id, email, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES (
        new_user_id,
        user_email,
        CASE (RANDOM() * 10)::INT
          WHEN 0 THEN 'John'
          WHEN 1 THEN 'Sarah'
          WHEN 2 THEN 'Michael'
          WHEN 3 THEN 'Emily'
          WHEN 4 THEN 'David'
          WHEN 5 THEN 'Jessica'
          WHEN 6 THEN 'Robert'
          WHEN 7 THEN 'Jennifer'
          WHEN 8 THEN 'William'
          ELSE 'Lisa'
        END,
        CASE (RANDOM() * 10)::INT
          WHEN 0 THEN 'Smith'
          WHEN 1 THEN 'Johnson'
          WHEN 2 THEN 'Williams'
          WHEN 3 THEN 'Brown'
          WHEN 4 THEN 'Jones'
          WHEN 5 THEN 'Garcia'
          WHEN 6 THEN 'Miller'
          WHEN 7 THEN 'Davis'
          WHEN 8 THEN 'Rodriguez'
          ELSE 'Martinez'
        END,
        'customer',
        true,
        NOW(),
        NOW()
      );
    END IF;
  END LOOP;
END $$;

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_exists BOOLEAN;
  new_admin_id UUID;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin') INTO admin_exists;
  
  IF NOT admin_exists THEN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@burpp.com') THEN
      new_admin_id := gen_random_uuid();
      
      INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
      VALUES (new_admin_id, 'admin@burpp.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"role": "admin"}'::jsonb);
      
      INSERT INTO user_profiles (id, email, first_name, last_name, role, is_active, created_at, updated_at)
      VALUES (new_admin_id, 'admin@burpp.com', 'Admin', 'User', 'admin', true, NOW(), NOW());
    END IF;
  END IF;
END $$;

-- Create a temporary table to store admin user for approving reviews
CREATE TEMP TABLE admin_user AS
SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin' OR email = 'admin@burpp.com' LIMIT 1;

-- Seed reviews for vendors (3-8 reviews per vendor)
-- Get all vendor IDs
CREATE TEMP TABLE all_vendors AS
SELECT id FROM vendor_profiles ORDER BY created_at;

-- Get all client IDs
CREATE TEMP TABLE all_clients AS
SELECT id FROM auth.users WHERE email LIKE 'client.%@burpp.com';

-- Create reviews with variety
INSERT INTO reviews (user_id, vendor_id, rating, title, comment, approved, approved_at, approved_by, created_at, updated_at)
SELECT 
  (SELECT id FROM all_clients ORDER BY RANDOM() LIMIT 1) as user_id,
  v.id as vendor_id,
  (4 + (RANDOM() * 2)::INT) as rating, -- Random rating between 4-5
  CASE (RANDOM() * 10)::INT
    WHEN 0 THEN 'Excellent Service!'
    WHEN 1 THEN 'Highly Recommend'
    WHEN 2 THEN 'Outstanding Professional'
    WHEN 3 THEN 'Great Experience'
    WHEN 4 THEN 'Top Quality Work'
    WHEN 5 THEN 'Exceeded Expectations'
    WHEN 6 THEN 'Will Use Again'
    WHEN 7 THEN 'Very Professional'
    WHEN 8 THEN 'Amazing Results'
    ELSE 'Fantastic Service'
  END as title,
  CASE (RANDOM() * 12)::INT
    WHEN 0 THEN 'Had a wonderful experience! Very professional and delivered exactly what was promised. Would definitely hire again.'
    WHEN 1 THEN 'Quick response time and excellent quality of work. Highly satisfied with the service provided.'
    WHEN 2 THEN 'This professional went above and beyond my expectations. Great communication throughout the process.'
    WHEN 3 THEN 'Outstanding service from start to finish. Very knowledgeable and friendly. Highly recommended!'
    WHEN 4 THEN 'Exceptional work quality and attention to detail. Made the entire process smooth and stress-free.'
    WHEN 5 THEN 'Very impressed with the professionalism and expertise. Will definitely be using their services again.'
    WHEN 6 THEN 'Fantastic experience! They were punctual, professional, and the results exceeded my expectations.'
    WHEN 7 THEN 'Great service at a fair price. Very responsive and easy to work with. Highly recommend to others.'
    WHEN 8 THEN 'Could not be happier with the service provided. True professional who takes pride in their work.'
    WHEN 9 THEN 'Amazing work! Very skilled and knowledgeable. Made sure everything was perfect before finishing.'
    WHEN 10 THEN 'Excellent from start to finish. Great communication and delivered exactly what I was looking for.'
    ELSE 'Top-notch service! Professional, efficient, and the quality of work was outstanding. Will hire again!'
  END as comment,
  true as approved,
  NOW() - (RANDOM() * INTERVAL '60 days') as approved_at,
  (SELECT id FROM admin_user) as approved_by,
  NOW() - (RANDOM() * INTERVAL '90 days') as created_at,
  NOW() - (RANDOM() * INTERVAL '90 days') as updated_at
FROM all_vendors v
CROSS JOIN generate_series(1, (3 + (RANDOM() * 6)::INT)) -- 3-8 reviews per vendor
ORDER BY RANDOM();

-- Add some 3-star reviews (less common, more critical but still positive)
INSERT INTO reviews (user_id, vendor_id, rating, title, comment, approved, approved_at, approved_by, created_at, updated_at)
SELECT 
  (SELECT id FROM all_clients ORDER BY RANDOM() LIMIT 1) as user_id,
  v.id as vendor_id,
  3 as rating,
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'Good Service'
    WHEN 1 THEN 'Decent Experience'
    WHEN 2 THEN 'Satisfactory'
    ELSE 'Pretty Good'
  END as title,
  CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'Service was good overall. A few minor issues but nothing major. Would consider using again.'
    WHEN 1 THEN 'Decent work quality. Communication could have been better but got the job done.'
    WHEN 2 THEN 'Satisfactory service. Met expectations but nothing exceptional. Fair pricing.'
    ELSE 'Pretty good experience. Some room for improvement but overall satisfied with the work.'
  END as comment,
  true as approved,
  NOW() - (RANDOM() * INTERVAL '45 days') as approved_at,
  (SELECT id FROM admin_user) as approved_by,
  NOW() - (RANDOM() * INTERVAL '60 days') as created_at,
  NOW() - (RANDOM() * INTERVAL '60 days') as updated_at
FROM all_vendors v
WHERE RANDOM() < 0.15 -- Only 15% of vendors get a 3-star review
ORDER BY RANDOM();

-- Clean up temp tables
DROP TABLE all_vendors;
DROP TABLE all_clients;
DROP TABLE admin_user;

-- Summary
DO $$
DECLARE
  vendor_count INT;
  review_count INT;
  client_count INT;
BEGIN
  SELECT COUNT(*) INTO vendor_count FROM vendor_profiles;
  SELECT COUNT(*) INTO review_count FROM reviews WHERE approved = true;
  SELECT COUNT(*) INTO client_count FROM user_profiles WHERE role = 'customer';
  
  RAISE NOTICE '✅ Successfully seeded reviews!';
  RAISE NOTICE '   - % total vendors in database', vendor_count;
  RAISE NOTICE '   - % approved reviews from % clients', review_count, client_count;
  RAISE NOTICE '   - Password for all test accounts: password123';
  RAISE NOTICE '   - Average reviews per vendor: %', ROUND(review_count::NUMERIC / vendor_count, 1);
END $$;

