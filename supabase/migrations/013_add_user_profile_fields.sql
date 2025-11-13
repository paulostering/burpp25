-- Add profile photo and phone number fields to user_profiles table
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_number ON public.user_profiles(phone_number) WHERE phone_number IS NOT NULL;
