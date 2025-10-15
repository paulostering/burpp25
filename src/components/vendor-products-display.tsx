'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Image as ImageIcon } from 'lucide-react'
import type { VendorProduct } from '@/types/db'
import Image from 'next/image'

interface VendorProductsDisplayProps {
  vendorId: string
}

export function VendorProductsDisplay({ vendorId }: VendorProductsDisplayProps) {
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [vendorId])

  const fetchProducts = async () => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('vendor_products')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        // Silently fail for public display - just don't show products section
        setProducts([])
        return
      }

      setProducts(data || [])
    } catch (error) {
      // Silently fail for public display
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  // Don't render the section if there are no products
  if (!loading && products.length === 0) {
    return null
  }

  if (loading) {
    return (
      <div className="mb-8">
        <h3 className="font-semibold text-xl border-b border-gray-100 pb-4 mb-6">Products & Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
              <div className="p-4 border border-gray-200 rounded-b-lg">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h3 className="font-semibold text-xl border-b border-gray-100 pb-4 mb-6">Products & Services</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden p-0">
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <ImageIcon className="h-12 w-12 text-gray-300" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h4 className="font-semibold text-lg mb-1">
                {product.title.replace(/\b\w/g, l => l.toUpperCase())}
              </h4>
              
              {product.starting_price && (
                <div className="text-sm text-gray-600 mb-3">
                  ${product.starting_price.toFixed(2)} / per hour
                </div>
              )}
              
              <p className="text-sm text-gray-600 line-clamp-3">
                {product.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

