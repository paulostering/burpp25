'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  Upload, 
  CheckCircle, 
  Globe, 
  MapPin,
  DollarSign,
  Phone,
  AlertCircle,
  Loader2,
  Camera,
  Image as ImageIcon
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import type { VendorProfile, Category } from '@/types/db'

interface VendorProfileManagerProps {
  vendor: VendorProfile
  categories: Category[]
  onProfileUpdate: (updatedVendor: VendorProfile) => void
}

export function VendorProfileManager({ vendor, categories, onProfileUpdate }: VendorProfileManagerProps) {
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
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)
  const coverPhotoInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

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
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('vendor_profiles')
        .update(updateData)
        .eq('id', vendor.id)
        .select()
        .single()

      if (error) throw error

      toast.success('Profile updated successfully!')
      setIsEditing(false)
      onProfileUpdate(data)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
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
    })
    setErrors({})
    setIsEditing(false)
  }

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = formData.service_categories.includes(categoryId)
      ? formData.service_categories.filter(id => id !== categoryId)
      : [...formData.service_categories, categoryId]
    
    handleInputChange('service_categories', newCategories)
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

  const handlePhotoUpload = async (file: File, type: 'profile' | 'cover') => {
    // Validate image
    const validationError = validateImage(file)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setUploadingPhoto(type)

    try {
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to upload photos')
        return
      }

      // Create file path following vendor registration pattern: {userId}/{type}/{filename}
      const fileExt = file.name.split('.').pop()
      const fileName = type === 'profile' ? 'profile.jpg' : 'cover.jpg'
      const filePath = `${user.id}/${type}/${fileName}`

      // Upload to Supabase Storage with upsert to replace existing
      console.log('Uploading to path:', filePath)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vendor')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      if (!uploadData) {
        console.error('No upload data returned')
        toast.error('Upload failed: No data returned')
        return
      }

      console.log('Upload successful:', uploadData)

      // Get public URL with cache-busting timestamp
      const { data: { publicUrl } } = supabase.storage
        .from('vendor')
        .getPublicUrl(uploadData.path)

      // Add timestamp to URL to bust cache
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`

      console.log('Public URL:', cacheBustedUrl)

      // Update vendor profile in database
      const updateField = type === 'profile' ? 'profile_photo_url' : 'cover_photo_url'
      console.log('Updating vendor profile:', { [updateField]: cacheBustedUrl })
      
      const { data: updatedVendor, error: updateError } = await supabase
        .from('vendor_profiles')
        .update({ 
          [updateField]: cacheBustedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id)
        .select()
        .single()

      if (updateError) {
        console.error('Database update error:', updateError)
        toast.error(`Failed to update profile: ${updateError.message}`)
        return
      }

      if (!updatedVendor) {
        console.error('No vendor data returned from update')
        toast.error('Failed to update profile: No data returned')
        return
      }

      console.log('Profile updated successfully:', updatedVendor)

      // Update local state with cache-busted URL
      setFormData(prev => ({
        ...prev,
        [updateField]: cacheBustedUrl
      }))

      // Notify parent component
      onProfileUpdate(updatedVendor)

      toast.success(`${type === 'profile' ? 'Profile' : 'Cover'} photo updated successfully!`)
    } catch (error) {
      console.error('Error uploading photo:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      toast.error(`Failed to upload ${type} photo. Please try again.`)
    } finally {
      setUploadingPhoto(null)
    }
  }

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0]
    if (file) {
      handlePhotoUpload(file, type)
    }
    // Reset input value to allow uploading the same file again
    e.target.value = ''
  }

  const triggerPhotoUpload = (type: 'profile' | 'cover') => {
    if (type === 'profile') {
      profilePhotoInputRef.current?.click()
    } else {
      coverPhotoInputRef.current?.click()
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Management</h2>
          <p className="text-gray-600">Manage your business profile information</p>
        </div>
        <div className="flex space-x-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Profile Overview */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Photo Section - Matching Public View */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                <div className="relative">
                  {/* Cover Photo */}
                  <div className="h-48 bg-gradient-to-r from-primary to-primary/60 relative rounded-t-lg">
                    {formData.cover_photo_url ? (
                      <Image
                        src={formData.cover_photo_url}
                        alt="Cover"
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    ) : null}
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white"
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
                
                <div className="pt-16 pb-6 text-center space-y-4">
                  {/* Business Name */}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {formData.business_name || 'Business Name'}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {formData.profile_title || 'Professional Service Provider'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">Service Area</p>
                  <p className="text-sm text-gray-600">
                    {formData.zip_code ? (
                      <>Within {formData.service_radius || 25} miles of {formData.zip_code}</>
                    ) : (
                      'Virtual services only'
                    )}
                  </p>
                </div>
              </div>
              
              {formData.hourly_rate && (
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Hourly Rate</p>
                    <p className="text-sm text-gray-600">${formData.hourly_rate}/hour</p>
                  </div>
                </div>
              )}
              
              {formData.phone_number && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-gray-600">{formData.phone_number}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Editable Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your business details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  {isEditing ? (
                    <>
                      <Input
                        id="business_name"
                        value={formData.business_name}
                        onChange={(e) => handleInputChange('business_name', e.target.value)}
                        placeholder="Enter your business name"
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About Your Business</Label>
                {isEditing ? (
                  <Textarea
                    id="about"
                    value={formData.about}
                    onChange={(e) => handleInputChange('about', e.target.value)}
                    placeholder="Describe your services, experience, and what makes you unique..."
                    rows={4}
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {formData.about || 'No description provided'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <div className="flex items-center space-x-2">
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
            </CardContent>
          </Card>

          {/* Service Area */}
          <Card>
            <CardHeader>
              <CardTitle>Service Area</CardTitle>
              <CardDescription>Where you provide your services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <Label htmlFor="offers_virtual_services">Virtual Services</Label>
                      </div>
                      <Switch
                        id="offers_virtual_services"
                        checked={formData.offers_virtual_services}
                        onCheckedChange={(checked) => handleInputChange('offers_virtual_services', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-gray-400" />
                        <Label htmlFor="offers_in_person_services">In-Person Services</Label>
                      </div>
                      <Switch
                        id="offers_in_person_services"
                        checked={formData.offers_in_person_services}
                        onCheckedChange={(checked) => handleInputChange('offers_in_person_services', checked)}
                      />
                    </div>
                    {errors.service_types && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.service_types}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {formData.offers_virtual_services && (
                      <Badge className="bg-primary text-white px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Virtual
                      </Badge>
                    )}
                    {formData.offers_in_person_services && (
                      <Badge className="bg-primary text-white px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        In Person
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Service Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Service Categories</CardTitle>
              <CardDescription>What types of services you offer</CardDescription>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant={formData.service_categories.includes(category.id) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        {category.icon_url && (
                          <img 
                            src={category.icon_url} 
                            alt={`${category.name} icon`}
                            className="h-4 w-4 object-contain mr-2 filter brightness-0 invert"
                          />
                        )}
                        {category.name}
                        {formData.service_categories.includes(category.id) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                  {errors.service_categories && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.service_categories}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {vendorCategories.length > 0 ? (
                    vendorCategories.map((category, index) => (
                      category && (
                        <Badge key={index} className="bg-primary text-white px-3 py-1 text-sm font-medium rounded-full flex items-center gap-2">
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
                    ))
                  ) : (
                    <p className="text-gray-500">No categories selected</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Status */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profile Status</span>
                  <Badge variant={vendor.admin_approved ? 'default' : 'secondary'}>
                    {vendor.admin_approved ? 'Approved' : 'Pending Approval'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Member Since</span>
                  <span className="text-sm text-gray-600">
                    {vendor.created_at ? formatDate(vendor.created_at) : 'Unknown'}
                  </span>
                </div>
                {vendor.updated_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Updated</span>
                    <span className="text-sm text-gray-600">
                      {formatDate(vendor.updated_at)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
