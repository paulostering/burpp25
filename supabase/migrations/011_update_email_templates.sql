-- Drop existing welcome email and recreate with better templates
DELETE FROM email_templates WHERE event_name = 'user_welcome';

-- Insert Welcome Email - Client
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
  'client_welcome',
  'Welcome Email - Client',
  'Sent to new clients when they sign up for the platform',
  'hello@burpp.com',
  'Burpp Team',
  'Welcome to Burpp, {{firstName}}!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Burpp</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f9fafb; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: #633B9A; padding: 40px 30px; text-align: center; }
    .logo { max-width: 100px; height: auto; }
    .content { padding: 40px 30px; color: #374151; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .features { margin: 30px 0; }
    .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
    .feature-item:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
    .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    h2 { color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 700; }
    p { line-height: 1.6; margin: 0 0 15px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="{{siteUrl}}/images/burpp_logo_white.webp" alt="Burpp" class="logo">
      <h1 style="margin-top: 20px;">Welcome to Burpp!</h1>
    </div>
    
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>We''re thrilled to have you join Burpp! You''re now part of a trusted community that connects people with verified service professionals.</p>
      
      <h2>What You Can Do on Burpp:</h2>
      
      <div class="features">
        <div class="feature-item">Browse hundreds of service categories</div>
        <div class="feature-item">Find and connect with verified vendors in your area</div>
        <div class="feature-item">Save your favorite service providers</div>
        <div class="feature-item">Message vendors directly through our platform</div>
        <div class="feature-item">Read reviews from other customers</div>
      </div>
      
      <center>
        <a href="{{dashboardUrl}}" class="button">Explore Services</a>
      </center>
      
      <p style="margin-top: 30px;">Need help getting started? Our support team is here to assist you at <a href="mailto:support@burpp.com" style="color: #667eea;">support@burpp.com</a></p>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>The Burpp Team</strong></p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">© 2025 Burpp. All rights reserved.</p>
      <p style="margin: 0;">You received this email because you signed up for Burpp.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

We''re thrilled to have you join Burpp! You''re now part of a trusted community that connects people with verified service professionals.

What You Can Do on Burpp:
✓ Browse hundreds of service categories
✓ Find and connect with verified vendors in your area
✓ Save your favorite service providers
✓ Message vendors directly through our platform
✓ Read reviews from other customers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 EXPLORE SERVICES: {{dashboardUrl}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Need help? Contact us at support@burpp.com

Best regards,
The Burpp Team

© 2025 Burpp. All rights reserved.',
  '[
    {"name": "firstName", "label": "First Name", "description": "User''s first name"},
    {"name": "lastName", "label": "Last Name", "description": "User''s last name"},
    {"name": "email", "label": "Email", "description": "User''s email address"},
    {"name": "dashboardUrl", "label": "Dashboard URL", "description": "Link to user dashboard"},
    {"name": "siteUrl", "label": "Site URL", "description": "Base URL of the website"}
  ]'::jsonb
);

-- Insert Welcome Email - Vendor
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
  'vendor_welcome',
  'Welcome Email - Vendor',
  'Sent to new vendors when they sign up and submit their profile',
  'hello@burpp.com',
  'Burpp Team',
  'Welcome to Burpp, {{businessName}}!',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Burpp</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f9fafb; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: #633B9A; padding: 40px 30px; text-align: center; }
    .logo { max-width: 100px; height: auto; }
    .content { padding: 40px 30px; color: #374151; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .alert-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .features { margin: 30px 0; }
    .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
    .feature-item:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
    .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    h2 { color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 700; }
    p { line-height: 1.6; margin: 0 0 15px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="{{siteUrl}}/images/burpp_logo_white.webp" alt="Burpp" class="logo">
      <h1 style="margin-top: 20px;">Welcome to Burpp!</h1>
    </div>
    
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>Thank you for joining Burpp as a service provider! We''re excited to help you grow your business and connect with customers.</p>
      
      <div class="alert-box">
        <p style="margin: 0; font-weight: 600; color: #92400e;">⏳ Your profile is currently under review</p>
        <p style="margin: 10px 0 0 0; color: #92400e;">Our team will review your profile and approve it within 24-48 hours. You''ll receive an email notification once approved.</p>
      </div>
      
      <h2>While You Wait:</h2>
      
      <div class="features">
        <div class="feature-item">Complete your vendor profile with photos and details</div>
        <div class="feature-item">Add your product offerings and services</div>
        <div class="feature-item">Set your service area and pricing</div>
        <div class="feature-item">Familiarize yourself with the dashboard</div>
      </div>
      
      <center>
        <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
      </center>
      
      <p style="margin-top: 30px;">Questions? We''re here to help at <a href="mailto:vendors@burpp.com" style="color: #667eea;">vendors@burpp.com</a></p>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>The Burpp Team</strong></p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">© 2025 Burpp. All rights reserved.</p>
      <p style="margin: 0;">You received this email because you registered as a vendor on Burpp.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

Thank you for joining Burpp as a service provider! We''re excited to help you grow your business and connect with customers.

⏳ YOUR PROFILE IS UNDER REVIEW
Our team will review your profile and approve it within 24-48 hours. You''ll receive an email notification once approved.

While You Wait:
✓ Complete your vendor profile with photos and details
✓ Add your product offerings and services
✓ Set your service area and pricing
✓ Familiarize yourself with the dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 GO TO DASHBOARD: {{dashboardUrl}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? Contact us at vendors@burpp.com

Best regards,
The Burpp Team

© 2025 Burpp. All rights reserved.',
  '[
    {"name": "firstName", "label": "First Name", "description": "Vendor contact first name"},
    {"name": "lastName", "label": "Last Name", "description": "Vendor contact last name"},
    {"name": "businessName", "label": "Business Name", "description": "Vendor business name"},
    {"name": "email", "label": "Email", "description": "Vendor email address"},
    {"name": "dashboardUrl", "label": "Dashboard URL", "description": "Link to vendor dashboard"}
  ]'::jsonb
);

-- Insert Message Received - Vendor
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
  'vendor_message_received',
  'Message Received - Vendor',
  'Sent to vendors when they receive a new message from a customer',
  'notifications@burpp.com',
  'Burpp Notifications',
  'New Message from {{clientName}}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f9fafb; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: #633B9A; padding: 40px 30px; text-align: center; }
    .logo { max-width: 100px; height: auto; }
    .content { padding: 40px 30px; color: #374151; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .message-box { background-color: #f3f4f6; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    h2 { color: #111827; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; }
    p { line-height: 1.6; margin: 0 0 15px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="{{siteUrl}}/images/burpp_logo_white.webp" alt="Burpp" class="logo">
    </div>
    
    <div class="content">
      <h2>💬 New Message from {{clientName}}</h2>
      
      <p>Hi {{firstName}},</p>
      
      <p>You have a new message from a potential customer!</p>
      
      <div class="message-box">
        <p style="margin: 0; font-style: italic; color: #4b5563;">"{{messagePreview}}"</p>
      </div>
      
      <p>Respond quickly to increase your chances of winning this job!</p>
      
      <center>
        <a href="{{messageUrl}}" class="button">View & Respond</a>
      </center>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <strong>Pro Tip:</strong> Vendors who respond within 1 hour get 3x more bookings!
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">© 2025 Burpp. All rights reserved.</p>
      <p style="margin: 0;">To manage your notification preferences, visit your <a href="{{settingsUrl}}" style="color: #667eea; text-decoration: none;">account settings</a>.</p>
    </div>
  </div>
</body>
</html>',
  'New Message from {{clientName}}

Hi {{firstName}},

You have a new message from a potential customer!

Message:
"{{messagePreview}}"

Respond quickly to increase your chances of winning this job!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 VIEW & RESPOND NOW: {{messageUrl}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Pro Tip: Vendors who respond within 1 hour get 3x more bookings!

---
© 2025 Burpp. All rights reserved.
Manage notification preferences: {{settingsUrl}}',
  '[
    {"name": "firstName", "label": "Vendor First Name", "description": "Vendor''s first name"},
    {"name": "businessName", "label": "Business Name", "description": "Vendor business name"},
    {"name": "clientName", "label": "Client Name", "description": "Name of customer who sent message"},
    {"name": "messagePreview", "label": "Message Preview", "description": "First 100 characters of message"},
    {"name": "messageUrl", "label": "Message URL", "description": "Link to view full message"},
    {"name": "settingsUrl", "label": "Settings URL", "description": "Link to notification settings"},
    {"name": "siteUrl", "label": "Site URL", "description": "Base URL of the website"}
  ]'::jsonb
);

-- Insert Password Reset Confirmation
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
  'password_reset_request',
  'Password Reset Confirmation',
  'Sent when a user requests to reset their password',
  'security@burpp.com',
  'Burpp Security',
  'Reset Your Burpp Password',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f9fafb; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: #633B9A; padding: 40px 30px; text-align: center; }
    .logo { max-width: 100px; height: auto; }
    .content { padding: 40px 30px; color: #374151; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .warning-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    h2 { color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 700; }
    p { line-height: 1.6; margin: 0 0 15px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="{{siteUrl}}/images/burpp_logo_white.webp" alt="Burpp" class="logo">
      <h1 style="margin-top: 20px;">Reset Your Password</h1>
    </div>
    
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <p>We received a request to reset the password for your Burpp account (<strong>{{email}}</strong>).</p>
      
      <p>Click the button below to reset your password. This link will expire in 1 hour for security reasons.</p>
      
      <center>
        <a href="{{resetUrl}}" class="button">Reset Password</a>
      </center>
      
      <div class="warning-box">
        <p style="margin: 0; font-weight: 600; color: #991b1b;">⚠️ Did you request this?</p>
        <p style="margin: 10px 0 0 0; color: #991b1b;">If you didn''t request a password reset, please ignore this email or contact our support team immediately if you believe your account has been compromised.</p>
      </div>
      
      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        For security, this link expires in 1 hour. If the link has expired, you can request a new password reset from the login page.
      </p>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>The Burpp Team</strong></p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">© 2025 Burpp. All rights reserved.</p>
      <p style="margin: 0;">This is an automated security email from Burpp.</p>
    </div>
  </div>
</body>
</html>',
  'Reset Your Burpp Password

Hi {{firstName}},

We received a request to reset the password for your Burpp account ({{email}}).

Click the link below to reset your password. This link will expire in 1 hour.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 RESET PASSWORD: {{resetUrl}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ SECURITY NOTICE
If you didn''t request a password reset, please ignore this email or contact support@burpp.com if you believe your account has been compromised.

Best regards,
The Burpp Team

© 2025 Burpp. All rights reserved.',
  '[
    {"name": "firstName", "label": "First Name", "description": "User''s first name"},
    {"name": "email", "label": "Email", "description": "User''s email address"},
    {"name": "resetUrl", "label": "Reset URL", "description": "Password reset link"},
    {"name": "siteUrl", "label": "Site URL", "description": "Base URL of the website"}
  ]'::jsonb
);

-- Insert Password Reset Confirmed
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
  'password_reset_confirmed',
  'Password Reset Confirmed',
  'Sent after a user successfully resets their password',
  'security@burpp.com',
  'Burpp Security',
  'Your Burpp Password Has Been Changed',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, ''Segoe UI'', Roboto, ''Helvetica Neue'', Arial, sans-serif; background-color: #f9fafb; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: #633B9A; padding: 40px 30px; text-align: center; }
    .logo { max-width: 100px; height: auto; }
    .content { padding: 40px 30px; color: #374151; }
    .button { display: inline-block; padding: 14px 32px; background: #667eea; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .success-box { background-color: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .warning-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { background-color: #f3f4f6; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; }
    h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; }
    h2 { color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 700; }
    p { line-height: 1.6; margin: 0 0 15px 0; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <img src="{{siteUrl}}/images/burpp_logo_white.webp" alt="Burpp" class="logo">
      <h1 style="margin-top: 20px;">Password Changed</h1>
    </div>
    
    <div class="content">
      <p>Hi {{firstName}},</p>
      
      <div class="success-box">
        <p style="margin: 0; font-weight: 600; color: #065f46;">✓ Password Successfully Changed</p>
        <p style="margin: 10px 0 0 0; color: #065f46;">Your Burpp account password was changed on {{resetDate}} at {{resetTime}}.</p>
      </div>
      
      <p>Your account is now secured with your new password. You can use it to log in to Burpp.</p>
      
      <center>
        <a href="{{loginUrl}}" class="button">Go to Login</a>
      </center>
      
      <div class="warning-box">
        <p style="margin: 0; font-weight: 600; color: #991b1b;">⚠️ Didn''t change your password?</p>
        <p style="margin: 10px 0 0 0; color: #991b1b;">If you didn''t make this change, please contact our security team immediately at <a href="mailto:security@burpp.com" style="color: #991b1b;">security@burpp.com</a> as your account may be compromised.</p>
      </div>
      
      <p style="margin-top: 30px;">Best regards,<br><strong>The Burpp Team</strong></p>
    </div>
    
    <div class="footer">
      <p style="margin: 0 0 10px 0;">© 2025 Burpp. All rights reserved.</p>
      <p style="margin: 0;">This is an automated security notification.</p>
    </div>
  </div>
</body>
</html>',
  'Password Successfully Changed

Hi {{firstName}},

✓ Your Burpp account password was changed on {{resetDate}} at {{resetTime}}.

Your account is now secured with your new password. You can use it to log in to Burpp.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👉 GO TO LOGIN: {{loginUrl}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ DIDN''T CHANGE YOUR PASSWORD?
If you didn''t make this change, please contact security@burpp.com immediately as your account may be compromised.

Best regards,
The Burpp Team

© 2025 Burpp. All rights reserved.',
  '[
    {"name": "firstName", "label": "First Name", "description": "User''s first name"},
    {"name": "email", "label": "Email", "description": "User''s email address"},
    {"name": "resetDate", "label": "Reset Date", "description": "Date password was changed"},
    {"name": "resetTime", "label": "Reset Time", "description": "Time password was changed"},
    {"name": "loginUrl", "label": "Login URL", "description": "Link to login page"},
    {"name": "siteUrl", "label": "Site URL", "description": "Base URL of the website"}
  ]'::jsonb
);

