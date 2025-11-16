'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { Conversation } from '@/types/db'
import { formatDistanceToNow } from 'date-fns'

interface ConversationsListProps {
  onConversationSelect: (conversationId: string) => void
  selectedConversationId?: string
}

export function ConversationsList({ onConversationSelect, selectedConversationId }: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true)
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        if (!user) return

        const { data, error } = await supabase
          .from('conversation_list')
          .select('*')
          .or(`customer_id.eq.${user.id},vendor_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false })

        if (error) {
          return
        }

        setConversations(data || [])
      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }

    loadConversations()
  }, [supabase])

  // Set up real-time subscription for conversations
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel(`conversations-updates-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          const updatedConversation = payload.new as any

          // Check if this conversation involves the current user
          if (updatedConversation.customer_id === currentUser.id || updatedConversation.vendor_id === currentUser.id) {
            loadConversations()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations'
        },
        (payload) => {
          loadConversations()
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
          // Update conversations when new messages arrive
          loadConversations()
        }
      )
      .subscribe()

    const loadConversations = async () => {
      const { data, error } = await supabase
        .from('conversation_list')
        .select('*')
        .or(`customer_id.eq.${currentUser.id},vendor_id.eq.${currentUser.id}`)
        .order('last_message_at', { ascending: false })

      if (!error) {
        setConversations(data || [])
      }
    }

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, supabase])

  const getInitials = (email?: string, firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.split('@')[0].substring(0, 2).toUpperCase()
    }
    return '??'
  }

  const getOtherUser = (conversation: Conversation) => {
    if (!currentUser) return null
    
    return currentUser.id === conversation.customer_id 
      ? {
          email: conversation.vendor_email,
          name: conversation.business_name,
          photo: conversation.vendor_photo,
          firstName: conversation.vendor_first_name,
          lastName: conversation.vendor_last_name
        }
      : {
          email: conversation.customer_email,
          name: (() => {
            const firstName = conversation.customer_first_name?.trim()
            const lastName = conversation.customer_last_name?.trim()
            if (firstName && lastName) {
              return `${firstName} ${lastName}`
            }
            if (firstName) {
              return firstName
            }
            if (lastName) {
              return lastName
            }
            return conversation.customer_email?.split('@')[0] || 'User'
          })(),
          photo: conversation.customer_photo || null,
          firstName: conversation.customer_first_name,
          lastName: conversation.customer_last_name
        }
  }

  const getUnreadCount = (conversation: Conversation) => {
    if (!currentUser) return 0
    
    return currentUser.id === conversation.customer_id 
      ? conversation.customer_unread_count
      : conversation.vendor_unread_count
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500 p-8 text-center">
        <div>
          <p className="text-lg font-medium mb-2">No conversations yet</p>
          <p className="text-sm">Start messaging vendors to see your conversations here</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conversation) => {
        const otherUser = getOtherUser(conversation)
        const unreadCount = getUnreadCount(conversation)
        const isSelected = selectedConversationId === conversation.id

        if (!otherUser) return null

        return (
          <div
            key={conversation.id}
            onClick={() => onConversationSelect(conversation.id)}
            className={`flex items-center gap-3 p-4 cursor-pointer border-b hover:bg-gray-50 transition-colors ${
              isSelected ? 'bg-blue-50 border-r-2 border-r-primary' : ''
            }`}
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={otherUser.photo || undefined} />
              <AvatarFallback>
                {getInitials(otherUser.email, otherUser.firstName, otherUser.lastName)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-medium truncate ${unreadCount > 0 ? 'font-semibold' : ''}`}>
                  {otherUser.name || otherUser.email}
                </h3>
                
                <div className="flex items-center gap-2">
                  {conversation.last_message_time && (
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                    </span>
                  )}
                  {unreadCount > 0 && (
                    <Badge variant="default" className="h-5 min-w-5 text-xs">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </div>
              </div>

              <p className={`text-sm text-gray-600 truncate ${unreadCount > 0 ? 'font-medium' : ''}`}>
                {conversation.last_message_content || 'Start the conversation...'}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
