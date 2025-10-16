'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { EmailTemplate } from '@/types/email'

interface EmailTemplatesListProps {
  templates: EmailTemplate[]
}

export function EmailTemplatesList({ templates }: EmailTemplatesListProps) {
  const router = useRouter()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Event</TableHead>
              <TableHead className="text-left">Description</TableHead>
              <TableHead className="text-left">From</TableHead>
              <TableHead className="text-left">Subject</TableHead>
              <TableHead className="text-left">Status</TableHead>
              <TableHead className="text-left">Last Updated</TableHead>
              <TableHead className="w-[100px] text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                  No email templates found.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow 
                  key={template.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/email-templates/${template.id}`)}
                >
                  <TableCell className="text-left">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{template.event_label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <span className="text-sm text-gray-600">
                      {template.event_description || 'No description'}
                    </span>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="text-sm">
                      <div className="font-medium">{template.from_name}</div>
                      <div className="text-gray-500">{template.from_email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <span className="text-sm">{template.subject}</span>
                  </TableCell>
                  <TableCell className="text-left">
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <span className="text-sm text-gray-600">
                      {formatDate(template.updated_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/email-templates/${template.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

