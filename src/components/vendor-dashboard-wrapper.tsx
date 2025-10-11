'use client'

import { useState } from 'react'
import { VendorProfileManager } from './vendor-profile-manager'
import { VendorSettings } from './vendor-settings'
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
                onClick={() => setCurrentView('profile')}
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
                onClick={() => setCurrentView('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  currentView === 'products'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Product Offering</span>
                </div>
              </button>
              <button
                onClick={() => setCurrentView('settings')}
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Product Offering</h3>
              <p className="text-gray-600 mb-6">
                Manage your services, packages, and pricing options
              </p>
              <p className="text-sm text-gray-500">Coming soon...</p>
            </div>
          </div>
        )}
        
        {currentView === 'settings' && (
          <VendorSettings vendor={vendor} />
        )}
      </div>
    </div>
  )
}
