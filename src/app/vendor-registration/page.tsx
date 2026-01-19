'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { VendorProfile } from '@/types/db'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { MapPin, Loader2, Camera, Sparkles, RefreshCw, DollarSign, X, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Area } from 'react-easy-crop'
import { ImageCropModal } from '@/components/image-crop-modal'


const step1Schema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  service_categories: z.array(z.string().uuid()).min(1, 'Select at least one category'),
})

const step2Schema = z.object({
  profile_title: z.string().min(1, 'Profile title is required'),
  about: z
    .string()
    .min(1, 'About is required')
    .max(200, 'About must be 200 characters or fewer'),
})

const step3Schema = z.object({
  offers_virtual_services: z.boolean(),
  offers_in_person_services: z.boolean(),
  zip_code: z.string().optional(),
  service_radius: z.number().optional(),
  hourly_rate: z.number().min(1, 'Hourly rate must be at least $1.00').optional(),
}).refine(
  (v) => {
    if (!v.offers_in_person_services) return true
    return Boolean(v.zip_code && v.service_radius)
  },
  { message: 'Zip code and radius are required for in-person services' }
)

const step5Schema = z.object({
  first_name: z.string().min(1, 'Required').max(50, 'First name must be 50 characters or less'),
  last_name: z.string().min(1, 'Required').max(50, 'Last name must be 50 characters or less'),
  email: z.string().email('Invalid email').max(100, 'Email must be 100 characters or less'),
  phone_number: z.string().max(20, 'Phone number must be 20 characters or less').optional(),
  password: z.string().min(6, 'Min 6 characters').max(100, 'Password must be 100 characters or less'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
  allow_phone_contact: z.boolean().optional(),
  agree_to_terms: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // If allow_phone_contact is true, phone_number is required
  if (data.allow_phone_contact) {
    return data.phone_number && data.phone_number.length >= 7
  }
  return true
}, {
  message: "Phone number is required when allowing phone contact",
  path: ["phone_number"],
}).refine((data) => data.agree_to_terms === true, {
  message: "You must agree to the terms of service and privacy policy",
  path: ["agree_to_terms"],
})

type Category = { id: string; name: string }

export default function VendorRegisterPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step data
  const [categories, setCategories] = useState<Category[]>([])
  const [businessName, setBusinessName] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const [profileTitle, setProfileTitle] = useState('')
  const [about, setAbout] = useState('')
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)

  const [offersVirtual, setOffersVirtual] = useState<boolean>(true)
  const [offersInPerson] = useState<boolean>(true) // Always true
  const [zipCode, setZipCode] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([])
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false)
  const [radius, setRadius] = useState<number | undefined>(25)
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined)
  const [hourlyRateInput, setHourlyRateInput] = useState<string>('')
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Step 4 images (react-easy-crop)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null)
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [cropType, setCropType] = useState<'profile' | 'cover'>('profile')
  const [cropModalOpen, setCropModalOpen] = useState(false)

  // Step 4 products
  const [products, setProducts] = useState<Array<{
    title: string
    description: string
    starting_price: string
    imageFile: File | null
    imageUrl: string | null
    croppedImageBlob: Blob | null
  }>>([])
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)
  const [productCropModalOpen, setProductCropModalOpen] = useState(false)
  const [productImageToCrop, setProductImageToCrop] = useState<string>('')
  const [currentProductImageIndex, setCurrentProductImageIndex] = useState<number | null>(null)
  const [productErrors, setProductErrors] = useState<Record<number, { title?: string; description?: string }>>({})

  // Step 5 auth
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [allowPhoneContact, setAllowPhoneContact] = useState(true)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    supabase
      .from('categories')
      .select('id,name')
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }) => {
        if (error) return
        setCategories(data ?? [])
      })
  }, [supabase])

  // Check for prefill data from landing page
  useEffect(() => {
    try {
      const prefillData = localStorage.getItem('burpp_vendor_prefill')
      if (prefillData) {
        const parsed = JSON.parse(prefillData)
        if (parsed.businessName) {
          setBusinessName(parsed.businessName)
        }
        if (parsed.serviceCategories && Array.isArray(parsed.serviceCategories)) {
          setSelectedCategoryIds(parsed.serviceCategories)
        }
        // If startStep is 2, we've completed step 1 on the landing page
        if (parsed.startStep === 2) {
          setStep(2)
        }
        // Clear the prefill data after reading it
        localStorage.removeItem('burpp_vendor_prefill')
      }
    } catch {
      // ignore errors
    }
  }, [])

  // Close location dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('#location') && !target.closest('[data-location-dropdown]')) {
        setIsLocationDropdownOpen(false)
      }
    }

    if (isLocationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLocationDropdownOpen])

  const validateStep = () => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      const res = step1Schema.safeParse({ business_name: businessName, service_categories: selectedCategoryIds })
      if (!res.success) {
        res.error.issues.forEach(issue => {
          if (issue.path[0] === 'business_name') {
            newErrors.business_name = issue.message
          } else if (issue.path[0] === 'service_categories') {
            newErrors.service_categories = issue.message
          }
        })
      }
    }
    
    if (step === 2) {
      const res = step2Schema.safeParse({ profile_title: profileTitle, about })
      if (!res.success) {
        res.error.issues.forEach(issue => {
          if (issue.path[0] === 'profile_title') {
            newErrors.profile_title = issue.message
          } else if (issue.path[0] === 'about') {
            newErrors.about = issue.message
          }
        })
      }
    }
    
    if (step === 3) {
      // Validate service area (no hourly rate here anymore)
      const res = step3Schema.safeParse({
        offers_virtual_services: offersVirtual,
        offers_in_person_services: offersInPerson,
        zip_code: zipCode || undefined,
        service_radius: radius,
        hourly_rate: hourlyRate || 0, // Pass dummy value since it's optional in schema
      })
      if (!res.success) {
        res.error.issues.forEach(issue => {
          if (issue.path[0] === 'zip_code') {
            newErrors.zip_code = issue.message
          } else if (issue.path[0] === 'service_radius') {
            newErrors.service_radius = issue.message
          } else if (issue.path.length === 0) {
            // This is likely the refine validation
            newErrors.general = issue.message
          }
        })
      }
    }

    if (step === 4) {
      // Custom validation for hourly rate
      if (!hourlyRate || hourlyRate < 1) {
        if (!hourlyRate) {
          newErrors.hourly_rate = 'Please enter your starting hourly rate'
        } else if (hourlyRate < 1) {
          newErrors.hourly_rate = 'Hourly rate must be at least $1.00'
        }
      }
    }

    if (step === 5) {
      // Validate products - if any products exist, they must have title and description
      const newProductErrors: Record<number, { title?: string; description?: string }> = {}
      let hasProductErrors = false

      products.forEach((product, index) => {
        const productError: { title?: string; description?: string } = {}
        
        if (!product.title.trim()) {
          productError.title = 'Title is required'
          hasProductErrors = true
        }
        
        if (!product.description.trim()) {
          productError.description = 'Description is required'
          hasProductErrors = true
        }

        if (Object.keys(productError).length > 0) {
          newProductErrors[index] = productError
        }
      })

      if (hasProductErrors) {
        setProductErrors(newProductErrors)
        return false
      } else {
        setProductErrors({})
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const next = async () => {
    if (validateStep()) {
      setStep((s) => s + 1)
    }
  }

  const back = () => setStep((s) => Math.max(1, s - 1))

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleGenerateTitle = async () => {
    setIsGeneratingTitle(true)
    try {
      const selectedCategories = categories
        .filter(c => selectedCategoryIds.includes(c.id))
        .map(c => c.name)

      const response = await fetch('/api/generate-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'title',
          businessName,
          categories: selectedCategories,
          currentText: profileTitle || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate title')
      }

      setProfileTitle(data.text)
      clearError('profile_title')
    } catch (error) {
      console.error('Error generating title:', error)
      toast.error('Failed to generate title. Please try again.')
    } finally {
      setIsGeneratingTitle(false)
    }
  }

  const truncateWithWordBoundary = (text: string, limit: number) => {
    if (text.length <= limit) {
      return text.trim()
    }
    const truncated = text.slice(0, limit)
    const lastSpace = truncated.lastIndexOf(' ')
    return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()
  }

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true)
    try {
      const selectedCategories = categories
        .filter(c => selectedCategoryIds.includes(c.id))
        .map(c => c.name)

      const isRefinement = Boolean(about)
      const characterLimit = isRefinement ? 200 : 100

      const response = await fetch('/api/generate-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'description',
          businessName,
          categories: selectedCategories,
          currentText: about || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description')
      }

      setAbout(truncateWithWordBoundary(data.text, characterLimit))
      clearError('about')
    } catch (error) {
      console.error('Error generating description:', error)
      toast.error('Failed to generate description. Please try again.')
    } finally {
      setIsGeneratingDescription(false)
    }
  }

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password)
    }
    
    score += checks.length ? 1 : 0
    score += checks.lowercase ? 1 : 0
    score += checks.uppercase ? 1 : 0
    score += checks.numbers ? 1 : 0
    score += checks.symbols ? 1 : 0
    
    if (score <= 2) return { strength: 'weak', color: 'bg-red-500', text: 'Weak' }
    if (score <= 3) return { strength: 'medium', color: 'bg-yellow-500', text: 'Medium' }
    if (score <= 4) return { strength: 'strong', color: 'bg-blue-500', text: 'Strong' }
    return { strength: 'very-strong', color: 'bg-green-500', text: 'Very Strong' }
  }

  const passwordStrength = getPasswordStrength(password)

  const handleCategoryChange = (selected: string[]) => {
    clearError('service_categories')
    setSelectedCategoryIds(selected)
  }

  // Convert categories to MultiSelect options
  const categoryOptions: Option[] = useMemo(
    () =>
      categories.map((c) => ({
        label: c.name,
        value: c.id,
      })),
    [categories]
  )

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    clearError('hourly_rate')
    
    const value = e.target.value
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '')
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.')
    let sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue
    
    // Limit to 2 decimal places but allow typing
    if (sanitized.includes('.')) {
      const [whole, decimal] = sanitized.split('.')
      if (decimal && decimal.length > 2) {
        sanitized = whole + '.' + decimal.slice(0, 2)
      }
    }
    
    // Parse the numeric value
    const numValue = sanitized && sanitized !== '.' && sanitized !== '' ? parseFloat(sanitized) : undefined
    
    // Cap at 999
    if (numValue !== undefined && numValue > 999) {
      setHourlyRateInput('999')
      setHourlyRate(999)
      return
    }
    
    // Update the display value (preserves trailing decimal and zeros)
    setHourlyRateInput(sanitized)
    
    // Update the numeric value for validation/submission
    setHourlyRate(numValue)
  }

  const handleProductPriceChange = (index: number, value: string) => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '')
    
    // Prevent multiple decimal points
    const parts = numericValue.split('.')
    let sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : numericValue
    
    // Limit to 2 decimal places but allow typing
    if (sanitized.includes('.')) {
      const [whole, decimal] = sanitized.split('.')
      if (decimal && decimal.length > 2) {
        sanitized = whole + '.' + decimal.slice(0, 2)
      }
    }
    
    // Parse the numeric value
    const numValue = sanitized && sanitized !== '.' && sanitized !== '' ? parseFloat(sanitized) : undefined
    
    // Cap at 10,000
    if (numValue !== undefined && numValue > 10000) {
      sanitized = '10000'
    }
    
    // Update the product price
    const updated = [...products]
    updated[index].starting_price = sanitized
    setProducts(updated)
  }

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser')
      return
    }

    setIsGettingLocation(true)
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords
      
      // Use Mapbox geocoding API to get zip code from coordinates
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=postcode,place&limit=1`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data')
      }
      
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const placeName = feature.place_name || feature.text
        setLocationQuery(placeName)
        setZipCode(feature.text || feature.properties?.postcode || '')
      } else {
        throw new Error('No location data found')
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location permissions or enter your location manually.')
            break
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable. Please enter your location manually.')
            break
          case error.TIMEOUT:
            toast.error('Location request timed out. Please enter your location manually.')
            break
          default:
            toast.error('Unable to detect your location. Please enter your location manually.')
        }
      } else {
        toast.error('Unable to detect your location. Please enter your location manually.')
      }
    } finally {
      setIsGettingLocation(false)
    }
  }

  const searchLocations = async (query: string) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=place,locality,neighborhood,postcode&country=us&limit=5`
      )
      const data = await response.json()
      setLocationSuggestions(data.features || [])
    } catch (error) {
      console.error('Error searching locations:', error)
      setLocationSuggestions([])
    }
  }

  const handleLocationSelect = async (feature: any) => {
    const placeName = feature.place_name
    const [lng, lat] = feature.center
    
    // Extract zip code from the feature
    let zipCodeValue = ''
    if (feature.place_type.includes('postcode')) {
      zipCodeValue = feature.text
    } else {
      // Try to extract zip code from context
      const postcodeContext = feature.context?.find((c: any) => c.id.startsWith('postcode'))
      if (postcodeContext) {
        zipCodeValue = postcodeContext.text
      }
    }
    
    setLocationQuery(placeName)
    setZipCode(zipCodeValue || feature.text)
    setLocationSuggestions([])
    setIsLocationDropdownOpen(false)
  }

  const validateImage = (file: File): string | null => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    if (!validTypes.includes(file.type.toLowerCase())) {
      return 'Please upload a valid image file (JPEG, PNG, WebP, or HEIC)'
    }

    // Check file size (max 15MB to handle high-res iPhone photos)
    const maxSize = 15 * 1024 * 1024 // 15MB
    if (file.size > maxSize) {
      return 'Image size must be less than 15MB'
    }

    return null
  }

  const onPhotoSelected = (file: File | null, type: 'profile' | 'cover') => {
    if (!file) return

    // Validate image
    const validationError = validateImage(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    // Show loading state
    toast.loading('Preparing image...')

    // Set the appropriate state based on type
    if (type === 'profile') {
      setProfilePhotoFile(file)
      setCroppedAreaPixels(null)
      if (profilePhotoUrl) URL.revokeObjectURL(profilePhotoUrl)
      const url = URL.createObjectURL(file)
      setProfilePhotoUrl(url)
    } else {
      setCoverPhotoFile(file)
      setCroppedAreaPixels(null)
      if (coverPhotoUrl) URL.revokeObjectURL(coverPhotoUrl)
      const url = URL.createObjectURL(file)
      setCoverPhotoUrl(url)
    }
    
    setCropType(type)
    
    // Use setTimeout to ensure state is set before opening modal
    setTimeout(() => {
      setCropModalOpen(true)
      toast.dismiss()
    }, 100)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Create preview URL from cropped blob
    const previewUrl = URL.createObjectURL(croppedBlob)
    
    // Store the cropped blob for later upload during submission
    if (cropType === 'profile') {
      const file = new File([croppedBlob], 'profile.jpg', { type: 'image/jpeg' })
      
      // Use setTimeout to ensure state updates happen after modal closes
      setTimeout(() => {
        setProfilePhotoFile(file)
        setProfilePhotoUrl(previewUrl)
      }, 100)
    } else {
      const file = new File([croppedBlob], 'cover.jpg', { type: 'image/jpeg' })
      
      setTimeout(() => {
        setCoverPhotoFile(file)
        setCoverPhotoUrl(previewUrl)
      }, 100)
    }
    setCropModalOpen(false)
  }

  const handleCropCancel = () => {
    // Reset the appropriate photo state
    if (cropType === 'profile') {
      setProfilePhotoFile(null)
      setProfilePhotoUrl(null)
    } else {
      setCoverPhotoFile(null)
      setCoverPhotoUrl(null)
    }
    setCropModalOpen(false)
  }

  const handleProductCropComplete = async (croppedBlob: Blob) => {
    if (currentProductImageIndex === null) return

    const previewUrl = URL.createObjectURL(croppedBlob)
    const updated = [...products]
    updated[currentProductImageIndex].croppedImageBlob = croppedBlob
    updated[currentProductImageIndex].imageUrl = previewUrl
    setProducts(updated)
    setProductCropModalOpen(false)
    setCurrentProductImageIndex(null)
  }

  const handleProductCropCancel = () => {
    setProductCropModalOpen(false)
    setCurrentProductImageIndex(null)
    setProductImageToCrop('')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (profilePhotoUrl && profilePhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(profilePhotoUrl)
      }
      if (coverPhotoUrl && coverPhotoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(coverPhotoUrl)
      }
    }
  }, []) // Empty dependency array - only cleanup on unmount


  const geocodeZipCode = async (zipCode: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode })
      })
      
      if (!response.ok) return null
      
      const data = await response.json()
      if (data.lat && data.lng) {
        return { lat: data.lat, lng: data.lng }
      }
      
      return null
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }

  const submit = async () => {
    // Validate step 5 first
    const newErrors: Record<string, string> = {}
    const v = step5Schema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      password,
      confirmPassword,
      allow_phone_contact: allowPhoneContact,
      agree_to_terms: true, // Automatically true since terms are in header
    })
    
    if (!v.success) {
      v.error.issues.forEach(issue => {
        if (issue.path[0] === 'first_name') {
          newErrors.first_name = issue.message
        } else if (issue.path[0] === 'last_name') {
          newErrors.last_name = issue.message
        } else if (issue.path[0] === 'email') {
          newErrors.email = issue.message
        } else if (issue.path[0] === 'phone_number') {
          newErrors.phone_number = issue.message
        } else if (issue.path[0] === 'password') {
          newErrors.password = issue.message
        } else if (issue.path[0] === 'confirmPassword') {
          newErrors.confirmPassword = issue.message
        } else if (issue.path[0] === 'agree_to_terms') {
          newErrors.agree_to_terms = issue.message
        }
      })
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    
    try {

      // Create account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          data: { 
            first_name: firstName.trim().slice(0, 50), 
            last_name: lastName.trim().slice(0, 50), 
            role: 'vendor'
          } 
        },
      })
      if (signUpError) {
        console.error('Signup error:', signUpError)
        toast.error(`Signup failed: ${signUpError.message}`)
        return
      }

      // Get user ID from signup or try sign-in
      let uid = signUpData.user?.id
      if (!uid) {
        // Try sign-in (in case email confirmation disabled)
        const { data: signInData } = await supabase.auth.signInWithPassword({ email, password })
        uid = signInData.user?.id
      }

      if (!uid) {
        toast.error('Failed to create user account')
        return
      }

      let profile_photo_url: string | undefined
      let cover_photo_url: string | undefined
      
      // Upload profile photo if exists
      if (uid && profilePhotoFile) {
        try {
          const path = `${uid}/profile/profile.jpg`
          const { data: up, error: upErr } = await supabase.storage.from('vendor').upload(path, profilePhotoFile, {
            upsert: true,
            contentType: 'image/jpeg',
          })
          if (upErr) {
            console.error('Profile photo upload error:', {
              message: upErr.message,
              name: upErr.name,
              error: upErr
            })
            toast.error(`Profile photo upload failed: ${upErr.message}`)
          } else {
            const { data: pub } = supabase.storage.from('vendor').getPublicUrl(up.path)
            profile_photo_url = pub.publicUrl
            console.log('✅ Profile photo uploaded successfully:', profile_photo_url)
          }
        } catch (error) {
          console.error('Profile photo processing exception:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
          })
          toast.error('Profile photo processing failed, continuing without photo')
        }
      }
      
      // Upload cover photo if exists
      if (uid && coverPhotoFile) {
        try {
          const path = `${uid}/cover/cover.jpg`
          const { data: up, error: upErr } = await supabase.storage.from('vendor').upload(path, coverPhotoFile, {
            upsert: true,
            contentType: 'image/jpeg',
          })
          if (upErr) {
            console.error('Cover photo upload error:', {
              message: upErr.message,
              name: upErr.name,
              error: upErr
            })
            toast.error(`Cover photo upload failed: ${upErr.message}`)
          } else {
            const { data: pub } = supabase.storage.from('vendor').getPublicUrl(up.path)
            cover_photo_url = pub.publicUrl
            console.log('✅ Cover photo uploaded successfully:', cover_photo_url)
          }
        } catch (error) {
          console.error('Cover photo processing exception:', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined
          })
          toast.error('Cover photo processing failed, continuing without photo')
        }
      }

      // Insert vendor profile if possible
      if (uid) {
        // First, ensure user_profiles entry exists and is active
        const { error: userProfileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: uid,
            email,
            first_name: firstName,
            last_name: lastName,
            role: 'vendor',
            is_active: true,
          }, {
            onConflict: 'id'
          })

        if (userProfileError) {
          console.error('User profile upsert error:', userProfileError)
          toast.error(`Failed to create user profile: ${userProfileError.message}`)
          return
        }

        // Geocode zip code if in-person services are offered
        let latitude: number | undefined
        let longitude: number | undefined
        
        if (offersInPerson && zipCode) {
          console.log(`🌍 Geocoding zip code: ${zipCode}`)
          const coords = await geocodeZipCode(zipCode)
          if (coords) {
            latitude = coords.lat
            longitude = coords.lng
            console.log(`✅ Geocoded ${zipCode} to:`, coords)
          } else {
            console.warn(`⚠️ Failed to geocode ${zipCode}, profile will be created without coordinates`)
          }
        }

        // Then create vendor profile
        const payload: Partial<VendorProfile> & {
          user_id: string
          service_categories: string[]
          profile_title?: string
          about?: string
          offers_virtual_services?: boolean
          offers_in_person_services?: boolean
          zip_code?: string
          latitude?: number
          longitude?: number
          service_radius?: number
          hourly_rate?: number
          profile_photo_url?: string
          cover_photo_url?: string
          business_name: string
          first_name: string
          last_name: string
          email: string
          phone_number: string
          allow_phone_contact?: boolean
        } = {
          user_id: uid,
          business_name: businessName.trim().slice(0, 100),
          service_categories: selectedCategoryIds,
          profile_title: profileTitle.trim().slice(0, 200),
          about: about.trim().slice(0, 200),
          offers_virtual_services: offersVirtual,
          offers_in_person_services: offersInPerson,
          zip_code: zipCode ? zipCode.trim().slice(0, 10) : undefined,
          latitude,
          longitude,
          service_radius: radius,
          hourly_rate: hourlyRate,
          profile_photo_url,
          cover_photo_url,
          first_name: firstName.trim().slice(0, 50),
          last_name: lastName.trim().slice(0, 50),
          email: email.trim().slice(0, 100),
          phone_number: phone ? phone.trim().slice(0, 20) : '',
          allow_phone_contact: allowPhoneContact,
          admin_approved: true, // Auto-approve vendors on registration
        }
        
        console.log('Attempting to insert vendor profile with payload:', {
          ...payload,
          user_id: uid.slice(0, 8) + '...',
          email: email.slice(0, 20) + '...'
        })
        
        const { error: insErr, data: vendorProfile } = await supabase.from('vendor_profiles').insert(payload).select().single()
        if (insErr) {
          console.error('Profile insertion error details:', {
            message: insErr.message,
            details: insErr.details,
            hint: insErr.hint,
            code: insErr.code
          })
          toast.error(`Profile creation failed: ${insErr.message || 'Unknown error'}`)
          return
        }

        // Save products if any were added
        if (products.length > 0 && vendorProfile?.id) {
          for (let i = 0; i < products.length; i++) {
            const product = products[i]
            
            // Skip products without title and description
            if (!product.title.trim() || !product.description.trim()) {
              continue
            }

            let productImageUrl: string | null = null

            // Upload product image if exists
            if (product.croppedImageBlob) {
              try {
                // Use the same pattern as vendor dashboard: vendor bucket with vendorId/product/ path
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
                const filePath = `${vendorProfile.id}/product/${fileName}`
                const file = new File([product.croppedImageBlob], fileName, { type: 'image/jpeg' })
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('vendor')
                  .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: 'image/jpeg',
                  })

                if (uploadError) {
                  console.error('Product image upload error:', {
                    message: uploadError.message,
                    name: uploadError.name,
                    error: uploadError,
                    productTitle: product.title
                  })
                  toast.error(`Failed to upload product image: ${uploadError.message}`)
                  // Continue without image
                } else if (uploadData) {
                  const { data: { publicUrl } } = supabase.storage
                    .from('vendor')
                    .getPublicUrl(uploadData.path)
                  productImageUrl = publicUrl
                  console.log('✅ Product image uploaded successfully:', productImageUrl)
                }
              } catch (error) {
                console.error('Product image processing exception:', {
                  error,
                  errorMessage: error instanceof Error ? error.message : 'Unknown error',
                  errorStack: error instanceof Error ? error.stack : undefined,
                  productTitle: product.title
                })
                toast.error('Failed to upload product image')
                // Continue without image
              }
            }

            // Insert product
            const { error: productError } = await supabase.from('vendor_products').insert({
              vendor_id: vendorProfile.id,
              title: product.title.trim(),
              description: product.description.trim(),
              starting_price: product.starting_price ? parseFloat(product.starting_price) : null,
              image_url: productImageUrl,
              is_active: true,
              display_order: i,
            })

            if (productError) {
              console.error('Error creating product:', productError)
              // Don't fail registration if product creation fails
            }
          }
        }

        // Send vendor welcome email (non-blocking)
        console.log('🎉 Vendor profile created - triggering welcome email...')
        fetch('/api/send-vendor-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            businessName,
          }),
        })
          .then(async (response) => {
            const result = await response.json()
            console.log('Vendor welcome email API response:', result)
          })
          .catch(error => {
            console.error('Failed to send vendor welcome email:', error)
            // Don't show error to user - email is non-critical
          })

        // Send admin notification (non-blocking)
        console.log('📧 Sending admin notification for vendor registration...')
        const categoryNames = categories
          .filter(cat => selectedCategoryIds.includes(cat.id))
          .map(cat => cat.name)
          .join(', ')
        
        const serviceTypeText = offersVirtual && offersInPerson 
          ? 'Virtual & In-Person' 
          : offersVirtual 
            ? 'Virtual Only' 
            : 'In-Person Only'
        
        const locationText = zipCode || 'Not specified'
        
        fetch('/api/admin-notifications/vendor-registration', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            businessName,
            phone,
            categories: categoryNames,
            location: locationText,
            serviceType: serviceTypeText,
            userId: uid,
          }),
        })
          .then(async (response) => {
            const result = await response.json()
            console.log('Admin notification API response:', result)
          })
          .catch(error => {
            console.error('Failed to send admin notification:', error)
            // Don't show error to user - email is non-critical
          })
      }

      // Set flag to show welcome modal on dashboard
      sessionStorage.setItem('burpp_new_vendor_welcome', 'true')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating account:', error)
      toast.error('An error occurred while creating your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/images/burpp_logo.webp"
              alt="Burpp Logo"
              width={120}
              height={40}
              className="h-8 w-auto"
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
      {step === 1 && (
        <section className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Start Growing Your Business, Join the Burpp Community Today</h1>
            <p className="text-muted-foreground">Tell us about your business so we can help you connect with clients.</p>
          </div>
          <div className="space-y-3">
            <Label htmlFor="business">What is the name of your business? *</Label>
            <Input 
              id="business" 
              value={businessName} 
              onChange={(e) => {
                clearError('business_name')
                setBusinessName(e.target.value)
              }}
              className={errors.business_name ? 'border-red-500' : ''}
            />
            {errors.business_name && (
              <p className="text-sm text-red-500">{errors.business_name}</p>
            )}
          </div>
          <div className="space-y-3">
            <Label>Choose the categories that best describe your business *</Label>
            <MultiSelect
              options={categoryOptions}
              selected={selectedCategoryIds}
              onChange={handleCategoryChange}
              placeholder="Select categories"
              maxCount={2}
              className={errors.service_categories ? 'border-red-500' : ''}
            />
            {errors.service_categories && (
              <p className="text-sm text-red-500">{errors.service_categories}</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={next}>Next</Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <>
          <button onClick={back} className="flex items-center gap-2 text-primary mb-3 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Put Your Best Foot Forward</h2>
            <p className="text-muted-foreground">Create a compelling profile to attract potential clients.</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Profile Title *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateTitle}
                disabled={isGeneratingTitle || !businessName}
                className="text-xs h-7 px-2"
              >
                {isGeneratingTitle ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {profileTitle ? (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Refine
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1 h-3 w-3" />
                        Generate
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
            <Input 
              id="title" 
              value={profileTitle} 
              onChange={(e) => {
                clearError('profile_title')
                setProfileTitle(e.target.value)
              }}
              className={errors.profile_title ? 'border-red-500' : ''}
              placeholder="e.g., Professional Plumber with 10+ Years Experience"
            />
            {errors.profile_title && (
              <p className="text-sm text-red-500">{errors.profile_title}</p>
            )}
            {!businessName && (
              <p className="text-xs text-muted-foreground">
                Complete Step 1 to use AI generation
              </p>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="about">About *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription || !businessName}
                className="text-xs h-7 px-2"
              >
                {isGeneratingDescription ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    {about ? (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Refine
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-1 h-3 w-3" />
                        Generate
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
            <Textarea 
              id="about" 
              value={about} 
              onChange={(e) => {
                clearError('about')
                const value = e.target.value.slice(0, 200)
                setAbout(value)
              }}
              rows={6}
              className={cn('text-base', errors.about && 'border-red-500')}
              placeholder="Tell potential clients about your business, experience, and what makes you unique..."
              maxLength={200}
            />
            {errors.about && (
              <p className="text-sm text-red-500">{errors.about}</p>
            )}
            <p className="text-xs text-muted-foreground text-right">
              {about.length}/200 characters
            </p>
            {!businessName && (
              <p className="text-xs text-muted-foreground">
                Complete Step 1 to use AI generation
              </p>
            )}
          </div>
          <div className="flex justify-start gap-2">
            <Button onClick={next}>Next</Button>
          </div>
        </section>
        </>
      )}

      {step === 3 && (
        <>
          <button onClick={back} className="flex items-center gap-2 text-primary mb-3 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Where is your business located?</h2>
            <p className="text-muted-foreground">Select the area where you plan to offer services. You can change this later.</p>
          </div>
          
          {/* ZIP Code / City Input - First Position */}
          <div className="space-y-2">
            <Label htmlFor="location">Enter the ZIP code or city for your service area.</Label>
            <div className="relative">
              <Input 
                id="location" 
                value={locationQuery} 
                onChange={(e) => {
                  clearError('zip_code')
                  const value = e.target.value
                  setLocationQuery(value)
                  searchLocations(value)
                  setIsLocationDropdownOpen(true)
                }}
                onFocus={() => {
                  if (locationSuggestions.length > 0) {
                    setIsLocationDropdownOpen(true)
                  }
                }}
                placeholder="Enter city or zip code"
                className={`pr-12 ${errors.zip_code ? 'border-red-500' : ''}`}
                autoComplete="off"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                title="Use current location"
              >
                {isGettingLocation ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </Button>
              
              {/* Location Suggestions Dropdown */}
              {isLocationDropdownOpen && locationSuggestions.length > 0 && (
                <div 
                  data-location-dropdown
                  className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
                >
                  {locationSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleLocationSelect(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {suggestion.text}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {suggestion.place_name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.zip_code && (
              <p className="text-sm text-red-500">{errors.zip_code}</p>
            )}
          </div>
          
          {/* Travel Distance - Always shown since in-person is always true */}
          <div className="space-y-2">
            <Label htmlFor="radius">How far are you willing to travel to service a client?</Label>
            <Select
              value={radius?.toString()}
              onValueChange={(value) => {
                clearError('service_radius')
                setRadius(parseInt(value))
              }}
            >
              <SelectTrigger id="radius" className="w-full text-base">
                <SelectValue placeholder="Select distance" />
              </SelectTrigger>
              <SelectContent className="text-base">
                <SelectItem value="10">10 miles</SelectItem>
                <SelectItem value="25">25 miles</SelectItem>
                <SelectItem value="50">50 miles</SelectItem>
                <SelectItem value="100">100 miles</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Virtual Services Switch */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Label 
              htmlFor="offersVirtual" 
              className="text-base font-semibold cursor-pointer"
            >
              I offer services virtually as well.
            </Label>
            <Switch 
              id="offersVirtual"
              checked={offersVirtual}
              onCheckedChange={(checked) => {
                setOffersVirtual(checked)
                clearError('general')
              }}
            />
          </div>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          <div className="flex justify-start gap-2">
            <Button onClick={next}>Next</Button>
          </div>
        </section>
        </>
      )}

      {step === 4 && (
        <>
          <button onClick={back} className="flex items-center gap-2 text-primary mb-3 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Rate per Hour</h2>
            <p className="text-muted-foreground">Enter your typical hourly rate so customers have a clear sense of your pricing.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">Hourly Rate *</Label>
            <div className="relative">
              <Input
                id="rate"
                type="text"
                inputMode="decimal"
                placeholder=""
                value={hourlyRateInput}
                onChange={handleHourlyRateChange}
                required
                className={`pr-16 text-base ${errors.hourly_rate ? 'border-red-500' : ''}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base font-medium pointer-events-none">
                $/HR
              </div>
            </div>
            {errors.hourly_rate && (
              <p className="text-sm text-red-500">{errors.hourly_rate}</p>
            )}
          </div>
          <div className="flex justify-start gap-2">
            <Button onClick={next}>Next</Button>
          </div>
        </section>
        </>
      )}

      {step === 5 && (
        <>
          <button onClick={back} className="flex items-center gap-2 text-primary mb-3 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Add Your First Product</h2>
            <p className="text-muted-foreground">Adding your first product helps potential clients understand the services you offer and what sets you apart.</p>
          </div>

          {products.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-600 mb-4">No products added yet. You can skip this step and add products later from your dashboard.</p>
              <Button
                variant="outline"
                onClick={() => {
                  setProducts([{
                    title: '',
                    description: '',
                    starting_price: '',
                    imageFile: null,
                    imageUrl: null,
                    croppedImageBlob: null
                  }])
                  setEditingProductIndex(0)
                }}
              >
                Add Product
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Add a Product Offering</h3>
                    {products.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProducts(products.filter((_, i) => i !== index))
                          if (editingProductIndex === index) {
                            setEditingProductIndex(null)
                          } else if (editingProductIndex !== null && editingProductIndex > index) {
                            setEditingProductIndex(editingProductIndex - 1)
                          }
                        }}
                        className="h-8 px-3 text-xs border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`product-title-${index}`}>Title *</Label>
                      <Input
                        id={`product-title-${index}`}
                        value={product.title}
                        onChange={(e) => {
                          const updated = [...products]
                          updated[index].title = e.target.value
                          setProducts(updated)
                          // Clear error when user starts typing
                          if (productErrors[index]?.title) {
                            const updatedErrors = { ...productErrors }
                            delete updatedErrors[index]?.title
                            if (Object.keys(updatedErrors[index] || {}).length === 0) {
                              delete updatedErrors[index]
                            }
                            setProductErrors(updatedErrors)
                          }
                        }}
                        className={productErrors[index]?.title ? 'border-red-500' : ''}
                        placeholder="e.g., Professional Wedding Photography Package"
                      />
                      {productErrors[index]?.title && (
                        <p className="text-sm text-red-500">{productErrors[index].title}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`product-description-${index}`}>Description *</Label>
                      <Textarea
                        id={`product-description-${index}`}
                        value={product.description}
                        onChange={(e) => {
                          const updated = [...products]
                          updated[index].description = e.target.value
                          setProducts(updated)
                          // Clear error when user starts typing
                          if (productErrors[index]?.description) {
                            const updatedErrors = { ...productErrors }
                            delete updatedErrors[index]?.description
                            if (Object.keys(updatedErrors[index] || {}).length === 0) {
                              delete updatedErrors[index]
                            }
                            setProductErrors(updatedErrors)
                          }
                        }}
                        className={productErrors[index]?.description ? 'border-red-500' : ''}
                        rows={4}
                        placeholder="Describe what's included, the process, timeline, and what makes your service unique..."
                      />
                      {productErrors[index]?.description && (
                        <p className="text-sm text-red-500">{productErrors[index].description}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`product-price-${index}`}>Starting Price (optional)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id={`product-price-${index}`}
                          type="text"
                          inputMode="decimal"
                          placeholder="99.99"
                          value={product.starting_price}
                          onChange={(e) => handleProductPriceChange(index, e.target.value)}
                          className="pl-9"
                          maxLength={8}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Maximum: $10,000.00
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Product Image (optional)</Label>
                      {product.imageUrl ? (
                        <div className="relative h-56 border border-gray-200 rounded-lg overflow-hidden bg-white">
                          <img
                            key={product.imageUrl}
                            src={product.imageUrl}
                            alt="Product preview"
                            className="w-full h-full object-contain"
                            loading="eager"
                          />
                          {/* Action buttons in top right corner */}
                          <div className="absolute top-3 right-3 flex gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*'
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0]
                                  if (!file) return

                                  if (!file.type.startsWith('image/')) {
                                    toast.error('Please select an image file')
                                    return
                                  }

                                  if (file.size > 15 * 1024 * 1024) {
                                    toast.error('Image must be less than 15MB')
                                    return
                                  }

                                  toast.loading('Preparing image...')
                                  const imageUrl = URL.createObjectURL(file)
                                  setCurrentProductImageIndex(index)
                                  setProductImageToCrop(imageUrl)
                                  
                                  setTimeout(() => {
                                    setProductCropModalOpen(true)
                                    toast.dismiss()
                                  }, 100)
                                }
                                input.click()
                              }}
                              className="h-8 px-3 text-xs bg-white/95 hover:bg-white shadow-md"
                            >
                              <Camera className="h-3 w-3 mr-1" />
                              Change
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                const updated = [...products]
                                updated[index].imageUrl = null
                                updated[index].imageFile = null
                                updated[index].croppedImageBlob = null
                                setProducts(updated)
                              }}
                              className="h-8 px-3 text-xs bg-white/95 hover:bg-white shadow-md text-red-600 hover:text-red-700"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (!file) return

                              if (!file.type.startsWith('image/')) {
                                toast.error('Please select an image file')
                                return
                              }

                              if (file.size > 15 * 1024 * 1024) {
                                toast.error('Image must be less than 15MB')
                                return
                              }

                              toast.loading('Preparing image...')
                              const imageUrl = URL.createObjectURL(file)
                              setCurrentProductImageIndex(index)
                              setProductImageToCrop(imageUrl)
                              
                              setTimeout(() => {
                                setProductCropModalOpen(true)
                                toast.dismiss()
                              }, 100)
                            }
                            input.click()
                          }}
                          className="w-full"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Upload Image
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                onClick={() => {
                  // Validate existing products before adding a new one
                  const hasIncompleteProducts = products.some(p => !p.title.trim() || !p.description.trim())
                  if (hasIncompleteProducts) {
                    toast.error('Please complete the title and description for all products before adding another')
                    return
                  }
                  setProducts([...products, {
                    title: '',
                    description: '',
                    starting_price: '',
                    imageFile: null,
                    imageUrl: null,
                    croppedImageBlob: null
                  }])
                }}
                className="w-full"
              >
                Add Another Product
              </Button>
            </div>
          )}

          <div className="flex justify-start gap-2">
            <Button onClick={next}>Next</Button>
          </div>
        </section>
        </>
      )}

      {step === 6 && (
        <>
          <button onClick={back} className="flex items-center gap-2 text-primary mb-3 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Add Profile & Cover Photos</h2>
            <p className="text-muted-foreground">Upload optional profile and cover photos to make your profile stand out.</p>
          </div>
          
          {/* Profile Preview Card */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="relative">
              {/* Cover Photo */}
              <div className="h-48 bg-gradient-to-r from-primary to-primary/60 relative">
                {coverPhotoFile && coverPhotoUrl ? (
                  <img
                    key={coverPhotoUrl}
                    src={coverPhotoUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                ) : null}
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-4 right-4 bg-white/95 hover:bg-white shadow-md text-sm"
                  style={{ fontFamily: 'Helvetica Neue, sans-serif', fontSize: '14px' }}
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement
                      onPhotoSelected(target.files?.[0] ?? null, 'cover')
                    }
                    input.click()
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {coverPhotoFile ? 'Change Cover' : 'Add Cover'}
                </Button>
                {coverPhotoFile && (
                  <div className="absolute top-4 left-4 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Cover photo ready
                  </div>
                )}
              </div>
              
              {/* Profile Photo */}
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                <div className="relative">
                  <div 
                    className="h-24 w-24 border-4 border-white shadow-lg rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
                    key={`profile-${profilePhotoFile ? 'has-file' : 'no-file'}-${profilePhotoUrl ? 'has-url' : 'no-url'}`}
                  >
                    {profilePhotoFile && profilePhotoUrl ? (
                      <img
                        key={profilePhotoUrl}
                        src={profilePhotoUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-gray-600">
                        {getInitials(businessName || 'Business')}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-50"
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => {
                        const target = e.target as HTMLInputElement
                        onPhotoSelected(target.files?.[0] ?? null, 'profile')
                      }
                      input.click()
                    }}
                    title={profilePhotoFile ? 'Change profile photo' : 'Add profile photo'}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  {profilePhotoFile && (
                    <div className="absolute -top-2 -left-2 bg-green-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium">
                      ✓
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-16 pb-6 px-6 text-center space-y-2">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {businessName || 'Business Name'}
                </h3>
                <p className="text-gray-500 mt-2">
                  {profileTitle || 'Professional Service Provider'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-start gap-2">
            <Button onClick={next}>Next</Button>
          </div>
        </section>
        </>
      )}

      {/* Image Crop Modal for Profile/Cover Photos */}
      <ImageCropModal
        open={cropModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCropCancel()
          }
        }}
        imageSrc={cropType === 'profile' ? (profilePhotoUrl || '') : (coverPhotoUrl || '')}
        onCropComplete={handleCropComplete}
        aspectRatio={cropType === 'profile' ? 1 : 446 / 192}
        title={`Crop ${cropType === 'profile' ? 'Profile' : 'Cover'} Photo`}
      />

      {/* Product Image Crop Modal - Always rendered */}
      <ImageCropModal
        open={productCropModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleProductCropCancel()
          }
        }}
        imageSrc={productImageToCrop}
        onCropComplete={handleProductCropComplete}
        aspectRatio={16 / 9}
        title="Crop Image"
      />

      {step === 7 && (
        <>
          <button onClick={back} className="flex items-center gap-2 text-primary mb-3 hover:underline disabled:opacity-50" disabled={isSubmitting}>
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </button>
          <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Great! Now create your business account.</h2>
            <p className="text-muted-foreground">
              By continuing, you agree to Burpp's{' '}
              <a href="/terms" target="_blank" className="text-primary font-bold">
                Terms of Service
              </a>
              {' '}and acknowledge{' '}
              <a href="/privacy" target="_blank" className="text-primary font-bold">
                Privacy Policy
              </a>
              .
            </p>
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first">First name *</Label>
              <Input 
                id="first" 
                value={firstName} 
                onChange={(e) => {
                  clearError('first_name')
                  setFirstName(e.target.value)
                }}
                maxLength={50}
                className={errors.first_name ? 'border-red-500' : ''}
              />
              {errors.first_name && (
                <p className="text-sm text-red-500">{errors.first_name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last">Last name *</Label>
              <Input 
                id="last" 
                value={lastName} 
                onChange={(e) => {
                  clearError('last_name')
                  setLastName(e.target.value)
                }}
                maxLength={50}
                className={errors.last_name ? 'border-red-500' : ''}
              />
              {errors.last_name && (
                <p className="text-sm text-red-500">{errors.last_name}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => {
                  clearError('email')
                  setEmail(e.target.value)
                }}
                maxLength={100}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone {allowPhoneContact && '*'}</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => {
                  clearError('phone_number')
                  setPhone(e.target.value)
                }}
                maxLength={20}
                className={errors.phone_number ? 'border-red-500' : ''}
              />
              {errors.phone_number && (
                <p className="text-sm text-red-500">{errors.phone_number}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input 
              id="password" 
              type="password" 
              value={password} 
              onChange={(e) => {
                clearError('password')
                setPassword(e.target.value)
              }}
              className={errors.password ? 'border-red-500' : ''}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
            {password && !errors.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Password strength:</span>
                  <span className={`font-medium ${
                    passwordStrength.strength === 'weak' ? 'text-red-600' :
                    passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                    passwordStrength.strength === 'strong' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.text}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                    style={{ 
                      width: passwordStrength.strength === 'weak' ? '25%' :
                             passwordStrength.strength === 'medium' ? '50%' :
                             passwordStrength.strength === 'strong' ? '75%' : '100%'
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => {
                clearError('confirmPassword')
                setConfirmPassword(e.target.value)
              }}
              className={errors.confirmPassword ? 'border-red-500' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
          
          {/* Checkboxes */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="allowPhoneContact"
                checked={allowPhoneContact}
                onCheckedChange={(checked) => {
                  setAllowPhoneContact(checked === true)
                  // Clear phone error when unchecking
                  if (!checked) {
                    clearError('phone_number')
                  }
                }}
              />
              <Label 
                htmlFor="allowPhoneContact" 
                className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5"
              >
                Allow customers to call my phone number (Recommended)
              </Label>
            </div>
          </div>
          
          <div className="flex justify-start gap-2">
            <Button onClick={submit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </div>
        </section>
        </>
      )}
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/images/auth_vendor.webp"
          alt="Vendor Registration"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        {/* Dance Instructor Tag */}
        <div className="absolute bottom-8 left-4 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg border-l-4 border-primary">
          <div className="text-sm font-semibold text-white">
            Dance Instructor
          </div>
          <div className="text-xs text-white/80">
            Kevin, Brooklyn NY
          </div>
        </div>
      </div>
    </div>
  )
}


