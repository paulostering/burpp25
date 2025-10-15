# Customizing Supabase Password Reset Emails

## Current Implementation

The password reset flow now uses **custom branded email templates** via SendGrid! To prevent duplicate emails, you need to disable Supabase's built-in password reset email.

## ⚠️ REQUIRED: Disable Supabase Default Email

To avoid sending duplicate reset emails, you MUST disable Supabase's default email:

### Steps:

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**

2. Find **"Reset Password"** template

3. **Disable the template** or change the template to be empty

4. **OR** Set "Enable email confirmations" to OFF in Auth settings (if you want to disable all Supabase emails)

This ensures only YOUR branded email is sent via SendGrid.

## How to Customize Supabase Email Templates

### Option 1: Customize in Supabase Dashboard (Easiest)

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**

2. Find **"Reset Password"** template

3. Replace the template with your branded version:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>Click the link below to reset your password for Burpp:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, please ignore this email.</p>
<p>Best regards,<br>The Burpp Team</p>
```

4. Use the HTML template from our migration (`password_reset_request`) and replace `{{resetUrl}}` with `{{ .ConfirmationURL }}`

### Option 2: Use Custom SMTP (Full Control)

1. **In Supabase Dashboard** → **Project Settings** → **Auth**

2. **Enable Custom SMTP**:
   - SMTP Host: `smtp.sendgrid.net`
   - SMTP Port: `587`
   - SMTP User: `apikey`
   - SMTP Pass: `[Your SendGrid API Key]`
   - Sender Email: `hello@burpp.com`
   - Sender Name: `Burpp Team`

3. **Update Email Templates** to use your branded HTML from the migration

### Option 3: Disable Supabase Emails & Use Full Custom (Advanced)

1. **In Supabase Dashboard** → **Authentication** → **Email Templates**

2. **Disable** "Confirm Signup" and "Reset Password" emails

3. Update the API route to use `admin.generateLink()` (already in code, commented out)

4. Handle session establishment manually (requires fixing the session issue)

## Current Flow (Working)

✅ User requests password reset at `/forgot-password`  
✅ Supabase sends its default reset email  
✅ User clicks link  
✅ Redirects to `/reset-password`  
✅ User enters new password  
✅ **Custom confirmation email sent** using `password_reset_confirmed` template  

## Recommended Approach

**For Now**: Use Option 1 (customize Supabase template in dashboard)
- Quick and easy
- Works immediately
- Can use most of your branded HTML

**Future**: Implement Option 2 (Custom SMTP)
- Full control over email design
- Use SendGrid for both Supabase and custom emails
- Consistent branding

## Testing

After customizing the Supabase template:

1. Go to `/forgot-password`
2. Enter email
3. Check inbox - you'll see your customized email
4. Click reset link
5. Form appears and works correctly
6. After reset, receive branded confirmation email

