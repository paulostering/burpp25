'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MessageComposer } from './message-composer'
import type { Message, Conversation } from '@/types/db'
import { formatDistanceToNow } from 'date-fns'

interface ConversationViewProps {
  conversationId: string
  onBack?: () => void
}

export function ConversationView({ conversationId, onBack }: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Load conversation and messages
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        if (!user) return

        // Load conversation details
        const { data: convData, error: convError } = await supabase
          .from('conversation_list')
          .select('*')
          .eq('id', conversationId)
          .single()

        if (convError) {
          return
        }

        setConversation(convData)

        // Load messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })

        if (messagesError) {
          return
        }

        setMessages(messagesData || [])

        // Mark messages as read (only incoming messages that are unread)
        const unreadMessages = messagesData?.filter(msg => 
          msg.sender_id !== user.id && !msg.is_read
        ) || []

        if (unreadMessages.length > 0) {
          const { error: markReadError } = await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(msg => msg.id))

          if (!markReadError) {
            // Update local state to reflect the read status
            setMessages(prev =>
              prev.map(msg =>
                unreadMessages.some(unread => unread.id === msg.id)
                  ? { ...msg, is_read: true }
                  : msg
              )
            )
          }
        }

      } catch (error) {
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [conversationId, supabase])

  // Set up real-time subscription
  useEffect(() => {
    if (!conversationId || !currentUser) return

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new as Message

          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const exists = prev.find(msg => msg.id === newMessage.id)
            if (exists) return prev

            return [...prev, newMessage]
          })

          // Only mark as read if this is an incoming message (not from current user)
          if (newMessage.sender_id !== currentUser.id) {
            supabase
              .from('messages')
              .update({ is_read: true })
              .eq('id', newMessage.id)
              .then(({ error }) => {
                if (!error) {
                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === newMessage.id
                        ? { ...msg, is_read: true }
                        : msg
                    )
                  )
                }
              })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message

          setMessages(prev =>
            prev.map(msg =>
              msg.id === updatedMessage.id
                ? updatedMessage
                : msg
            )
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, currentUser, supabase])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase()
  }

  const getOtherUser = () => {
    if (!conversation || !currentUser) return null
    
    return currentUser.id === conversation.customer_id 
      ? {
          id: conversation.vendor_id,
          email: conversation.vendor_email,
          name: conversation.business_name,
          photo: conversation.vendor_photo
        }
      : {
          id: conversation.customer_id,
          email: conversation.customer_email,
          name: conversation.customer_email?.split('@')[0],
          photo: null
        }
  }

  const otherUser = getOtherUser()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!conversation || !otherUser) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Conversation not found
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b bg-white p-4 flex-shrink-0">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.photo || undefined} />
          <AvatarFallback>
            {getInitials(otherUser.email || '')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h2 className="font-semibold">
            {otherUser.name || otherUser.email}
          </h2>
          <p className="text-sm text-gray-500">
            {otherUser.email}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            Start the conversation by sending a message below
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender_id === currentUser?.id
            const prevMessage = index > 0 ? messages[index - 1] : null
            const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id
            
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className="w-8">
                  {showAvatar && !isOwn && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={otherUser.photo || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(otherUser.email || '')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                
                <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwn
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  <p className="mt-1 text-xs text-gray-500">
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    {isOwn && (
                      <span className="ml-1">
                        {message.is_read ? '✓✓' : '✓'}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Composer */}
      <div className="flex-shrink-0">
        <MessageComposer
        conversationId={conversationId}
        onMessageSent={async () => {
          // Fallback: refetch messages if real-time doesn't work
          setTimeout(async () => {
            const { data: newMessages } = await supabase
              .from('messages')
              .select('*')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: true })
            
            if (newMessages) {
              setMessages(newMessages)
            }
          }, 500)
        }}
        placeholder={`Message ${otherUser.name || otherUser.email}...`}
        />
      </div>
    </div>
  )
}
