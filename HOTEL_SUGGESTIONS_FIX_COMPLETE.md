# Hotel Suggestions Fix - Complete

## Problem

When users asked for hotel suggestions (e.g., "Suggest hotels in Niseko"), the AI created 4 empty hotel reservation cards instead of returning hotel suggestions. This resulted in:
- Empty reservation cards with "Add..." placeholder text
- No clickable hotel names in the chat text
- No hover cards with photos, ratings, and addresses
- No map showing hotel locations
- No "Add to Itinerary" buttons

## Root Cause

The `EXP_BUILDER_SYSTEM_PROMPT` had conflicting instructions:

**Issue 1:** Missing guidance that hotels should be in the "places" array
- AI didn't know hotels should go in "places" for Google Places lookup

**Issue 2:** Confusing card creation rules
- "Hotel Confirmation Email Detection" section was too prominent
- No clear distinction between "suggestions" vs "confirmation emails"
- AI interpreted "suggest hotels" as needing hotel_reservation_card objects

## Solution

1. **Clarified field descriptions** to indicate hotels go in "places" array
2. **Added "WHEN TO INCLUDE IN EACH ARRAY" section** with explicit guidance
3. **Added "IMPORTANT: Suggestions vs. Reservations" section** to distinguish between the two use cases
4. **Updated "Hotel Confirmation Email Detection"** to only apply to actual confirmation emails
5. **Rewrote Important Rules** to prioritize the correct behavior

## Changes Made

### 1. Updated Field Descriptions (Lines 5-10)

**Before:**
```
3. "places" - Array of place suggestions for Google Places lookup
5. "hotels" - Array of hotel suggestions for Amadeus API
```

**After:**
```
3. "places" - Array of place suggestions for Google Places lookup (restaurants, attractions, AND hotels)
5. "hotels" - Array of hotel suggestions for Amadeus API (when dates are provided)
```

### 2. Added "WHEN TO INCLUDE IN EACH ARRAY" Section (After Line 12)

```typescript
## WHEN TO INCLUDE IN EACH ARRAY

"places" array - Include ALL of these:
- Restaurants, cafes, dining venues
- Museums, attractions, landmarks
- Activities, tours
- Hotels (for Google Places info like address, rating, photos)
- ANY venue you want Google Places details for

"hotels" array - Include ONLY when dates are mentioned:
- Hotels with check-in/check-out dates specified
- SKIP if user just asks "suggest hotels" without dates

IMPORTANT: Hotels should appear in BOTH "places" (for Google info) AND "hotels" (for Amadeus availability) when dates are provided.
```

### 3. Added Hotel Example (Example 4, After Line 389)

Added a complete example showing hotels in the "places" array:

```json
{
  "text": "Here are some excellent hotels in Niseko:\n\n• Sansui Niseko - Luxury resort with ski access\n• Ki Niseko - Modern design hotel\n• The Vale Niseko - Mountain views and onsens\n\nWould you like me to add any of these to your itinerary?",
  "cards": [],
  "places": [
    {
      "suggestedName": "Sansui Niseko",
      "category": "Stay",
      "type": "Hotel",
      "searchQuery": "Sansui Niseko Hotel Japan",
      "context": {
        "dayNumber": 0,
        "timeOfDay": "",
        "specificTime": "",
        "notes": "Luxury resort with ski access"
      },
      "segmentId": ""
    },
    // ... more hotels
  ],
  "transport": [],
  "hotels": []
}
```

### 4. Updated Important Rules (Rules 8-9)

Added two new rules:

```
8. **ALWAYS include hotels in "places" array** when suggesting accommodations (for Google Maps data)
9. **ALSO include hotels in "hotels" array** when user provides specific dates
```

## Expected Behavior After Fix

When a user asks "Suggest hotels in Niseko":

1. **AI Response**: Returns hotels in the "places" array
2. **Stage 2 (Google Places)**: Each hotel is resolved via Google Places API
   - Gets photos, ratings, address, phone, website
   - Gets GPS coordinates for map display
3. **Stage 3 (HTML Assembly)**: Hotel names become clickable links
4. **User Experience**:
   - Sees hotel names as clickable blue links with map pin icons
   - Hover shows rich cards with photos, ratings, and details
   - Can click map pin to see hotel location
   - Can click "Add to Itinerary" to add the hotel to their trip

## Changes Made to `/app/exp/lib/exp-prompts.ts`

### 1. Updated Field Descriptions (Lines 5-10)
- Clarified "places" includes restaurants, attractions, AND hotels
- Clarified "hotels" is only for Amadeus API when dates are provided

### 2. Expanded "WHEN TO INCLUDE IN EACH ARRAY" Section
Added explicit breakdown for all arrays:
- **"cards" array**: ONLY for creating trips/segments/reservations or extracting from emails
- **"places" array**: For ALL suggestions (restaurants, hotels, attractions)
- **"transport" array**: For flight/train suggestions
- **"hotels" array**: For Amadeus availability lookup when dates specified

**Key addition:**
```
CRITICAL DISTINCTION:
- User asks "Suggest hotels" → places array (empty cards array)
- User pastes confirmation email → cards array (empty places array)
```

### 3. Added "IMPORTANT: Suggestions vs. Reservations" Section (NEW)
Placed prominently before "Hotel Confirmation Email Detection" to clearly distinguish:
- **Suggestions** → use "places" array, keep "cards" empty
- **Confirmation emails** → use "cards" array, keep "places" empty

### 4. Updated "Hotel Confirmation Email Detection" Header
Changed to emphasize "ONLY create hotel_reservation_card when..." with clear criteria (confirmation numbers, booking details)

### 5. Added Hotel Suggestions Example (Example 4)
Complete example showing:
- 3 hotels in the "places" array
- Empty "cards" array
- Proper structure with searchQuery, category, type, context

### 6. Rewrote Important Rules
**New priority order:**
1. DO NOT create cards when suggesting
2. ONLY create cards for trips/segments/reservations or confirmation emails
3. ALWAYS include suggestions in "places" array

## Testing

To verify the fix works:
1. Open a trip chat
2. Ask: "Suggest hotels in [location]"
3. Verify you see:
   - Clickable hotel names (blue text with map pin icons)
   - Hover cards with photos and ratings
   - "Add to Itinerary" buttons

## Related Documentation

- Default `SYSTEM_PROMPT` in `lib/ai/generate-place-suggestions.ts` (lines 115-127) has the correct instructions
- `ENHANCED_AMADEUS_INTEGRATION_COMPLETE.md` documents the dual-array pattern

---

**Fix completed on**: January 27, 2026
**Related to**: Structured Outputs Migration
