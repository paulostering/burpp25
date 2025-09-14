-- Create user_vendor_favorites table for storing user's favorite vendors
CREATE TABLE IF NOT EXISTS public.user_vendor_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Ensure a user can only favorite a vendor once
    UNIQUE(user_id, vendor_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_vendor_favorites_user_id ON public.user_vendor_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vendor_favorites_vendor_id ON public.user_vendor_favorites(vendor_id);
CREATE INDEX IF NOT EXISTS idx_user_vendor_favorites_created_at ON public.user_vendor_favorites(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_vendor_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view their own favorites
CREATE POLICY "Users can view own favorites" ON public.user_vendor_favorites
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites" ON public.user_vendor_favorites
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites" ON public.user_vendor_favorites
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.user_vendor_favorites TO authenticated;