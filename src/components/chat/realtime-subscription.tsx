'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { MessageRow } from '@/types/db'

export default function RealtimeMessages({ conversationIds }: { conversationIds: string[] }) {
  useEffect(() => {
    if (!conversationIds.length) return
    const supabase = createClient()
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=in.(${conversationIds.join(',')})`,
        },
        (payload: { new: MessageRow }) => {
          toast('New message', { description: payload.new.body })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationIds])

  return null
}


