'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  DollarSign,
  Save,
  X,
  Loader2,
  Upload,
  Trash2,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import type { VendorProduct } from '@/types/db'
import Image from 'next/image'
import { ImageCropModal } from '@/components/image-crop-modal'
import { useRouter } from 'next/navigation'

interface VendorProductFormProps {
  vendorId: string
  productId?: string
  initialData?: VendorProduct
}

export function VendorProductForm({ vendorId, productId, initialData }: VendorProductFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    starting_price: initialData?.starting_price?.toString() || '',
    is_active: initialData?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>(initialData?.image_url || '')
  
  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>('')
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('')

  const supabase = createClient()
  const router = useRouter()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setSelectedFile(file)
    
    // Show loading state
    toast.loading('Preparing image...')
    
    // Create preview URL using blob (faster than FileReader)
    const imageUrl = URL.createObjectURL(file)
      setImageToCrop(imageUrl)
    
    // Use setTimeout to ensure state is set before opening modal
    setTimeout(() => {
      setCropModalOpen(true)
      toast.dismiss()
    }, 100)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Convert blob to URL for preview (faster than FileReader)
    const dataUrl = URL.createObjectURL(croppedBlob)
      setCroppedImageUrl(dataUrl)
      setPreviewUrl(dataUrl)
    setCropModalOpen(false)
  }

  const handleCropCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(initialData?.image_url || '')
    setCroppedImageUrl('')
    setCropModalOpen(false)
    
    // Clear the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setPreviewUrl('') // Clear preview completely
    setCroppedImageUrl('')
    
    // Clear the file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      // Delete via API route
      await fetch(`/api/admin/vendors/${vendorId}/product-image?imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
      })
    } catch (error) {
      // Don't show error to user as this is cleanup
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required')
      return
    }

    try {
      setSaving(true)
      
      let imageUrl = initialData?.image_url || null

      // If there's a cropped image, upload it first
      if (croppedImageUrl) {
        // Convert cropped image URL to blob and upload via API
        const response = await fetch(croppedImageUrl)
        const blob = await response.blob()
        
        // Create form data
        const uploadFormData = new FormData()
        uploadFormData.append('file', blob, 'product.jpg')

        // Upload via API route
        const uploadResponse = await fetch(`/api/admin/vendors/${vendorId}/product-image`, {
          method: 'POST',
          body: uploadFormData,
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          toast.error(uploadResult.error || 'Image upload failed. Please try again.')
          setSaving(false)
          return
        }

        imageUrl = uploadResult.publicUrl
        
        // If editing and there was an old image from storage, delete it
        if (initialData?.image_url && initialData.image_url.includes('supabase')) {
          await deleteImageFromStorage(initialData.image_url)
        }
      }
      
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
        image_url: imageUrl,
        is_active: formData.is_active,
        display_order: initialData?.display_order || 0,
      }

      if (productId) {
        // Update existing product via API
        const response = await fetch(`/api/admin/vendors/${vendorId}/products/${productId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update product')
        }

        toast.success('Product updated successfully')
      } else {
        // Create new product via API
        const response = await fetch(`/api/admin/vendors/${vendorId}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create product')
        }

        toast.success('Product added successfully')
      }

      // Navigate back to products list
      router.push('/dashboard?tab=products')
    } catch (error) {
      toast.error('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard?tab=products')
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            {productId ? 'Edit Product' : 'Add New Product'}
          </h1>
          <p className="text-gray-600 mt-2">
            {productId 
              ? 'Update your product information below. Changes will be reflected immediately on your profile.'
              : 'Add a new product or service to showcase to potential customers.'
            }
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-semibold">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Professional Wedding Photography Package"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-base"
                  maxLength={255}
                />
                <p className="text-xs text-gray-500">
                  Give your product or service a clear, descriptive name
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe what's included, the process, timeline, and what makes your service unique..."
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="text-base resize-none"
                />
                <p className="text-xs text-gray-500">
                  Provide detailed information to help customers understand your offering
                </p>
              </div>

              {/* Starting Price */}
              <div className="space-y-2">
                <Label htmlFor="starting_price" className="text-base font-semibold">
                  Starting Price / per hour
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    id="starting_price"
                    type="text"
                    inputMode="decimal"
                    placeholder="99.99"
                    value={formData.starting_price}
                    onChange={(e) => {
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
                      
                      // Cap at 10,000
                      if (numValue !== undefined && numValue > 10000) {
                        sanitized = '10000'
                      }
                      
                      setFormData({ ...formData, starting_price: sanitized })
                    }}
                    className="pl-9 text-base"
                    maxLength={8}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Optional - Display a starting price. Maximum: $10,000.00. Leave blank if pricing varies or is available upon request.
                </p>
              </div>

              {/* Active/Inactive Toggle */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-1">
                  <Label htmlFor="is_active" className="text-base font-semibold cursor-pointer">
                    Product Status
                  </Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {formData.is_active 
                      ? 'This product is visible to customers on your public profile' 
                      : 'This product is hidden from your public profile'}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  Product Image
                </Label>
                
                <div className="space-y-3">
                  {/* Upload Button */}
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                      disabled={uploadingImage}
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {selectedFile ? 'Change Image' : 'Upload Image'}
                    </Button>
                    {(selectedFile || croppedImageUrl) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveImage}
                        className="shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* File Info */}
                  {selectedFile && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <ImageIcon className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {uploadingImage && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Uploading...</span>
                        <span className="text-gray-600">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Upload an image (max 5MB). Images are stored securely in Supabase Storage.
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Preview</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <div className="relative h-64 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={handleCancel} 
                disabled={saving}
                className="min-w-24"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving || !formData.title.trim() || !formData.description.trim()}
                className="min-w-24"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {productId ? 'Update' : 'Add'} Product
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        open={cropModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCropCancel()
          }
        }}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
        title="Crop Image"
      />
    </>
  )
}

