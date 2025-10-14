-- Create vendor_products table for vendor product/service listings
CREATE TABLE IF NOT EXISTS public.vendor_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    starting_price DECIMAL(10,2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vendor_products_vendor_id ON public.vendor_products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_products_is_active ON public.vendor_products(is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_products_display_order ON public.vendor_products(vendor_id, display_order);
CREATE INDEX IF NOT EXISTS idx_vendor_products_created_at ON public.vendor_products(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can view active products for approved vendors
CREATE POLICY "Anyone can view active products for approved vendors" ON public.vendor_products
    FOR SELECT
    USING (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM public.vendor_profiles vp
            WHERE vp.id = vendor_products.vendor_id 
            AND vp.admin_approved = true
        )
    );

-- Vendors can view all their own products
CREATE POLICY "Vendors can view own products" ON public.vendor_products
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.vendor_profiles vp
            WHERE vp.id = vendor_products.vendor_id 
            AND vp.user_id = auth.uid()
        )
    );

-- Vendors can insert their own products
CREATE POLICY "Vendors can insert own products" ON public.vendor_products
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vendor_profiles vp
            WHERE vp.id = vendor_products.vendor_id 
            AND vp.user_id = auth.uid()
        )
    );

-- Vendors can update their own products
CREATE POLICY "Vendors can update own products" ON public.vendor_products
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.vendor_profiles vp
            WHERE vp.id = vendor_products.vendor_id 
            AND vp.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.vendor_profiles vp
            WHERE vp.id = vendor_products.vendor_id 
            AND vp.user_id = auth.uid()
        )
    );

-- Vendors can delete their own products
CREATE POLICY "Vendors can delete own products" ON public.vendor_products
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.vendor_profiles vp
            WHERE vp.id = vendor_products.vendor_id 
            AND vp.user_id = auth.uid()
        )
    );

-- Create a security definer function to check if user is admin
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() 
        AND role = 'administrator' 
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;

-- Administrators can view all products (using helper function to avoid recursion)
CREATE POLICY "Administrators can view all products" ON public.vendor_products
    FOR SELECT
    USING (is_admin());

-- Administrators can update all products
CREATE POLICY "Administrators can update all products" ON public.vendor_products
    FOR UPDATE
    USING (is_admin());

-- Administrators can delete products
CREATE POLICY "Administrators can delete products" ON public.vendor_products
    FOR DELETE
    USING (is_admin());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_products TO authenticated;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_vendor_products_updated_at
    BEFORE UPDATE ON public.vendor_products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

