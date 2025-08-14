-- =====================================================
-- MESSAGING SYSTEM DATABASE SETUP
-- =====================================================

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  customer_unread_count INTEGER DEFAULT 0,
  vendor_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one conversation per customer-vendor pair
  UNIQUE(customer_id, vendor_id)
);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  attachment_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Conversations indexes
CREATE INDEX idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX idx_conversations_vendor_id ON conversations(vendor_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX idx_conversations_customer_vendor ON conversations(customer_id, vendor_id);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = FALSE;

-- =====================================================
-- TRIGGERS FOR AUTO-UPDATES
-- =====================================================

-- Update conversations.updated_at when conversation is modified
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_updated_at();

-- Update messages.updated_at when message is modified
CREATE OR REPLACE FUNCTION update_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_message_updated_at();

-- Update conversation when new message is added
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  is_customer_sender BOOLEAN;
BEGIN
  -- Check if sender is the customer
  SELECT (NEW.sender_id = c.customer_id) INTO is_customer_sender
  FROM conversations c
  WHERE c.id = NEW.conversation_id;
  
  -- Update conversation
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    customer_unread_count = CASE 
      WHEN is_customer_sender THEN customer_unread_count 
      ELSE customer_unread_count + 1 
    END,
    vendor_unread_count = CASE 
      WHEN is_customer_sender THEN vendor_unread_count + 1 
      ELSE vendor_unread_count 
    END,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_new_message();

-- Reset unread count when messages are marked as read
CREATE OR REPLACE FUNCTION update_unread_count_on_read()
RETURNS TRIGGER AS $$
DECLARE
  is_customer_sender BOOLEAN;
  unread_count INTEGER;
BEGIN
  -- Only proceed if is_read changed from FALSE to TRUE
  IF OLD.is_read = FALSE AND NEW.is_read = TRUE THEN
    -- Check if the message sender is the customer
    SELECT (NEW.sender_id = c.customer_id) INTO is_customer_sender
    FROM conversations c
    WHERE c.id = NEW.conversation_id;
    
    -- Count remaining unread messages for the recipient
    IF is_customer_sender THEN
      -- Customer sent this message, so vendor read it - update vendor_unread_count
      SELECT COUNT(*) INTO unread_count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.conversation_id = NEW.conversation_id 
        AND m.sender_id = c.customer_id 
        AND m.is_read = FALSE;
      
      UPDATE conversations 
      SET vendor_unread_count = unread_count
      WHERE id = NEW.conversation_id;
    ELSE
      -- Vendor sent this message, so customer read it - update customer_unread_count
      SELECT COUNT(*) INTO unread_count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.conversation_id = NEW.conversation_id 
        AND m.sender_id = c.vendor_id 
        AND m.is_read = FALSE;
      
      UPDATE conversations 
      SET customer_unread_count = unread_count
      WHERE id = NEW.conversation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_unread_count_on_read
  AFTER UPDATE OF is_read ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count_on_read();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (
    auth.uid() = customer_id OR auth.uid() = vendor_id
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() = customer_id OR auth.uid() = vendor_id
  );

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (
    auth.uid() = customer_id OR auth.uid() = vendor_id
  );

-- Messages policies
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR vendor_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR vendor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations 
      WHERE customer_id = auth.uid() OR vendor_id = auth.uid()
    )
  );

-- =====================================================
-- USEFUL VIEWS FOR QUERIES
-- =====================================================

-- View for conversation list with user details
CREATE VIEW conversation_list AS
SELECT 
  c.*,
  customer.email as customer_email,
  vendor.email as vendor_email,
  vp.business_name,
  vp.profile_photo_url as vendor_photo,
  -- Get the latest message
  latest_msg.content as last_message_content,
  latest_msg.created_at as last_message_time
FROM conversations c
LEFT JOIN auth.users customer ON c.customer_id = customer.id
LEFT JOIN auth.users vendor ON c.vendor_id = vendor.id
LEFT JOIN vendor_profiles vp ON c.vendor_id = vp.user_id
LEFT JOIN LATERAL (
  SELECT content, created_at
  FROM messages m
  WHERE m.conversation_id = c.id
  ORDER BY created_at DESC
  LIMIT 1
) latest_msg ON true;

-- =====================================================
-- REAL-TIME SETUP
-- =====================================================

-- Enable real-time for tables (run these in Supabase Dashboard -> Database -> Replication)
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- =====================================================
-- SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Note: Replace UUIDs with actual user IDs from your auth.users table
/*
INSERT INTO conversations (customer_id, vendor_id) VALUES 
('customer-uuid-here', 'vendor-uuid-here');

INSERT INTO messages (conversation_id, sender_id, content) VALUES 
('conversation-uuid-here', 'sender-uuid-here', 'Hello, I am interested in your services!');
*/

