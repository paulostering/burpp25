'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Category } from '@/types/db'

export function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchFeaturedCategories = async () => {
      try {
        const response = await fetch('/api/categories/featured')
        if (response.ok) {
          const data = await response.json()
          setCategories(data)
        } else {
          console.error('Failed to fetch featured categories')
        }
      } catch (error) {
        console.error('Error fetching featured categories:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedCategories()
  }, [])

  const handleCategoryClick = (category: Category) => {
    const params = new URLSearchParams()
    params.set('category', category.id)
    params.set('q', '') // Empty location for now
    router.push(`/search?${params.toString()}`)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg border bg-card p-4 text-center text-sm flex items-center justify-center animate-pulse"
          >
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg border bg-card p-4 text-center text-sm flex items-center justify-center"
          >
            <span className="text-muted-foreground">No categories</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {categories.map((category) => {
        // Clean the icon URL - remove any emoji characters and ensure it's a valid URL
        const cleanIconUrl = category.icon_url ? 
          category.icon_url.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim() : 
          null
        
        // Only use the URL if it starts with http or https
        const validIconUrl = cleanIconUrl && (cleanIconUrl.startsWith('http://') || cleanIconUrl.startsWith('https://')) ? 
          cleanIconUrl : 
          null

        return (
          <div
            key={category.id}
            className="aspect-square rounded-lg border bg-card p-4 text-center text-sm flex items-center justify-center cursor-pointer hover:bg-accent transition-colors"
            onClick={() => handleCategoryClick(category)}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              {validIconUrl && (
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <img
                    src={validIconUrl}
                    alt={`${category.name} icon`}
                    className="h-8 w-8 object-contain filter brightness-0 invert"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              <span className="font-medium">{category.name}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
