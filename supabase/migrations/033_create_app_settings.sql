-- Create app_settings table for storing application-wide settings
CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_app_settings_setting_key ON public.app_settings(setting_key);

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Anyone can view settings (needed for public pages like signup)
CREATE POLICY "Anyone can view app settings" ON public.app_settings
    FOR SELECT
    USING (true);

-- Only administrators can update settings
CREATE POLICY "Administrators can update app settings" ON public.app_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Only administrators can insert settings
CREATE POLICY "Administrators can insert app settings" ON public.app_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND up.role = 'administrator' 
            AND up.is_active = true
        )
    );

-- Grant permissions
GRANT SELECT ON public.app_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.app_settings TO authenticated;

-- Insert default setting for user registration (enabled by default)
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
    'user_registration_enabled',
    'true'::jsonb,
    'Controls whether new users can register accounts. When disabled, the signup page will show a message instead of the registration form.'
)
ON CONFLICT (setting_key) DO NOTHING;

