# exp1 Chat Selection Bug Fix & Date Display Implementation - COMPLETE

## Summary
Fixed the "new chat" selection bug and added creation/update date displays to the exp1 chat interface.

## Changes Made

### 1. Fixed New Chat Selection Bug

**Problem:** When users clicked "New Chat", the new empty chat wasn't properly loaded - old messages persisted in the UI.

**Solution:** Added `onMessagesReset` callback to clear messages when switching to a new chat.

**Files Modified:**
- `app/exp1/components/chat-name-dropdown.tsx`
  - Added `onMessagesReset: () => void` prop to interface (line 28)
  - Called `onMessagesReset()` in `handleNewChat()` before selecting the new conversation (line 66)
  
- `app/exp1/client.tsx`
  - Passed `onMessagesReset={() => setMessages([])}` to `ChatNameDropdown` component (line 1037)

### 2. Added Date Formatting Helper

**Implementation:** Created a `formatDate()` helper function that displays relative time for recent chats and absolute dates for older ones.

**Format Examples:**
- "Just now" (< 1 minute)
- "5m ago" (< 1 hour)
- "2h ago" (< 24 hours)
- "3d ago" (< 7 days)
- "1/24/2026" (7+ days)

**Files Modified:**
- `app/exp1/components/chat-name-dropdown.tsx` (lines 46-59)
- `app/exp1/client.tsx` (lines 154-168)

### 3. Added Date Display to Chat Dropdown

**Implementation:** Updated each conversation item in the dropdown to show when it was last updated.

**Files Modified:**
- `app/exp1/components/chat-name-dropdown.tsx` (lines 94-105)
  - Changed dropdown items to use flex column layout
  - Added "Updated: X ago" text below each chat title

### 4. Added Date Display to Chat Header

**Implementation:** Updated the chat header to show the current conversation's last updated time.

**Files Modified:**
- `app/exp1/client.tsx` (lines 1019-1046)
  - Restructured header to use flex column layout
  - Added date display below the chat name/dropdown
  - Shows "Updated: X ago" for the currently selected chat

## Testing Checklist

✅ Click "New Chat" - empty chat loads immediately (messages cleared)
✅ Switch between existing chats - correct messages load
✅ Dropdown shows "Updated: X ago" for each chat
✅ Chat header shows current chat's update time
✅ Date formatting works: "Just now", "5m ago", "2h ago", "3d ago", "1/24/2026"
✅ No linter errors

## Technical Details

### Bug Fix Mechanism
The bug was caused by the `handleConversationSelect()` function only updating local state without clearing old messages. When a new chat was created with no messages, the UI still displayed messages from the previous chat. The fix ensures messages are explicitly cleared when creating a new chat.

### Date Display Strategy
- **Relative time** for recent activity (< 7 days) provides quick context
- **Absolute dates** for older chats provide precise information
- Consistent formatting across dropdown and header
- Dates update based on `updatedAt` field from database

## Files Changed
1. `app/exp1/components/chat-name-dropdown.tsx` - Added date display, formatDate helper, and onMessagesReset callback
2. `app/exp1/client.tsx` - Added date display to header, formatDate helper, and passed onMessagesReset callback

## Impact
- **User Experience:** Users can now easily identify which chat they're working with based on when it was last updated
- **Bug Fix:** New chats now load properly without showing old messages
- **Consistency:** Date formatting is consistent across the interface
- **Scope:** Changes only affect exp1 (as requested)
