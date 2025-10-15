-- Create email_templates table
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL UNIQUE,
  event_label TEXT NOT NULL,
  event_description TEXT,
  from_email TEXT NOT NULL DEFAULT 'noreply@burpp.com',
  from_name TEXT NOT NULL DEFAULT 'Burpp',
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index on event_name for faster lookups
CREATE INDEX idx_email_templates_event_name ON email_templates(event_name);
CREATE INDEX idx_email_templates_is_active ON email_templates(is_active);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Insert default Welcome Email template
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
  'user_welcome',
  'Welcome Email',
  'Sent to new users when they sign up for the platform',
  'noreply@burpp.com',
  'Burpp Team',
  'Welcome to Burpp - Get Started Today!',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 40px 20px; border: 1px solid #e0e0e0; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Burpp!</h1>
    </div>
    <div class="content">
      <p>Hi {{firstName}},</p>
      <p>We''re excited to have you join Burpp! You''re now part of a community that connects customers with trusted service providers.</p>
      <p>Here''s what you can do next:</p>
      <ul>
        <li>Browse our service categories</li>
        <li>Find and connect with verified vendors</li>
        <li>Save your favorite service providers</li>
        <li>Message vendors directly</li>
      </ul>
      <center>
        <a href="{{dashboardUrl}}" class="button">Go to Dashboard</a>
      </center>
      <p>If you have any questions, feel free to reach out to our support team at support@burpp.com</p>
      <p>Best regards,<br>The Burpp Team</p>
    </div>
    <div class="footer">
      <p>© 2025 Burpp. All rights reserved.</p>
      <p>You received this email because you signed up for Burpp.</p>
    </div>
  </div>
</body>
</html>',
  'Hi {{firstName}},

We''re excited to have you join Burpp! You''re now part of a community that connects customers with trusted service providers.

Here''s what you can do next:
- Browse our service categories
- Find and connect with verified vendors
- Save your favorite service providers
- Message vendors directly

Visit your dashboard: {{dashboardUrl}}

If you have any questions, feel free to reach out to our support team at support@burpp.com

Best regards,
The Burpp Team

© 2025 Burpp. All rights reserved.
You received this email because you signed up for Burpp.',
  '[
    {"name": "firstName", "label": "First Name", "description": "User''s first name"},
    {"name": "lastName", "label": "Last Name", "description": "User''s last name"},
    {"name": "email", "label": "Email", "description": "User''s email address"},
    {"name": "dashboardUrl", "label": "Dashboard URL", "description": "Link to user dashboard"}
  ]'::jsonb
);

-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Only administrators can read email templates
CREATE POLICY "Administrators can read email templates"
  ON email_templates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'administrator'
    )
  );

-- Policy: Only administrators can insert email templates
CREATE POLICY "Administrators can insert email templates"
  ON email_templates
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'administrator'
    )
  );

-- Policy: Only administrators can update email templates
CREATE POLICY "Administrators can update email templates"
  ON email_templates
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'administrator'
    )
  );

-- Policy: Only administrators can delete email templates
CREATE POLICY "Administrators can delete email templates"
  ON email_templates
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'administrator'
    )
  );

