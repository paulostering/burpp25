'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientsDataTable } from '@/components/admin/clients-data-table'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus, Users, Calendar } from 'lucide-react'
import type { UserProfile } from '@/types/db'

export default function AdminClientsPage() {
  const [clients, setClients] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calculate stats from clients data
  const stats = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay()) // Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const newToday = clients.filter(client => {
      const createdAt = new Date(client.created_at)
      return createdAt >= startOfToday
    }).length

    const newThisWeek = clients.filter(client => {
      const createdAt = new Date(client.created_at)
      return createdAt >= startOfWeek
    }).length

    const newThisMonth = clients.filter(client => {
      const createdAt = new Date(client.created_at)
      return createdAt >= startOfMonth
    }).length

    return {
      today: newToday,
      week: newThisWeek,
      month: newThisMonth
    }
  }, [clients])

  const fetchClients = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/clients', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch clients')
      }
      
      setClients(data.clients || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch clients')
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Clients</h1>
          <p className="text-gray-600 mt-1">
            View and manage customer accounts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Accounts</CardTitle>
          </CardHeader>
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Clients</h1>
          <p className="text-gray-600 mt-1">
            View and manage customer accounts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customer Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchClients}
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
        <h1 className="text-3xl font-bold text-gray-900">Manage Clients</h1>
        <p className="text-gray-600 mt-1">
          View and manage customer accounts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              New Clients Today
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500">
              <UserPlus className="h-4 w-4 text-white" />
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
              New Clients This Week
            </CardTitle>
            <div className="p-2 rounded-lg bg-green-500">
              <Users className="h-4 w-4 text-white" />
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
              New Clients This Month
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
        <CardHeader>
          <CardTitle>Customer Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientsDataTable clients={clients} />
        </CardContent>
      </Card>
    </div>
  )
}


