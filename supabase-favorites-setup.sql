-- Create user_vendor_favorites table for storing user favorite vendors
CREATE TABLE IF NOT EXISTS public.user_vendor_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, vendor_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_vendor_favorites ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites" ON public.user_vendor_favorites
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert their own favorites" ON public.user_vendor_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON public.user_vendor_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_vendor_favorites_user_id ON public.user_vendor_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vendor_favorites_vendor_id ON public.user_vendor_favorites(vendor_id);

-- Grant permissions
GRANT ALL ON public.user_vendor_favorites TO authenticated;
GRANT ALL ON public.user_vendor_favorites TO service_role;
