-- Add admin notification email templates

-- Client registration notification
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
  'admin_client_registration',
  'Admin Client Registration Notification',
  'Sent to administrators when a new client registers',
  'notifications@burpp.com',
  'Burpp System',
  'New Registration - Client',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e0e0e0; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #667eea; font-weight: 600; }
    .table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; padding: 4px 12px; background: #667eea; color: white; border-radius: 4px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 New Client Registration</h1>
    </div>
    <div class="content">
      <p><span class="badge">CLIENT</span></p>
      <p>A new client has joined Burpp.</p>
      
      <table class="table">
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
        <tr>
          <td><strong>Name</strong></td>
          <td>{{firstName}} {{lastName}}</td>
        </tr>
        <tr>
          <td><strong>Email</strong></td>
          <td>{{email}}</td>
        </tr>
        <tr>
          <td><strong>Registration Date</strong></td>
          <td>{{registrationDate}}</td>
        </tr>
        <tr>
          <td><strong>User ID</strong></td>
          <td>{{userId}}</td>
        </tr>
      </table>
      
      <p>
        <a href="{{adminUrl}}" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View in Admin Panel</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Burpp Ventures LLC. All rights reserved.</p>
      <p>This is an automated notification from the Burpp system.</p>
    </div>
  </div>
</body>
</html>',
  'NEW CLIENT REGISTRATION

A client has joined Burpp.

Client Details:
- Name: {{firstName}} {{lastName}}
- Email: {{email}}
- Registration Date: {{registrationDate}}
- User ID: {{userId}}

View in Admin Panel: {{adminUrl}}

---
© 2026 Burpp Ventures LLC. All rights reserved.
This is an automated notification from the Burpp system.',
  '[
    {"name": "firstName", "label": "First Name", "description": "Client first name"},
    {"name": "lastName", "label": "Last Name", "description": "Client last name"},
    {"name": "email", "label": "Email", "description": "Client email address"},
    {"name": "registrationDate", "label": "Registration Date", "description": "Date and time of registration"},
    {"name": "userId", "label": "User ID", "description": "User ID in the system"},
    {"name": "adminUrl", "label": "Admin URL", "description": "Link to admin panel"}
  ]'::jsonb
);

-- Vendor registration notification
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
  'admin_vendor_registration',
  'Admin Vendor Registration Notification',
  'Sent to administrators when a new vendor registers',
  'notifications@burpp.com',
  'Burpp System',
  'New Registration - Vendor',
  '<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #ffffff; padding: 30px 20px; border: 1px solid #e0e0e0; }
    .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .table th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #667eea; font-weight: 600; }
    .table td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; padding: 4px 12px; background: #10b981; color: white; border-radius: 4px; font-size: 12px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 New Vendor Registration</h1>
    </div>
    <div class="content">
      <p><span class="badge">VENDOR</span></p>
      <p>A new vendor has joined Burpp.</p>
      
      <table class="table">
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
        <tr>
          <td><strong>Business Name</strong></td>
          <td>{{businessName}}</td>
        </tr>
        <tr>
          <td><strong>Contact Name</strong></td>
          <td>{{firstName}} {{lastName}}</td>
        </tr>
        <tr>
          <td><strong>Email</strong></td>
          <td>{{email}}</td>
        </tr>
        <tr>
          <td><strong>Phone</strong></td>
          <td>{{phone}}</td>
        </tr>
        <tr>
          <td><strong>Categories</strong></td>
          <td>{{categories}}</td>
        </tr>
        <tr>
          <td><strong>Location</strong></td>
          <td>{{location}}</td>
        </tr>
        <tr>
          <td><strong>Service Type</strong></td>
          <td>{{serviceType}}</td>
        </tr>
        <tr>
          <td><strong>Registration Date</strong></td>
          <td>{{registrationDate}}</td>
        </tr>
        <tr>
          <td><strong>User ID</strong></td>
          <td>{{userId}}</td>
        </tr>
      </table>
      
      <p>
        <a href="{{adminUrl}}" style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View in Admin Panel</a>
      </p>
    </div>
    <div class="footer">
      <p>© 2026 Burpp Ventures LLC. All rights reserved.</p>
      <p>This is an automated notification from the Burpp system.</p>
    </div>
  </div>
</body>
</html>',
  'NEW VENDOR REGISTRATION

A vendor has joined Burpp.

Vendor Details:
- Business Name: {{businessName}}
- Contact Name: {{firstName}} {{lastName}}
- Email: {{email}}
- Phone: {{phone}}
- Categories: {{categories}}
- Location: {{location}}
- Service Type: {{serviceType}}
- Registration Date: {{registrationDate}}
- User ID: {{userId}}

View in Admin Panel: {{adminUrl}}

---
© 2026 Burpp Ventures LLC. All rights reserved.
This is an automated notification from the Burpp system.',
  '[
    {"name": "businessName", "label": "Business Name", "description": "Vendor business name"},
    {"name": "firstName", "label": "First Name", "description": "Vendor contact first name"},
    {"name": "lastName", "label": "Last Name", "description": "Vendor contact last name"},
    {"name": "email", "label": "Email", "description": "Vendor email address"},
    {"name": "phone", "label": "Phone", "description": "Vendor phone number"},
    {"name": "categories", "label": "Categories", "description": "Service categories"},
    {"name": "location", "label": "Location", "description": "Business location"},
    {"name": "serviceType", "label": "Service Type", "description": "Virtual, In-person, or Both"},
    {"name": "registrationDate", "label": "Registration Date", "description": "Date and time of registration"},
    {"name": "userId", "label": "User ID", "description": "User ID in the system"},
    {"name": "adminUrl", "label": "Admin URL", "description": "Link to admin panel"}
  ]'::jsonb
);

