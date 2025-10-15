'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon,
  DollarSign,
  Eye,
  EyeOff,
  Save,
  X,
  Loader2,
  Package,
  AlertCircle,
  Upload
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { VendorProduct } from '@/types/db'
import Image from 'next/image'
import { ImageCropModal } from '@/components/image-crop-modal'

interface VendorProductsManagerProps {
  vendorId: string
}

export function VendorProductsManager({ vendorId }: VendorProductsManagerProps) {
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null)
  const [hasError, setHasError] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    starting_price: '',
    is_active: true,
  })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  
  // Image crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>('')
  const [croppedImageUrl, setCroppedImageUrl] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    if (vendorId) {
      fetchProducts()
    } else {
      setHasError(true)
      setLoading(false)
    }
  }, [vendorId])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setHasError(false)

      if (!vendorId) {
        setHasError(true)
        toast.error('No vendor ID found. Please ensure you have a vendor profile.')
        return
      }

      const response = await fetch(`/api/admin/vendors/${vendorId}/products`)
      const result = await response.json()

      if (!response.ok) {
        setHasError(true)
        toast.error(result.error || 'Failed to load products')
        return
      }

      setProducts(result.data || [])
      setHasError(false)
    } catch (error) {
      setHasError(true)
      toast.error('Failed to load products. Please try refreshing the page.')
    } finally {
      setLoading(false)
    }
  }

  const openDialog = (product?: VendorProduct) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        title: product.title,
        description: product.description,
        starting_price: product.starting_price?.toString() || '',
        is_active: product.is_active,
      })
      setPreviewUrl(product.image_url || '')
      setCroppedImageUrl('') // Reset cropped image when editing
    } else {
      setEditingProduct(null)
      setFormData({
        title: '',
        description: '',
        starting_price: '',
        is_active: true,
      })
      setPreviewUrl('')
      setCroppedImageUrl('')
    }
    setSelectedFile(null)
    setUploadProgress(0)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingProduct(null)
    setFormData({
      title: '',
      description: '',
      starting_price: '',
      is_active: true,
    })
    setSelectedFile(null)
    setPreviewUrl('')
    setCroppedImageUrl('')
    setUploadProgress(0)
  }

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
    
    // Create preview URL and open crop modal
    const reader = new FileReader()
    reader.onloadend = () => {
      const imageUrl = reader.result as string
      setImageToCrop(imageUrl)
      setCropModalOpen(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    // Convert blob to data URL for preview
    const reader = new FileReader()
    reader.onloadend = () => {
      const dataUrl = reader.result as string
      setCroppedImageUrl(dataUrl)
      setPreviewUrl(dataUrl)
    }
    reader.readAsDataURL(croppedBlob)
    setCropModalOpen(false)
  }

  const handleCropCancel = () => {
    setSelectedFile(null)
    setPreviewUrl(editingProduct?.image_url || '')
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

  const uploadImageToStorage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true)
      setUploadProgress(0)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${vendorId}/product/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vendor')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      setUploadProgress(100)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('vendor')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      toast.error('Failed to upload image')
      return null
    } finally {
      setUploadingImage(false)
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
      
      let imageUrl = editingProduct?.image_url || null

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
        if (editingProduct?.image_url && editingProduct.image_url.includes('supabase')) {
          await deleteImageFromStorage(editingProduct.image_url)
        }
      }
      
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        starting_price: formData.starting_price ? parseFloat(formData.starting_price) : null,
        image_url: imageUrl,
        is_active: formData.is_active,
        display_order: editingProduct?.display_order || 0,
      }

      if (editingProduct) {
        // Update existing product via API
        const response = await fetch(`/api/admin/vendors/${vendorId}/products/${editingProduct.id}`, {
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

      closeDialog()
      fetchProducts()
    } catch (error) {
      toast.error('Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (product: VendorProduct) => {
    try {
      const response = await fetch(`/api/admin/vendors/${vendorId}/products/${product.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: product.title,
          description: product.description,
          starting_price: product.starting_price,
          image_url: product.image_url,
          is_active: !product.is_active,
          display_order: product.display_order,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product')
      }

      toast.success(product.is_active ? 'Product hidden' : 'Product published')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to update product')
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      // Find the product to get its image URL
      const product = products.find(p => p.id === productId)
      
      const response = await fetch(`/api/admin/vendors/${vendorId}/products/${productId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete product')
      }
      
      // Delete image from storage if it exists
      if (product?.image_url && product.image_url.includes('supabase')) {
        await deleteImageFromStorage(product.image_url)
      }

      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-7 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-96"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <div className="p-4 border border-gray-200 rounded-b-lg space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Products</h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                There was an error loading your products. This might be because the database migration hasn't been run yet.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={fetchProducts} variant="default">
                  <Loader2 className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left max-w-2xl mx-auto">
                <p className="text-sm font-semibold text-gray-900 mb-2">To fix this issue:</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Make sure you've run the database migration: <code className="bg-gray-200 px-2 py-1 rounded text-xs">supabase db push</code></li>
                  <li>Or apply the migration file <code className="bg-gray-200 px-2 py-1 rounded text-xs">009_create_vendor_products.sql</code> in your Supabase SQL Editor</li>
                  <li>Check the browser console for more details about the error</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Products & Services</CardTitle>
                <CardDescription className="mt-2">
                  Showcase your offerings to potential customers. Add photos, descriptions, and pricing to help customers understand your services.
                </CardDescription>
              </div>
              <Button onClick={() => openDialog()} className="shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No products yet</h3>
                <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                  Start showcasing your work by adding your first product or service. Include photos and pricing to attract more customers.
                </p>
                <Button onClick={() => openDialog()} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </div>
            ) : (
              <div className="flex flex-col">
                {products.map((product, index) => (
                  <Card
                    key={product.id}
                    className={`overflow-hidden transition-all border-0 shadow-none ${
                      !product.is_active ? 'opacity-60' : ''
                    } ${index < products.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    {/* Mobile Layout (stacked) */}
                    <div className="flex flex-col sm:hidden">
                      {/* Product Image */}
                      <div className="relative w-full h-48">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                            <ImageIcon className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge 
                            variant={product.is_active ? 'default' : 'secondary'}
                            className="shadow-sm text-xs"
                          >
                            {product.is_active ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hidden
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold text-lg">
                          {product.title.replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        
                        {product.starting_price && (
                          <div className="text-sm text-gray-600">
                            ${product.starting_price.toFixed(2)} / per hour
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600">
                          {product.description}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDialog(product)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Layout (horizontal) */}
                    <div className="hidden sm:flex">
                      {/* Product Image */}
                      <div className="relative w-32 h-32 flex-shrink-0">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.title}
                            fill
                            className="object-cover rounded-lg"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <Badge 
                            variant={product.is_active ? 'default' : 'secondary'}
                            className="shadow-sm text-xs"
                          >
                            {product.is_active ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Hidden
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 p-4">
                        <div className="flex justify-between items-start h-full">
                          <div className="flex-1 pr-4">
                            <h3 className="font-semibold text-lg mb-1">
                              {product.title.replace(/\b\w/g, l => l.toUpperCase())}
                            </h3>
                            
                            {product.starting_price && (
                              <div className="text-sm text-gray-600 mb-3">
                                ${product.starting_price.toFixed(2)} / per hour
                              </div>
                            )}
                            
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {product.description}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDialog(product)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete product"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update your product information below. Changes will be reflected immediately on your profile.'
                : 'Add a new product or service to showcase to potential customers.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
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
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="99.99"
                  value={formData.starting_price}
                  onChange={(e) => setFormData({ ...formData, starting_price: e.target.value })}
                  className="pl-9 text-base"
                />
              </div>
              <p className="text-xs text-gray-500">
                Optional - Display a starting price. Leave blank if pricing varies or is available upon request.
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

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={closeDialog} 
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
                  {editingProduct ? 'Update' : 'Add'} Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        aspectRatio={16/9}
        title="Crop Product Image"
        description="Crop your product image to the desired size. This will be the main image displayed for your product."
      />
    </>
  )
}

