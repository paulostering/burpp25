-- Fix the role column type issue
-- The role column may have been converted to a custom enum type which is causing issues

-- First, let's check if there's a user_role enum type and handle it
DO $$ 
BEGIN
    -- If user_role type exists, we need to convert the column back to TEXT
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        -- Drop the constraint if it exists
        ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
        
        -- Convert the column to TEXT
        ALTER TABLE public.user_profiles 
        ALTER COLUMN role TYPE TEXT USING role::TEXT;
        
        -- Add back the CHECK constraint
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_role_check 
        CHECK (role IN ('customer', 'vendor', 'administrator'));
        
        -- Drop the enum type (it's no longer needed)
        DROP TYPE IF EXISTS user_role CASCADE;
    END IF;
END $$;

-- Ensure the default is set correctly
ALTER TABLE public.user_profiles 
ALTER COLUMN role SET DEFAULT 'customer';

