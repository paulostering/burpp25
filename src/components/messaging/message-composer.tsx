'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface MessageComposerProps {
  conversationId: string
  onMessageSent?: () => void
  placeholder?: string
  disabled?: boolean
}

export function MessageComposer({ 
  conversationId, 
  onMessageSent, 
  placeholder = "Type your message...",
  disabled = false
}: MessageComposerProps) {
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const supabase = createClient()

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return

    setIsSending(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Please log in to send messages')
        return
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message.trim(),
          message_type: 'text'
        })
        .select()
        .single()

      if (error) {
        toast.error('Failed to send message')
        console.error('Error sending message:', error)
        return
      }

      console.log('Message sent successfully:', data)
      setMessage('')
      onMessageSent?.()
      
    } catch (error) {
      toast.error('Failed to send message')
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t bg-white p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled || isSending}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
        </div>
        
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled || isSending}
          className="h-11 px-4"
        >
          {isSending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
