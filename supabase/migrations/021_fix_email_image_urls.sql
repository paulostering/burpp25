-- Fix email templates to use publicly accessible Supabase storage URL for logo
-- This ensures images work in emails (localhost URLs don't work in email clients)

-- Update client_welcome template
UPDATE email_templates
SET body_html = REPLACE(
  body_html, 
  '{{siteUrl}}/images/burpp_logo_white.webp',
  'https://slvqwoglqaqccibwmpwx.supabase.co/storage/v1/object/public/assets/burpp_logo_white.webp'
)
WHERE event_name = 'client_welcome' 
AND body_html LIKE '%burpp_logo_white.webp%';

-- Update vendor_welcome template  
UPDATE email_templates
SET body_html = REPLACE(
  body_html,
  '{{siteUrl}}/images/burpp_logo_white.webp',
  'https://slvqwoglqaqccibwmpwx.supabase.co/storage/v1/object/public/assets/burpp_logo_white.webp'
)
WHERE event_name = 'vendor_welcome'
AND body_html LIKE '%burpp_logo_white.webp%';

-- Update vendor_message_received template
UPDATE email_templates
SET body_html = REPLACE(
  body_html,
  '{{siteUrl}}/images/burpp_logo_white.webp',
  'https://slvqwoglqaqccibwmpwx.supabase.co/storage/v1/object/public/assets/burpp_logo_white.webp'
)
WHERE event_name = 'vendor_message_received'
AND body_html LIKE '%burpp_logo_white.webp%';

-- Update password_reset_request template
UPDATE email_templates
SET body_html = REPLACE(
  body_html,
  '{{siteUrl}}/images/burpp_logo_white.webp',
  'https://slvqwoglqaqccibwmpwx.supabase.co/storage/v1/object/public/assets/burpp_logo_white.webp'
)
WHERE event_name = 'password_reset_request'
AND body_html LIKE '%burpp_logo_white.webp%';

-- Update password_reset_confirmed template
UPDATE email_templates
SET body_html = REPLACE(
  body_html,
  '{{siteUrl}}/images/burpp_logo_white.webp',
  'https://slvqwoglqaqccibwmpwx.supabase.co/storage/v1/object/public/assets/burpp_logo_white.webp'
)
WHERE event_name = 'password_reset_confirmed'
AND body_html LIKE '%burpp_logo_white.webp%';

