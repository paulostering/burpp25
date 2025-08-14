"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { VendorProfile } from "@/types/db"

export default function VendorsList({ vendors }: { vendors: VendorProfile[] }) {
  if (!vendors?.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2">No professionals found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search criteria or expanding your search radius.
          </p>
          <Button onClick={() => window.history.back()}>
            Adjust Search
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vendors.map((vendor) => (
        <Link key={vendor.id} href={`/vendor/${vendor.id}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer h-full">
            {/* Image */}
            <div className="aspect-square relative bg-muted">
              {vendor.profile_photo_url ? (
                <Image
                  src={vendor.profile_photo_url}
                  alt={vendor.business_name || "Vendor"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-4xl font-semibold text-muted-foreground">
                  {vendor.business_name?.[0] ?? "V"}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Header */}
              <div>
                <h3 className="font-semibold text-lg leading-tight line-clamp-1">
                  {vendor.business_name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {vendor.profile_title}
                </p>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-medium">4.8</span>
                <span className="text-sm text-muted-foreground">(12)</span>
              </div>

              {/* Rate */}
              {typeof vendor.hourly_rate === "number" && (
                <div className="text-lg font-semibold">
                  ${vendor.hourly_rate}/hr
                </div>
              )}

              {/* Service Type Badges */}
              <div className="flex flex-wrap gap-1">
                {vendor.offers_virtual_services && (
                  <Badge variant="secondary" className="text-xs">
                    Virtual
                  </Badge>
                )}
                {vendor.offers_in_person_services && (
                  <Badge variant="secondary" className="text-xs">
                    In-Person
                  </Badge>
                )}
              </div>

              {/* View Profile Button */}
              <Button className="w-full">
                View Profile
              </Button>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}


