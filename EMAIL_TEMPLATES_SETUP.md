# Email Templates Management - Setup Guide

## Overview
A complete email notification management system has been created for admins to customize email templates sent by the platform.

## What Was Created

### 1. Database Migrations

**Files**: 
- `supabase/migrations/010_create_email_templates.sql` - Creates the email_templates table
- `supabase/migrations/011_update_email_templates.sql` - Adds all branded email templates

**Features**:
- Creates `email_templates` table
- Includes RLS policies (administrator-only access)
- Pre-populated with 4 professional, branded email templates
- Support for dynamic variables (e.g., {{firstName}}, {{email}})
- Tracks active/inactive status
- Auto-updates `updated_at` timestamp

**Run the migrations**:
```bash
# If using Supabase CLI
supabase db push

# Or manually execute both SQL files in order in your Supabase dashboard:
# 1. 010_create_email_templates.sql
# 2. 011_update_email_templates.sql
```

### 2. Admin Pages

#### Email Templates List
**Route**: `/admin/email-templates`
**File**: `src/app/admin/email-templates/page.tsx`

Features:
- View all email templates
- See template status (Active/Inactive)
- Click to edit any template

#### Email Template Editor
**Route**: `/admin/email-templates/[id]`
**File**: `src/app/admin/email-templates/[id]/page.tsx`

Features:
- Edit email metadata (from name, from email, subject)
- Toggle active/inactive status
- Edit HTML and plain text versions
- Insert dynamic variables with one click
- Live preview with variable highlighting
- Save changes

### 3. Components

#### `EmailTemplatesList`
**File**: `src/components/admin/email-templates-list.tsx`
- Table view of all templates
- Shows event name, description, from info, subject, status
- Click to edit functionality

#### `EmailTemplateEditor`
**File**: `src/components/admin/email-template-editor.tsx`
- Full WYSIWYG-style editor
- Tabbed interface (HTML / Plain Text)
- Variable insertion helper
- Live preview pane
- Active/inactive toggle

### 4. API Routes

**File**: `src/app/api/admin/email-templates/[id]/route.ts`
- PATCH endpoint to update templates
- Admin-only access via RLS

### 5. TypeScript Types

**File**: `src/types/email.ts`
- `EmailTemplate` interface
- `EmailTemplateVariable` interface

### 6. Sidebar Integration

The email templates feature has been added to the admin sidebar under a new "Communications" section.

## Database Schema

```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY,
  event_name TEXT UNIQUE,          -- e.g., "user_welcome"
  event_label TEXT,                -- e.g., "Welcome Email"
  event_description TEXT,          -- Description of when it's sent
  from_email TEXT,                 -- Sender email
  from_name TEXT,                  -- Sender name
  subject TEXT,                    -- Email subject
  body_html TEXT,                  -- HTML version
  body_text TEXT,                  -- Plain text version
  is_active BOOLEAN,               -- Enable/disable template
  variables JSONB,                 -- Available dynamic variables
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);
```

## Pre-configured Email Templates

The system comes with 4 professional, branded email templates:

### 1. Welcome Email - Client (`client_welcome`)
Sent when a new customer signs up
- Burpp branded header with logo
- Lists platform features
- Call-to-action to explore services
- Variables: `{{firstName}}`, `{{lastName}}`, `{{email}}`, `{{dashboardUrl}}`

### 2. Welcome Email - Vendor (`vendor_welcome`)
Sent when a vendor registers
- Burpp branded header with logo
- Approval pending notice
- Onboarding checklist
- Variables: `{{firstName}}`, `{{lastName}}`, `{{businessName}}`, `{{email}}`, `{{dashboardUrl}}`

### 3. Message Received - Vendor (`vendor_message_received`)
Sent when a vendor receives a customer message
- Shows sender name and message preview
- Quick response call-to-action
- Pro tip for faster response times
- Variables: `{{firstName}}`, `{{businessName}}`, `{{clientName}}`, `{{messagePreview}}`, `{{messageUrl}}`, `{{settingsUrl}}`

