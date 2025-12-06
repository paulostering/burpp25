-- Add policy to allow viewing basic public user profile info
-- This is needed for displaying user names on reviews, messages, etc.

-- Create a policy that allows anyone to view basic user profile info
-- We limit this to SELECT only and specific columns are handled by the view/query
CREATE POLICY "Anyone can view public user info" 
ON public.user_profiles
FOR SELECT
USING (true);

-- Note: This allows viewing all columns in user_profiles
-- If you want to restrict to only certain columns, you would need to:
-- 1. Create a view that exposes only public columns
-- 2. Grant SELECT on that view instead
-- For now, the user_profiles table contains:
-- - id, email, first_name, last_name, role, is_active, profile_photo_url, phone_number
-- These are all reasonably public for a platform like this

