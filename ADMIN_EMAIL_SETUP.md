# Admin Email Notification Setup

This document explains how to set up email notifications for new user and vendor registrations.

## Overview

When a new client or vendor registers on Burpp, an email notification will be automatically sent to the admin email address with details about the registration.

## Recipient Email

All registration notifications are sent to: **`registrations@burpp.com`**

## Setup Steps

### 1. Run the Database Migration

Run the migration to add the email templates to your database:

```bash
npx supabase db push
```

Or manually run the SQL file:

```bash
psql YOUR_DATABASE_URL -f supabase/migrations/034_add_admin_notification_templates.sql
```

Alternatively, you can copy the contents of `supabase/migrations/034_add_admin_notification_templates.sql` and run it in your Supabase SQL editor.

### 2. Email Configuration

All registration notifications are automatically sent to: **`registrations@burpp.com`**

This is hardcoded in the application and does not require any environment variable configuration.

### 3. Verify Email Templates

1. Log in to your admin panel at `/admin`
2. Navigate to **Settings** → **Email Templates**
3. You should see two new templates:
   - **Admin Client Registration Notification**
   - **Admin Vendor Registration Notification**
4. You can customize these templates as needed

## What Gets Sent

### Client Registration Notification

When a new client registers, you'll receive an email with:
- Client's full name
- Email address
- Registration date and time
- User ID
- Link to view in admin panel

### Vendor Registration Notification

When a new vendor registers, you'll receive an email with:
- Business name
- Contact name
- Email address
- Phone number
- Service categories
- Location (zip code)
- Service type (Virtual, In-Person, or Both)
- Registration date and time
- User ID
- Link to view in admin panel

## Testing

To test the notifications:

1. Create a new client account at `/signup`
2. Create a new vendor account at `/vendor-registration`
3. Check your admin email inbox for the notifications

## Troubleshooting

### Not Receiving Emails

1. **Check Email Address**: All notifications are sent to `registrations@burpp.com`
2. **Check Resend API Key**: Verify `RESEND_API_KEY` is configured
3. **Check Email Templates**: Ensure templates are active in `/admin/email-templates`
4. **Check Server Logs**: Look for error messages in your application logs
5. **Check Spam Folder**: Notification emails might be filtered as spam

### Emails Going to Spam

If notifications are going to spam:
1. Add `notifications@burpp.com` to your email contacts
2. Configure SPF/DKIM records in Resend
3. Mark the emails as "Not Spam" in your email client

## Customization

You can customize the email templates by:

1. Going to `/admin/email-templates`
2. Clicking on the template you want to edit
3. Modifying the HTML or text content
4. Saving your changes

Available variables in the templates:
- Client: `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{userId}}`, `{{registrationDate}}`, `{{adminUrl}}`
- Vendor: All client variables plus `{{businessName}}`, `{{phone}}`, `{{categories}}`, `{{location}}`, `{{serviceType}}`

## Files Modified

- `supabase/migrations/034_add_admin_notification_templates.sql` - Database migration
- `src/lib/email.ts` - Email helper functions
- `src/app/api/admin-notifications/client-registration/route.ts` - Client notification API
- `src/app/api/admin-notifications/vendor-registration/route.ts` - Vendor notification API
- `src/components/signup-form.tsx` - Client registration integration
- `src/components/vendor-auth-form.tsx` - Vendor auth integration
- `src/app/vendor-registration/page.tsx` - Vendor registration integration

