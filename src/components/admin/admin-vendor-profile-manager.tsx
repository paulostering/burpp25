'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Save, 
  Edit, 
  X,
  Loader2,
  Camera,
  Check,
  ChevronsUpDown,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import type { VendorProfile, Category } from '@/types/db'
import { ImageCropModal } from '@/components/image-crop-modal'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface AdminVendorProfileManagerProps {
  vendor: VendorProfile
  stats: {
    conversations: number
    messages: number
    reviews: number
  }
  categories: Category[]
  onProfileUpdate: (updatedVendor: VendorProfile) => void
}

export function AdminVendorProfileManager({ vendor, stats, categories, onProfileUpdate }: AdminVendorProfileManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState<'profile' | 'cover' | null>(null)
  const [formData, setFormData] = useState({
    business_name: vendor.business_name || '',
    profile_title: vendor.profile_title || '',
    about: vendor.about || '',
    hourly_rate: vendor.hourly_rate?.toString() || '',
    zip_code: vendor.zip_code || '',
    service_radius: vendor.service_radius?.toString() || '',
    phone_number: vendor.phone_number || '',
    service_categories: vendor.service_categories || [],
    offers_virtual_services: vendor.offers_virtual_services || false,
    offers_in_person_services: vendor.offers_in_person_services || false,
    allow_phone_contact: vendor.allow_phone_contact || false,
    profile_photo_url: vendor.profile_photo_url || '',
    cover_photo_url: vendor.cover_photo_url || '',
    admin_approved: vendor.admin_approved || false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>('')
  const [cropType, setCropType] = useState<'profile' | 'cover'>('profile')
  
  // Multi-select popover state
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const coverPhotoInputRef = useRef<HTMLInputElement>(null)

  // Get vendor categories with full objects
  const vendorCategories = formData.service_categories?.map(catId => 
    categories.find(cat => cat.id === catId)
  ).filter(Boolean) || []

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.business_name.trim()) {
      newErrors.business_name = 'Business name is required'
    }
    
    if (formData.hourly_rate && isNaN(parseFloat(formData.hourly_rate))) {
      newErrors.hourly_rate = 'Please enter a valid hourly rate'
    }
    
    if (formData.service_radius && (isNaN(parseInt(formData.service_radius)) || parseInt(formData.service_radius) < 1)) {
      newErrors.service_radius = 'Service radius must be a positive number'
    }
    
    if (formData.zip_code && !/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
      newErrors.zip_code = 'Please enter a valid ZIP code'
    }
    
    if (formData.phone_number && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number'
    }
    
    if (formData.service_categories.length === 0) {
      newErrors.service_categories = 'Please select at least one service category'
    }
    
    if (!formData.offers_virtual_services && !formData.offers_in_person_services) {
      newErrors.service_types = 'Please select at least one service type'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }

    setIsLoading(true)
    
    try {
      const updateData = {
        business_name: formData.business_name,
        profile_title: formData.profile_title || null,
        about: formData.about || null,
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        zip_code: formData.zip_code || null,
        service_radius: formData.service_radius ? parseInt(formData.service_radius) : null,
        phone_number: formData.phone_number || null,
        service_categories: formData.service_categories.length > 0 ? formData.service_categories : null,
        offers_virtual_services: formData.offers_virtual_services,
        offers_in_person_services: formData.offers_in_person_services,
        allow_phone_contact: formData.allow_phone_contact,
      }

      const response = await fetch(`/api/admin/vendors/${vendor.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      toast.success('Profile updated successfully!')
      setIsEditing(false)
      onProfileUpdate(result.data)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      business_name: vendor.business_name || '',
      profile_title: vendor.profile_title || '',
      about: vendor.about || '',
      hourly_rate: vendor.hourly_rate?.toString() || '',
      zip_code: vendor.zip_code || '',
      service_radius: vendor.service_radius?.toString() || '',
      phone_number: vendor.phone_number || '',
      service_categories: vendor.service_categories || [],
      offers_virtual_services: vendor.offers_virtual_services || false,
      offers_in_person_services: vendor.offers_in_person_services || false,
      allow_phone_contact: vendor.allow_phone_contact || false,
      profile_photo_url: vendor.profile_photo_url || '',
      cover_photo_url: vendor.cover_photo_url || '',
      admin_approved: vendor.admin_approved || false,
    })
    setErrors({})
    setIsEditing(false)
  }

  const handleImageUpload = async (file: File, type: 'profile' | 'cover') => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageToCrop(e.target?.result as string)
      setCropType(type)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file, type)
    }
    e.target.value = ''
  }

  const handleCroppedImage = async (croppedImageBlob: Blob) => {
    setUploadingPhoto(cropType)
    try {
      // Check if we have user_id
      if (!vendor.user_id) {
        toast.error('Vendor user ID not found')
        return
      }

      // Create form data
      const uploadFormData = new FormData()
      uploadFormData.append('file', croppedImageBlob, 'photo.jpg')
      uploadFormData.append('type', cropType)
      uploadFormData.append('userId', vendor.user_id)

      // Upload via API route
      const response = await fetch(`/api/admin/vendors/${vendor.id}/photo`, {
        method: 'POST',
        body: uploadFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload image')
      }

      const updateField = cropType === 'profile' ? 'profile_photo_url' : 'cover_photo_url'
      setFormData(prev => ({ ...prev, [updateField]: result.publicUrl }))
      onProfileUpdate(result.data)
      toast.success(`${cropType === 'profile' ? 'Profile' : 'Cover'} photo updated successfully!`)
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setUploadingPhoto(null)
      setCropModalOpen(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    const currentCategories = formData.service_categories
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId]
    
    handleInputChange('service_categories', newCategories)
  }

  const triggerPhotoUpload = (type: 'profile' | 'cover') => {
    if (type === 'profile') {
      profilePhotoInputRef.current?.click()
    } else {
      coverPhotoInputRef.current?.click()
    }
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="space-y-8">
      {/* Hidden File Inputs */}
      <input
        ref={profilePhotoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handlePhotoInputChange(e, 'profile')}
      />
      <input
        ref={coverPhotoInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handlePhotoInputChange(e, 'cover')}
      />

      {/* Header with Edit Toggle */}
      <div className="flex items-center justify-end">
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Photo Section */}
          <Card className="border border-gray-200 shadow-none overflow-hidden pt-0">
            <CardContent className="p-0">
              <div className="relative">
                {/* Cover Photo */}
                <div className="h-48 bg-gradient-to-r from-primary to-primary/60 relative">
                  {formData.cover_photo_url ? (
                    <Image
                      src={formData.cover_photo_url}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 right-4 bg-white/95 hover:bg-white shadow-md"
                    onClick={() => triggerPhotoUpload('cover')}
                    disabled={uploadingPhoto === 'cover'}
                  >
                    {uploadingPhoto === 'cover' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        {formData.cover_photo_url ? 'Change Cover' : 'Add Cover'}
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Profile Photo */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage src={formData.profile_photo_url || ''} />
                      <AvatarFallback className="text-lg font-semibold">
                        {getInitials(formData.business_name || 'Business')}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white shadow-md hover:bg-gray-50"
                      onClick={() => triggerPhotoUpload('profile')}
                      disabled={uploadingPhoto === 'profile'}
                      title={formData.profile_photo_url ? 'Change profile photo' : 'Add profile photo'}
                    >
                      {uploadingPhoto === 'profile' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="pt-16 pb-6 px-6 text-center space-y-2">
                {/* Business Name */}
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {formData.business_name || 'Business Name'}
                  </h2>
                  <p className="text-gray-500 mt-2">
                    {formData.profile_title || 'Professional Service Provider'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Editable Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <Card className="border border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Basic Information</CardTitle>
              <CardDescription className="text-gray-500">Business details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Row 1: Business Name, Profile Title, Hourly Rate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) => handleInputChange('business_name', e.target.value)}
                        placeholder="Enter business name"
                      />
                      {errors.business_name && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.business_name}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-900 font-medium">{formData.business_name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile_title">Profile Title</Label>
                  {isEditing ? (
                    <Input
                      id="profile_title"
                      value={formData.profile_title}
                      onChange={(e) => handleInputChange('profile_title', e.target.value)}
                      placeholder="e.g., Professional Plumber"
                    />
                  ) : (
                    <p className="text-gray-600">{formData.profile_title || 'No title set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="hourly_rate"
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                        placeholder="0.00"
                      />
                      {errors.hourly_rate && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.hourly_rate}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-900 font-medium">
                      {formData.hourly_rate ? `$${formData.hourly_rate}/hour` : 'Not set'}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Phone Number, Allow Phone Contact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="phone_number"
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                      {errors.phone_number && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.phone_number}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-900">{formData.phone_number || 'Not provided'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allow_phone_contact">Allow Phone Contact</Label>
                  {isEditing ? (
                    <div className="flex items-center space-x-2 pt-2">
                      <Switch
                        id="allow_phone_contact"
                        checked={formData.allow_phone_contact}
                        onCheckedChange={(checked) => handleInputChange('allow_phone_contact', checked)}
                      />
                      <Label htmlFor="allow_phone_contact" className="text-sm">
                        {formData.allow_phone_contact ? 'Yes' : 'No'}
                      </Label>
                    </div>
                  ) : (
                    <p className="text-gray-900">
                      {formData.allow_phone_contact ? 'Yes' : 'No'}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: About Your Business */}
              <div className="space-y-2">
                <Label htmlFor="about">About Your Business</Label>
                {isEditing ? (
                  <Textarea
                    id="about"
                    value={formData.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    placeholder="Describe services, experience, and what makes this business unique..."
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {formData.about || 'No description provided'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Area */}
          <Card className="border border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Service Area</CardTitle>
              <CardDescription className="text-gray-500">Where services are provided</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="zip_code"
                        value={formData.zip_code}
                        onChange={(e) => handleInputChange('zip_code', e.target.value)}
                        placeholder="12345"
                      />
                      {errors.zip_code && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.zip_code}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-900">{formData.zip_code || 'Not set'}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_radius">Service Radius (miles)</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="service_radius"
                        type="number"
                        value={formData.service_radius}
                        onChange={(e) => handleInputChange('service_radius', e.target.value)}
                        placeholder="25"
                      />
                      {errors.service_radius && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.service_radius}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-900">{formData.service_radius || 'Not set'} miles</p>
                  )}
                </div>
              </div>

              {/* Service Types */}
              <div className="space-y-3">
                <Label>Service Types *</Label>
                {isEditing ? (
                  <div className="space-y-3">
                    {errors.service_types && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.service_types}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="offers_virtual_services"
                        checked={formData.offers_virtual_services}
                        onCheckedChange={(checked) => handleInputChange('offers_virtual_services', checked)}
                      />
                      <Label htmlFor="offers_virtual_services" className="text-sm font-normal">
                        Virtual Services
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="offers_in_person_services"
                        checked={formData.offers_in_person_services}
                        onCheckedChange={(checked) => handleInputChange('offers_in_person_services', checked)}
                      />
                      <Label htmlFor="offers_in_person_services" className="text-sm font-normal">
                        In-Person Services
                      </Label>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {formData.offers_virtual_services && (
                      <Badge variant="secondary">Virtual Services</Badge>
                    )}
                    {formData.offers_in_person_services && (
                      <Badge variant="secondary">In-Person Services</Badge>
                    )}
                    {!formData.offers_virtual_services && !formData.offers_in_person_services && (
                      <p className="text-gray-500 text-sm">No service types selected</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Categories */}
          <Card className="border border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Service Categories</CardTitle>
              <CardDescription className="text-gray-500">Categories where this vendor appears</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryPopoverOpen}
                        className="w-full justify-between"
                      >
                        {vendorCategories.length > 0
                          ? `${vendorCategories.length} selected`
                          : 'Select categories...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandEmpty>No category found.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {categories.map((category) => (
                              <CommandItem
                                key={category.id}
                                onSelect={() => toggleCategory(category.id)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.service_categories.includes(category.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {category.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.service_categories && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.service_categories}
                    </p>
                  )}
                  {vendorCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {vendorCategories.map((category) => (
                        <Badge key={category?.id} variant="secondary">
                          {category?.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {vendorCategories.length > 0 ? (
                    vendorCategories.map((category) => (
                      <Badge key={category?.id} variant="secondary">
                        {category?.name}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No categories selected</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        onOpenChange={setCropModalOpen}
        imageSrc={imageToCrop}
        onCropComplete={handleCroppedImage}
        aspectRatio={cropType === 'profile' ? 1 : 16 / 9}
      />
    </div>
  )
}
