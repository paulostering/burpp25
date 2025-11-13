import { Suspense } from 'react'
import { SearchClient } from './search-client'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'

function SearchFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search Results Header Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Vendor Results Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, index) => (
            <Card key={index} className="overflow-hidden border-0 shadow-sm">
              {/* Image Skeleton */}
              <Skeleton className="aspect-square w-full" />
              
              {/* Content Skeleton */}
              <div className="p-4 space-y-2">
                {/* Business Name */}
                <Skeleton className="h-5 w-3/4" />
                
                {/* Reviews */}
                <Skeleton className="h-4 w-1/2" />
                
                {/* Rate */}
                <Skeleton className="h-4 w-2/3" />
                
                {/* Badge */}
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient />
    </Suspense>
  )
}


