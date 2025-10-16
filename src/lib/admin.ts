import { createServerSupabase } from '@/lib/supabase/server'
import { createClient as createClientClient } from '@/lib/supabase/client'
import type { AdminActivityLog } from '@/types/db'
import type { User } from '@supabase/supabase-js'

// Server-side admin utilities
export async function getServerUser() {
  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  return { data, error }
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const { data } = await getUserProfile(userId)
  return data?.role === 'administrator' && data?.is_active === true
}

export async function requireAdmin() {
  const { user } = await getServerUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  const isAdmin = await isUserAdmin(user.id)
  if (!isAdmin) {
    throw new Error('Administrator access required')
  }
  
  return user
}

// Client-side admin utilities
export function useAdminCheck() {
  const supabase = createClientClient()
  
  const checkAdminStatus = async (): Promise<{ isAdmin: boolean; user: User | null }> => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { isAdmin: false, user: null }
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()
    
    const isAdmin = profile?.role === 'administrator' && profile?.is_active === true
    return { isAdmin, user }
  }
  
  return { checkAdminStatus }
}

// Activity logging
export async function logAdminActivity(
  adminId: string,
  action: string,
  tableName: string,
  recordId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>
) {
  const supabase = await createServerSupabase()
  
  const logEntry: Omit<AdminActivityLog, 'id' | 'created_at'> = {
    admin_id: adminId,
    action,
    table_name: tableName,
    record_id: recordId || null,
    old_values: oldValues || null,
    new_values: newValues || null,
    ip_address: null, // Could be populated from headers
    user_agent: null   // Could be populated from headers
  }
  
  const { error } = await supabase
    .from('admin_activity_log')
    .insert([logEntry])
  
  if (error) {
    console.error('Failed to log admin activity:', error)
  }
}

// Pagination helpers
export const DEFAULT_PAGE_SIZE = 10

export function calculatePagination(page: number, total: number, perPage: number = DEFAULT_PAGE_SIZE) {
  const totalPages = Math.ceil(total / perPage)
  const offset = (page - 1) * perPage
  
  return {
    page,
    per_page: perPage,
    total,
    total_pages: totalPages,
    offset,
    limit: perPage
  }
}

export function validatePageParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get('per_page') || String(DEFAULT_PAGE_SIZE), 10)))
  
  return { page, perPage }
}


