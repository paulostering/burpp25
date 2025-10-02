-- Create vendor_profiles table for vendor information
CREATE TABLE IF NOT EXISTS public.vendor_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    profile_title TEXT,
    about TEXT,
    profile_photo_url TEXT,
    cover_photo_url TEXT,
    offers_virtual_services BOOLEAN DEFAULT false,
    offers_in_person_services BOOLEAN DEFAULT false,
    hourly_rate DECIMAL(10,2),
    zip_code TEXT,
    service_radius INTEGER,
    service_categories TEXT[], -- Array of category names or IDs
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone_number TEXT,
    allow_phone_contact BOOLEAN DEFAULT false,
    admin_approved BOOLEAN DEFAULT false,
    admin_notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_business_name ON public.vendor_profiles(business_name);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_zip_code ON public.vendor_profiles(zip_code);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_admin_approved ON public.vendor_profiles(admin_approved);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_service_categories ON public.vendor_profiles USING GIN(service_categories);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_created_at ON public.vendor_profiles(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can view approved vendor profiles
CREATE POLICY "Anyone can view approved vendor profiles" ON public.vendor_profiles
    FOR SELECT
    USING (admin_approved = true);

-- Vendors can view their own profile (even if not approved)
CREATE POLICY "Vendors can view own profile" ON public.vendor_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Vendors can insert their own profile
CREATE POLICY "Vendors can insert own profile" ON public.vendor_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Vendors can update their own profile
CREATE POLICY "Vendors can update own profile" ON public.vendor_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Administrators can view all vendor profiles
CREATE POLICY "Administrators can view all vendor profiles" ON public.vendor_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Administrators can update all vendor profiles
CREATE POLICY "Administrators can update all vendor profiles" ON public.vendor_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Administrators can delete vendor profiles
CREATE POLICY "Administrators can delete vendor profiles" ON public.vendor_profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.vendor_profiles TO authenticated;
GRANT DELETE ON public.vendor_profiles TO authenticated; -- For admin operations

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_vendor_profiles_updated_at
    BEFORE UPDATE ON public.vendor_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


