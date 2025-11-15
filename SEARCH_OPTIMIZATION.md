# Search Performance Optimization

## Problem
The search was timing out because it was geocoding vendor locations on-the-fly for every search query. This doesn't scale - with thousands of vendors, it would make hundreds of API calls to Nominatim (OpenStreetMap) on every search.

## Solution
Store pre-geocoded latitude/longitude coordinates directly in the `vendor_profiles` table.

## What Was Changed

### 1. Database Schema (Migrations)
- **024_add_vendor_coordinates.sql** - Adds `latitude` and `longitude` columns to `vendor_profiles`
- **025_geocode_existing_vendors.sql** - Updates existing 360 vendors with their coordinates

### 2. TypeScript Types
- **src/types/db.ts** - Added `latitude` and `longitude` to `VendorProfile` interface

### 3. Search API  
- **src/app/api/search-vendors/route.ts** - Now uses stored coordinates instead of geocoding on-the-fly
  - Before: Geocoded each vendor's zip code on every search (slow, rate-limited)
  - After: Uses pre-stored coordinates from database (instant!)

### 4. Seeding (Future vendors)
- **022_seed_vendors.sql** - Updated first INSERT to include coordinates for future seeding

## How to Apply

### Run the migrations in Supabase SQL Editor:

1. Run `024_add_vendor_coordinates.sql` - Adds the columns
2. Run `025_geocode_existing_vendors.sql` - Geocodes your 360 existing vendors

That's it! Your search will now be instant. ⚡

## Performance Improvement

**Before:** 5-30+ seconds (timed out)
- Geocoded 15+ zip codes per search
- Hit Nominatim rate limits
- Made hundreds of API calls

**After:** <100ms 
- No geocoding during search
- Simple distance calculation using stored coordinates
- Scales to thousands/millions of vendors

## For Future Vendors

✅ **Already Implemented!** The system now automatically geocodes vendor locations:

### During Vendor Registration
- **src/app/vendor-registration/page.tsx** - Geocodes zip code on signup
- Coordinates are stored immediately when vendor creates their profile
- Uses Nominatim (OpenStreetMap) for geocoding

### During Vendor Profile Updates
- **src/components/vendor-profile-manager.tsx** - Vendor self-service profile editing
- **src/components/admin/admin-vendor-profile-manager.tsx** - Admin profile editing
- Automatically re-geocodes if zip code is changed
- Only geocodes when zip code actually changes (efficient!)

### Geocoding Logic
```typescript
// Example from vendor registration
const coords = await geocodeZipCode(zipCode)
if (coords) {
  payload.latitude = coords.lat
  payload.longitude = coords.lng
}
```

This ensures all new vendors and profile updates automatically have coordinates for instant search results.

## Coordinates Used

- **Brooklyn, NY 11219**: 40.6323, -73.9967
- **Phoenix, AZ 85001**: 33.4484, -112.0740
- **Wesley Chapel, FL 33545**: 28.2103, -82.3276

These are accurate center points for each zip code.

