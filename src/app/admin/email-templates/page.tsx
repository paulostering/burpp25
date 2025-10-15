import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmailTemplatesList } from '@/components/admin/email-templates-list'
import { createAdminSupabase } from '@/lib/supabase/server'

async function getEmailTemplates() {
  const supabase = createAdminSupabase()
  
  const { data: templates, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('event_label', { ascending: true })
  
  if (error) {
    console.error('Error fetching email templates:', error)
    return []
  }
  
  return templates || []
}

export default async function EmailTemplatesPage() {
  const templates = await getEmailTemplates()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
        <p className="text-gray-600 mt-1">
          Manage and customize email notifications sent by the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailTemplatesList templates={templates} />
        </CardContent>
      </Card>
    </div>
  )
}

