-- Add latitude and longitude columns to vendor_profiles
-- This allows us to store geocoded coordinates at creation time instead of geocoding on every search

ALTER TABLE vendor_profiles
ADD COLUMN latitude NUMERIC(10, 7),
ADD COLUMN longitude NUMERIC(10, 7);

-- Create an index for faster location-based queries
CREATE INDEX idx_vendor_profiles_coordinates ON vendor_profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add a comment explaining these fields
COMMENT ON COLUMN vendor_profiles.latitude IS 'Pre-geocoded latitude for the vendor zip code';
COMMENT ON COLUMN vendor_profiles.longitude IS 'Pre-geocoded longitude for the vendor zip code';

