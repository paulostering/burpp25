'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { VendorProductForm } from '@/components/vendor-product-form'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

export default function NewProductPage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadVendorData = async () => {
      if (authLoading) return
      
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Get vendor profile by user_id
        const { data: vendor, error } = await supabase
          .from('vendor_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (error || !vendor) {
          console.error('Vendor profile not found:', error)
          router.push('/dashboard')
          return
        }

        setVendorId(vendor.id)
      } catch (err) {
        console.error('Error loading vendor data:', err)
        router.push('/dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadVendorData()
  }, [user, authLoading, router, supabase])

  if (loading || authLoading || !vendorId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <VendorProductForm vendorId={vendorId} />
}

