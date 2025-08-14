import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VendorsDataTable } from '@/components/admin/vendors-data-table'
import { createServerSupabase } from '@/lib/supabase/server'

async function getVendors() {
  const supabase = await createServerSupabase()
  
  const { data: vendors, error } = await supabase
    .from('vendor_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching vendors:', error)
    return []
  }
  
  return vendors || []
}

export default async function AdminVendorsPage() {
  const vendors = await getVendors()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Vendors</h1>
        <p className="text-gray-600 mt-1">
          Review and approve vendor profiles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <VendorsDataTable vendors={vendors} />
        </CardContent>
      </Card>
    </div>
  )
}


