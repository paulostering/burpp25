'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Star, Heart, Share, MessageCircle, Phone, MapPin, CheckCircle, Globe } from 'lucide-react'
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
import { LoginForm } from '@/components/login-form'
import { ServiceAreaMap } from '@/components/service-area-map'
import { SignupForm } from '@/components/signup-form'
import { createOrGetConversation } from '@/lib/messaging'
import { useRouter } from 'next/navigation'

interface VendorProfileProps {
  vendor: VendorProfile
  categories: Array<{ id: string; name: string; icon_url?: string | null }>
}

interface ReviewWithUser extends Review {
  user?: {
    first_name?: string | null
    last_name?: string | null
  }
}

export function VendorProfile({ vendor, categories }: VendorProfileProps) {
  const [user, setUser] = useState<any>(null)
  const [isFavorited, setIsFavorited] = useState(false)
  const [reviews, setReviews] = useState<ReviewWithUser[]>([])
  const [averageRating, setAverageRating] = useState(0)
  const [totalReviews, setTotalReviews] = useState(0)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup')
  const [locationName, setLocationName] = useState<string>('')

  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  // Get vendor categories with full objects
  const vendorCategories = vendor.service_categories?.map(catId => 
    categories.find(cat => cat.id === catId)
  ).filter(Boolean) || []

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Check if vendor is favorited
        const { data } = await supabase
          .from('user_vendor_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('vendor_id', vendor.id)
          .single()
        
        setIsFavorited(!!data)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (event === 'SIGNED_IN') {
        setShowAuthModal(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, vendor.id])

  useEffect(() => {
    const getLocationName = async () => {
      if (!vendor.zip_code || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return
      
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(vendor.zip_code)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=postcode`
        )
        const data = await response.json()
        
        if (data.features && data.features.length > 0) {
          const place = data.features[0]
          const placeName = place.place_name || ''
          console.log('Mapbox place_name:', placeName) // Debug log
          
          // Parse the place name to extract components
          const parts = placeName.split(', ')
          console.log('Parsed parts:', parts) // Debug log
          
          let city = ''
          let state = ''
          
          // Different parsing strategies based on response format
          if (parts.length >= 3) {
            // Find the city (usually the first non-postal code part)
            for (let i = 1; i < parts.length - 1; i++) {
              if (!/^\d+$/.test(parts[i])) { // Not just numbers
                city = parts[i]
                break
              }
            }
            
            // Find the state (usually second to last, before country)
            if (parts.length >= 3) {
              state = parts[parts.length - 2] // Second to last part
            }
          }
          
          // Fallback: try context array for more structured data
          if (!city && place.context) {
            const cityContext = place.context.find((c: any) => c.id?.startsWith('place.'))
            const stateContext = place.context.find((c: any) => c.id?.startsWith('region.'))
            
            city = cityContext?.text || ''
            state = stateContext?.text || ''
          }
          
          if (city && state) {
            setLocationName(`${city}, ${state} ${vendor.zip_code}`)
          } else if (state) {
            setLocationName(`${state} ${vendor.zip_code}`)
          } else {
            setLocationName(vendor.zip_code || '')
          }
        }
      } catch (error) {
        console.error('Error geocoding zip code:', error)
      }
    }

    getLocationName()
  }, [vendor.zip_code])

  useEffect(() => {
    const loadReviews = async () => {
      setIsLoadingReviews(true)
      console.log('Loading reviews for vendor ID:', vendor.id)
      
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
      
      console.log('Reviews table exists, proceeding with query...')
      
      // First, let's try a simple query without the user join
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('vendor_id', vendor.id)
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

  const handleFavorite = async () => {
    if (!user) {
      setAuthMode('signup')
      setShowAuthModal(true)
      return
    }

    try {
      if (isFavorited) {
        await supabase
          .from('user_vendor_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('vendor_id', vendor.id)
        
        setIsFavorited(false)
        toast.success('Removed from favorites')
      } else {
        await supabase
          .from('user_vendor_favorites')
          .insert({
            user_id: user.id,
            vendor_id: vendor.id
          })
        
        setIsFavorited(true)
        toast.success('Added to favorites')
      }
    } catch (error) {
      toast.error('Something went wrong')
    }
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
      setShowAuthModal(true)
      return
    }

    setIsSubmittingReview(true)

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          vendor_id: vendor.id,
          rating: reviewRating,
          title: reviewTitle || null,
          comment: reviewComment || null
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already reviewed this vendor')
        } else {
          toast.error('Failed to submit review')
        }
        return
      }

      toast.success('Review submitted successfully!')
      setReviewRating(5)
      setReviewTitle('')
      setReviewComment('')
      
      // Reload reviews
      const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          user:user_id (
            first_name,
            last_name
          )
        `)
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false })

      if (data) {
        setReviews(data)
        const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length
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
    const first = firstName?.charAt(0)?.toUpperCase() || ''
    const last = lastName?.charAt(0)?.toUpperCase() || ''
    return `${first}${last}` || '??'
  }



  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
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
                  <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
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
                      size="icon" 
                      className="h-10 w-10"
                      onClick={async () => {
                        if (!user) {
                          setAuthMode('signup')
                          setShowAuthModal(true)
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
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                    {vendor.allow_phone_contact && (
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-10 w-10"
                        onClick={() => {
                          if (!user) {
                            setAuthMode('signup')
                            setShowAuthModal(true)
                            return
                          }
                          // TODO: Implement calling functionality
                          toast.info('Calling feature coming soon!')
                        }}
                      >
                        <Phone className="h-5 w-5" />
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
                <div className="flex gap-2">
                  {vendor.offers_in_person_services && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      In Person
                    </Badge>
                  )}
                  {vendor.offers_virtual_services && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Virtual
                    </Badge>
                  )}
                </div>
              {/* Location */}
                <p className="text-gray-700 mb-4">
                  I service all areas within {vendor.service_radius || 0} miles of {locationName || vendor.zip_code || 'Unknown location'}.
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
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      {category.name}
                    </Badge>
                  )
                ))}
              </div>
            </div>

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
                  <p className="text-gray-500 text-center py-8">No reviews yet.</p>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
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
                      setShowAuthModal(true)
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

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Join the Burpp Community
            </DialogTitle>
            <DialogDescription>
              Create an account to message vendors and manage your service requests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {authMode === 'login' ? <LoginForm /> : <SignupForm />}
            
            <div className="text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-sm text-blue-600 hover:underline"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Login'
                }
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
