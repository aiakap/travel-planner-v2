# Root Cause Found - Hotel Suggestions Not Appearing

## Problem Identified

The debug instrumentation revealed the exact issue: **The AI is returning hotel names in the `places` array but NOT mentioning those names in the text response.**

## Test Output Analysis

```
Text: "Here are some hotel options in Niseko for your consideration."

Places array:
  1. Hilton Niseko Village (Stay/Hotel)
  2. The Vale Niseko (Stay/Hotel)
  3. Ki Niseko (Stay/Hotel)

Stage 3 Matching Results:
  🔍 Searching for: "Hilton Niseko Village"
      Result: ❌ NOT FOUND
  
  🔍 Searching for: "The Vale Niseko"
      Result: ❌ NOT FOUND
  
  🔍 Searching for: "Ki Niseko"
      Result: ❌ NOT FOUND
```

## Why This Breaks

1. AI generates text: "Here are some hotel options in Niseko for your consideration."
2. AI populates places array: `["Hilton Niseko Village", "The Vale Niseko", "Ki Niseko"]`
3. `assemblePlaceLinks()` searches for "Hilton Niseko Village" in the text
4. Can't find it because the text doesn't actually mention "Hilton Niseko Village"
5. No match = no clickable link = no interactive element

## Root Cause

The `EXP_BUILDER_SYSTEM_PROMPT` had the instruction backwards:

**Original instruction:**
> "Every place/hotel/restaurant name you mention in 'text' MUST appear in 'places' array"

This tells the AI: "If you mention a place in text, put it in the array"

**What we actually need:**
> "Every place in 'places' array MUST be mentioned by name in 'text'"

This tells the AI: "If you put a place in the array, you MUST mention it by name in text"

## The Fix

Updated `app/exp/lib/exp-prompts.ts` with clearer bidirectional instructions:

```typescript
CRITICAL MATCHING RULES:
1. Every place in "places" array MUST be mentioned by name in "text"
2. Every place name you mention in "text" MUST appear in "places" array
3. The names must match EXACTLY (character-for-character)
4. Use plain names like "The Vale Niseko", NOT "[HOTEL: The Vale Niseko]"
5. NO brackets, NO tags, NO prefixes in the text

EXAMPLE - If your places array has ["Sansui Niseko", "Ki Niseko", "The Vale Niseko"], 
your text MUST include those exact names:

GOOD: "Here are some hotels: Sansui Niseko, Ki Niseko, and The Vale Niseko are all excellent options."
BAD: "Here are some hotel options in Niseko for your consideration." (names not mentioned!)
```

## Expected Result After Fix

**AI should now return:**

```
Text: "Here are some excellent hotels in Niseko: Hilton Niseko Village offers 
luxury ski access, The Vale Niseko has stunning mountain views, and Ki Niseko 
features modern design. Would you like to add any of these to your itinerary?"

Places array:
  1. Hilton Niseko Village (Stay/Hotel)
  2. The Vale Niseko (Stay/Hotel)
  3. Ki Niseko (Stay/Hotel)
```

**Then matching will succeed:**

```
🔍 Searching for: "Hilton Niseko Village"
      Result: ✅ FOUND at 45

🔍 Searching for: "The Vale Niseko"
      Result: ✅ FOUND at 102

🔍 Searching for: "Ki Niseko"
      Result: ✅ FOUND at 156
```

## Why Previous Fixes Didn't Work

1. **Adding exact-match instruction** - Helped, but didn't address that AI wasn't mentioning names at all
2. **Flexible matching with fallbacks** - Can't find names that aren't there
3. **Removing `[HOTEL: ...]` tags** - Fixed one issue, but AI went too far and removed names entirely

The AI interpreted "don't use brackets" as "don't mention the names at all", generating generic text instead.

## Testing the Fix

Run the test script again:
```bash
npx tsx scripts/test-hotel-suggestions.ts
```

Or test in the app:
1. Navigate to `/exp`
2. Ask: "Suggest hotels in Niseko"
3. Check terminal logs for Stage 3 matching results
4. Should now see ✅ FOUND for all hotels

## Files Modified

- **`app/exp/lib/exp-prompts.ts`** (lines 14-23)
  - Added explicit bidirectional matching rules
  - Added clear example showing GOOD vs BAD
  - Emphasized that places array entries MUST appear in text

## Debug Instrumentation Value

The comprehensive logging made this immediately obvious:
- ✅ Showed AI response text preview
- ✅ Showed places array contents
- ✅ Showed each matching attempt with NOT FOUND results
- ✅ Showed the text being searched

Without this instrumentation, we would have been guessing. With it, the problem was crystal clear in the first test run.

---

**Issue found**: January 27, 2026
**Fix applied**: Bidirectional matching instructions in prompt
**Test command**: `npx tsx scripts/test-hotel-suggestions.ts`
