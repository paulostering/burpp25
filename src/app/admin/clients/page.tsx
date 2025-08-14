import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientsDataTable } from '@/components/admin/clients-data-table'
import { createServerSupabase } from '@/lib/supabase/server'

async function getClients() {
  const supabase = await createServerSupabase()
  
  const { data: clients, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching clients:', error)
    return []
  }
  
  return clients || []
}

export default async function AdminClientsPage() {
  const clients = await getClients()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Clients</h1>
        <p className="text-gray-600 mt-1">
          View and manage customer accounts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientsDataTable clients={clients} />
        </CardContent>
      </Card>
    </div>
  )
}


