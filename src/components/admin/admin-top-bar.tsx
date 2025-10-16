'use client'

import { usePathname } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function AdminTopBar() {
  const pathname = usePathname()
  
  // Generate breadcrumbs based on pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    // Always start with Admin
    breadcrumbs.push({ name: 'Admin', href: '/admin' })
    
    // Add other segments
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]
      const href = `/${segments.slice(0, i + 1).join('/')}`
      const name = segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ name, href })
    }
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-2 px-6">
        <SidebarTrigger className="-ml-2 h-6 w-6" />
        <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
              <a
                href={breadcrumb.href}
                className={cn(
                  "flex items-center gap-1 hover:text-foreground transition-colors",
                  index === breadcrumbs.length - 1 && "text-foreground font-medium"
                )}
              >
                {/* Icon support can be added later if needed */}
                {breadcrumb.name}
              </a>
            </div>
          ))}
        </nav>
      </div>
    </div>
  )
}
