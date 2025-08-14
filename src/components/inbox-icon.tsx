'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function InboxIcon() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    const loadUnreadCount = async () => {
      try {
        console.log('Loading unread count for user:', user.id)
        
        const { data, error } = await supabase
          .from('conversations')
          .select('customer_unread_count, vendor_unread_count, customer_id, vendor_id')
          .or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`)

        if (error) {
          console.error('Error loading unread count:', error)
          return
        }

        console.log('Conversations data:', data)

        const totalUnread = data?.reduce((total, conversation) => {
          // Get unread count based on user role in conversation
          const unread = conversation.customer_id === user.id 
            ? conversation.customer_unread_count 
            : conversation.vendor_unread_count
          
          console.log(`Conversation ${conversation.customer_id === user.id ? 'as customer' : 'as vendor'}: ${unread} unread`)
          return total + (unread || 0)
        }, 0) || 0

        console.log('Total unread count:', totalUnread)
        setUnreadCount(totalUnread)
      } catch (error) {
        console.error('Error loading unread count:', error)
      }
    }

    loadUnreadCount()

    // Set up real-time subscription for conversation updates
    const channel = supabase
      .channel(`unread-count-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          console.log('Conversation updated:', payload)
          const updatedConversation = payload.new as any
          
          // Check if this conversation involves the current user
          if (updatedConversation.customer_id === user.id || updatedConversation.vendor_id === user.id) {
            console.log('Conversation involves current user, reloading unread count')
            loadUnreadCount()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message inserted:', payload)
          // Always reload when new messages are inserted
          loadUnreadCount()
        }
      )
      .subscribe((status) => {
        console.log('Unread count subscription status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  if (!user) return null

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 relative" asChild>
      <Link href="/messages">
        <Mail className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 text-[10px] p-0 flex items-center justify-center bg-primary text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Link>
    </Button>
  )
}
