# Auto-Add Debug Guide

## Issue
Items show "Added to profile" badge but aren't actually being added to the graph.

## Fixes Applied

### 1. Fixed JSON Format for Extraction
**Problem:** The AI was using `json_object` mode which requires an object, but we were asking for an array.

**Fix:** Updated prompts to request JSON object with "items" array:
```json
{
  "items": [
    {"value": "Swimming", "category": "hobbies", "subcategory": "sports", "metadata": {...}}
  ]
}
```

### 2. Enhanced Logging
Added comprehensive logging at each step to diagnose issues:

**Extraction Function (`lib/ai/profile-graph-chat.ts`):**
- Raw AI response
- Cleaned response
- Parsed JSON
- Final items array

**API Route (`app/api/profile-graph/chat/route.ts`):**
- User message
- Current profile item count
- Extracted items (full JSON)
- Each item addition attempt
- Success/failure for each item
- Total items added

**Client (`app/profile/graph/client.tsx`):**
- Graph update with node count
- Auto-added items list

## How to Debug

### 1. Open Browser Console
Navigate to `http://localhost:3000/profile/graph` and open DevTools console.

### 2. Send Test Message
Type: "I like to swim"

### 3. Check Logs in Order

**Step 1: Extraction**
```
🔍 [Profile Graph API] Phase 1: Extracting explicit items...
📝 [Profile Graph API] User message: I like to swim
📊 [Profile Graph API] Current profile has X items
🔍 [Profile Graph AI] Extracting explicit items from: I like to swim
🔍 [Profile Graph AI] Raw AI response: {...}
🔍 [Profile Graph AI] Cleaned response: {...}
🔍 [Profile Graph AI] Parsed JSON: {...}
🔍 [Profile Graph AI] Final items array: [...]
✅ [Profile Graph AI] Extracted 1 explicit items: Swimming
```

**Step 2: Database Addition**
```
🔍 [Profile Graph API] Extracted items: [{"value":"Swimming",...}]
➕ [Profile Graph API] Attempting to add: Swimming to category: hobbies
✅ [Profile Graph API] Successfully added: Swimming Result: {...}
✨ [Profile Graph API] Total items added: 1
```

**Step 3: Client Update**
```
📊 [Client] Updating graph with X nodes
✨ [Client] Auto-added items: Swimming
```

### 4. Common Issues

#### Issue: "Extracted 0 items"
**Cause:** AI didn't extract anything
**Check:** 
- Is the message explicit enough? ("I like to swim" vs "Tell me more")
- Is the item already in profile? (Check current profile log)

#### Issue: "Error adding item"
**Cause:** Database error
**Check:**
- Error message in console
- Category/subcategory valid?
- User authenticated?

#### Issue: "Extracted items: []"
**Cause:** Parsing failed
**Check:**
- Raw AI response format
- Is it valid JSON?
- Does it have "items" array?

#### Issue: Badge shows but graph doesn't update
**Cause:** Graph data not refreshing
**Check:**
- Is `graphData` being updated in client?
- Does API return `graphData` and `xmlData`?
- Check node count in "Updating graph" log

## Test Cases

### Test 1: Single Item
**Input:** "I like to swim"
**Expected:**
- ✅ Extract: `[{"value": "Swimming", "category": "hobbies", "subcategory": "sports"}]`
- ✅ Add: Successfully added
- ✅ Badge: "✓ Added to profile: Swimming"
- ✅ Graph: New "Swimming" node appears

### Test 2: Multiple Items
**Input:** "I like swimming, hiking, and photography"
**Expected:**
- ✅ Extract: All 3 items
- ✅ Add: All 3 successfully added
- ✅ Badge: "✓ Added to profile: Swimming, Hiking, Photography"
- ✅ Graph: 3 new nodes appear

### Test 3: Already Exists
**Input:** "I like to swim" (when Swimming already in profile)
**Expected:**
- ✅ Extract: `[]` (empty, already exists)
- ✅ Add: Nothing to add
- ✅ Badge: Not shown
- ✅ Graph: No change

### Test 4: No Explicit Items
**Input:** "Tell me more about that"
**Expected:**
- ✅ Extract: `[]` (empty, no explicit items)
- ✅ Add: Nothing to add
- ✅ Badge: Not shown
- ✅ Graph: No change

## Files Modified

1. **`lib/ai/profile-graph-chat.ts`**
   - Updated EXTRACTION_SYSTEM_PROMPT examples to use object format
   - Updated extraction prompt to request object format
   - Added detailed logging throughout extraction

2. **`app/api/profile-graph/chat/route.ts`**
   - Added logging for user message and profile state
   - Added logging for each item addition attempt
   - Added result logging for each operation

3. **`app/profile/graph/client.tsx`**
   - Added logging for graph updates
   - Added logging for auto-added items

## Next Steps

1. **Test with real data** - Send "I like to swim" and check all logs
2. **Verify extraction** - Ensure AI returns correct format
3. **Verify addition** - Ensure items are added to database
4. **Verify graph update** - Ensure graph refreshes with new nodes

If issues persist, share the console logs from all three steps above.
