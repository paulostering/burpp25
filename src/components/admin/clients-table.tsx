import { createAdminSupabase } from '@/lib/supabase/server'
import { ClientsDataTable } from './clients-data-table'

export async function ClientsTable() {
  const supabase = createAdminSupabase()
  
  // Get all auth users and their profiles
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    console.error('Error fetching auth users:', authError)
    return <ClientsDataTable clients={[]} />
  }
  
  // Get all user profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
  
  if (profilesError) {
    console.error('Error fetching user profiles:', profilesError)
    return <ClientsDataTable clients={[]} />
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
    .filter(client => client.role === 'customer')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  
  return <ClientsDataTable clients={clients} />
}







