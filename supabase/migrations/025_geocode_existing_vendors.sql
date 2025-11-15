-- Geocode existing vendors
-- Update latitude/longitude for our seeded vendors based on their zip codes
-- These coordinates are from OpenStreetMap/Nominatim

-- Brooklyn, NY 11219
-- Coordinates: 40.6323, -73.9967
UPDATE vendor_profiles
SET latitude = 40.6323,
    longitude = -73.9967
WHERE zip_code = '11219';

-- Phoenix, AZ 85001
-- Coordinates: 33.4484, -112.0740
UPDATE vendor_profiles
SET latitude = 33.4484,
    longitude = -112.0740
WHERE zip_code = '85001';

-- Wesley Chapel, FL 33545
-- Coordinates: 28.2103, -82.3276
UPDATE vendor_profiles
SET latitude = 28.2103,
    longitude = -82.3276
WHERE zip_code = '33545';

-- Summary
DO $$
DECLARE
  updated_count INT;
BEGIN
  SELECT COUNT(*) INTO updated_count 
  FROM vendor_profiles 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  
  RAISE NOTICE '✅ Geocoded % vendor locations', updated_count;
END $$;

