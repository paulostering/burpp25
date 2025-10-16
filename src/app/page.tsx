import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase/server'

export default async function RootPage() {
  // Check if user is logged in
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check user role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    
    // Check if user is admin
    const isAdmin = (profile?.role === 'administrator' && profile?.is_active) ||
                   user.user_metadata?.role === 'administrator'
    
    if (isAdmin) {
      redirect('/admin')
    } else {
      redirect('/home')
    }
  } else {
    // Not logged in, go to home page
    redirect('/home')
  }
}
