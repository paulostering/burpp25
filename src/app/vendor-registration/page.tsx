'use client'

import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { VendorProfile } from '@/types/db'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Check, MapPin, Loader2, Camera, Sparkles, RefreshCw } from 'lucide-react'
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
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone_number: z.string().min(7, 'Invalid phone'),
  password: z.string().min(6, 'Min 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type Category = { id: string; name: string }

export default function VendorRegisterPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [open, setOpen] = useState(false)

  // Step data
  const [categories, setCategories] = useState<Category[]>([])
  const [businessName, setBusinessName] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const [profileTitle, setProfileTitle] = useState('')
  const [about, setAbout] = useState('')
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false)
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false)

  const [offersVirtual, setOffersVirtual] = useState<boolean>(true)
  const [offersInPerson, setOffersInPerson] = useState<boolean>(true)
  const [zipCode, setZipCode] = useState('')
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

  // Step 5 auth
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    supabase
      .from('categories')
      .select('id,name')
      .order('name')
      .then(({ data, error }) => {
        if (error) return
        setCategories(data ?? [])
      })
  }, [supabase])

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
      // Custom validation for hourly rate to provide better error message
      if (!hourlyRate || hourlyRate < 1) {
        if (!hourlyRate) {
          newErrors.hourly_rate = 'Please enter your starting hourly rate'
        } else if (hourlyRate < 1) {
          newErrors.hourly_rate = 'Hourly rate must be at least $1.00'
        }
      }
      
      const res = step3Schema.safeParse({
        offers_virtual_services: offersVirtual,
        offers_in_person_services: offersInPerson,
        zip_code: zipCode || undefined,
        service_radius: radius,
        hourly_rate: hourlyRate || 0, // Pass 0 if undefined to avoid type error
      })
      if (!res.success) {
        res.error.issues.forEach(issue => {
          if (issue.path[0] === 'hourly_rate' && !newErrors.hourly_rate) {
            newErrors.hourly_rate = issue.message
          } else if (issue.path[0] === 'zip_code') {
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
      toast.success(profileTitle ? 'Title refined!' : 'Title generated!')
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
      toast.success(about ? 'Description refined!' : 'Description generated!')
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

  const toggleCategory = (id: string) => {
    clearError('service_categories')
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

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
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&types=postcode&limit=1`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data')
      }
      
      const data = await response.json()
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0]
        const zipCode = feature.text || feature.properties?.postcode
        if (zipCode) {
          setZipCode(zipCode)
          toast.success(`Location detected: ${zipCode}`)
        } else {
          throw new Error('Could not extract zip code from location')
        }
      } else {
        throw new Error('No location data found')
      }
    } catch (error) {
      console.error('Error getting current location:', error)
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Location access denied. Please enable location permissions or enter your zip code manually.')
            break
          case error.POSITION_UNAVAILABLE:
            toast.error('Location information unavailable. Please enter your zip code manually.')
            break
          case error.TIMEOUT:
            toast.error('Location request timed out. Please enter your zip code manually.')
            break
          default:
            toast.error('Unable to detect your location. Please enter your zip code manually.')
        }
      } else {
        toast.error('Unable to detect your location. Please enter your zip code manually.')
      }
    } finally {
      setIsGettingLocation(false)
    }
  }

  const validateImage = (file: File): string | null => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, or WebP)'
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return 'Image size must be less than 5MB'
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
    setCropModalOpen(true)
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  // Cleanup object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (profilePhotoUrl) URL.revokeObjectURL(profilePhotoUrl)
      if (coverPhotoUrl) URL.revokeObjectURL(coverPhotoUrl)
    }
  }, [profilePhotoUrl, coverPhotoUrl])


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
        }
      })
      setErrors(newErrors)
      return
    }
    
    setIsSubmitting(true)
    
    try {

      // Create account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            first_name: firstName, 
            last_name: lastName, 
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
            toast.error(`Profile photo upload failed: ${upErr.message}`)
          } else {
            const { data: pub } = supabase.storage.from('vendor').getPublicUrl(up.path)
            profile_photo_url = pub.publicUrl
          }
        } catch {
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
            toast.error(`Cover photo upload failed: ${upErr.message}`)
          } else {
            const { data: pub } = supabase.storage.from('vendor').getPublicUrl(up.path)
            cover_photo_url = pub.publicUrl
          }
        } catch {
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

        // Then create vendor profile
        const payload: Partial<VendorProfile> & {
          user_id: string
          service_categories: string[]
          profile_title?: string
          about?: string
          offers_virtual_services?: boolean
          offers_in_person_services?: boolean
          zip_code?: string
          service_radius?: number
          hourly_rate?: number
          profile_photo_url?: string
          cover_photo_url?: string
          business_name: string
          first_name: string
          last_name: string
          email: string
          phone_number: string
        } = {
          user_id: uid,
          business_name: businessName,
          service_categories: selectedCategoryIds,
          profile_title: profileTitle,
          about,
          offers_virtual_services: offersVirtual,
          offers_in_person_services: offersInPerson,
          zip_code: zipCode || undefined,
          service_radius: radius,
          hourly_rate: hourlyRate,
          profile_photo_url,
          cover_photo_url,
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone,
          admin_approved: true, // Auto-approve vendors on registration
        }
        const { error: insErr } = await supabase.from('vendor_profiles').insert(payload)
        if (insErr) {
          console.error('Profile insertion error:', insErr)
          toast.error(`Profile creation failed: ${insErr.message}`)
          return
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
      }

      toast.success('Vendor account created')
      router.push(`/vendor/${uid}/dashboard`)
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
            <div className="mb-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Step {step} of 5</div>
            </div>

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
            <Label>What do you specialize in? *</Label>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`w-full justify-between text-base font-normal ${errors.service_categories ? 'border-red-500' : ''}`}
                  style={{ fontFamily: 'Helvetica Neue, sans-serif', fontSize: '16px' }}
                >
                  <span className="truncate">
                    {selectedCategoryIds.length > 0 
                      ? `${selectedCategoryIds.length} Categories Selected: ${selectedCategoryIds.map(id => categories.find(c => c.id === id)?.name).filter(Boolean).join(', ')}`
                      : 'Select categories'
                    }
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full h-full max-w-none max-h-none sm:max-w-[425px] sm:max-h-[80vh] overflow-hidden flex flex-col m-0 sm:m-4 rounded-none sm:rounded-lg">
                <DialogHeader>
                  <DialogTitle>Select categories</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                  <Command className="h-full">
                    <CommandInput placeholder="Search categories..." />
                    <CommandList className="max-h-[200px] sm:max-h-[250px] overflow-auto">
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {categories.map((c) => {
                          const selected = selectedCategoryIds.includes(c.id)
                          return (
                            <CommandItem
                              key={c.id}
                              onSelect={() => toggleCategory(c.id)}
                            >
                              <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                              {c.name}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
                {selectedCategoryIds.length > 0 && (
                  <div className="mt-4 space-y-2 flex-shrink-0">
                    <Label className="text-sm">Selected categories:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategoryIds.map((id) => {
                        const category = categories.find(c => c.id === id)
                        return (
                          <Badge key={id} variant="secondary" className="text-xs">
                            {category?.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-4 flex-shrink-0">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Done
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={back}>Back</Button>
            <Button onClick={next}>Next</Button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Service Area & Rates</h2>
            <p className="text-muted-foreground">Tell us about your service offerings and pricing.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rate">What is the hourly rate for your service? *</Label>
            <Input
              id="rate"
              type="text"
              inputMode="decimal"
              placeholder="Enter amount (minimum $1.00)"
              value={hourlyRateInput}
              onChange={handleHourlyRateChange}
              required
              className={errors.hourly_rate ? 'border-red-500' : ''}
            />
            {errors.hourly_rate && (
              <p className="text-sm text-red-500">{errors.hourly_rate}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Offers virtual services</Label>
              <div className="flex gap-2">
                <Button 
                  variant={offersVirtual ? 'default' : 'outline'} 
                  size="sm" 
                  className="text-base"
                  style={{ fontFamily: 'Helvetica Neue, sans-serif', fontSize: '16px' }}
                  onClick={() => {
                    clearError('general')
                    setOffersVirtual(true)
                  }}
                >
                  Yes
                </Button>
                <Button 
                  variant={!offersVirtual ? 'default' : 'outline'} 
                  size="sm" 
                  className="text-base"
                  style={{ fontFamily: 'Helvetica Neue, sans-serif', fontSize: '16px' }}
                  onClick={() => {
                    clearError('general')
                    setOffersVirtual(false)
                  }}
                >
                  No
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Offers in-person services</Label>
              <div className="flex gap-2">
                <Button 
                  variant={offersInPerson ? 'default' : 'outline'} 
                  size="sm" 
                  className="text-base"
                  style={{ fontFamily: 'Helvetica Neue, sans-serif', fontSize: '16px' }}
                  onClick={() => {
                    clearError('general')
                    setOffersInPerson(true)
                  }}
                >
                  Yes
                </Button>
                <Button 
                  variant={!offersInPerson ? 'default' : 'outline'} 
                  size="sm" 
                  className="text-base"
                  style={{ fontFamily: 'Helvetica Neue, sans-serif', fontSize: '16px' }}
                  onClick={() => {
                    clearError('general')
                    setOffersInPerson(false)
                  }}
                >
                  No
                </Button>
              </div>
            </div>
          </div>
          {offersInPerson && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zip">Service zip code</Label>
                <div className="relative">
                  <Input 
                    id="zip" 
                    value={zipCode} 
                    onChange={(e) => {
                      clearError('zip_code')
                      setZipCode(e.target.value)
                    }}
                    placeholder="Enter zip code"
                    className={`pr-12 ${errors.zip_code ? 'border-red-500' : ''}`}
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
                </div>
                {errors.zip_code && (
                  <p className="text-sm text-red-500">{errors.zip_code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Service radius</Label>
                <div className="flex flex-wrap gap-2">
                  {[10, 25, 50, 100].map((r) => (
                    <Button 
                      key={r} 
                      variant={radius === r ? 'default' : 'outline'} 
                      size="sm" 
                      className="text-base font-semibold"
                      style={{ fontFamily: 'Helvetica Neue, sans-serif', fontSize: '16px' }}
                      onClick={() => {
                        clearError('service_radius')
                        setRadius(r)
                      }}
                    >
                      {r} miles
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={back}>Back</Button>
            <Button onClick={next}>Next</Button>
          </div>
        </section>
      )}

      {step === 4 && (
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
                {coverPhotoFile ? (
                  <img
                    src={coverPhotoUrl || ''}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
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
                        src={profilePhotoUrl}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
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
          
          {/* Image Crop Modal */}
          <ImageCropModal
            open={cropModalOpen}
            onOpenChange={(open) => {
              if (!open) {
                handleCropCancel()
              }
            }}
            imageSrc={cropType === 'profile' ? (profilePhotoUrl || '') : (coverPhotoUrl || '')}
            onCropComplete={handleCropComplete}
            aspectRatio={cropType === 'profile' ? 1 : 2.5}
            title={`Crop ${cropType === 'profile' ? 'Profile' : 'Cover'} Photo`}
            description={`Crop your ${cropType} photo to the desired size. This will be displayed on your vendor profile.`}
          />
          
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={back}>Back</Button>
            <Button onClick={next}>Next</Button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Create Account</h2>
            <p className="text-muted-foreground">Set up your account credentials to complete registration.</p>
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
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => {
                  clearError('phone_number')
                  setPhone(e.target.value)
                }}
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
          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={back} disabled={isSubmitting}>Back</Button>
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


