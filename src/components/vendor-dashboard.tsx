'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  MessageSquare, 
  Star, 
  Users, 
  Edit, 
  Phone, 
  MapPin, 
  Clock,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import type { VendorProfile } from '@/types/db'
import { VendorProductsManager } from '@/components/vendor-products-manager'

interface VendorDashboardProps {
  vendor: VendorProfile
  stats: {
    conversations: number
    messages: number
    reviews: number
  }
}

interface RecentMessage {
  id: string
  content: string
  created_at: string
  client_name: string
  client_email: string
}

interface RecentReview {
  id: string
  rating: number
  comment: string
  created_at: string
  client_name: string
}

interface MessageWithConversation {
  id: string
  content: string
  created_at: string
  conversations: {
    client_name: string
    client_email: string
  }
}

export function VendorDashboard({ vendor, stats }: VendorDashboardProps) {
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([])
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentData = async () => {
      const supabase = createClient()
      
      // Fetch recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          conversations!inner(
            client_name,
            client_email
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (messages) {
        setRecentMessages((messages as unknown as MessageWithConversation[]).map(msg => ({
          id: msg.id,
          content: msg.content,
          created_at: msg.created_at,
          client_name: msg.conversations.client_name,
          client_email: msg.conversations.client_email
        })))
      }

      // Fetch recent reviews
      const { data: reviews } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          client_name,
          approved
        `)
        .eq('vendor_id', vendor.id)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(3)

      if (reviews) {
        setRecentReviews(reviews)
      }

      setLoading(false)
    }

    fetchRecentData()
  }, [vendor.id])

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getServiceTypes = () => {
    const types = []
    if (vendor.offers_virtual_services) types.push('Virtual')
    if (vendor.offers_in_person_services) types.push('In Person')
    return types
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={vendor.profile_photo_url || ''} />
                <AvatarFallback className="text-lg">
                  {getInitials(vendor.business_name || 'Vendor')}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {vendor.business_name}
                </h1>
                <p className="text-gray-600">{vendor.profile_title}</p>
                <div className="flex items-center space-x-2 mt-2">
                  {getServiceTypes().map(type => (
                    <Badge key={type} variant="secondary" className="bg-primary text-white">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" asChild>
                <Link href={`/vendor/${vendor.id}`}>
                  <Edit className="h-4 w-4 mr-2" />
                  View Public Profile
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversations}</div>
              <p className="text-xs text-muted-foreground">
                Active client conversations
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Messages</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.messages}</div>
              <p className="text-xs text-muted-foreground">
                Total messages sent
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviews}</div>
              <p className="text-xs text-muted-foreground">
                Customer reviews received
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>
                Latest messages from your clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentMessages.length > 0 ? (
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="border-l-4 border-primary pl-4 py-2">
                      <p className="text-sm text-gray-900 line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {message.client_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No messages yet</p>
                  <p className="text-sm">Messages from clients will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>
                Latest customer feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : recentReviews.length > 0 ? (
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {review.comment}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        - {review.client_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No reviews yet</p>
                  <p className="text-sm">Customer reviews will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Products & Services */}
        <div className="mt-8">
          <VendorProductsManager vendorId={vendor.id} />
        </div>

        {/* Business Info */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Service Area</p>
                      <p className="text-sm text-gray-600">
                        {vendor.zip_code ? (
                          <>Within {vendor.service_radius || 25} miles of {vendor.zip_code}</>
                        ) : (
                          'Virtual services only'
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {vendor.hourly_rate && (
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Hourly Rate</p>
                        <p className="text-sm text-gray-600">${vendor.hourly_rate}/hour</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {vendor.phone_number && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-gray-600">{vendor.phone_number}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Member Since</p>
                      <p className="text-sm text-gray-600">
                        {formatDate(vendor.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {vendor.about && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2">About</p>
                  <p className="text-sm text-gray-600">{vendor.about}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}



