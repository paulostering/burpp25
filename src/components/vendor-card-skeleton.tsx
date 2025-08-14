import { Card } from "@/components/ui/card"

export function VendorCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      {/* Image skeleton */}
      <div className="aspect-square bg-muted animate-pulse" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title and subtitle */}
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        </div>
        
        {/* Rating */}
        <div className="h-4 bg-muted rounded w-20 animate-pulse" />
        
        {/* Price */}
        <div className="h-6 bg-muted rounded w-24 animate-pulse" />
        
        {/* Badges */}
        <div className="flex gap-1">
          <div className="h-5 bg-muted rounded w-16 animate-pulse" />
          <div className="h-5 bg-muted rounded w-20 animate-pulse" />
        </div>
        
        {/* Button */}
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    </Card>
  )
}

export function VendorGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <VendorCardSkeleton key={i} />
      ))}
    </div>
  )
}
