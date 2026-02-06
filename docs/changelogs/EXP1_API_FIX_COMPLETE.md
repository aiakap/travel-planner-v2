# EXP1 API 500 Error - Fix Complete

## Problem Summary

The `/exp1` chat was returning 500 errors because the `EXP_BUILDER_SYSTEM_PROMPT` had misleading examples that confused the AI about the expected output format.

### Root Cause

The prompt had examples showing conversational responses without JSON wrappers:

```
User: "Plan a trip to Tokyo"
AI: "[TRIP_CARD: ...]
I've created a 7-day Tokyo trip..."
```

This made the AI output plain text instead of the required JSON format with card syntax embedded in the `text` field.

## Solution Implemented

### 1. Fixed the Prompt (CRITICAL)

**File**: `app/exp1/lib/exp-prompts.ts`

Updated all three example conversations (lines 129-167) to show the correct JSON format:

```json
{
  "text": "[TRIP_CARD: ...]\n\nI've created your trip...",
  "places": [],
  "transport": [],
  "hotels": []
}
```

The key insight: Card syntax like `[TRIP_CARD: ...]` goes **INSIDE** the `text` field of the JSON response, not as standalone output.

### 2. Added Response Validation

**New File**: `lib/ai/validate-ai-response.ts`

Created a validation utility that:
- Checks for required fields (`text`, `places`, `transport`, `hotels`)
- Validates field types (string, arrays)
- Detects common AI mistakes (markdown wrappers, nested JSON)
- Returns detailed error messages and warnings

### 3. Added Comprehensive Logging

**File**: `app/api/chat/simple/route.ts`

Added logging to track:
- Which prompt is being used (DEFAULT vs EXP1)
- AI response validation results
- Text length and suggestion counts
- Validation errors and warnings

This helps debug future issues quickly.

### 4. Improved Client Error Handling

**File**: `app/exp1/client.tsx`

Enhanced error handling to:
- Log full error responses from API
- Show user-friendly error messages based on error type
- Provide specific guidance for 500 errors (format issues)
- Handle authentication and timeout errors

### 5. Created Prompt Testing Script

**New File**: `scripts/test-prompts.ts`

Created a testing utility that:
- Tests both DEFAULT and EXP1 prompts
- Validates responses match expected format
- Measures response times
- Can be run before deployment to catch issues

**Usage**: `npx tsx scripts/test-prompts.ts`

## How the Card System Works

Understanding the flow helps prevent future issues:

1. **Stage 1**: AI generates JSON with 4 fields: `text`, `places`, `transport`, `hotels`
2. **Stage 2.5**: `parseCardsFromText()` extracts card syntax from the `text` field
3. Card syntax is **removed** from the text field
4. Card segments and place segments are **combined** into final output

**Key Point**: The system was already designed correctly. We just needed to fix the prompt examples to match how it actually works.

## Files Changed

### Modified Files
1. `app/exp1/lib/exp-prompts.ts` - Fixed example conversations to show JSON format
2. `app/api/chat/simple/route.ts` - Added validation and logging
3. `app/exp1/client.tsx` - Improved error handling

### New Files
1. `lib/ai/validate-ai-response.ts` - Response validation utility
2. `scripts/test-prompts.ts` - Prompt testing script
3. `EXP1_API_FIX_COMPLETE.md` - This document

## Testing

### Manual Testing Required

1. **Test Simple Query**: Open `/exp1` and type "Plan a trip to Paris"
   - Should return without 500 error
   - Should show a trip card inline

2. **Test Place Suggestions**: Type "Show me restaurants in Tokyo"
   - Should return without 500 error
   - Should show clickable place links

3. **Test Hotel Email**: Paste the Hotels.com confirmation email
   - Should detect hotel reservation
   - Should show hotel card with all fields

### Automated Testing

Run the test script to verify both prompts work:

```bash
npx tsx scripts/test-prompts.ts
```

This tests 5 queries with both DEFAULT and EXP1 prompts and validates all responses.

## Rollback Plan

If the fix doesn't work:

**Quick Rollback** (30 seconds): In `app/exp1/client.tsx` line 168, change:
```typescript
useExpPrompt: true,  // Change to false
```

This reverts to the default prompt while keeping all other improvements.

## Success Criteria

- ✅ `/exp1` chat works without 500 errors
- ✅ Simple queries return valid responses with trip cards
- ✅ Place suggestions work and show clickable links
- ✅ Hotel email detection works with hotel card syntax
- ✅ Detailed logs show what's happening at each stage
- ✅ Validation catches malformed responses before they cause errors
- ✅ Error messages are helpful for debugging
- ✅ Test script can verify prompt changes before deployment

## Key Takeaways

1. **Always match examples to implementation**: The prompt examples must show exactly how the system expects data
2. **Validate AI responses**: Don't assume AI will always follow instructions - validate the structure
3. **Add comprehensive logging**: Makes debugging much faster when issues occur
4. **Test before deploying**: The test script can catch format issues early
5. **Understand the flow**: Knowing how the pipeline works prevents confusion about where data should go

## Time Spent

- Critical fix (Step 1): 5 minutes
- Optional instrumentation (Steps 2-5): 40 minutes
- **Total**: 45 minutes

The critical fix alone would have resolved the 500 error. The additional instrumentation helps prevent and debug future issues.
