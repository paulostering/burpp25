-- Clear categories and reseed with the new parent/subcategory structure.
-- NOTE: This will remove all existing category IDs. Any vendors referencing old IDs
-- in vendor_profiles.service_categories will be reset to NULL below.

-- 1) Add a description/tagline column (for parent category taglines)
ALTER TABLE public.categories
ADD COLUMN IF NOT EXISTS description text;

-- 2) Reset vendor category selections (old UUIDs would be invalid after reseed)
UPDATE public.vendor_profiles
SET service_categories = NULL;

-- 3) Clear categories (self-FK exists, so use TRUNCATE ... CASCADE)
TRUNCATE TABLE public.categories RESTART IDENTITY CASCADE;

-- 4) Seed parents
WITH parents(name, description, is_featured) AS (
  VALUES
    ('Home & Living', 'Everyday home help, done right.', false),
    ('Beauty & Personal Care', 'Everything that helps you look and feel your best.', false),
    ('Health & Wellness', 'Mind–body support from real people you can trust.', false),
    ('Pet Care', 'For all things furry, feathered, and loved.', false),
    ('Events & Hospitality', 'Support for parties, gatherings, and special moments.', false),
    ('Learning & Development', 'Support for students, kids, creatives, and lifelong learners.', false),
    ('Lifestyle Support', 'Modern life-management made human.', false),
    ('Food & Kitchen Support', 'Support for all your food & kitchen needs.', false),
    ('People You Can Count On', 'The HUMAN category that sets Burpp apart from TaskRabbit, Rover, Thumbtack, etc.', true)
),
inserted_parents AS (
  INSERT INTO public.categories (name, description, parent_id, is_active, is_featured)
  SELECT name, description, NULL, true, is_featured
  FROM parents
  RETURNING id, name
),
children(parent_name, child_name) AS (
  VALUES
    -- 1) Home & Living
    ('Home & Living', 'Home Cleaning'),
    ('Home & Living', 'Deep Cleaning'),
    ('Home & Living', 'Move-Out / Move-In Cleaning'),
    ('Home & Living', 'Laundry & Folding'),
    ('Home & Living', 'Home Organization'),
    ('Home & Living', 'Decluttering'),
    ('Home & Living', 'Handyman Tasks'),
    ('Home & Living', 'Furniture Assembly'),
    ('Home & Living', 'Minor Repairs'),
    ('Home & Living', 'Errands / Task Runner'),
    ('Home & Living', 'Grocery Shopping'),
    ('Home & Living', 'Plant Care'),
    ('Home & Living', 'Home Check-Ins (Travel)'),
    ('Home & Living', 'House Sitting'),
    ('Home & Living', 'Packing / Unpacking'),
    ('Home & Living', 'Room Makeovers / Light Staging'),
    ('Home & Living', 'Moving Help (Loading/Unloading)'),

    -- 2) Beauty & Personal Care
    ('Beauty & Personal Care', 'Hair Stylist'),
    ('Beauty & Personal Care', 'Blowouts & Styling'),
    ('Beauty & Personal Care', 'Braids'),
    ('Beauty & Personal Care', 'Makeup Artist'),
    ('Beauty & Personal Care', 'Skincare Services'),
    ('Beauty & Personal Care', 'Lash Tech'),
    ('Beauty & Personal Care', 'Brow Artist'),
    ('Beauty & Personal Care', 'Nail Tech'),
    ('Beauty & Personal Care', 'Waxing'),
    ('Beauty & Personal Care', 'Spray Tans'),
    ('Beauty & Personal Care', 'Men’s Grooming'),
    ('Beauty & Personal Care', 'Body Sculpting (non-medical)'),
    ('Beauty & Personal Care', 'Teeth Whitening (non-medical)'),

    -- 3) Health & Wellness
    ('Health & Wellness', 'Massage'),
    ('Health & Wellness', 'Stretch Therapy'),
    ('Health & Wellness', 'Personal Trainer'),
    ('Health & Wellness', 'Yoga Instructor'),
    ('Health & Wellness', 'Pilates Instructor'),
    ('Health & Wellness', 'Nutrition Support'),
    ('Health & Wellness', 'Wellness Coaching'),
    ('Health & Wellness', 'Post-Surgery Support'),
    ('Health & Wellness', 'Stress Relief / Guided Breathwork'),
    ('Health & Wellness', 'Meditation / Mindfulness'),
    ('Health & Wellness', 'Mobility Coaching'),
    ('Health & Wellness', 'Prenatal / Postnatal Support (non-medical)'),

    -- 4) Pet Care
    ('Pet Care', 'Dog Walking'),
    ('Pet Care', 'Pet Sitting'),
    ('Pet Care', 'Pet Drop-Ins'),
    ('Pet Care', 'Feeding & Medication'),
    ('Pet Care', 'Pet Grooming'),
    ('Pet Care', 'Overnight Pet Care'),
    ('Pet Care', 'Pet Transportation'),
    ('Pet Care', 'Puppy Training (basic)'),
    ('Pet Care', 'Litter Box / Habitat Refresh'),
    ('Pet Care', 'Exotic Pet Care (non-medical)'),

    -- 5) Events & Hospitality
    ('Events & Hospitality', 'Catering'),
    ('Events & Hospitality', 'Private Chef'),
    ('Events & Hospitality', 'Bartending'),
    ('Events & Hospitality', 'Event Staff / Host'),
    ('Events & Hospitality', 'Poker Dealer'),
    ('Events & Hospitality', 'Card Dealer (other games)'),
    ('Events & Hospitality', 'Party Helpers'),
    ('Events & Hospitality', 'Event Set-Up & Clean-Up'),
    ('Events & Hospitality', 'DJ / Music'),
    ('Events & Hospitality', 'Photographer'),
    ('Events & Hospitality', 'Videographer'),
    ('Events & Hospitality', 'Content Creator'),
    ('Events & Hospitality', 'Balloon / Decor Set-Up'),
    ('Events & Hospitality', 'Kid’s Party Helper'),

    -- 6) Learning & Development
    ('Learning & Development', 'Tutoring (Math, English, Science, etc.)'),
    ('Learning & Development', 'Test Prep'),
    ('Learning & Development', 'Language Lessons'),
    ('Learning & Development', 'Music Lessons'),
    ('Learning & Development', 'Art Lessons'),
    ('Learning & Development', 'Homework Support'),
    ('Learning & Development', 'Study Skills Coaching'),
    ('Learning & Development', 'Adult Learning / Skill Building'),
    ('Learning & Development', 'Tech Lessons (basic computer, software, phone use)'),

    -- 7) Lifestyle Support
    ('Lifestyle Support', 'Life Assistant'),
    ('Lifestyle Support', 'Personal Assistant (In-Person)'),
    ('Lifestyle Support', 'Virtual Assistant'),
    ('Lifestyle Support', 'Personal Shopper'),
    ('Lifestyle Support', 'Travel Planning'),
    ('Lifestyle Support', 'Home Management Support'),
    ('Lifestyle Support', 'Companion Visits'),
    ('Lifestyle Support', 'Elder Support (non-medical)'),
    ('Lifestyle Support', 'Car Drop-Off / Pick-Up'),
    ('Lifestyle Support', 'Closet Refresh / Wardrobe Help'),
    ('Lifestyle Support', 'Scheduling & Calendar Help'),

    -- 8) Food & Kitchen Support
    ('Food & Kitchen Support', 'Private Chef'),
    ('Food & Kitchen Support', 'Meal Prep'),
    ('Food & Kitchen Support', 'Weekly Meal Support'),
    ('Food & Kitchen Support', 'Grocery List Planning'),
    ('Food & Kitchen Support', 'In-Home Cooking Help'),
    ('Food & Kitchen Support', 'Baking Help'),
    ('Food & Kitchen Support', 'Kitchen Organization'),

    -- 9) People You Can Count On
    ('People You Can Count On', 'Ongoing Weekly Help'),
    ('People You Can Count On', 'Recurring Monthly Help'),
    ('People You Can Count On', 'Last-Minute Help'),
    ('People You Can Count On', 'Reliability Pros'),
    ('People You Can Count On', '“Go-To” Person'),
    ('People You Can Count On', 'Multi-Skill Helper'),
    ('People You Can Count On', 'Emotional Support Tasks (reading to elderly, companionship)'),
    ('People You Can Count On', 'Comfort Companion (cuddling, safe company)'),
    ('People You Can Count On', 'Rent-a-Friend'),
    ('People You Can Count On', 'Adventure Buddy (hikes, walks, activities)'),
    ('People You Can Count On', 'Safe-Walk Companion (nighttime escort for safety)'),
    ('People You Can Count On', 'Accountability Partner (goals, routines)')
)
INSERT INTO public.categories (name, description, parent_id, is_active, is_featured)
SELECT
  c.child_name,
  NULL,
  p.id,
  true,
  false
FROM children c
JOIN inserted_parents p
  ON p.name = c.parent_name;



