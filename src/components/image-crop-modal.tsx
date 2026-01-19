'use client'

import { useState, useCallback, useEffect } from 'react'
import Cropper from 'react-easy-crop'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ZoomOut, RotateCw, Loader2, RotateCcw } from 'lucide-react'

interface ImageCropModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageSrc: string
  onCropComplete: (croppedImage: Blob) => Promise<void>
  aspectRatio?: number
  title?: string
  description?: string
}

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export function ImageCropModal({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  title = 'Crop Image',
  description
}: ImageCropModalProps) {
  // State management
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [currentAspect, setCurrentAspect] = useState<number | undefined>(aspectRatio)

  // Sync aspect ratio when prop changes or modal opens
  useEffect(() => {
    if (open) {
      setCurrentAspect(aspectRatio)
      setIsImageLoading(true)
      // Reset crop/zoom on open
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
    }
  }, [open, aspectRatio])

  const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
    setCrop(newCrop)
  }, [])

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom)
  }, [])

  const onCropCompleteCallback = useCallback(
    (croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: CropArea,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { 
      alpha: false,
      willReadFrequently: false 
    })

    if (!ctx) {
      throw new Error('No 2d context')
    }

    // Set canvas to final crop size
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height

    // Fill with white background (prevents black if something goes wrong)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (rotation === 0) {
      // Simple path for no rotation - more reliable
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )
    } else {
      // Complex path for rotation
    const maxSize = Math.max(image.width, image.height)
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

      // Create temporary canvas for rotation
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = safeArea
      tempCanvas.height = safeArea
      const tempCtx = tempCanvas.getContext('2d', { alpha: false })
      
      if (!tempCtx) {
        throw new Error('Failed to create temp context')
      }

      // Fill temp canvas with white
      tempCtx.fillStyle = '#FFFFFF'
      tempCtx.fillRect(0, 0, safeArea, safeArea)

      // Rotate and draw
      tempCtx.translate(safeArea / 2, safeArea / 2)
      tempCtx.rotate((rotation * Math.PI) / 180)
      tempCtx.translate(-safeArea / 2, -safeArea / 2)
      tempCtx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    )

      // Draw cropped portion to final canvas
      ctx.drawImage(
        tempCanvas,
        safeArea / 2 - image.width * 0.5 + pixelCrop.x,
        safeArea / 2 - image.height * 0.5 + pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )
    }

    // Convert to blob with validation
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create image blob'))
            return
          }
          
          // Verify blob has meaningful data (not just headers)
          if (blob.size < 1000) {
            reject(new Error('Created image is suspiciously small - likely corrupted'))
            return
          }
          
          resolve(blob)
        },
        'image/jpeg',
        0.92
      )
    })
  }

  const handleSave = async () => {
    if (!croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      )
      await onCropComplete(croppedImage)
      onOpenChange(false)
    } catch (error) {
      console.error('Error cropping image:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }

  const handleCancel = () => {
    // Reset state
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setCroppedAreaPixels(null)
    setCurrentAspect(aspectRatio)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Crop Area */}
        <div className="relative h-[400px] bg-white rounded-lg overflow-hidden">
          {isImageLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500 font-medium">Loading photo...</p>
              </div>
            </div>
          )}
          
          {/* Quick Actions - Top Right Corner */}
          <div className="absolute top-3 right-3 z-20 flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRotate}
              className="h-8 px-3 text-xs bg-white/95 hover:bg-white shadow-md"
            >
              <RotateCw className="h-3 w-3 mr-1" />
              Rotate
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="h-8 px-3 text-xs bg-white/95 hover:bg-white shadow-md"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={currentAspect}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteCallback}
            onMediaLoaded={() => setIsImageLoading(false)}
            objectFit="contain"
            showGrid={false}
            classes={{
              containerClassName: 'rounded-lg',
              cropAreaClassName: 'border-2 border-white shadow-lg'
            }}
          />
        </div>

        {/* Controls */}
        <div className="space-y-4 pt-4">
          {/* Zoom & Rotation Controls - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                <span>Zoom</span>
              </div>
                <span className="text-xs">{zoom.toFixed(1)}x</span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Rotation Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                <span>Rotation</span>
              </div>
              <span className="text-xs">{rotation}°</span>
            </div>
            <Slider
              value={[rotation]}
              onValueChange={(value) => setRotation(value[0])}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>
          </div>
        </div>

        <DialogFooter className="border-t border-gray-200 pt-4 flex flex-row gap-2 sm:gap-2">
          <Button
            onClick={handleSave}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

