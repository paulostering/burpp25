'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VendorProfileManager } from './vendor-profile-manager'
import { VendorSettings } from './vendor-settings'
import { VendorProductsManager } from './vendor-products-manager'
import { Settings, User, Package } from 'lucide-react'
import type { VendorProfile, Category } from '@/types/db'

interface VendorDashboardWrapperProps {
  vendor: VendorProfile
  stats: {
    conversations: number
    messages: number
    reviews: number
  }
  categories: Category[]
}

type DashboardView = 'profile' | 'products' | 'settings'

export function VendorDashboardWrapper({ vendor: initialVendor, stats, categories }: VendorDashboardWrapperProps) {
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
    router.replace(`/dashboard?${params.toString()}`, { scroll: false })
  }

  const handleProfileUpdate = (updatedVendor: VendorProfile) => {
    setVendor(updatedVendor)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
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
                  <span>Profile</span>
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
                  <span>Settings</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {currentView === 'profile' && (
          <VendorProfileManager 
            vendor={vendor} 
            categories={categories} 
            onProfileUpdate={handleProfileUpdate}
          />
        )}
        
        {currentView === 'products' && (
          <VendorProductsManager vendorId={vendor.id} />
        )}
        
        {currentView === 'settings' && (
          <VendorSettings vendor={vendor} />
        )}
      </div>
    </div>
  )
}
