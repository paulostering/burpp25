'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Save,
  Edit,
  X,
  Upload,
  Phone,
  AlertCircle,
  Loader2,
  Camera,
  User,
  Mail,
  Lock,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile } from '@/types/db'
import { ImageCropModal } from '@/components/image-crop-modal'

interface UserProfileManagerProps {
  userProfile: UserProfile
  onProfileUpdate: (updatedProfile: UserProfile) => void
}

export function UserProfileManager({ userProfile, onProfileUpdate }: UserProfileManagerProps) {
  const { user } = useAuth()
  const supabase = createClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [formData, setFormData] = useState({
    first_name: userProfile.first_name || '',
    last_name: userProfile.last_name || '',
    phone_number: userProfile.phone_number || '',
    profile_photo_url: userProfile.profile_photo_url || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>('')

  // Password Reset State
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  })
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Delete Account State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const profilePhotoInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (formData.phone_number && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number'
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
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number || null,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userProfile.id)
        .select()
        .single()

      if (error) throw error

      toast.success('Profile updated successfully!')
      setIsEditing(false)
      onProfileUpdate(data)
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      first_name: userProfile.first_name || '',
      last_name: userProfile.last_name || '',
      phone_number: userProfile.phone_number || '',
      profile_photo_url: userProfile.profile_photo_url || '',
    })
    setErrors({})
    setIsEditing(false)
  }

  const validateImage = (file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return 'Please upload a valid image file (JPEG, PNG, or WebP)'
    }

    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return 'Image size must be less than 5MB'
    }

    return null
  }

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validationError = validateImage(file)
      if (validationError) {
        toast.error(validationError)
        e.target.value = ''
        return
      }

      const url = URL.createObjectURL(file)
      setImageToCrop(url)
      setCropModalOpen(true)
    }
    e.target.value = ''
  }

  const handleCroppedImageUpload = async (croppedBlob: Blob) => {
    setUploadingPhoto(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('You must be logged in to upload photos')
        return
      }

      const fileName = 'profile.jpg'
      const file = new File([croppedBlob], fileName, { type: 'image/jpeg' })
      const filePath = `${user.id}/profile/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('users')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      if (!uploadData) {
        toast.error('Upload failed: No data returned')
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('users')
        .getPublicUrl(uploadData.path)

      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`

      const { data: updatedProfile, error: updateError } = await supabase
        .from('user_profiles')
        .update({
          profile_photo_url: cacheBustedUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id)
        .select()
        .single()

      if (updateError) {
        toast.error(`Failed to update profile: ${updateError.message}`)
        return
      }

      setFormData(prev => ({ ...prev, profile_photo_url: cacheBustedUrl }))
      onProfileUpdate(updatedProfile)
      toast.success('Profile photo updated successfully!')
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const getInitials = () => {
    const first = formData.first_name || userProfile.first_name || ''
    const last = formData.last_name || userProfile.last_name || ''
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || userProfile.email.charAt(0).toUpperCase()
  }

  // Password validation
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  // Handle Password Reset
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    const validationError = validatePassword(passwordForm.newPassword)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setPasswordLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (error) throw error

      toast.success('Password updated successfully')
      setPasswordForm({
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('Failed to update password. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm')
      return
    }

    setDeleteLoading(true)

    try {
      // Call API to delete account (requires admin privileges)
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmText: deleteConfirmText })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Sign out user locally
      await supabase.auth.signOut()

      toast.success('Account deleted successfully')
      window.location.href = '/'
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account. Please contact support.')
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Profile Information</h2>
          <p className="text-gray-600 mt-1">Manage your personal information and profile photo</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleCancel} variant="outline" size="sm" disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} size="sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column - Profile Photo */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-gray-200 shadow-none">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={formData.profile_photo_url} alt="Profile photo" />
                  <AvatarFallback className="text-3xl">{getInitials()}</AvatarFallback>
                </Avatar>
                {uploadingPhoto && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button
                  onClick={() => profilePhotoInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  disabled={uploadingPhoto}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {formData.profile_photo_url ? 'Change Photo' : 'Upload Photo'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG or WebP. Max size 5MB.
                </p>
              </div>
              <input
                ref={profilePhotoInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoInputChange}
              />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Form Fields */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Personal Information</CardTitle>
              <CardDescription className="text-gray-500">Your account details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={userProfile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="first_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name {isEditing && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="first_name"
                type="text"
                placeholder="Enter your first name"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                disabled={!isEditing}
                className={errors.first_name ? 'border-destructive' : ''}
              />
              {errors.first_name && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.first_name}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="last_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Last Name {isEditing && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="last_name"
                type="text"
                placeholder="Enter your last name"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                disabled={!isEditing}
                className={errors.last_name ? 'border-destructive' : ''}
              />
              {errors.last_name && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.last_name}</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number
              </Label>
              <Input
                id="phone_number"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone_number}
                onChange={(e) => handleInputChange('phone_number', e.target.value)}
                disabled={!isEditing}
                className={errors.phone_number ? 'border-destructive' : ''}
              />
              {errors.phone_number && (
                <div className="flex items-center gap-1 text-destructive text-sm">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.phone_number}</span>
                </div>
              )}
            </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Reset */}
          <Card className="border border-gray-200 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Change Password</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters with uppercase, lowercase, and numbers
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone - Delete Account */}
          <Card className="border-destructive shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                <CardTitle className="text-xl text-destructive">Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-gray-500">
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-4 p-4 border border-destructive rounded-lg bg-destructive/5">
                  <div className="space-y-2">
                    <p className="text-destructive">
                      This action cannot be undone. Type "DELETE" to confirm:
                    </p>
                    <Label htmlFor="deleteConfirm" className="sr-only">
                      Delete confirmation
                    </Label>
                    <Input
                      id="deleteConfirm"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="border-destructive"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                    >
                      {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirm Delete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      disabled={deleteLoading}
                    >
                      Cancel
                    </Button>
                  </div>
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
        onCropComplete={handleCroppedImageUpload}
        aspectRatio={1}
        title="Crop Profile Photo"
      />
    </>
  )
}
