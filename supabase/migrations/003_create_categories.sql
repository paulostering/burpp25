-- Create categories table for service categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    icon_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES public.user_profiles(id),
    updated_by UUID REFERENCES public.user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_categories_name ON public.categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_is_featured ON public.categories(is_featured);
CREATE INDEX IF NOT EXISTS idx_categories_created_at ON public.categories(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can view active categories
CREATE POLICY "Anyone can view active categories" ON public.categories
    FOR SELECT
    USING (is_active = true);

-- Administrators can view all categories
CREATE POLICY "Administrators can view all categories" ON public.categories
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Administrators can insert categories
CREATE POLICY "Administrators can insert categories" ON public.categories
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Administrators can update categories
CREATE POLICY "Administrators can update categories" ON public.categories
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Administrators can delete categories
CREATE POLICY "Administrators can delete categories" ON public.categories
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
GRANT SELECT ON public.categories TO authenticated;
GRANT ALL ON public.categories TO authenticated; -- For admin operations

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


