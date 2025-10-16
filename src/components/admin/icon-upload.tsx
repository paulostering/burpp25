'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface IconUploadProps {
  value?: string
  onChange: (url: string) => void
  onRemove: () => void
  disabled?: boolean
}

export function IconUpload({ value, onChange, onRemove, disabled = false }: IconUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const uploadIcon = async (file: File) => {
    if (!file) return

    // Validate file type (SVG only)
    const validTypes = ['image/svg+xml']
    if (!validTypes.includes(file.type)) {
      alert('Please upload an SVG file only')
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('File size must be less than 2MB')
      return
    }

    setIsUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('categories')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        alert('Failed to upload icon')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('categories')
        .getPublicUrl(fileName)

      onChange(urlData.publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload icon')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadIcon(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      uploadIcon(file)
    }
  }

  const handleRemove = async () => {
    if (!value) return

    try {
      // Extract filename from URL
      const urlParts = value.split('/')
      const fileName = urlParts[urlParts.length - 1]

      // Delete from Supabase storage
      const { error } = await supabase.storage
        .from('categories')
        .remove([fileName])

      if (error) {
        console.error('Delete error:', error)
      }
    } catch (error) {
      console.error('Delete error:', error)
    }

    onRemove()
  }

  return (
    <div className="space-y-4">
      <Label>Icon</Label>
      
      {value && value.trim() ? (
        <div className="flex items-center space-x-4">
          <div className="relative h-12 w-12 border rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden">
            <img 
              src={value} 
              alt="Category icon" 
              className="h-full w-full object-contain"
              style={{ minWidth: '20px', minHeight: '20px' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                // Show fallback
                const parent = e.currentTarget.parentElement
                if (parent) {
                  parent.innerHTML = '<div class="text-xs text-gray-400 p-2">Failed to load</div>'
                }
              }}
            />
          </div>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-gray-300",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
                     <input
             ref={fileInputRef}
             type="file"
             accept=".svg"
             onChange={handleFileSelect}
             className="hidden"
             disabled={disabled || isUploading}
           />
          
          <div className="space-y-2">
            {isUploading ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <div>
                  <p className="text-sm font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    SVG files only, up to 2MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled || isUploading}
                >
                  Choose File
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
