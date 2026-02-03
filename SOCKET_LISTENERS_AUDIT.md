# Socket Listener Audit

## Current Socket Listener Registrations

### 1. `useConversations` Hook (src/hooks/useMessages.ts:58-204)
**Used by:**
- ConversationList.tsx
- ForwardMessageDialog.tsx
- SharePostToDMDialog.tsx

**Registers:**
- `onDMMessage` - Updates conversation list, increments unread count, plays sound
- `onNewConversation` - Joins new conversation rooms
- `onDMRead` - Updates read receipts for sent messages

**Issue:** This hook is called by 3 different components. Each component instance creates its own set of listeners.

### 2. `useConversationMessages` Hook (src/hooks/useMessages.ts:206-319)
**Used by:**
- ChatView.tsx

**Registers:**
- `onDMMessage` - Updates message list for specific conversation
- `onDMRead` - Updates read receipts in conversation

**Issue:** Only used once, but registers listeners that overlap with useConversations

### 3. `useUnreadMessageCount` Hook (src/hooks/useMessages.ts:586-612)
**Used by:**
- Header.tsx
- useDocumentTitle.ts (which is used in App.tsx)

**Registers:**
- `onUnreadCountUpdate` - Updates unread count from server

**Status:** Fixed - removed duplicate dm:message and dm:read listeners

### 4. `useDesktopNotifications` Hook (src/hooks/useDesktopNotifications.ts:101)
**Used by:**
- App.tsx (via AppHooks)

**Registers:**
- `onDMMessage` - Shows desktop notifications

**Issue:** Another dm:message listener

## Problem Analysis

### Multiple Instances of useConversations
When MessagesSheet is open:
1. ConversationList calls useConversations → registers 3 listeners
2. ForwardMessageDialog (if open) calls useConversations → registers 3 more listeners
3. SharePostToDMDialog (if open) calls useConversations → registers 3 more listeners

### Overlapping Listeners
- `useConversations.onDMMessage` - handles conversation list updates
- `useConversationMessages.onDMMessage` - handles message list updates (filtered by conversationId)
- `useDesktopNotifications.onDMMessage` - shows notifications

All three listen to the same `dm:message` event!

## Solution

### Option 1: Singleton Pattern (Recommended)
Create a single global socket listener manager that handles all dm:message events and dispatches to appropriate handlers.

### Option 2: Conditional Registration
Only register listeners in the top-level component and pass data down via context.

### Option 3: Event Filtering
Keep current structure but ensure each listener properly filters events to avoid duplicate processing.
