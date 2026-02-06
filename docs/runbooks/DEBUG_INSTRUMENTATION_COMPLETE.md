# Debug Instrumentation Implementation - Complete

## Overview

Comprehensive debugging instrumentation has been added to trace the entire hotel suggestions pipeline. This will help identify exactly where the system is failing and provide detailed logs at every stage.

## What Was Implemented

### 1. Enhanced Server-Side Logging

#### File: `app/api/chat/simple/route.ts`

**After Stage 1 (Lines 607-627):**
- Logs the first 500 characters of AI response text
- Logs detailed places array with all fields
- Shows suggestedName, category, type, and searchQuery for each place
- Warns if NO PLACES are returned
- Shows all keys in stage1Output object

**Before Stage 3 (Lines 757-767):**
- Logs the text being passed to assemblePlaceLinks (first 200 chars)
- Shows exact count of places being processed
- Lists every place name that will be searched for
- Shows all keys in the placeMap (resolved Google Places data)

**Debug Mode with In-Chat Messages (Lines 15-27, 840-879):**
- Added DEBUG_MODE flag (enabled in development or with DEBUG_CHAT=true)
- Created `createDebugSegment()` helper function
- Prepends 5 debug segments to chat response showing:
  - Stage 1: AI Response (text length, places count, cards count)
  - Stage 2: Google Places Resolution (resolved/total)
  - Stage 3: Segment Assembly (total, place, text segments)
  - Places Array from AI (name, category, type for each)
  - Segment Details (index, type, display text for each)

#### File: `lib/html/assemble-place-links.ts`

**Enhanced Matching Logs (Lines 70-91):**
- Logs search start for each place name
- Shows starting position in text
- Reports result (FOUND or NOT FOUND) with position
- For failures, shows:
  - Extended text context (100 chars before, 200 after)
  - All matching strategies that were attempted
  - Exact text that was searched for
- For successes, shows the actual matched text

### 2. Client-Side Console Logging

#### File: `app/exp/client.tsx`

**After Response Received (Lines 264-286):**
- Logs content length
- Shows total segment count
- Provides breakdown by segment type (text, place, card, etc.)
- Lists all place segments with their display names
- Shows if placeData is present for each place
- Warns if NO PLACE SEGMENTS are found

### 3. Test Script

#### File: `scripts/test-hotel-suggestions.ts` (NEW)

Created standalone test script that:
- Tests the complete pipeline in isolation
- Shows output from all 3 stages
- Displays AI-generated text and places array
- Shows Google Places resolution results
- Analyzes final segments with detailed breakdown
- Can be run independently: `npx tsx scripts/test-hotel-suggestions.ts`

## How to Use

### Method 1: Live Chat Testing

1. **Start the development server** (if not already running)
2. **Open browser console** (F12 → Console tab)
3. **Open terminal** with Next.js logs visible
4. **Navigate to** `/exp` page
5. **Ask for hotels**: "Suggest hotels in Niseko"
6. **Watch both consoles simultaneously**

### Method 2: Test Script

```bash
cd /Users/alexkaplinsky/Desktop/Dev\ site/travel-planner-v2
npx tsx scripts/test-hotel-suggestions.ts
```

This runs the pipeline in isolation without the full app.

**Note**: The script automatically loads environment variables from `.env` and `.env.local` files. Make sure you have:
- `OPENAI_API_KEY` set
- `GOOGLE_PLACES_API_KEY` or `GOOGLE_MAPS_API_KEY` set (either works)

### Method 3: In-Chat Debug (Optional)

Set environment variable:
```bash
export DEBUG_CHAT=true
```

Or in `.env.local`:
```
DEBUG_CHAT=true
```

This will show debug JSON data directly in the chat UI.

## What to Look For

### Terminal (Server-Side)

**Stage 1 - AI Generation:**
```
✅ Stage 1 complete (1234ms)
   Text length: 234 chars
   Text preview: "Here are some excellent hotels in Niseko:..."
   Places array (3 items):
     1. suggestedName: "Sansui Niseko"
        category: Stay, type: Hotel
        searchQuery: "Sansui Niseko Hotel Japan"
```

**Pre-Stage 3 - Before Matching:**
```
🔨 [Pre-Stage 3] Inputs to assemblePlaceLinks:
   Text: "Here are some excellent hotels..."
   Places count: 3
     1. Looking for: "Sansui Niseko"
     2. Looking for: "Ki Niseko"
     3. Looking for: "The Vale Niseko"
   PlaceMap keys: Sansui Niseko, Ki Niseko, The Vale Niseko
```

