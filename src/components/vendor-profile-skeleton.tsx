import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function VendorProfileSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Cover Photo with Profile Photo Skeleton */}
            <Card className="overflow-hidden">
              <div className="relative">
                {/* Cover Photo Skeleton */}
                <Skeleton className="h-48 w-full" />
                
                {/* Profile Photo Skeleton */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                  <Skeleton className="h-24 w-24 rounded-full border-4 border-white" />
                </div>
              </div>
              
              <CardContent className="pt-16 pb-6 text-center space-y-4">
                {/* Business Name Skeleton */}
                <div>
                  <Skeleton className="h-8 w-48 mx-auto" />
                  <Skeleton className="h-5 w-32 mx-auto mt-2" />
                </div>

                {/* Action Buttons Skeleton */}
                <div className="flex justify-center space-x-3">
                  <Skeleton className="h-9 w-20" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>

            {/* Service Rates Skeleton */}
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-10 w-40" />
              </CardContent>
            </Card>

            {/* Contact Actions Skeleton */}
            <Card>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Me Skeleton */}
            <div className="p-6 bg-white rounded-lg">
                <Skeleton className="h-6 w-24 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
            </div>

            {/* Service Details Skeleton */}
            <div className="p-6 bg-white rounded-lg space-y-6">
                <Skeleton className="h-6 w-32" />
                
                {/* Location Skeleton */}
                <div>
                  <Skeleton className="h-5 w-20 mb-2" />
                  <Skeleton className="h-4 w-48 mb-4" />
                  {/* Map Skeleton */}
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </div>

                {/* Service Offerings Skeleton */}
                <div>
                  <Skeleton className="h-5 w-16 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>

                {/* Categories Skeleton */}
                <div>
                  <Skeleton className="h-5 w-24 mb-2" />
                  <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-18" />
                    <Skeleton className="h-6 w-22" />
                  </div>
                </div>
            </div>

            {/* Reviews Skeleton */}
            <div className="p-6 bg-white rounded-lg">
                <div className="mb-6">
                  <Skeleton className="h-6 w-20 mb-2" />
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Skeleton key={i} className="h-4 w-4" />
                      ))}
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>

                {/* Reviews List Skeleton */}
                <div className="space-y-4">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Skeleton className="h-4 w-24" />
                            <div className="flex gap-1">
                              {Array.from({ length: 5 }, (_, j) => (
                                <Skeleton key={j} className="h-3 w-3" />
                              ))}
                            </div>
                          </div>
                          <Skeleton className="h-4 w-40 mb-1" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-3/4 mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>

            {/* Leave a Review Section Skeleton */}
            <div className="p-6 bg-white rounded-lg">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-4 w-48 mb-6" />
              
              <div className="space-y-4">
                {/* Rating Skeleton */}
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Skeleton key={i} className="h-6 w-6" />
                    ))}
                  </div>
                </div>

                {/* Title Skeleton */}
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>

                {/* Comment Skeleton */}
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-24 w-full" />
                </div>

                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
