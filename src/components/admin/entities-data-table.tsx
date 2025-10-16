'use client'

import { useState, useEffect } from 'react'
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
import { Search, MoreHorizontal, Edit, Plus, ArrowUpDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { CategoryForm } from './category-form'
import { toast } from 'sonner'
import type { Category } from '@/types/db'

interface EntitiesDataTableProps {
  entities: Category[]
}

type SortField = 'name' | 'created_at' | 'updated_at' | 'is_active' | 'is_featured'
type SortDirection = 'asc' | 'desc'

export function EntitiesDataTable({ entities: initialEntities }: EntitiesDataTableProps) {
  const [entities, setEntities] = useState<Category[]>(initialEntities)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Update entities when props change
  useEffect(() => {
    setEntities(initialEntities)
  }, [initialEntities])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedAndFilteredEntities = entities
    .filter(entity =>
      entity.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        case 'is_active':
          aValue = a.is_active ? 1 : 0
          bValue = b.is_active ? 1 : 0
          break
        case 'is_featured':
          aValue = a.is_featured ? 1 : 0
          bValue = b.is_featured ? 1 : 0
          break
        default:
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleAddCategory = async (data: Partial<Category>) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create category')
      }

      // Add new category to local state
      setEntities(prev => [...prev, responseData])
      
      // Close sheet and show success toast
      setIsAddSheetOpen(false)
      toast.success('Category created successfully!')
      
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditCategory = async (data: Partial<Category>) => {
    if (!selectedCategory?.id) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/categories/${selectedCategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update category')
      }

      // Update category in local state
      setEntities(prev => 
        prev.map(category => 
          category.id === selectedCategory.id ? responseData : category
        )
      )
      
      // Close sheet and show success toast
      setIsEditSheetOpen(false)
      setSelectedCategory(null)
      toast.success('Category updated successfully!')
      
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category)
    setIsEditSheetOpen(true)
  }

  const handleToggleActive = async (category: Category) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: category.name,
          icon_url: category.icon_url,
          is_active: !category.is_active,
          is_featured: category.is_featured,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }

      const updatedCategory = await response.json()
      
      // Update category in local state
      setEntities(prev => 
        prev.map(cat => 
          cat.id === category.id ? updatedCategory : cat
        )
      )
      
      toast.success(`Category ${!category.is_active ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleFeatured = async (category: Category) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: category.name,
          icon_url: category.icon_url,
          is_active: category.is_active,
          is_featured: !category.is_featured,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update category')
      }

      const updatedCategory = await response.json()
      
      // Update category in local state
      setEntities(prev => 
        prev.map(cat => 
          cat.id === category.id ? updatedCategory : cat
        )
      )
      
      toast.success(`Category ${!category.is_featured ? 'featured' : 'unfeatured'} successfully!`)
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update category')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        
        {/* Add Category Sheet */}
        <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
          <SheetTrigger asChild>
            <Button size="sm" className="text-base">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Add New Category</SheetTitle>
              <SheetDescription>
                Create a new service category for your platform.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 px-4">
              <CategoryForm
                onSubmit={handleAddCategory}
                onCancel={() => setIsAddSheetOpen(false)}
                isLoading={isLoading}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left text-sm font-normal pl-0">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('name')}
                  className="h-auto p-0 font-normal text-sm hover:bg-transparent text-left justify-start"
                >
                  Category Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('is_active')}
                  className="h-auto p-0 font-normal text-sm hover:bg-transparent text-left justify-start"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('is_featured')}
                  className="h-auto p-0 font-normal text-sm hover:bg-transparent text-left justify-start"
                >
                  Featured
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('created_at')}
                  className="h-auto p-0 font-normal text-sm hover:bg-transparent text-left justify-start"
                >
                  Created
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('updated_at')}
                  className="h-auto p-0 font-normal text-sm hover:bg-transparent text-left justify-start"
                >
                  Updated
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[50px] text-left text-sm font-normal pl-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFilteredEntities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground pl-4">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFilteredEntities.map((entity) => (
                <TableRow key={entity.id}>
                  <TableCell>
                    <div className="font-medium">
                      {entity.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={entity.is_active ? "default" : "secondary"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleToggleActive(entity)}
                    >
                      {entity.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={entity.is_featured ? "default" : "secondary"}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleToggleFeatured(entity)}
                    >
                      {entity.is_featured ? "Featured" : "Not Featured"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(entity.created_at)}</TableCell>
                  <TableCell>{formatDate(entity.updated_at)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditClick(entity)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
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

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedAndFilteredEntities.length} of {entities.length} categories
      </div>

      {/* Edit Category Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Category</SheetTitle>
            <SheetDescription>
              Update the category information.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 px-4">
            <CategoryForm
              category={selectedCategory}
              onSubmit={handleEditCategory}
              onCancel={() => {
                setIsEditSheetOpen(false)
                setSelectedCategory(null)
              }}
              isLoading={isLoading}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

