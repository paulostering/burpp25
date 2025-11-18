'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { EntitiesDataTable } from '@/components/admin/entities-data-table'
import { Skeleton } from '@/components/ui/skeleton'
import type { Category } from '@/types/db'

export default function AdminEntitiesPage() {
  const [entities, setEntities] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEntities = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/admin/entities', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch entities')
      }
      
      setEntities(data.entities || [])
    } catch (err) {
      console.error('Error fetching entities:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch entities')
      setEntities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEntities()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Entities</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">Manage Entities</h1>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchEntities}
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
        <h1 className="text-3xl font-bold text-gray-900">Manage Entities</h1>
      </div>

      <Card>
        <CardContent>
          <EntitiesDataTable entities={entities} />
        </CardContent>
      </Card>
    </div>
  )
}

