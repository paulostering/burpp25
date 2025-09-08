'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { VendorWithProfile, Category } from '@/types/db'
import { X } from 'lucide-react'

interface VendorEditSheetProps {
  vendor?: VendorWithProfile | null
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function VendorEditSheet({ vendor, isOpen, onClose, onSave }: VendorEditSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    business_name: '',
    profile_title: '',
    about: '',
    hourly_rate: '',
    zip_code: '',
    service_radius: '',
    service_categories: [] as string[],
    offers_virtual_services: false,
    offers_in_person_services: false,
    allow_phone_contact: false,
    admin_approved: false,
    admin_notes: ''
  })

  const supabase = createClient()
  const isEditing = !!vendor

  useEffect(() => {
    if (isOpen) {
      loadCategories()
      if (vendor) {
        setFormData({
          business_name: vendor.business_name || '',
          profile_title: vendor.profile_title || '',
          about: vendor.about || '',
          hourly_rate: vendor.hourly_rate?.toString() || '',
          zip_code: vendor.zip_code || '',
          service_radius: vendor.service_radius?.toString() || '',
          service_categories: vendor.service_categories || [],
          offers_virtual_services: vendor.offers_virtual_services || false,
          offers_in_person_services: vendor.offers_in_person_services || false,
          allow_phone_contact: vendor.allow_phone_contact || false,
          admin_approved: vendor.admin_approved || false,
          admin_notes: vendor.admin_notes || ''
        })
      } else {
        // Reset form for new vendor
        setFormData({
          business_name: '',
          profile_title: '',
          about: '',
          hourly_rate: '',
          zip_code: '',
          service_radius: '',
          service_categories: [],
          offers_virtual_services: false,
          offers_in_person_services: false,
          allow_phone_contact: false,
          admin_approved: false,
          admin_notes: ''
        })
      }
    }
  }, [isOpen, vendor])

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    setCategories(data || [])
  }

  const handleCategoryToggle = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      service_categories: prev.service_categories.includes(categoryId)
        ? prev.service_categories.filter(id => id !== categoryId)
        : [...prev.service_categories, categoryId]
    }))
  }

  const handleSave = async () => {
    if (!formData.business_name.trim()) {
      toast.error('Business name is required')
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
        service_categories: formData.service_categories.length > 0 ? formData.service_categories : null,
        offers_virtual_services: formData.offers_virtual_services,
        offers_in_person_services: formData.offers_in_person_services,
        allow_phone_contact: formData.allow_phone_contact,
        admin_approved: formData.admin_approved,
        admin_notes: formData.admin_notes || null,
        updated_at: new Date().toISOString()
      }

      if (isEditing && vendor) {
        if (formData.admin_approved && !vendor.admin_approved) {
          // TODO: Add approved_at field to database schema and update accordingly
          // updateData.approved_at = new Date().toISOString()
          // TODO: Set approved_by to current admin user ID
        }

        const { error } = await supabase
          .from('vendor_profiles')
          .update(updateData)
          .eq('id', vendor.id)

        if (error) throw error
        toast.success('Vendor updated successfully')
      } else {
        // For new vendors, we'd need to create both auth user and vendor profile
        // This is more complex and might be better handled through invitation system
        toast.error('Creating new vendors not yet implemented')
        setIsLoading(false)
        return
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving vendor:', error)
      toast.error('Failed to save vendor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? 'Edit Vendor' : 'Create New Vendor'}
          </SheetTitle>
          <SheetDescription>
            {isEditing 
              ? 'Update vendor profile information and approval status'
              : 'Create a new vendor profile'
            }
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-900">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Enter business name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_title">Profile Title</Label>
              <Input
                id="profile_title"
                value={formData.profile_title}
                onChange={(e) => setFormData(prev => ({ ...prev, profile_title: e.target.value }))}
                placeholder="e.g., Professional Plumber"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">About</Label>
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) => setFormData(prev => ({ ...prev, about: e.target.value }))}
                placeholder="Describe the services and experience"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                <Input
                  id="hourly_rate"
                  type="number"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_radius">Service Radius (miles)</Label>
                <Input
                  id="service_radius"
                  type="number"
                  value={formData.service_radius}
                  onChange={(e) => setFormData(prev => ({ ...prev, service_radius: e.target.value }))}
                  placeholder="25"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code}
                onChange={(e) => setFormData(prev => ({ ...prev, zip_code: e.target.value }))}
                placeholder="12345"
              />
            </div>
          </div>

          {/* Profile Photos */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-900">Profile Photos</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Profile Photo URL</Label>
                <Input
                  value={vendor?.profile_photo_url || ''}
                  placeholder="https://example.com/profile.jpg"
                  disabled
                />
                <p className="text-xs text-gray-500">Profile photos are managed through the vendor registration process</p>
              </div>
              <div className="space-y-2">
                <Label>Cover Photo URL</Label>
                <Input
                  value={vendor?.cover_photo_url || ''}
                  placeholder="https://example.com/cover.jpg"
                  disabled
                />
                <p className="text-xs text-gray-500">Cover photos are managed through the vendor registration process</p>
              </div>
            </div>
          </div>

          {/* Service Categories */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-900">Service Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={formData.service_categories.includes(category.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  {category.name}
                  {formData.service_categories.includes(category.id) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Service Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-900">Service Options</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="offers_virtual_services">Offers Virtual Services</Label>
              <Switch
                id="offers_virtual_services"
                checked={formData.offers_virtual_services}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, offers_virtual_services: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="offers_in_person_services">Offers In-Person Services</Label>
              <Switch
                id="offers_in_person_services"
                checked={formData.offers_in_person_services}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, offers_in_person_services: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="allow_phone_contact">Allow Phone Contact</Label>
              <Switch
                id="allow_phone_contact"
                checked={formData.allow_phone_contact}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allow_phone_contact: checked }))}
              />
            </div>
          </div>

          {/* Admin Controls */}
          {isEditing && (
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-900">Admin Controls</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="admin_approved">Approved</Label>
                <Switch
                  id="admin_approved"
                  checked={formData.admin_approved}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, admin_approved: checked }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_notes">Admin Notes</Label>
                <Textarea
                  id="admin_notes"
                  value={formData.admin_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, admin_notes: e.target.value }))}
                  placeholder="Internal notes about this vendor"
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : (isEditing ? 'Update Vendor' : 'Create Vendor')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

