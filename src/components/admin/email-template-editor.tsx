'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Save, Eye, Code, Type, Mail, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { EmailTemplate } from '@/types/email'

interface EmailTemplateEditorProps {
  template: EmailTemplate
}

export function EmailTemplateEditor({ template: initialTemplate }: EmailTemplateEditorProps) {
  const router = useRouter()
  const [template, setTemplate] = useState<EmailTemplate>(initialTemplate)
  const [isLoading, setIsLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html')

  const handleChange = (field: keyof EmailTemplate, value: string | boolean) => {
    setTemplate(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from_email: template.from_email,
          from_name: template.from_name,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          is_active: template.is_active,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update template')
      }

      toast.success('Email template updated successfully!')
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update template')
    } finally {
      setIsLoading(false)
    }
  }

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('body_html') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = template.body_html
      const before = text.substring(0, start)
      const after = text.substring(end)
      const newText = before + `{{${variable}}}` + after
      
      handleChange('body_html', newText)
      
      // Reset cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
      }, 0)
    }
  }

  const getPreviewHtml = () => {
    let html = template.body_html
    const variables = template.variables as Array<{ name: string; label: string }>
    
    // Create example values for all variables
    const siteUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    
    const exampleValues: { [key: string]: string } = {
      siteUrl: siteUrl,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      businessName: 'ABC Services',
      dashboardUrl: `${siteUrl}/dashboard`,
      messageUrl: `${siteUrl}/messages?id=123`,
      settingsUrl: `${siteUrl}/settings`,
      resetUrl: `${siteUrl}/reset-password?token=abc123`,
      loginUrl: `${siteUrl}/login`,
      clientName: 'Jane Smith',
      messagePreview: 'Hi, I need help with my project...',
      resetDate: 'January 15, 2025',
      resetTime: '10:30 AM'
    }
    
    // Replace all variables with actual example values
    variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
      const exampleValue = exampleValues[variable.name] || variable.label
      html = html.replace(regex, exampleValue)
    })
    
    return html
  }

  const getPreviewText = () => {
    let text = template.body_text || ''
    const siteUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    
    const exampleValues: { [key: string]: string } = {
      siteUrl: siteUrl,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      businessName: 'ABC Services',
      dashboardUrl: `${siteUrl}/dashboard`,
      messageUrl: `${siteUrl}/messages?id=123`,
      settingsUrl: `${siteUrl}/settings`,
      resetUrl: `${siteUrl}/reset-password?token=abc123`,
      loginUrl: `${siteUrl}/login`,
      clientName: 'Jane Smith',
      messagePreview: 'Hi, I need help with my project...',
      resetDate: 'January 15, 2025',
      resetTime: '10:30 AM'
    }
    
    // Replace all variables with example values
    variables.forEach(variable => {
      const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
      const exampleValue = exampleValues[variable.name] || variable.label
      text = text.replace(regex, exampleValue)
    })
    
    return text
  }

  const variables = (template.variables as Array<{ name: string; label: string; description: string }>) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/admin/email-templates')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="is_active" className="text-sm font-medium">
              Active
            </Label>
            <Switch
              id="is_active"
              checked={template.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Template Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {template.event_label}
              </CardTitle>
              <CardDescription>{template.event_description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={template.from_name}
                    onChange={(e) => handleChange('from_name', e.target.value)}
                    placeholder="Burpp Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={template.from_email}
                    onChange={(e) => handleChange('from_email', e.target.value)}
                    placeholder="noreply@burpp.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={template.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  placeholder="Email subject"
                />
                <p className="text-xs text-gray-500">
                  You can use variables like {'{{'} firstName {'}}'}  in the subject
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Body Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">
                    <Type className="h-4 w-4 mr-2" />
                    Plain Text
                  </TabsTrigger>
                  <TabsTrigger value="html">
                    <Code className="h-4 w-4 mr-2" />
                    HTML
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-2">
                  <Textarea
                    id="body_text"
                    value={template.body_text || ''}
                    onChange={(e) => handleChange('body_text', e.target.value)}
                    className="min-h-[500px]"
                    placeholder="Plain text version of your email..."
                  />
                  <p className="text-xs text-gray-500">
                    Plain text fallback for email clients that don't support HTML.
                  </p>
                </TabsContent>
                
                <TabsContent value="html" className="space-y-2">
                  <Textarea
                    id="body_html"
                    value={template.body_html}
                    onChange={(e) => handleChange('body_html', e.target.value)}
                    className="font-mono text-sm min-h-[500px]"
                    placeholder="HTML email content..."
                  />
                  <p className="text-xs text-gray-500">
                    Write HTML markup for your email. Click variables on the right to insert them.
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Available Variables</CardTitle>
              <CardDescription>Click to insert into your template</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {variables.map((variable) => (
                <Button
                  key={variable.name}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => insertVariable(variable.name)}
                >
                  <Code className="h-3 w-3 mr-2" />
                  <span className="font-mono text-xs">{'{{'}{variable.name}{'}}' }</span>
                  <span className="ml-auto text-xs text-gray-500">{variable.label}</span>
                </Button>
              ))}
              {variables.length === 0 && (
                <p className="text-sm text-gray-500">No variables available</p>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={previewMode === 'html' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('html')}
                  >
                    HTML
                  </Button>
                  <Button
                    variant={previewMode === 'text' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setPreviewMode('text')}
                  >
                    Text
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {previewMode === 'html' ? (
                <div 
                  className="border rounded-lg p-4 bg-white max-h-[600px] overflow-auto"
                  dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
                />
              ) : (
                <pre className="border rounded-lg p-4 bg-gray-50 text-sm whitespace-pre-wrap max-h-[600px] overflow-auto">
                  {getPreviewText()}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

