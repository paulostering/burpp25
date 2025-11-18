'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ClientsDataTable } from '@/components/admin/clients-data-table'
import { Skeleton } from '@/components/ui/skeleton'
import type { UserProfile } from '@/types/db'

export default function AdminClientsPage() {
  const [clients, setClients] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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


