'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { VendorProfile } from '@/types/db'

export default function VendorDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<VendorProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to access your vendor dashboard')
        return
      }

      const { data: p, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        toast.error('Error loading profile')
        return
      }

      setProfile(p)
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="text-center">Loading your vendor dashboard...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              It looks like your vendor profile hasn&apos;t been created yet.
            </p>
            <Button asChild>
              <a href="/vendor/registration">Complete Your Profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Vendor Dashboard</h1>
        <p className="text-muted-foreground">Manage your services and profile</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Business Name</label>
              <p className="text-lg">{profile.business_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Profile Title</label>
              <p className="text-lg">{profile.profile_title}</p>
            </div>
            <div>
              <label className="text-sm font-medium">About</label>
              <p className="text-muted-foreground">{profile.about}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {profile.offers_virtual_services && <Badge>Virtual Services</Badge>}
              {profile.offers_in_person_services && <Badge>In-Person Services</Badge>}
            </div>
            {profile.hourly_rate && (
              <div>
                <label className="text-sm font-medium">Hourly Rate</label>
                <p className="text-lg">${profile.hourly_rate}/hr</p>
              </div>
            )}
            {profile.zip_code && (
              <div>
                <label className="text-sm font-medium">Service Area</label>
                <p className="text-lg">{profile.zip_code} ({profile.service_radius} miles)</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">Edit Profile</Button>
              <Button variant="outline">View Messages</Button>
              <Button variant="outline">Manage Services</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


