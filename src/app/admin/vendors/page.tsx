'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VendorsDataTable } from '@/components/admin/vendors-data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { Store, Building, Calendar } from 'lucide-react'
import type { VendorProfile } from '@/types/db'

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate stats from vendors data
  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const newToday = vendors.filter(vendor => {
      if (!vendor.created_at) return false
      const createdAt = new Date(vendor.created_at)
      return createdAt >= startOfToday
    }).length

    const newThisWeek = vendors.filter(vendor => {
      if (!vendor.created_at) return false
      const createdAt = new Date(vendor.created_at)
      return createdAt >= startOfWeek
    }).length

    const newThisMonth = vendors.filter(vendor => {
      if (!vendor.created_at) return false
      const createdAt = new Date(vendor.created_at)
      return createdAt >= startOfMonth
    }).length

    return {
      today: newToday,
      week: newThisWeek,
      month: newThisMonth
    }
  }, [vendors])

  const fetchVendors = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/vendors', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vendors')
      }
      
      setVendors(data.vendors || [])
    } catch (err) {
      console.error('Error fetching vendors:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch vendors')
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVendors()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Vendors</h1>
        </div>

        <Card>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Vendors</h1>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchVendors}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Vendors</h1>
        <p className="text-gray-600 mt-1">
          View and manage vendor profiles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Vendors Today
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500">
              <Store className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.today.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Registered today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Vendors This Week
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500">
              <Building className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.week.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Since Sunday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Vendors This Month
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {stats.month.toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Since {new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <VendorsDataTable vendors={vendors} />
        </CardContent>
      </Card>
    </div>
  )
}


