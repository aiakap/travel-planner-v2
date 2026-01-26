# Simplified Profile Builder Flow - Complete

## Summary

Implemented a simplified, explicit save flow for the Profile Builder where:
1. User types message → AI adds to XML in memory → Right panel shows it (unsaved)
2. User clicks "Save Data" button → Writes to DB → Refreshes with latest data

## Changes Made

### 1. Added XML State Management to ChatLayout

**File:** `app/object/_core/chat-layout.tsx`

- Added `xmlData` state to track in-memory XML
- Added `hasUnsavedChanges` state to track unsaved status
- Added `handleSave` function that:
  - Calls `/api/profile-graph/save-xml` API
  - Updates state with fresh data from DB
  - Clears unsaved flag
- Updated `onDataUpdate` handler to:
  - Accept `xmlData` in updates
  - Mark as unsaved when XML changes
- Pass `xmlData` to ChatPanel
- Pass `hasUnsavedChanges` and `onSave` to DataPanel

### 2. Modified Auto-Action Handler

**File:** `app/object/_core/chat-panel.tsx`

- Added imports for XML utilities: `addItemToXml`, `parseXmlToGraph`, `createEmptyProfileXml`
- Accepts `xmlData` prop from ChatLayout
- Changed auto-action handler to:
  - NOT call `config.autoActions.onAutoAction` (which saved to DB)
  - Instead, update XML in memory using `addItemToXml`
  - Parse XML to graph data
  - Call `onDataUpdate` with both `graphData` and `xmlData`
  - Mark as unsaved (handled by ChatLayout)

### 3. Added Save Button to DataPanel

**File:** `app/object/_core/data-panel.tsx`

- Added `hasUnsavedChanges` and `onSave` props
- Added local `isSaving` state
- Renders yellow warning bar when `hasUnsavedChanges` is true
- Shows "Save Data" button that calls `onSave`
- Button shows "Saving..." while save is in progress
- Warning message: "You have unsaved changes"

### 4. Updated Type Definitions

**File:** `app/object/_core/types.ts`

- Added `xmlData?: string` to `ChatPanelProps`
- Added `hasUnsavedChanges?: boolean` to `DataPanelProps`
- Added `onSave?: () => Promise<void>` to `DataPanelProps`

### 5. Created Save XML API Route

**File:** `app/api/profile-graph/save-xml/route.ts` (NEW)

- Accepts `xmlData` in POST body
- Validates authentication
- Saves XML to `UserProfileGraph` table using `prisma.upsert`
- Revalidates paths for cache invalidation
- Returns saved XML from database

### 6. Simplified System Prompt

**File:** `app/object/_configs/profile_attribute.config.ts`

- Removed RELATED_SUGGESTIONS card instructions
- Removed TOPIC_CHOICE card instructions
- Simplified to ONLY use AUTO_ADD cards
- Removed reference to topics list
- Kept instructions simple and focused

## How It Works Now

### Flow Diagram

```
User types "I like triathlon"
  ↓
AI responds with AUTO_ADD card
  ↓
ChatPanel detects auto-action card
  ↓
ChatPanel adds "triathlon" to XML in memory (using addItemToXml)
  ↓
ChatPanel parses XML to graphData
  ↓
ChatPanel calls onDataUpdate({ graphData, xmlData })
  ↓
ChatLayout updates state:
  - setData({ graphData, xmlData })
  - setXmlData(xmlData)
  - setHasUnsavedChanges(true)
  ↓
DataPanel receives hasUnsavedChanges=true
  ↓
DataPanel shows yellow "Save Data" button
  ↓
Right panel (ProfileView) shows "triathlon" immediately
  ↓
User clicks "Save Data"
  ↓
ChatLayout.handleSave() calls /api/profile-graph/save-xml
  ↓
API saves XML to database
  ↓
API returns saved XML
  ↓
ChatLayout updates state with DB data
  ↓
ChatLayout sets hasUnsavedChanges=false
  ↓
Yellow bar disappears
  ↓
Data is now persisted!
```

## Testing Instructions

1. **Navigate to** `/object/profile_attribute`
2. **Type** "I like triathlon" in the chat
3. **Verify:**
   - AI responds with "Great! I've added Triathlon to your profile"
   - Right panel shows "Triathlon" under Hobbies
   - Yellow bar appears at top of right panel
   - "Save Data" button is visible
4. **Click** "Save Data" button
5. **Verify:**
   - Button shows "Saving..." briefly
   - Yellow bar disappears
   - Data remains on right panel
6. **Refresh the page**
7. **Verify:**
   - "Triathlon" still appears (persisted to DB)
8. **Navigate to** `/profile/graph` (dossier page)
9. **Verify:**
   - "Triathlon" appears there too

## Key Benefits

1. **Explicit Control** - User decides when to save
2. **Clear Feedback** - Yellow bar shows unsaved state
3. **No Auto-Save Failures** - No more silent failures
4. **Immediate Preview** - See changes before saving
5. **Simple Flow** - Easy to understand and debug

## Files Modified

1. `app/object/_core/chat-layout.tsx` - XML state & save handler
2. `app/object/_core/chat-panel.tsx` - Memory-only auto-actions
3. `app/object/_core/data-panel.tsx` - Save button UI
4. `app/object/_core/types.ts` - Type definitions
5. `app/api/profile-graph/save-xml/route.ts` - Save API (NEW)
6. `app/object/_configs/profile_attribute.config.ts` - Simplified prompt

## Success Criteria

✅ Type message → See on right immediately (unsaved)
✅ Yellow "Save Data" button appears
✅ Click Save → Data persists to database
✅ Refresh page → Data still there
✅ Check dossier page → Data appears there too
✅ No automatic DB writes until Save clicked
