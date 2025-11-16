-- Fix function_search_path_mutable security warnings
-- All functions should have SET search_path explicitly defined to prevent search path manipulation attacks
-- Reference: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$;

-- Fix update_email_templates_updated_at function
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_conversation_last_message function (may be called update_conversation_on_new_message)
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.conversations 
    SET 
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at,
        -- Increment unread count for the recipient
        customer_unread_count = CASE 
            WHEN NEW.sender_id != customer_id THEN customer_unread_count + 1
            ELSE customer_unread_count
        END,
        vendor_unread_count = CASE 
            WHEN NEW.sender_id != vendor_id THEN vendor_unread_count + 1
            ELSE vendor_unread_count
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() 
        AND role = 'administrator' 
        AND is_active = true
    );
END;
$$;

-- Fix remaining functions if they exist (using ALTER FUNCTION to set search_path)
-- These functions may have been created elsewhere or have different signatures

-- Fix handle_new_user if it exists (common auth trigger function)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
    ) THEN
        -- Try to alter the function to set search_path
        -- Note: We need to match the exact function signature
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || p.oid::regprocedure || ' SET search_path = public, pg_temp'
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
            LIMIT 1
        );
    END IF;
END $$;

-- Fix get_user_role if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'get_user_role'
    ) THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || p.oid::regprocedure || ' SET search_path = public, pg_temp'
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'get_user_role'
            LIMIT 1
        );
    END IF;
END $$;

-- Fix update_unread_count_on_read if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_unread_count_on_read'
    ) THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || p.oid::regprocedure || ' SET search_path = public, pg_temp'
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'update_unread_count_on_read'
            LIMIT 1
        );
    END IF;
END $$;

-- Fix update_conversation_on_new_message if it exists (may be an alias)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'update_conversation_on_new_message'
    ) THEN
        EXECUTE (
            SELECT 'ALTER FUNCTION ' || p.oid::regprocedure || ' SET search_path = public, pg_temp'
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = 'update_conversation_on_new_message'
            LIMIT 1
        );
    END IF;
END $$;

