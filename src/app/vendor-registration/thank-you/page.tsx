'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function VendorThankYouPage() {
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchVendorProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: vendorProfile, error } = await supabase
            .from('vendor_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (vendorProfile && !error) {
            setVendorId(vendorProfile.id)
          }
        }
      } catch (error) {
        console.error('Error fetching vendor profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchVendorProfile()
  }, [supabase])

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/images/burp_logo_letter.webp"
              alt="Burpp Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <h1 className="text-2xl font-semibold">You&apos;re officially a Burpp Pro!</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Thanks for joining us! You can now access and manage your services from your vendor profile.
        </p>
        <div className="flex justify-center">
          {loading ? (
            <Button disabled>
              Loading...
            </Button>
          ) : vendorId ? (
            <Button asChild>
              <Link href={`/vendor/${vendorId}`}>Go to Vendor Profile</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
