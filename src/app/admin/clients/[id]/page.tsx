import { createAdminSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AdminClientManager } from '@/components/admin/admin-client-manager'

async function getClient(userId: string) {
  const supabase = createAdminSupabase()
  
  // Get auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId)
  
  if (authError || !authUser.user) {
    console.error('Error fetching auth user:', authError)
    return null
  }
  
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (profileError && profileError.code !== 'PGRST116') {
    console.error('Error fetching user profile:', profileError)
  }
  
  // Return profile if exists, otherwise create virtual profile
  if (profile) {
    return profile
  }
  
  return {
    id: authUser.user.id,
    email: authUser.user.email || '',
    first_name: authUser.user.user_metadata?.first_name || null,
    last_name: authUser.user.user_metadata?.last_name || null,
    role: 'customer' as const,
    is_active: true,
    created_at: authUser.user.created_at,
    updated_at: authUser.user.updated_at
  }
}

async function getClientStats(userId: string) {
  const supabase = createAdminSupabase()
  
  // Get conversation count
  const { count: conversationsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', userId)
  
  // Get messages count
  const { count: messagesCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('sender_id', userId)
  
  // Get favorites count
  const { count: favoritesCount } = await supabase
    .from('user_vendor_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  
  return {
    conversations: conversationsCount || 0,
    messages: messagesCount || 0,
    favorites: favoritesCount || 0,
  }
}

interface AdminClientPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminClientPage({ params }: AdminClientPageProps) {
  const { id } = await params
  const client = await getClient(id)
  
  if (!client) {
    notFound()
  }
  
  const stats = await getClientStats(id)
  
  return (
    <div className="space-y-6">
      <AdminClientManager 
        client={client}
        stats={stats}
      />
    </div>
  )
}