**Stage 3 - Matching:**
```
🔍 Searching for: "Sansui Niseko"
      Starting from position: 0
      Result: ✅ FOUND at 45
      Matched text: "Sansui Niseko"
```

**Or if failing:**
```
🔍 Searching for: "The Vale Niseko"
      Starting from position: 0
      Result: ❌ NOT FOUND
      ⚠️  Place "The Vale Niseko" not found in text
      Text context (pos 0-200):
      "Here are some excellent hotels in Niseko: Sansui Niseko..."
      Tried matching strategies:
        - Exact: "The Vale Niseko"
        - With 'the': "the The Vale Niseko"
        - Case-insensitive: "the vale niseko"
```

### Browser Console (Client-Side)

```
📨 [Client] Received response:
   Content length: 234
   Segments: 7
   Segment breakdown:
    { text: 4, place: 3 }
   Place segments:
     1. "Sansui Niseko" (hasData: true)
     2. "Ki Niseko" (hasData: true)
     3. "The Vale Niseko" (hasData: true)
```

**Or if failing:**
```
📨 [Client] Received response:
   Content length: 234
   Segments: 1
   Segment breakdown:
    { text: 1 }
   ⚠️  NO PLACE SEGMENTS!
```

### In-Chat Debug (If Enabled)

```
🔧 DEBUG: Stage 1: AI Response
{
  "textLength": 234,
  "placesCount": 3,
  "cardsCount": 0
}

🔧 DEBUG: Stage 2: Google Places Resolution
{
  "resolved": 3,
  "total": 3
}

🔧 DEBUG: Stage 3: Segment Assembly
{
  "totalSegments": 7,
  "placeSegments": 3,
  "textSegments": 4
}
```

## Debugging Checklist

Use this checklist to trace through the pipeline:

- [ ] **Stage 1**: Does AI return places array?
  - [ ] Is places array populated?
  - [ ] Do suggestedName values look correct?
  - [ ] Are the names present in the text preview?

- [ ] **Stage 2**: Does Google Places resolve successfully?
  - [ ] Are all places resolved?
  - [ ] Do placeMap keys match suggestedNames?

- [ ] **Stage 3**: Does assemblePlaceLinks find matches?
  - [ ] Are places being searched for?
  - [ ] Are they FOUND or NOT FOUND?
  - [ ] If not found, what does the text context show?
  - [ ] Are matching strategies being tried?

- [ ] **Client**: Are segments reaching the browser?
  - [ ] Is segments array populated?
  - [ ] Are there place-type segments?
  - [ ] Do place segments have placeData?

## Common Issues to Check

1. **AI not returning places array**
   - Check Stage 1 output
   - Look for "NO PLACES in response!"
   - Verify EXP_BUILDER_SYSTEM_PROMPT has places array instructions

2. **Place names not in text**
   - Check text preview vs suggestedName
   - Look for exact match failures
   - Verify AI is using exact names (not brackets/tags)

3. **Flexible matching failing**
   - Check "Tried matching strategies" output
   - Verify findPlaceInText is being called
   - Look at text context to see actual format

4. **Segments not reaching client**
   - Check client console for segment count
   - Verify API response includes segments
   - Check for serialization errors

## Files Modified

1. **`app/api/chat/simple/route.ts`**
   - Added DEBUG_MODE flag and createDebugSegment helper
   - Enhanced Stage 1 logging (text preview, places array details)
   - Added Pre-Stage 3 logging (inputs to assemblePlaceLinks)
   - Added in-chat debug segments (optional)

2. **`lib/html/assemble-place-links.ts`**
   - Enhanced matching loop with detailed search logs
   - Shows result for each search attempt
   - Extended context for failures
   - Lists all matching strategies attempted

3. **`app/exp/client.tsx`**
   - Added response logging after fetch
   - Shows segment breakdown by type
   - Lists place segments with data availability
   - Warns if no place segments found

4. **`scripts/test-hotel-suggestions.ts`** (NEW)
   - Standalone test script
   - Runs complete pipeline
   - Shows all stages with detailed output

## Next Steps

1. **Run the test**: Ask "Suggest hotels in Niseko" in the chat
2. **Check terminal logs**: Look for the diagnostic output
3. **Check browser console**: Look for client-side analysis
4. **Identify the failure point**: Use the logs to pinpoint where it breaks
5. **Fix the root cause**: Based on what the logs reveal

The logs will show exactly where and why the pipeline is failing!

---

**Implementation completed on**: January 27, 2026
**Purpose**: Debug hotel suggestions not appearing as clickable links
