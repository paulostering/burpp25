'use client'

import { useState, useEffect, Suspense } from 'react'
import { ConversationsList } from '@/components/messaging/conversations-list'
import { ConversationView } from '@/components/messaging/conversation-view'
import { Button } from '@/components/ui/button'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function MessagesPageContent() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        router.push('/login')
      } else {
        setUser(session.user)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router])

  // Handle conversation parameter from URL
  useEffect(() => {
    const conversationParam = searchParams.get('conversation')
    if (conversationParam) {
      setSelectedConversationId(conversationParam)
    }
  }, [searchParams])

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // Mobile view: show either list or conversation
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <div className="h-[calc(100vh-3.5rem)]">
          <ConversationView
            conversationId={selectedConversationId}
            onBack={() => setSelectedConversationId(null)}
          />
        </div>
      )
    }

    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="border-b bg-white p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ConversationsList
            onConversationSelect={setSelectedConversationId}
            selectedConversationId={selectedConversationId || undefined}
          />
        </div>
      </div>
    )
  }

  // Desktop view: side-by-side layout
  return (
    <div className="h-[calc(100vh-3.5rem)] flex">
      {/* Conversations sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
        <div className="border-b p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-lg font-semibold">Messages</h1>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <ConversationsList
            onConversationSelect={setSelectedConversationId}
            selectedConversationId={selectedConversationId || undefined}
          />
        </div>
      </div>

      {/* Conversation view */}
      <div className="flex-1">
        {selectedConversationId ? (
          <ConversationView conversationId={selectedConversationId} />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Select a conversation</p>
              <p className="text-sm">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MessagesPageContent />
    </Suspense>
  )
}