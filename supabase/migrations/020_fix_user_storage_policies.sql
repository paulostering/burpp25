-- Fix storage bucket for user profile photos
-- Note: Storage policies must be configured through the Supabase Dashboard
-- Go to Storage > Policies to set up RLS policies

-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'users',
  'users',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- Storage policies must be created through the Supabase Dashboard:
-- 1. Go to Storage > users bucket > Policies
-- 2. Create the following policies:
--
-- Policy 1: "Users can upload own photos" (INSERT)
--   Target roles: authenticated
--   WITH CHECK: bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 2: "Users can update own photos" (UPDATE)
--   Target roles: authenticated
--   USING: bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]
--   WITH CHECK: bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 3: "Users can delete own photos" (DELETE)
--   Target roles: authenticated
--   USING: bucket_id = 'users' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- Policy 4: "Anyone can view user photos" (SELECT)
--   Target roles: public
--   USING: bucket_id = 'users'
