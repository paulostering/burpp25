'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function VendorThankYouPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <Card className="p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-primary" />
          </div>
          <h1 className="text-2xl font-semibold">You&apos;re officially a Burpp Pro!</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Thanks for joining us! You can now access and manage your services from your vendor profile.
        </p>
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/vendor">Go to Vendor Dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
