'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function UserRegistrationPage() {
  const [isEnabled, setIsEnabled] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadSetting()
  }, [])

  const loadSetting = async () => {
    try {
      const response = await fetch('/api/admin/user-registration')
      
      if (!response.ok) {
        throw new Error('Failed to load setting')
      }

      const data = await response.json()
      setIsEnabled(data.enabled ?? true)
    } catch (error) {
      console.error('Error loading setting:', error)
      toast.error('Failed to load setting')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = async (checked: boolean) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/user-registration', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: checked }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update setting')
      }

      const data = await response.json()
      setIsEnabled(data.enabled)
      toast.success(`User registration ${checked ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Error updating setting:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update setting')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Registration</h1>
        <p className="text-gray-600 mt-1">
          Control whether new users can register accounts on the platform
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration Settings</CardTitle>
          <CardDescription>
            When registration is disabled, the signup page will display a message instead of the registration form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary"></div>
              <span className="text-sm text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="registration-toggle" className="text-base">
                  Allow User Registration
                </Label>
                <p className="text-sm text-gray-600">
                  {isEnabled 
                    ? 'New users can create accounts on the signup page.'
                    : 'User registration is disabled. The signup page will show a message instead.'}
                </p>
              </div>
              <Switch
                id="registration-toggle"
                checked={isEnabled}
                onCheckedChange={handleToggle}
                disabled={isSaving}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

