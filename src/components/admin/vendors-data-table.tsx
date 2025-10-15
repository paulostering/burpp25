'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, MoreHorizontal, Eye, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import type { VendorProfile } from '@/types/db'

interface VendorsDataTableProps {
  vendors: VendorProfile[]
}

type SortKey = 'business_name' | 'email' | 'hourly_rate' | 'admin_approved' | 'zip_code' | 'created_at'
type SortOrder = 'asc' | 'desc' | null

export function VendorsDataTable({ vendors }: VendorsDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const router = useRouter()
  
  const itemsPerPage = 10

  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price?: number | null) => {
    if (!price) return 'Not set'
    return `$${price.toFixed(2)}/hr`
  }

  // Filter vendors based on search term across all columns
  const filteredVendors = useMemo(() => {
    if (!searchTerm) return vendors

    const lowerSearch = searchTerm.toLowerCase()
    return vendors.filter(vendor => {
      return (
        vendor.business_name?.toLowerCase().includes(lowerSearch) ||
        vendor.email?.toLowerCase().includes(lowerSearch) ||
        vendor.phone_number?.toLowerCase().includes(lowerSearch) ||
        vendor.zip_code?.toLowerCase().includes(lowerSearch) ||
        vendor.hourly_rate?.toString().includes(lowerSearch) ||
        (vendor.admin_approved ? 'approved' : 'pending').includes(lowerSearch) ||
        formatDate(vendor.created_at || '').toLowerCase().includes(lowerSearch)
      )
    })
  }, [vendors, searchTerm])

  // Sort vendors
  const sortedVendors = useMemo(() => {
    if (!sortKey || !sortOrder) return filteredVendors

    return [...filteredVendors].sort((a, b) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let aVal: any = a[sortKey]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let bVal: any = b[sortKey]

      // Handle null/undefined values
      if (aVal == null) return sortOrder === 'asc' ? 1 : -1
      if (bVal == null) return sortOrder === 'asc' ? -1 : 1

      // Handle specific data types
      if (sortKey === 'created_at') {
        aVal = new Date(aVal).getTime()
        bVal = new Date(bVal).getTime()
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase()
        bVal = bVal.toLowerCase()
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredVendors, sortKey, sortOrder])

  // Paginate vendors
  const totalPages = Math.ceil(sortedVendors.length / itemsPerPage)
  const paginatedVendors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedVendors.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedVendors, currentPage])

  // Reset to page 1 when search or sort changes
  useMemo(() => {
    setCurrentPage(1)
  }, [searchTerm, sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Cycle through: asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortKey(null)
        setSortOrder(null)
      }
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortOrder === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  const generatePaginationItems = () => {
    const items = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i)
      }
    } else {
      if (currentPage <= 3) {
        items.push(1, 2, 3, 4, -1, totalPages)
      } else if (currentPage >= totalPages - 2) {
        items.push(1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
      } else {
        items.push(1, -1, currentPage - 1, currentPage, currentPage + 1, -2, totalPages)
      }
    }
    
    return items
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search all columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {sortedVendors.length} vendor{sortedVendors.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('business_name')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start"
                >
                  Business Name
                  {getSortIcon('business_name')}
                </Button>
              </TableHead>
              <TableHead className="text-left">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('email')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start"
                >
                  Contact
                  {getSortIcon('email')}
                </Button>
              </TableHead>
              <TableHead className="text-left">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('hourly_rate')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start"
                >
                  Rate
                  {getSortIcon('hourly_rate')}
                </Button>
              </TableHead>
              <TableHead className="text-left">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('admin_approved')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start"
                >
                  Status
                  {getSortIcon('admin_approved')}
                </Button>
              </TableHead>
              <TableHead className="text-left">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('zip_code')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start"
                >
                  Service ZIP
                  {getSortIcon('zip_code')}
                </Button>
              </TableHead>
              <TableHead className="text-left">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('created_at')}
                  className="h-auto p-0 font-medium hover:bg-transparent text-left justify-start"
                >
                  Date Joined
                  {getSortIcon('created_at')}
                </Button>
              </TableHead>
              <TableHead className="w-[50px] text-left">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedVendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                  {searchTerm ? 'No vendors found matching your search.' : 'No vendors found.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedVendors.map((vendor) => (
                <TableRow 
                  key={vendor.id} 
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/vendors/${vendor.id}`)}
                >
                  <TableCell className="text-left">
                    <div className="font-medium">
                      {vendor.business_name || 'Unnamed Business'}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div>
                      <div className="text-sm">
                        {vendor.email}
                      </div>
                      {vendor.phone_number && (
                        <div className="text-sm text-muted-foreground">
                          {vendor.phone_number}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">{formatPrice(vendor.hourly_rate)}</TableCell>
                  <TableCell className="text-left">
                    <Badge variant={vendor.admin_approved ? "default" : "secondary"}>
                      {vendor.admin_approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="text-sm">
                      {vendor.zip_code || 'Not set'}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">{formatDate(vendor.created_at || '')}</TableCell>
                  <TableCell className="text-left" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/vendors/${vendor.id}`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Vendor
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedVendors.length)} of {sortedVendors.length} vendors
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {generatePaginationItems().map((pageNum, idx) => {
                if (pageNum === -1 || pageNum === -2) {
                  return (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}


