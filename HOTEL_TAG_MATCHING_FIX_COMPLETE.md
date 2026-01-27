# Hotel Tag Matching Fix - Complete

## Problem

When users asked for hotel suggestions (e.g., "Suggest hotels in Niseko"), the AI returned hotel names wrapped in tags:

```
• [HOTEL: The Vale Niseko]
• [HOTEL: Hilton Niseko Village]
• [HOTEL: Ki Niseko]
```

This broke the place suggestion system because:
1. The `assemblePlaceLinks()` function uses exact string matching
2. It searches for `suggestion.suggestedName` (e.g., "The Vale Niseko") in the text
3. But the text contained `[HOTEL: The Vale Niseko]`, so the match failed
4. Without a match, no Google Places enrichment happened
5. Without enrichment, no clickable links or hover cards appeared

## Root Cause

The `EXP_BUILDER_SYSTEM_PROMPT` was missing a critical instruction that exists in the default `SYSTEM_PROMPT`:

```typescript
IMPORTANT: Every place/flight/hotel name you mention in "text" MUST appear EXACTLY in the respective array's "suggestedName" field.
```

Without this instruction, the AI invented its own formatting convention using `[HOTEL: ...]` tags, which broke the exact string matching algorithm in `assemblePlaceLinks()`.

## How the System Works

**String Matching Algorithm** (`lib/html/assemble-place-links.ts:32`):
```typescript
const placeIndex = text.indexOf(suggestion.suggestedName, lastIndex);
```

This requires:
- Text: "I recommend **The Vale Niseko** for your stay"
- suggestedName: "The Vale Niseko"
- Result: Match found at position of "The Vale Niseko" ✅

But with tags:
- Text: "I recommend **[HOTEL: The Vale Niseko]** for your stay"
- suggestedName: "The Vale Niseko"
- Result: No match found (because "[HOTEL: The Vale Niseko]" ≠ "The Vale Niseko") ❌

## Solution

Added explicit instructions to `EXP_BUILDER_SYSTEM_PROMPT` that place names must appear exactly (without any brackets or tags) in both the text and the suggestedName field.

## Changes Made

### 1. Added Critical Exact-Match Instruction (After Line 12)

```typescript
CRITICAL: Every place/hotel/restaurant name you mention in "text" MUST appear EXACTLY (character-for-character) in the "places" array's "suggestedName" field.
- Use plain names like "The Vale Niseko", NOT "[HOTEL: The Vale Niseko]"
- NO brackets, NO tags, NO prefixes in the text
- The exact same spelling and capitalization must appear in both locations
```

### 2. Updated Example 4 Comment (Line 418)

**Before:**
```
**Example 4: Hotel Suggestions**
```

**After:**
```
**Example 4: Hotel Suggestions** (NOTE: Place names in text MUST match suggestedName exactly - NO brackets or tags!)
```

### 3. Added Rule #10 to Important Rules (Line 483)

```
10. **Place names in "text" must EXACTLY match "suggestedName"** - no brackets, no tags, no prefixes
```

## Expected Behavior After Fix

When a user asks "Suggest hotels in Niseko":

**AI will return:**
```json
{
  "text": "Here are some excellent hotels in Niseko:\n\n• Sansui Niseko - Luxury resort with ski access\n• Ki Niseko - Modern design hotel\n• The Vale Niseko - Mountain views and onsens\n\nWould you like me to add any of these to your itinerary?",
  "cards": [],
  "places": [
    { "suggestedName": "Sansui Niseko", "category": "Stay", "type": "Hotel", ... },
    { "suggestedName": "Ki Niseko", "category": "Stay", "type": "Hotel", ... },
    { "suggestedName": "The Vale Niseko", "category": "Stay", "type": "Hotel", ... }
  ]
}
```

**Processing:**
1. Stage 1: AI generates response with hotels in "places" array ✅
2. Stage 2: Google Places resolves each hotel → photos, ratings, address ✅
3. Stage 3: `assemblePlaceLinks()` finds "Sansui Niseko" in text ✅
4. Creates place segment with enriched `placeData` ✅

**User sees:**
- "**Sansui Niseko**" as clickable blue link with map pin icon
- Hover shows card with photos, ratings, address, phone
- "Add to Itinerary" button available
- Map integration showing hotel locations

## File Modified

- `/app/exp/lib/exp-prompts.ts`
  - Added exact-match instruction after field descriptions
  - Updated Example 4 comment
  - Added rule #10

## Testing

To verify the fix:
1. Open `/exp` page
2. Create or select a trip with a segment
3. Ask: "Suggest hotels in [location]"
4. Verify:
   - Hotel names appear as plain text (e.g., "The Vale Niseko")
   - No `[HOTEL: ...]` brackets in the response
   - Names are clickable blue links with map pin icons
   - Hover shows rich cards with photos and details
   - "Add to Itinerary" buttons work

## Reference

- Default `SYSTEM_PROMPT` in `lib/ai/generate-place-suggestions.ts` (line 54) has had this instruction all along
- `lib/html/assemble-place-links.ts` shows the exact string matching algorithm
- `MessageSegmentsRenderer` component renders the clickable place links

---

**Fix completed on**: January 27, 2026
**Related to**: Structured Outputs Migration, Hotel Suggestions Fix
