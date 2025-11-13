'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VendorProductForm } from '@/components/vendor-product-form'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'
import type { VendorProduct } from '@/types/db'

export default function EditProductPage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [product, setProduct] = useState<VendorProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return
      
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Get vendor profile by user_id
        const { data: vendor, error: vendorError } = await supabase
          .from('vendor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (vendorError || !vendor) {
          console.error('Vendor profile not found:', vendorError)
          router.push('/dashboard')
          return
        }

        // Get product data
        const { data: productData, error: productError } = await supabase
          .from('vendor_products')
          .select('*')
          .eq('id', productId)
          .eq('vendor_id', vendor.id)
          .single()

        if (productError || !productData) {
          console.error('Product not found:', productError)
          router.push('/dashboard?tab=products')
          return
        }

        setVendorId(vendor.id)
        setProduct(productData)
      } catch (err) {
        console.error('Error loading data:', err)
        router.push('/dashboard?tab=products')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, authLoading, router, supabase, productId])

  if (loading || authLoading || !vendorId || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <VendorProductForm 
      vendorId={vendorId} 
      productId={productId}
      initialData={product}
    />
  )
}

