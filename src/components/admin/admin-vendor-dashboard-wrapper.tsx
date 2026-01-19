'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminVendorProfileManager } from './admin-vendor-profile-manager'
import { VendorProductsManager } from '../vendor-products-manager'
import { AdminVendorSettings } from './admin-vendor-settings'
import { Settings, User, Package, ChevronDown, Eye, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import type { VendorProfile, Category } from '@/types/db'

interface AdminVendorDashboardWrapperProps {
  vendor: VendorProfile
  stats: {
    conversations: number
    messages: number
    reviews: number
  }
  categories: Category[]
}

type DashboardView = 'profile' | 'products' | 'settings'

export function AdminVendorDashboardWrapper({ vendor: initialVendor, stats, categories }: AdminVendorDashboardWrapperProps) {
  const [vendor, setVendor] = useState<VendorProfile>(initialVendor)
  const [currentView, setCurrentView] = useState<DashboardView>('profile')
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize current view from URL params
  useEffect(() => {
    const tab = searchParams.get('tab') as DashboardView
    if (tab && ['profile', 'products', 'settings'].includes(tab)) {
      setCurrentView(tab)
    }
  }, [searchParams])

  const handleTabChange = (newView: DashboardView) => {
    setCurrentView(newView)
    // Update URL without causing a page refresh
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', newView)
    router.replace(`/admin/vendors/${vendor.id}?${params.toString()}`, { scroll: false })
  }

  const handleProfileUpdate = (updatedVendor: VendorProfile) => {
    setVendor(updatedVendor)
  }

  const handleResetPassword = async () => {
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Actions
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(`/vendor/${vendor.id}`, '_blank')}>
              <Eye className="mr-2 h-4 w-4" />
              View Public Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleResetPassword}>
              <KeyRound className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('profile')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentView === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile & Approval</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('products')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentView === 'products'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Products</span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              currentView === 'settings'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Admin Settings</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {currentView === 'profile' && (
        <AdminVendorProfileManager 
          vendor={vendor} 
          stats={stats}
          categories={categories} 
          onProfileUpdate={handleProfileUpdate}
        />
      )}
      
      {currentView === 'products' && (
        <VendorProductsManager vendorId={vendor.id} />
      )}
      
      {currentView === 'settings' && (
        <AdminVendorSettings vendor={vendor} onVendorUpdate={handleProfileUpdate} />
      )}
    </div>
  )
}

