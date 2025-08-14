# 🚀 Real-Time Messaging Setup Guide

## 📋 Required Steps to Enable Real-Time Messages

### 1. **Enable Real-Time in Supabase Dashboard**

Go to your Supabase project → **Database** → **Replication** and run:

```sql
-- Enable real-time for messaging tables
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### 2. **Verify Real-Time is Working**

Open browser console while testing messages. You should see:

```
Setting up real-time subscription for conversation: [conversation-id]
Subscription status: SUBSCRIBED
Real-time message received: [payload object]
Message sent successfully: [message data]
```

### 3. **Check Database Permissions**

Ensure RLS policies allow real-time updates:

```sql
-- Verify policies exist
SELECT * FROM pg_policies WHERE tablename IN ('conversations', 'messages');
```

### 4. **Test Real-Time Connection**

Run this in your browser console on the messages page:

```javascript
// Test real-time connection
const { createClient } = await import('/src/lib/supabase/client.js')
const supabase = createClient()

const channel = supabase
  .channel('test-realtime')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'messages' 
  }, (payload) => {
    console.log('Real-time test:', payload)
  })
  .subscribe((status) => {
    console.log('Test subscription status:', status)
  })
```

## 🔧 **Troubleshooting**

### **If messages don't appear in real-time:**

1. **Check Supabase Project Settings:**
   - Go to Settings → API
   - Ensure Real-time is enabled
   - Check if there are any rate limits

2. **Verify Network Connection:**
   - Real-time uses WebSockets
   - Check for firewall/proxy blocking
   - Test on different network

3. **Browser Console Debugging:**
   ```javascript
   // Check subscription status
   console.log('Supabase channels:', supabase.getChannels())
   ```

4. **Fallback Mechanism:**
   - Messages will still be saved to database
   - Fallback refetch happens after 500ms
   - Page refresh will show all messages

### **Common Issues:**

- **"CHANNEL_ERROR"**: Real-time not enabled in Supabase
- **"TIMED_OUT"**: Network connectivity issues  
- **"CLOSED"**: Authentication or permission issues

## ✅ **Verification Checklist**

- [ ] Real-time tables added to publication
- [ ] RLS policies configured correctly
- [ ] Console shows "SUBSCRIBED" status
- [ ] Messages appear without page refresh
- [ ] Multiple browser tabs sync messages
- [ ] Unread counts update in real-time

## 🔄 **Fallback Behavior**

Even if real-time fails, the system will:
1. Save messages to database successfully
2. Refetch messages after sending (500ms delay)
3. Show messages on page refresh
4. Continue working without real-time features

## 📞 **Support**

If real-time still doesn't work:
1. Check Supabase project logs
2. Verify API keys and permissions
3. Test with simple real-time example
4. Contact Supabase support if needed

