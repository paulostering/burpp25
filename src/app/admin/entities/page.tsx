import { Card, CardContent } from '@/components/ui/card'
import { EntitiesDataTable } from '@/components/admin/entities-data-table'
import { createServerSupabase } from '@/lib/supabase/server'

async function getEntities() {
  const supabase = await createServerSupabase()
  
  const { data: entities, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) {
    console.error('Error fetching entities:', error)
    return []
  }
  
  return entities || []
}

export default async function AdminEntitiesPage() {
  const entities = await getEntities()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Entities</h1>
      </div>

      <Card>
        <CardContent>
          <EntitiesDataTable entities={entities} />
        </CardContent>
      </Card>
    </div>
  )
}

