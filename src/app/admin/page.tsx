import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Store, Tag } from 'lucide-react'
import { createAdminSupabase } from '@/lib/supabase/server'
import Link from 'next/link'

async function getDashboardStats() {
  const supabase = createAdminSupabase()
  
  // Get counts for dashboard
  const [vendorsResult, customersResult, categoriesResult] = await Promise.all([
    supabase.from('vendor_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('categories').select('*', { count: 'exact', head: true })
  ])
  
  return {
    vendors: vendorsResult.count || 0,
    customers: customersResult.count || 0,
    entities: categoriesResult.count || 0
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()

  const managementCards = [
    {
      title: 'Manage Customers',
      description: 'View and manage customer accounts',
      icon: Users,
      href: '/admin/clients',
      count: stats.customers,
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Vendors',
      description: 'Review and approve vendor profiles',
      icon: Store,
      href: '/admin/vendors',
      count: stats.vendors,
      color: 'bg-green-500'
    },
    {
      title: 'Manage Entities',
      description: 'Manage service categories and settings',
      icon: Tag,
      href: '/admin/entities',
      count: stats.entities,
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome to the Burpp administration panel
        </p>
      </div>

      {/* Management Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {managementCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {card.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-gray-900">
                    {card.count.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    Total
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>


    </div>
  )
}


