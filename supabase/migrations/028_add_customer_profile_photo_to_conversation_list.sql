-- Update conversation_list view to include customer profile photo
-- Drop the existing view first to avoid column name conflicts
DROP VIEW IF EXISTS public.conversation_list;

-- Recreate the view with the customer profile photo column
CREATE VIEW public.conversation_list AS
SELECT 
    c.*,
    cp.email as customer_email,
    cp.first_name as customer_first_name,
    cp.last_name as customer_last_name,
    cp.profile_photo_url as customer_photo,
    vp_user.email as vendor_email,
    vp.business_name,
    vp.profile_photo_url as vendor_photo,
    vp.first_name as vendor_first_name,
    vp.last_name as vendor_last_name
FROM public.conversations c
LEFT JOIN public.user_profiles cp ON c.customer_id = cp.id
LEFT JOIN public.user_profiles vp_user ON c.vendor_id = vp_user.id
LEFT JOIN public.vendor_profiles vp ON c.vendor_id = vp.user_id;

-- Grant permissions on the view
GRANT SELECT ON public.conversation_list TO authenticated;

