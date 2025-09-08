import { createClient } from '@/lib/supabase/server'
import { validatePageParams, calculatePagination } from '@/lib/admin'
import { ClientsDataTable } from './clients-data-table'
import type { ClientWithProfile } from '@/types/db'

interface ClientsTableProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

async function getClients(page: number, perPage: number, search?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('user_profiles')
    .select('*', { count: 'exact' })
    .eq('role', 'customer')
  
  // Add search filter
  if (search) {
    query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
  }
  
  // Calculate offset for pagination
  const { offset, limit } = calculatePagination(page, 0, perPage)
  
  // Apply pagination
  query = query
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false })
  
  const { data, error, count } = await query
  
  if (error) {
    console.error('Error fetching clients:', error)
    return { clients: [], total: 0 }
  }
  
  // Get additional stats for each client
  const clientsWithStats = await Promise.all((data || []).map(async (client) => {
    // Get favorites count
    const { count: favoritesCount } = await supabase
      .from('user_vendor_favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', client.id)
    
    // Get reviews count
    const { count: reviewsCount } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', client.id)
    
    // Get last activity from conversations or reviews
    const { data: lastActivity } = await supabase
      .from('conversations')
      .select('last_message_at')
      .or(`customer_id.eq.${client.id},vendor_id.eq.${client.id}`)
      .order('last_message_at', { ascending: false })
      .limit(1)
    
    return {
      ...client,
      total_favorites: favoritesCount || 0,
      total_reviews: reviewsCount || 0,
      last_activity: lastActivity?.[0]?.last_message_at || client.created_at
    } as ClientWithProfile
  }))
  
  return {
    clients: clientsWithStats,
    total: count || 0
  }
}

export async function ClientsTable({ searchParams }: ClientsTableProps) {
  const searchParamsObj = new URLSearchParams()
  Object.entries(searchParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      searchParamsObj.set(key, value)
    }
  })
  
  const { page, perPage } = validatePageParams(searchParamsObj)
  const search = searchParamsObj.get('search') || undefined
  
  const { clients, total } = await getClients(page, perPage, search)
  const pagination = calculatePagination(page, total, perPage)
  
  return (
    <ClientsDataTable 
      clients={clients}
      pagination={pagination}
      currentSearch={search}
    />
  )
}







