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
import { Search, Star, Check, X, Eye, ArrowUpDown, Trash2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Review {
  id: string
  user_id: string
  vendor_id: string
  rating: number
  title?: string
  comment?: string
  approved: boolean
  created_at: string
  user?: {
    first_name?: string
    last_name?: string
    email?: string
  }
  vendor?: {
    business_name?: string
  }
}

interface ReviewsDataTableProps {
  reviews: Review[]
}

type SortKey = 'created_at' | 'rating' | 'approved'
type SortOrder = 'asc' | 'desc' | null

export function ReviewsDataTable({ reviews: initialReviews }: ReviewsDataTableProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)
  const [selectedReview, setSelectedReview] = useState<Review | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<Review | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredReviews = useMemo(() => {
    if (!searchTerm) return reviews

    const lowerSearch = searchTerm.toLowerCase()
    return reviews.filter(review => {
      const vendorName = review.vendor?.business_name?.toLowerCase() || ''
      const userName = `${review.user?.first_name || ''} ${review.user?.last_name || ''}`.toLowerCase()
      const email = review.user?.email?.toLowerCase() || ''
      const title = review.title?.toLowerCase() || ''
      const comment = review.comment?.toLowerCase() || ''
      
      return (
        vendorName.includes(lowerSearch) ||
        userName.includes(lowerSearch) ||
        email.includes(lowerSearch) ||
        title.includes(lowerSearch) ||
        comment.includes(lowerSearch)
      )
    })
  }, [reviews, searchTerm])

  const sortedReviews = useMemo(() => {
    if (!sortKey || !sortOrder) return filteredReviews

    return [...filteredReviews].sort((a, b) => {
      let aVal: string | number | boolean | Date | undefined = a[sortKey]
      let bVal: string | number | boolean | Date | undefined = b[sortKey]

      if (aVal == null) return sortOrder === 'asc' ? 1 : -1
      if (bVal == null) return sortOrder === 'asc' ? -1 : 1

      if (sortKey === 'created_at') {
        aVal = new Date(aVal as string).getTime()
        bVal = new Date(bVal as string).getTime()
      }

      // Convert boolean to number for comparison
      if (typeof aVal === 'boolean') aVal = aVal ? 1 : 0
      if (typeof bVal === 'boolean') bVal = bVal ? 1 : 0

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredReviews, sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
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

  const handleApprove = async (review: Review) => {
    setIsUpdating(true)
    try {
      // Use API route for approval to bypass RLS
      const response = await fetch(`/api/admin/reviews/${review.id}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve review')
      }

      setReviews(prev =>
        prev.map(r => r.id === review.id ? { ...r, approved: true } : r)
      )
      
      toast.success('Review approved successfully!')
    } catch (error) {
      console.error('Error approving review:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve review')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReject = async (review: Review) => {
    setIsUpdating(true)
    try {
      // Use API route for deletion to bypass RLS
      const response = await fetch(`/api/admin/reviews/${review.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject review')
      }

      setReviews(prev => prev.filter(r => r.id !== review.id))
      
      toast.success('Review rejected and deleted!')
    } catch (error) {
      console.error('Error rejecting review:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject review')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteClick = (review: Review) => {
    setReviewToDelete(review)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return

    setIsUpdating(true)
    try {
      // Use API route for deletion to bypass RLS
      const response = await fetch(`/api/admin/reviews/${reviewToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete review')
      }

      setReviews(prev => prev.filter(r => r.id !== reviewToDelete.id))
      
      toast.success('Review deleted successfully!')
      setIsDialogOpen(false)
      setIsDeleteDialogOpen(false)
      setReviewToDelete(null)
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete review')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleViewDetails = (review: Review) => {
    setSelectedReview(review)
    setIsDialogOpen(true)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ))
  }

  const pendingCount = reviews.filter(r => !r.approved).length
  const approvedCount = reviews.filter(r => r.approved).length

  return (
    <div className="space-y-4">
      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-yellow-600">{pendingCount}</span> pending
          </div>
          <div>
            <span className="font-medium text-green-600">{approvedCount}</span> approved
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left text-sm font-normal pl-0">Vendor</TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">Customer</TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('rating')}
                  className="h-auto p-0 font-normal text-sm hover:bg-transparent text-left justify-start"
                >
                  Rating
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">Review</TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('approved')}
                  className="h-auto p-0 font-normal text-sm hover:bg-transparent text-left justify-start"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-left text-sm font-normal pl-0">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('created_at')}
                  className="h-auto p-0 font-normal text-sm hover:bg-transparent text-left justify-start"
                >
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[150px] text-left text-sm font-normal pl-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedReviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                  {searchTerm ? 'No reviews found matching your search.' : 'No reviews found.'}
                </TableCell>
              </TableRow>
            ) : (
              sortedReviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell className="text-left">
                    <div className="font-medium">
                      {review.vendor?.business_name || 'Unknown'}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div>
                      <div className="font-medium">
                        {review.user?.first_name} {review.user?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {review.user?.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="max-w-md">
                      {review.title && (
                        <div className="font-medium text-sm line-clamp-1">
                          {review.title}
                        </div>
                      )}
                      {review.comment && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {review.comment}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <Badge variant={review.approved ? "default" : "secondary"}>
                      {review.approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-left">
                    {formatDate(review.created_at)}
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(review)}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!review.approved && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(review)}
                            disabled={isUpdating}
                            className="text-green-600 hover:text-green-700"
                            title="Approve review"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(review)}
                            disabled={isUpdating}
                            className="text-red-600 hover:text-red-700"
                            title="Reject and delete"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(review)}
                        disabled={isUpdating}
                        className="text-red-600 hover:text-red-700"
                        title="Delete review"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedReviews.length} of {reviews.length} reviews
      </div>

      {/* Review Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>
              Full review information
            </DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Vendor</div>
                <div className="text-lg font-semibold">
                  {selectedReview.vendor?.business_name || 'Unknown'}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">Customer</div>
                <div>
                  {selectedReview.user?.first_name} {selectedReview.user?.last_name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedReview.user?.email}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Rating</div>
                <div className="flex items-center gap-1">
                  {renderStars(selectedReview.rating)}
                  <span className="ml-2 text-sm">({selectedReview.rating}/5)</span>
                </div>
              </div>

              {selectedReview.title && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Title</div>
                  <div className="font-medium">{selectedReview.title}</div>
                </div>
              )}

              {selectedReview.comment && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Comment</div>
                  <div className="whitespace-pre-wrap">{selectedReview.comment}</div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge variant={selectedReview.approved ? "default" : "secondary"}>
                  {selectedReview.approved ? "Approved" : "Pending Approval"}
                </Badge>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Submitted</div>
                <div>{formatDate(selectedReview.created_at)}</div>
              </div>

              <div className="flex gap-2 pt-4">
                {!selectedReview.approved && (
                  <>
                    <Button
                      onClick={() => {
                        handleApprove(selectedReview)
                        setIsDialogOpen(false)
                      }}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Review
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleReject(selectedReview)
                        setIsDialogOpen(false)
                      }}
                      disabled={isUpdating}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Review
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleDeleteClick(selectedReview)}
                  disabled={isUpdating}
                  className="flex-1 text-red-600 hover:text-red-700 border-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {reviewToDelete && (
            <div className="py-4">
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Vendor:</span> {reviewToDelete.vendor?.business_name || 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">Customer:</span> {reviewToDelete.user?.first_name} {reviewToDelete.user?.last_name}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Rating:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(reviewToDelete.rating)}
                  </div>
                </div>
                {reviewToDelete.title && (
                  <div>
                    <span className="font-medium">Title:</span> {reviewToDelete.title}
                  </div>
                )}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isUpdating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isUpdating ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

