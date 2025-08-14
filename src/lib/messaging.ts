import { createClient } from '@/lib/supabase/client'

export async function createOrGetConversation(customerId: string, vendorId: string) {
  const supabase = createClient()
  
  try {
    // First, try to find existing conversation
    const { data: existingConversation, error: findError } = await supabase
      .from('conversations')
      .select('id')
      .eq('customer_id', customerId)
      .eq('vendor_id', vendorId)
      .single()

    if (existingConversation && !findError) {
      return { data: existingConversation, error: null }
    }

    // If no existing conversation, create a new one
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        customer_id: customerId,
        vendor_id: vendorId
      })
      .select('id')
      .single()

    return { data: newConversation, error: createError }
    
  } catch (error) {
    console.error('Error creating/getting conversation:', error)
    return { data: null, error }
  }
}

export async function sendMessage(
  conversationId: string, 
  senderId: string, 
  content: string,
  messageType: 'text' | 'image' | 'file' = 'text',
  attachmentUrl?: string
) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        attachment_url: attachmentUrl || null
      })
      .select()
      .single()

    return { data, error }
    
  } catch (error) {
    console.error('Error sending message:', error)
    return { data: null, error }
  }
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false)

    return { error }
    
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return { error }
  }
}

