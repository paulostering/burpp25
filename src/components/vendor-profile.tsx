'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Heart, Share, MessageCircle, Phone, MapPin, CheckCircle, Globe, Send, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import type { VendorProfile, Review } from '@/types/db'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { ServiceAreaMap } from '@/components/service-area-map'
import { VendorAuthForm } from '@/components/vendor-auth-form'
import { createOrGetConversation } from '@/lib/messaging'
import { useRouter } from 'next/navigation'
import { VendorProductsDisplay } from '@/components/vendor-products-display'

interface VendorProfileProps {
  vendor: VendorProfile
  categories: Array<{ id: string; name: string; icon_url?: string | null }>
}

interface ReviewWithUser extends Review {
  user?: {
    first_name?: string | null
    last_name?: string | null
    profile_photo_url?: string | null
  }
}

export function VendorProfile({ vendor, categories }: VendorProfileProps) {
  const [user, setUser] = useState<any>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [reviews, setReviews] = useState<ReviewWithUser[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalStep, setModalStep] = useState<'auth' | 'message'>('auth')
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [modalTrigger, setModalTrigger] = useState<'message' | 'phone' | 'favorite' | 'other'>('message')

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  // Generate service area message based on vendor's service types
  const getServiceAreaMessage = () => {
    const hasVirtual = vendor.offers_virtual_services
    const hasPhysical = vendor.service_radius && vendor.service_radius > 0
    const zipCode = vendor.zip_code || 'my location'
    const radius = vendor.service_radius || 100

    if (hasVirtual && hasPhysical) {
      return `I offer virtual services worldwide and can travel up to ${radius} miles from ZIP code ${zipCode} for in-person sessions. Have questions? Feel free to send me a message.`
    } else if (hasVirtual && !hasPhysical) {
      return "I work with clients all over the world through virtual sessions — send me a message to learn more!"
    } else if (!hasVirtual && hasPhysical) {
      return `I'll travel to within ${radius} miles of the zip code ${zipCode}. To book in a different location, you can message me.`
    } else {
      return `I service all areas within ${radius} miles of the zip code ${zipCode}.`
    }
  }

  // Get vendor categories with full objects
  const vendorCategories = vendor.service_categories?.map(catId => 
    categories.find(cat => cat.id === catId)
  ).filter(Boolean) || []

  // Step 1: After successful auth, handle based on trigger
  const handleAuthSuccess = async () => {
    setIsLoading(true)
    
    try {
      // If triggered by phone icon, just close modal and return to profile
      if (modalTrigger === 'phone') {
        handleModalClose()
        return
      }

      // If triggered by favorite button, perform the favorite action
      if (modalTrigger === 'favorite') {
        handleModalClose()
        // Perform the favorite action after successful auth
        setTimeout(() => {
          handleFavoriteAction()
        }, 100)
        return
      }

      // If triggered by review, just close modal and return to profile
      if (modalTrigger === 'other') {
        handleModalClose()
        return
      }

      // For message triggers, create conversation and go to step 2
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Authentication failed')
        return
      }

      const { data: conversation, error } = await createOrGetConversation(
        user.id,
        vendor.user_id || vendor.id
      )
      
      if (error || !conversation) {
        toast.error('Failed to start conversation')
        return
      }

      setConversationId(conversation.id)
      setModalStep('message')
    } catch (error) {
      toast.error('Failed to start conversation')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Send message and go to step 3 (redirect to inbox)
  const handleSendMessage = async () => {
    if (!message.trim() || !conversationId) return
    
    setIsLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim(),
          message_type: 'text',
          is_read: false
        })

      if (error) {
        toast.error('Failed to send message')
        return
      }

      // Step 3: Redirect to inbox
      router.push(`/messages?conversation=${conversationId}`)
      handleModalClose()
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setModalStep('auth')
    setConversationId(null)
    setMessage('')
    setModalTrigger('message') // Reset to default
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if vendor is favorited
        const { data, error } = await supabase
          .from('user_vendor_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('vendor_id', vendor.id)
          .single()
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error checking favorite status:', error)
        }
        
        setIsFavorited(!!data)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase, vendor.id])


  useEffect(() => {
    const loadReviews = async () => {
      setIsLoadingReviews(true)
      
      // Test if the reviews table exists
      const { data: tableTest, error: tableError } = await supabase
        .from('reviews')
        .select('count')
        .limit(1)
      
      if (tableError) {
        console.error('Reviews table does not exist or is not accessible:', tableError)
        setIsLoadingReviews(false)
        return
      }
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_id (
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq('vendor_id', vendor.id)
        .eq('approved', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading reviews:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          full_error: error
        })
        setIsLoadingReviews(false)
        return
      }

      setReviews(data || [])
      
      if (data && data.length > 0) {
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length
        setAverageRating(Math.round(avg * 10) / 10)
        setTotalReviews(data.length)
      }
      setIsLoadingReviews(false)
    }

    loadReviews()
  }, [supabase, vendor.id])

  // Separate function for the actual favorite action (used after auth)
  const handleFavoriteAction = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('user_vendor_favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('vendor_id', vendor.id)
        
        if (error) {
          console.error('Error removing favorite:', error)
          toast.error('Failed to remove from favorites')
          return
        }
        
        setIsFavorited(false)
        toast.success('Removed from favorites')
      } else {
        const { error } = await supabase
          .from('user_vendor_favorites')
          .insert({
            user_id: currentUser.id,
            vendor_id: vendor.id
          })
        
        if (error) {
          console.error('Error adding favorite:', error)
          if (error.code === '23505') {
            toast.error('Already in favorites')
            setIsFavorited(true)
          } else {
            toast.error('Failed to add to favorites')
          }
          return
        }
        
        setIsFavorited(true)
        toast.success('Added to favorites')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('Something went wrong')
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      setAuthMode('signup')
      setModalTrigger('favorite')
      setShowModal(true)
      return
    }

    // If user is logged in, perform the action directly
    await handleFavoriteAction()
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      await navigator.share({
        title: vendor.business_name || 'Vendor Profile',
        url: url
      })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Profile link copied to clipboard!')
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      setAuthMode('signup')
      setModalTrigger('other')
      setShowModal(true)
      return
    }

    setIsSubmittingReview(true)

    try {
      // First, moderate the review content using OpenAI
      const moderationResponse = await fetch('/api/moderate-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: reviewTitle,
          comment: reviewComment,
        }),
      })

      const moderationResult = await moderationResponse.json()

      if (!moderationResult.approved) {
        toast.error(moderationResult.reason || 'Review content does not meet our guidelines')
        setIsSubmittingReview(false)
        return
      }

      // If moderation passed, insert the review (with approved flag)
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          vendor_id: vendor.id,
          rating: reviewRating,
          title: reviewTitle || null,
          comment: reviewComment || null,
          approved: moderationResult.approved,
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this vendor')
        } else {
          toast.error('Failed to submit review')
        }
        return
      }

      toast.success('Review submitted successfully and is pending approval!')
      setReviewRating(5)
      setReviewTitle('')
      setReviewComment('')
      
      // Reload reviews (only approved)
      const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_id (
            first_name,
            last_name,
            profile_photo_url
          )
        `)
        .eq('vendor_id', vendor.id)
        .eq('approved', true)
        .order('created_at', { ascending: false })

      if (data) {
        setReviews(data)
        const avg = data.length > 0 ? data.reduce((sum, review) => sum + review.rating, 0) / data.length : 0
        setAverageRating(Math.round(avg * 10) / 10)
        setTotalReviews(data.length)
      }
    } catch (error) {
      toast.error('Failed to submit review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const renderStars = (rating: number, size: string = 'h-4 w-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
        }`}
      />
    ))
  }

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    // Try to get initials from first and last name
    if (firstName && lastName) {
      const firstInitial = firstName.trim().charAt(0).toUpperCase()
      const lastInitial = lastName.trim().charAt(0).toUpperCase()
      if (firstInitial && lastInitial) {
        return `${firstInitial}${lastInitial}`
      }
    }
    // Try to get initial from first name only
    if (firstName && firstName.trim()) {
      const trimmed = firstName.trim()
      return trimmed.charAt(0).toUpperCase() + trimmed.charAt(0).toUpperCase()
    }
    // Try to get initial from last name only
    if (lastName && lastName.trim()) {
      const trimmed = lastName.trim()
      return trimmed.charAt(0).toUpperCase() + trimmed.charAt(0).toUpperCase()
    }
    // Last resort: return single letter
    return 'U'
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sticky on large screens */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto lg:pb-6">
            {/* Cover Photo with Profile Photo */}
            <div className="overflow-hidden">
              <div className="relative">
                {/* Cover Photo */}
                <div className="h-48 bg-gradient-to-r from-primary to-primary/60 relative rounded-lg">
                  {vendor.cover_photo_url ? (
                    <Image
                      src={vendor.cover_photo_url}
                      alt="Cover"
                      fill
                      className="object-cover rounded-lg"
                    />
                  ) : null}
                </div>
                
                {/* Profile Photo */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <Avatar 
                    className="h-24 w-24 border-4 border-white shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => vendor.profile_photo_url && setShowImageModal(true)}
                  >
                    <AvatarImage src={vendor.profile_photo_url || undefined} />
                    <AvatarFallback className="text-lg font-semibold">
                      {getInitials(vendor.first_name, vendor.last_name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              <div className="pt-16 pb-6 text-center space-y-4">
                {/* Business Name */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {vendor.business_name || 'Business Name'}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {vendor.profile_title || 'Professional Service Provider'}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="flex items-center gap-2"
                  >
                    <Share className="h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant={isFavorited ? "default" : "outline"}
                    size="sm"
                    onClick={handleFavorite}
                    className="flex items-center gap-2"
                  >
                    <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Service Rates & Contact */}
            <Card className="shadow-lg border-none">
              <CardContent className="px-4">
                <div className="flex items-center justify-between">
                  {/* Left: Starting Rates */}
                  <div>
                    <h3 className="font-semibold text-sm mb-0">Starting From</h3>
                    <div className="text-xl font-bold text-gray-900">
                      ${vendor.hourly_rate?.toFixed(2) || '0.00'} / hr
                    </div>
                  </div>

                  {/* Right: Contact Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      className="h-10"
                      onClick={async () => {
                        if (!user) {
                          setAuthMode('signup')
                          setModalTrigger('message')
                          setShowModal(true)
                          return
                        }
                        
                        try {
                          const { data: conversation, error } = await createOrGetConversation(
                            user.id,
                            vendor.user_id || vendor.id
                          )
                          
                          if (error || !conversation) {
                            toast.error('Failed to start conversation')
                            return
                          }
                          
                          router.push(`/messages?conversation=${conversation.id}`)
                        } catch (error) {
                          toast.error('Failed to start conversation')
                        }
                      }}
                    >
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Message
                    </Button>
                    {vendor.allow_phone_contact && (
                      <Button 
                        variant="outline" 
                        className="h-10"
                        onClick={() => {
                          if (!user) {
                            setAuthMode('signup')
                            setModalTrigger('phone')
                            setShowModal(true)
                            return
                          }
                          // Open tel link with vendor's phone number
                          if (vendor.phone_number) {
                            window.location.href = `tel:${vendor.phone_number}`
                          } else {
                            toast.error('Phone number not available')
                          }
                        }}
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-10">
            {/* About Me */}
            <div>
              <h3 className="font-semibold text-xl border-b border-gray-100 pb-4 mb-4">About Me</h3>
              <p className="text-gray-700 leading-relaxed">
                {vendor.about || 'No description provided.'}
              </p>
            </div>

            {/* Service Details */}
            <div className="space-y-4 mb-8">
              <h3 className="font-semibold text-xl border-b border-gray-100 pb-4">Where I provide my services</h3>

              {/* Service Offerings */}
              <div className="space-y-4">
              {/* Location */}
                <p className="text-gray-700 mb-4">
                  {getServiceAreaMessage()}
                </p>
                
                {/* Service Area Map */}
                {vendor.zip_code && vendor.service_radius && process.env.NEXT_PUBLIC_MAPBOX_TOKEN && (
                  <ServiceAreaMap 
                    address={vendor.zip_code}
                    serviceRadius={vendor.service_radius}
                    mapboxToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                  />
                )}

              </div>

            </div>

            {/* What type of services do I offer */}
            <div className="space-y-6">
              <h3 className="font-semibold text-xl border-b border-gray-100 pb-4">What type of services do I offer</h3>
              
              <div className="flex flex-wrap gap-3">
                {vendorCategories.map((category, index) => (
                  category && (
                    <Badge key={index} className="bg-primary text-white px-4 py-2 text-sm font-medium rounded-full flex items-center gap-2">
                      {category.icon_url && (
                        <img 
                          src={category.icon_url} 
                          alt={`${category.name} icon`}
                          className="h-4 w-4 object-contain filter brightness-0 invert"
                        />
                      )}
                      {category.name}
                    </Badge>
                  )
                ))}
              </div>
            </div>

            {/* Products & Services */}
            <VendorProductsDisplay vendorId={vendor.id} />

            {/* Reviews */}
            <div>
              <div className="mb-6">
                <h3 className="font-semibold text-xl border-b border-gray-100 pb-4 mb-4">Reviews</h3>
                {totalReviews > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {renderStars(Math.round(averageRating))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {averageRating} ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                {isLoadingReviews ? (
                  // Loading Skeletons
                  Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Skeleton className="h-4 w-24" />
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }, (_, j) => (
                                <Skeleton key={j} className="h-3 w-3" />
                              ))}
                            </div>
                          </div>
                          <Skeleton className="h-4 w-40 mb-1" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : reviews.length === 0 ? (
                  <div className="border border-gray-200 rounded-lg p-8 text-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-gray-500">Be the first to share your experience with this vendor!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={review.user?.profile_photo_url || ''} alt="Profile photo" />
                          <AvatarFallback>
                            {getInitials(review.user?.first_name, review.user?.last_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {review.user?.first_name} {review.user?.last_name}
                            </span>
                            <div className="flex">
                              {renderStars(review.rating)}
                            </div>
                          </div>
                          {review.title && (
                            <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                          )}
                          {review.comment && (
                            <p className="text-gray-700 mb-2">{review.comment}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Leave a Review Section */}
            <div className="shadow-none border-none">
              {!user ? (
                /* Not logged in - Show CTA */
                <div className="text-center space-y-4">
                  <h3 className="font-semibold text-lg">Share Your Experience</h3>
                  <p className="text-gray-600">
                    Your reviews help others in the community find the right services for their needs.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setAuthMode('signup')
                      setShowModal(true)
                    }}
                    className="w-full"
                  >
                    Sign Up or Login To Leave a Review
                  </Button>
                </div>
              ) : (
                /* Logged in - Show form */
                <>
                  <h3 className="font-semibold text-lg mb-4">Leave a Review</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Share your experience with {vendor.business_name}
                  </p>
                  
                  <div className="space-y-4">
                    {/* Rating */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Rating</label>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <button
                            key={i}
                            onClick={() => setReviewRating(i + 1)}
                            className="p-1"
                          >
                            <Star
                              className={`h-6 w-6 ${
                                i < reviewRating 
                                  ? 'fill-yellow-400 text-yellow-400' 
                                  : 'fill-gray-200 text-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Title (Optional)</label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={(e) => setReviewTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Great service!"
                      />
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">Review (Optional)</label>
                      <Textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Tell others about your experience..."
                        rows={4}
                      />
                    </div>

                    <Button 
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview}
                      className="w-full"
                    >
                      {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simple Step Modal */}
      <Dialog open={showModal} onOpenChange={handleModalClose}>
        <DialogContent>
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-bold text-center">
              {modalStep === 'auth' ? 'Join the Burpp Community' : `Send a message to ${vendor.business_name}`}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm text-balance text-center">
              {modalStep === 'auth' 
                ? 'Create an account to message vendors and manage your service requests.'
                : 'Ask questions or describe what you need. You don\'t need to include contact info yet.'
              }
            </DialogDescription>
          </DialogHeader>
          
          {modalStep === 'auth' ? (
            <VendorAuthForm 
              mode={authMode} 
              onModeChange={setAuthMode}
              onAuthSuccess={handleAuthSuccess}
            />
          ) : (
            <div className="space-y-4">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What services are you looking for? Include any details that might help the vendor understand your needs."
                disabled={isLoading}
                className="min-h-[120px] resize-none"
                rows={5}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Profile Image Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-3xl p-0 border-0 shadow-none">
          <DialogTitle className="sr-only">
            {vendor.business_name} Profile Photo
          </DialogTitle>
          <div className="relative w-full aspect-square">
            {vendor.profile_photo_url ? (
              <Image
                src={vendor.profile_photo_url}
                alt={`${vendor.business_name} profile photo`}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <div className="text-6xl font-semibold text-gray-400">
                  {getInitials(vendor.first_name, vendor.last_name)}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
