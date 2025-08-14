export interface VendorProfile {
  id: string
  user_id?: string
  business_name?: string | null
  profile_title?: string | null
  about?: string | null
  profile_photo_url?: string | null
  cover_photo_url?: string | null
  offers_virtual_services?: boolean | null
  offers_in_person_services?: boolean | null
  hourly_rate?: number | null
  zip_code?: string | null
  service_radius?: number | null
  service_categories?: string[] | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone_number?: string | null
  allow_phone_contact?: boolean | null
  admin_approved?: boolean | null
  admin_notes?: string | null
  approved_at?: string | null
  approved_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string | null
  body: string
  created_at: string
}

export interface UserVendorFavorite {
  id: string
  user_id: string
  vendor_id: string
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  vendor_id: string
  rating: number
  title?: string | null
  comment?: string | null
  created_at: string
  updated_at: string
  user?: {
    first_name?: string | null
    last_name?: string | null
  }
}

export interface Conversation {
  id: string
  customer_id: string
  vendor_id: string
  last_message_at: string
  customer_unread_count: number
  vendor_unread_count: number
  created_at: string
  updated_at: string
  // Joined data
  customer_email?: string
  vendor_email?: string
  business_name?: string
  vendor_photo?: string
  last_message_content?: string
  last_message_time?: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'file'
  attachment_url?: string | null
  is_read: boolean
  created_at: string
  updated_at: string
}

// Admin and User Management Types
export type UserRole = 'customer' | 'vendor' | 'administrator'

export interface UserProfile {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  icon_url?: string | null
  is_active: boolean
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
}

export interface AdminActivityLog {
  id: string
  admin_id?: string | null
  action: string
  table_name: string
  record_id?: string | null
  old_values?: Record<string, any> | null
  new_values?: Record<string, any> | null
  ip_address?: string | null
  user_agent?: string | null
  created_at: string
}

// Admin Management Interfaces
export interface VendorWithProfile extends VendorProfile {
  user_profile?: UserProfile
  categories?: Category[]
  total_reviews?: number
  average_rating?: number
}

export interface ClientWithProfile extends UserProfile {
  total_favorites?: number
  total_reviews?: number
  last_activity?: string
}

// Pagination Interface
export interface PaginationMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}


