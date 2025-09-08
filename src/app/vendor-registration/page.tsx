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
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'


const step1Schema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  service_categories: z.array(z.string().uuid()).min(1, 'Select at least one category'),
})

const step2Schema = z.object({
  profile_title: z.string().min(1, 'Profile title is required'),
  about: z.string().min(1, 'About is required'),
})

const step3Schema = z.object({
  offers_virtual_services: z.boolean(),
  offers_in_person_services: z.boolean(),
  zip_code: z.string().optional(),
  service_radius: z.number().optional(),
  hourly_rate: z.number().optional(),
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
})

type Category = { id: string; name: string }

export default function VendorRegisterPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [open, setOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Step data
  const [categories, setCategories] = useState<Category[]>([])
  const [businessName, setBusinessName] = useState('')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const [profileTitle, setProfileTitle] = useState('')
  const [about, setAbout] = useState('')

  const [offersVirtual, setOffersVirtual] = useState<boolean>(true)
  const [offersInPerson, setOffersInPerson] = useState<boolean>(false)
  const [zipCode, setZipCode] = useState('')
  const [radius, setRadius] = useState<number | undefined>(25)
  const [hourlyRate, setHourlyRate] = useState<number | undefined>(undefined)

  // Step 4 image (react-easy-crop)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)

  // Step 5 auth
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
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

  const next = async () => {
    if (step === 1) {
      const res = step1Schema.safeParse({ business_name: businessName, service_categories: selectedCategoryIds })
      if (!res.success) return toast.error(res.error.issues[0]?.message ?? 'Fix errors to continue')
    }
    if (step === 2) {
      const res = step2Schema.safeParse({ profile_title: profileTitle, about })
      if (!res.success) return toast.error(res.error.issues[0]?.message ?? 'Fix errors to continue')
    }
    if (step === 3) {
      const res = step3Schema.safeParse({
        offers_virtual_services: offersVirtual,
        offers_in_person_services: offersInPerson,
        zip_code: zipCode || undefined,
        service_radius: radius,
        hourly_rate: hourlyRate,
      })
      if (!res.success) return toast.error(res.error.issues[0]?.message ?? 'Fix errors to continue')
    }
    if (step === 4) {
      // optional photo; no validation required
    }
    setStep((s) => s + 1)
  }

  const back = () => setStep((s) => Math.max(1, s - 1))

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const onPhotoSelected = (f: File | null) => {
    setPhotoFile(f)
    setZoom(1)
    setCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
    if (photoUrl) URL.revokeObjectURL(photoUrl)
    if (f) {
      const url = URL.createObjectURL(f)
      setPhotoUrl(url)
    } else {
      setPhotoUrl(null)
    }
  }

  const ensureImageDims = async (): Promise<HTMLImageElement | null> => {
    if (!photoUrl) return null
    return new Promise((resolve) => {
      const img = document.createElement('img')
      img.onload = () => {
        resolve(img)
      }
      img.src = photoUrl
    })
  }

  const getCroppedBlob = async (): Promise<Blob | null> => {
    if (!photoUrl || !croppedAreaPixels) return null
    const img = await ensureImageDims()
    if (!img) return null
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    
    canvas.width = 300
    canvas.height = 300
    
    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      300,
      300
    )
    
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9))
  }

  const submit = async () => {
    setIsSubmitting(true)
    
    try {
      const v = step5Schema.safeParse({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        password,
      })
      if (!v.success) {
        toast.error(v.error.issues[0]?.message ?? 'Fix errors to continue')
        return
      }

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
      if (uid && photoFile) {
        try {
          const blob = (await getCroppedBlob()) ?? photoFile
          const path = `${uid}/profile/profile.jpg`
          const { data: up, error: upErr } = await supabase.storage.from('vendor').upload(path, blob, {
            upsert: true,
            contentType: 'image/jpeg',
          })
          if (upErr) {
            console.error('Upload error:', upErr)
            toast.error(`Photo upload failed: ${upErr.message}`)
          } else {
            const { data: pub } = supabase.storage.from('vendor').getPublicUrl(up.path)
            profile_photo_url = pub.publicUrl
          }
        } catch (imageError) {
          console.error('Image processing error:', imageError)
          toast.error('Photo processing failed, continuing without photo')
        }
      }

      // Insert vendor profile if possible
      if (uid) {
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
          first_name: firstName,
          last_name: lastName,
          email,
          phone_number: phone,
        }
        const { error: insErr } = await supabase.from('vendor_profiles').insert(payload)
        if (insErr) {
          console.error('Profile insertion error:', insErr)
          toast.error(`Profile creation failed: ${insErr.message}`)
          return
        }
      }

      toast.success('Vendor account created')
      router.push('/vendor-registration/thank-you')
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
            <Label htmlFor="business">What is the name of your business?</Label>
            <Input id="business" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div className="space-y-3">
            <Label>What do you specialize in?</Label>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
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
            <Label htmlFor="title">Profile title</Label>
            <Input id="title" value={profileTitle} onChange={(e) => setProfileTitle(e.target.value)} />
          </div>
          <div className="space-y-3">
            <Label htmlFor="about">About</Label>
            <Textarea id="about" value={about} onChange={(e) => setAbout(e.target.value)} rows={6} />
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
            <Label htmlFor="rate">What is the hourly rate for your service?</Label>
            <Input id="rate" type="number" inputMode="decimal" value={hourlyRate ?? ''} onChange={(e) => setHourlyRate(e.target.value ? Number(e.target.value) : undefined)} />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div className="space-y-2">
              <Label>Offers virtual services</Label>
              <div className="flex gap-2">
                <Button variant={offersVirtual ? 'default' : 'outline'} size="sm" onClick={() => setOffersVirtual(true)}>Yes</Button>
                <Button variant={!offersVirtual ? 'default' : 'outline'} size="sm" onClick={() => setOffersVirtual(false)}>No</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Offers in-person services</Label>
              <div className="flex gap-2">
                <Button variant={offersInPerson ? 'default' : 'outline'} size="sm" onClick={() => setOffersInPerson(true)}>Yes</Button>
                <Button variant={!offersInPerson ? 'default' : 'outline'} size="sm" onClick={() => setOffersInPerson(false)}>No</Button>
              </div>
            </div>
          </div>
          {offersInPerson && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="zip">Service zip code</Label>
                <Input id="zip" value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Service radius</Label>
                <div className="flex flex-wrap gap-2">
                  {[10, 25, 50, 100].map((r) => (
                    <Button key={r} variant={radius === r ? 'default' : 'outline'} size="sm" onClick={() => setRadius(r)}>
                      {r} miles
                    </Button>
                  ))}
                </div>
              </div>
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
            <h2 className="text-2xl font-semibold">Add a Profile Photo</h2>
            <p className="text-muted-foreground">Upload an optional profile photo. Drag and drop or click to select an image.</p>
          </div>
          <div className="space-y-3">
            {!photoUrl ? (
              <div
                className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
                  const files = e.dataTransfer.files
                  if (files.length > 0) {
                    onPhotoSelected(files[0])
                  }
                }}
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = 'image/*'
                  input.onchange = (e) => {
                    const target = e.target as HTMLInputElement
                    onPhotoSelected(target.files?.[0] ?? null)
                  }
                  input.click()
                }}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Upload a photo</p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Simple, clean crop interface */}
                <div className="relative mx-auto w-[400px] h-[400px] bg-gray-900 rounded-lg overflow-hidden">
                  <Cropper
                    image={photoUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(croppedArea, croppedAreaPixels) => {
                      setCroppedAreaPixels(croppedAreaPixels)
                    }}
                    showGrid={false}
                    objectFit="cover"
                    style={{
                      containerStyle: {
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#111827'
                      }
                    }}
                  />
                </div>
                
                {/* Simple controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Zoom</Label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-500 w-12">{Math.round(zoom * 100)}%</span>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Drag to move, pinch to zoom, or use the slider</p>
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setPhotoFile(null)
                        setPhotoUrl(null)
                        setZoom(1)
                        setCrop({ x: 0, y: 0 })
                        setCroppedAreaPixels(null)
                      }}
                    >
                      Remove Photo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const target = e.target as HTMLInputElement
                          onPhotoSelected(target.files?.[0] ?? null)
                        }
                        input.click()
                      }}
                    >
                      Change Photo
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
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
              <Label htmlFor="first">First name</Label>
              <Input id="first" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last">Last name</Label>
              <Input id="last" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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


