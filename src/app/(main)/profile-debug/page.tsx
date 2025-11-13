'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'

export default function ProfileDebugPage() {
  const { user } = useAuth()
  const [results, setResults] = useState<any>({})
  const supabase = createClient()

  useEffect(() => {
    const runTests = async () => {
      if (!user) return

      const tests: any = {}

      // Test 1: Basic query without new fields
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, first_name, last_name, role')
          .eq('id', user.id)
          .single()
        tests.basicQuery = { success: !error, data, error: error?.message }
      } catch (e: any) {
        tests.basicQuery = { success: false, error: e.message }
      }

      // Test 2: Query with profile_photo_url
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, profile_photo_url')
          .eq('id', user.id)
          .single()
        tests.photoUrlQuery = { success: !error, data, error: error?.message }
      } catch (e: any) {
        tests.photoUrlQuery = { success: false, error: e.message }
      }

      // Test 3: Query with phone_number
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('id, email, phone_number')
          .eq('id', user.id)
          .single()
        tests.phoneQuery = { success: !error, data, error: error?.message }
      } catch (e: any) {
        tests.phoneQuery = { success: false, error: e.message }
      }

      // Test 4: Full query
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        tests.fullQuery = { success: !error, data, error: error?.message }
      } catch (e: any) {
        tests.fullQuery = { success: false, error: e.message }
      }

      setResults(tests)
    }

    runTests()
  }, [user, supabase])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Profile Query Debug</h1>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="font-semibold mb-2">User ID:</h2>
            <p className="font-mono text-sm">{user?.id || 'Not logged in'}</p>
          </div>

          {Object.entries(results).map(([testName, result]: [string, any]) => (
            <div key={testName} className="bg-white p-4 rounded-lg shadow">
              <h2 className="font-semibold mb-2">{testName}</h2>
              <div className="space-y-2">
                <p className={result.success ? 'text-green-600' : 'text-red-600'}>
                  Status: {result.success ? '✓ Success' : '✗ Failed'}
                </p>
                {result.error && (
                  <div>
                    <p className="font-semibold text-red-600">Error:</p>
                    <pre className="bg-red-50 p-2 rounded text-xs overflow-auto">
                      {result.error}
                    </pre>
                  </div>
                )}
                {result.data && (
                  <div>
                    <p className="font-semibold">Data:</p>
                    <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