### 4. Password Reset Confirmation (`password_reset_request`)
Sent when a user requests password reset
- Security-focused design
- Time-limited reset link
- Warning for unauthorized requests
- Variables: `{{firstName}}`, `{{email}}`, `{{resetUrl}}`

### 5. Password Reset Confirmed (`password_reset_confirmed`)
Sent after password is successfully changed
- Success confirmation
- Security alert for unauthorized changes
- Variables: `{{firstName}}`, `{{email}}`, `{{resetDate}}`, `{{resetTime}}`, `{{loginUrl}}`

## How to Use

### For Admins:
1. Navigate to `/admin/email-templates`
2. Click on any template to edit
3. Customize the from name, email, and subject
4. Edit the HTML or plain text content
5. Use the variable buttons to insert dynamic content
6. Preview your changes in real-time
7. Toggle active/inactive status
8. Click "Save Changes"

### For Developers:

**Easy-to-use email helper functions** have been created in `/src/lib/email.ts`:

```typescript
import { 
  sendClientWelcomeEmail,
  sendVendorWelcomeEmail,
  sendVendorMessageNotification,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation
} from '@/lib/email'

// Send welcome email to a new client
await sendClientWelcomeEmail(
  'user@example.com',
  'John',
  'Doe'
)

// Send welcome email to a new vendor
await sendVendorWelcomeEmail(
  'vendor@example.com',
  'Jane',
  'Smith',
  'ABC Plumbing'
)

// Notify vendor of new message
await sendVendorMessageNotification(
  'vendor@example.com',
  'Jane',
  'ABC Plumbing',
  'John Doe',
  'Hi, I need help with...',
  'conversation-id-123'
)

// Send password reset email
await sendPasswordResetEmail(
  'user@example.com',
  'John',
  'https://burpp.com/reset-password?token=xyz'
)

// Confirm password was reset
await sendPasswordResetConfirmation(
  'user@example.com',
  'John'
)
```

**Important**: The `{{siteUrl}}` variable is automatically injected into all emails based on `NEXT_PUBLIC_SITE_URL` environment variable. This ensures the logo and all links work in both development and production.

## Adding More Email Events

To add more email events, insert new records into the `email_templates` table:

```sql
INSERT INTO email_templates (
  event_name,
  event_label,
  event_description,
  from_email,
  from_name,
  subject,
  body_html,
  body_text,
  variables
) VALUES (
  'vendor_approved',
  'Vendor Approval Notification',
  'Sent to vendors when their profile is approved',
  'noreply@burpp.com',
  'Burpp Team',
  'Congratulations! Your Vendor Profile is Approved',
  '<html>...</html>',
  'Plain text version...',
  '[
    {"name": "businessName", "label": "Business Name", "description": "Vendor business name"},
    {"name": "approvalDate", "label": "Approval Date", "description": "Date profile was approved"}
  ]'::jsonb
);
```

## Features Implemented

✅ CRUD operations for email templates
✅ HTML and plain text editing
✅ Dynamic variable insertion
✅ Live preview
✅ Active/inactive toggle
✅ Beautiful default welcome email
✅ Admin-only access with RLS
✅ Full sidebar integration
✅ TypeScript types
✅ Professional UI with shadcn components

## Future Enhancements

Consider adding:
- Rich WYSIWYG editor (TinyMCE, Quill, or similar)
- Email testing (send test email to admin)
- Email history/logs
- Multiple templates per event (A/B testing)
- Template versioning
- Email analytics
- Scheduled emails
- Email queue management

## Next Steps

1. Run the Supabase migration
2. Navigate to `/admin/email-templates` to see your templates
3. Customize the welcome email
4. Integrate email sending in your auth signup flow
5. Add more email events as needed

