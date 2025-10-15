'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { 
  User, 
  Trash2,
  Loader2,
  Mail,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import type { VendorProfile } from '@/types/db'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AdminVendorSettingsProps {
  vendor: VendorProfile
  onVendorUpdate: (updatedVendor: VendorProfile) => void
}

export function AdminVendorSettings({ vendor, onVendorUpdate }: AdminVendorSettingsProps) {
  const supabase = createClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [approvalLoading, setApprovalLoading] = useState(false)

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleToggleApproval = async (checked: boolean) => {
    setApprovalLoading(true)
    try {
      const response = await fetch(`/api/admin/vendors/${vendor.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          admin_approved: checked,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update vendor status')
      }

      toast.success(checked ? 'Vendor activated successfully' : 'Vendor deactivated successfully')
      onVendorUpdate(result.data)
    } catch (error) {
      console.error('Error toggling approval:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update vendor status')
    } finally {
      setApprovalLoading(false)
    }
  }

  const handleDeleteVendor = async () => {
    if (deleteConfirmText !== vendor.business_name) {
      toast.error('Business name does not match')
      return
    }

    setDeleteLoading(true)
    try {
      // Delete vendor profile
      const { error: vendorError } = await supabase
        .from('vendor_profiles')
        .delete()
        .eq('id', vendor.id)

      if (vendorError) throw vendorError

      // Note: Related data (conversations, messages, reviews, products) 
      // should be handled by database CASCADE rules or separate cleanup

      toast.success('Vendor profile deleted successfully')
      
      // Redirect to vendors list
      window.location.href = '/admin/vendors'
    } catch (error) {
      console.error('Error deleting vendor:', error)
      toast.error('Failed to delete vendor profile')
    } finally {
      setDeleteLoading(false)
      setDeleteDialogOpen(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Vendor Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Vendor Account Information
          </CardTitle>
          <CardDescription>
            View vendor account details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Business Name</Label>
              <p className="text-base">{vendor.business_name || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Contact Name</Label>
              <p className="text-base">
                {vendor.first_name && vendor.last_name 
                  ? `${vendor.first_name} ${vendor.last_name}`
                  : 'N/A'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <p className="text-base">{vendor.email || 'N/A'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
              <p className="text-base">{vendor.phone_number || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Vendor ID</Label>
              <p className="text-sm font-mono text-gray-600">{vendor.id}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">User ID</Label>
              <p className="text-sm font-mono text-gray-600">{vendor.user_id || 'N/A'}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Member Since</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-base">{formatDate(vendor.created_at)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-base">{formatDate(vendor.updated_at)}</p>
              </div>
            </div>
          </div>

          {/* Approval Status */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Label className="font-semibold">Vendor Status</Label>
                  {vendor.admin_approved ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {vendor.admin_approved 
                    ? 'Active - Vendor is visible in search results'
                    : 'Inactive - Vendor is not visible in search results'
                  }
                </p>
                {vendor.approved_at && vendor.admin_approved && (
                  <p className="text-sm text-gray-500">
                    Activated on {formatDate(vendor.approved_at)}
                  </p>
                )}
              </div>
              <Switch
                checked={vendor.admin_approved || false}
                onCheckedChange={handleToggleApproval}
                disabled={approvalLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that will permanently affect this vendor account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div className="space-y-1">
              <h4 className="font-medium text-red-900">Delete Vendor Profile</h4>
              <p className="text-sm text-red-700">
                Permanently delete this vendor profile and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor profile
              for <strong>{vendor.business_name}</strong> and remove all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Profile information and photos</li>
                <li>Products and services</li>
                <li>Conversations and messages</li>
                <li>Reviews and ratings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <Label htmlFor="delete-confirm">
              Type <strong>{vendor.business_name}</strong> to confirm
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Enter business name"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVendor}
              disabled={deleteLoading || deleteConfirmText !== vendor.business_name}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

