import { createAdminSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EmailTemplateEditor } from '@/components/admin/email-template-editor'

async function getEmailTemplate(id: string) {
  const supabase = createAdminSupabase()
  
  const { data: template, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !template) {
    return null
  }
  
  return template
}

interface EmailTemplatePageProps {
  params: Promise<{ id: string }>
}

export default async function EmailTemplatePage({ params }: EmailTemplatePageProps) {
  const { id } = await params
  const template = await getEmailTemplate(id)
  
  if (!template) {
    notFound()
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Email Template</h1>
        <p className="text-gray-600 mt-1">
          Customize the {template.event_label} email template
        </p>
      </div>

      <EmailTemplateEditor template={template} />
    </div>
  )
}

