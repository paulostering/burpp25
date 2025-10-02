-- Create conversations table for messaging between customers and vendors
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    customer_unread_count INTEGER DEFAULT 0,
    vendor_unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Ensure unique conversation between customer and vendor
    UNIQUE(customer_id, vendor_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON public.conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor_id ON public.conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view conversations they are part of (as customer or vendor)
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT
    USING (auth.uid() = customer_id OR auth.uid() = vendor_id);

-- Users can insert conversations they are part of
CREATE POLICY "Users can insert own conversations" ON public.conversations
    FOR INSERT
    WITH CHECK (auth.uid() = customer_id OR auth.uid() = vendor_id);

-- Users can update conversations they are part of
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE
    USING (auth.uid() = customer_id OR auth.uid() = vendor_id)
    WITH CHECK (auth.uid() = customer_id OR auth.uid() = vendor_id);

-- Administrators can view all conversations
CREATE POLICY "Administrators can view all conversations" ON public.conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for conversation list with additional data
CREATE OR REPLACE VIEW public.conversation_list AS
SELECT 
    c.*,
    cp.email as customer_email,
    cp.first_name as customer_first_name,
    cp.last_name as customer_last_name,
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


