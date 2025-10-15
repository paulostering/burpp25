import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientsDataTable } from '@/components/admin/clients-data-table'
import { createAdminSupabase } from '@/lib/supabase/server'

async function getClients() {
  const supabase = createAdminSupabase()
  
  // Get all auth users and their profiles (if they exist)
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error fetching auth users:', authError)
    return { clients: [] }
  }
  
  // Get all user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
  
  if (profilesError) {
    console.error('Error fetching user profiles:', profilesError)
    return { clients: [] }
  }
  
  // Create a map of profiles by user ID
  const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])
  
  // Filter and transform users to show only customers
  const clients = authUsers.users
    .map(user => {
      const profile = profilesMap.get(user.id)
      
      // If user has a profile, use the profile data
      if (profile) {
        return profile
      }
      
      // If no profile exists, create a virtual profile for display
      // (users without profiles are considered customers by default)
      return {
        id: user.id,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        role: 'customer' as const,
        is_active: true,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })
    .filter(client => 
      // Only show customers (either explicit role or no profile)
      client.role === 'customer'
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return { clients }
}

export default async function AdminClientsPage() {
  const { clients } = await getClients()

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


