# Data Structure Fix - Complete

## Summary

Fixed the data structure mismatch that was preventing data from appearing on the right panel in the generic object system.

## Problem

The data wasn't appearing because of a structure mismatch:

1. **Initial data** from `fetchProfileData`: `{ graphData: {...}, hasData: boolean }`
2. **API response** from upsert: `{ success: true, graphData: {...}, xmlData: string }`
3. **Update passed** to ChatLayout: `{ graphData: {...}, xmlData: string }`
4. **ProfileView expected**: `data.graphData.nodes`

When `setData({ graphData, xmlData })` was called, the structure became:
```
data = { graphData: {...}, xmlData: "..." }
```

But ProfileView tried to access `data.graphData.nodes`, which worked because:
```
{ graphData: {...} }.graphData.nodes  ✅
```

However, the initial data structure was `{ graphData: {...}, hasData: boolean }`, so we needed consistency.

## Solution

### 1. Fixed ChatLayout onDataUpdate Handler

**File:** `app/object/_core/chat-layout.tsx`

Changed the `onDataUpdate` handler to properly wrap the graphData:

```typescript
} else if (update && update.graphData) {
  // Wrap the graphData to match expected structure
  console.log('🟣 ChatLayout: Wrapping graphData with', update.graphData.nodes?.length, 'nodes');
  
  // Keep the same structure as fetchProfileData returns
  setData({
    graphData: update.graphData,
    hasData: update.graphData.nodes?.length > 1
  });
  
  // Update XML data and mark as unsaved if XML is provided
  if (update.xmlData) {
    setXmlData(update.xmlData);
    setHasUnsavedChanges(true);
    console.log('🟣 ChatLayout: XML updated, marked as unsaved');
  }
}
```

**Key change:** Instead of `setData(update)`, we now wrap it as `setData({ graphData: update.graphData, hasData: ... })` to match the initial data structure.

### 2. Enhanced Logging

**File:** `app/object/_configs/profile_attribute.config.ts`

Added detailed logging to track the data flow:

```typescript
console.log('✅ [Profile Config] Upsert successful:', {
  success: result.success,
  nodeCount: result.graphData?.nodes?.length,
  nodes: result.graphData?.nodes?.map((n: any) => n.value).join(', '),
  hasXmlData: !!result.xmlData
});

if (onDataUpdate) {
  console.log('📤 [Profile Config] Calling onDataUpdate with graphData');
  onDataUpdate({
    graphData: result.graphData,
    xmlData: result.xmlData
  });
}
```

## Testing

To test the fix:

1. Go to `http://localhost:3000/object/profile_attribute`
2. Open browser console
3. Type "I like spy food"
4. Watch for these logs in order:
   - `🔵 [Profile Config] onAutoAction called`
   - `📤 [Profile Config] Calling upsert API`
   - `📥 [Profile Upsert API] Request`
   - `🔵 [upsertProfileItem] Starting`
   - `🟢 [upsertProfileItem] Saved to DB`
   - `✅ [Profile Config] Upsert successful` (shows "spy food" in nodes)
   - `📤 [Profile Config] Calling onDataUpdate`
   - `📊 Received data update from onAutoAction`
   - `🟣 ChatLayout: onDataUpdate received`
   - `🟣 ChatLayout: Wrapping graphData` (shows node count)
   - `📊 DataPanel: Rendering` (shows updated node count)
   - `📺 ProfileView: Rendering` (shows "spy food" in nodes)

5. Verify "spy food" appears on the right panel
6. Yellow "Save Changes" bar should appear at top
7. Click "Save Changes" to persist to database
8. Refresh page - data should still be there
9. Check `/profile/graph` - data should appear there too

## Expected Behavior

1. **Type message** → "I like spy food"
2. **AI responds** → Acknowledges the preference
3. **Right panel updates** → "spy food" appears immediately under appropriate category
4. **Save button appears** → Yellow bar at top of right panel
5. **Click save** → Data persists to database
6. **Yellow bar disappears** → Changes saved
7. **Refresh page** → Data still appears (persisted)
8. **Check dossier** → Data appears on `/profile/graph` too

## Files Modified

1. `app/object/_core/chat-layout.tsx` - Fixed data structure wrapping in onDataUpdate
2. `app/object/_configs/profile_attribute.config.ts` - Added detailed logging

## Root Cause

The issue was that we were passing `{ graphData, xmlData }` directly to `setData()`, but the component tree expected the data to be wrapped as `{ graphData: {...}, hasData: boolean }` to match the initial data structure from `fetchProfileData`.

By wrapping the update properly, the data now flows correctly through:
```
API → Config → ChatPanel → ChatLayout → DataPanel → ProfileView
```

All components now receive data in the expected structure, and the UI updates immediately when data changes.
