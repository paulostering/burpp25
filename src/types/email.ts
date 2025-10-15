export interface EmailTemplate {
  id: string
  event_name: string
  event_label: string
  event_description: string | null
  from_email: string
  from_name: string
  subject: string
  body_html: string
  body_text: string | null
  is_active: boolean
  variables: Array<{
    name: string
    label: string
    description: string
  }> | unknown
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface EmailTemplateVariable {
  name: string
  label: string
  description: string
}

