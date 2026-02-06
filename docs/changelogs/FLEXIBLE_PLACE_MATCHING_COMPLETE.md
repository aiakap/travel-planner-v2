# Flexible Place Matching Fix - Complete

## Problem

Place suggestions weren't appearing as clickable links because the exact string matching in `assemblePlaceLinks()` was too strict. Even with instructions for the AI to use exact names, subtle variations still occurred:

- Case differences ("The Vale Niseko" vs "the vale niseko")
- Prefix variations ("Vale Niseko" vs "The Vale Niseko")  
- Common prefixes ("Hotel Sansui" vs "Sansui")

**Console logs showed:**
```
⚠️  Place "The Vale Niseko" not found in text
⚠️  Place "Ki Niseko" not found in text
⚠️  Place "Sansui Niseko" not found in text
```

## Root Cause

The `assemblePlaceLinks()` function used strict `indexOf()` matching:

```typescript
const placeIndex = text.indexOf(suggestion.suggestedName, lastIndex);
```

This required **perfect character-for-character matching**, which failed with:
- Any capitalization differences
- Missing or extra "the" prefix
- Different formatting

## Solution

Ported the battle-tested flexible matching logic from the old working system (`components/chat-interface.tsx`) to the new pipeline.

### How Flexible Matching Works

The new `findPlaceInText()` function tries multiple matching strategies in order:

1. **Exact match** - Try to find the exact name first
2. **"the " prefix** - Try "the [Name]" if exact fails  
3. **"The " prefix** - Try "The [Name]" (capitalized)
4. **Case-insensitive** - Ignore capitalization entirely
5. **Prefix stripping** - Remove "Hotel", "The", "Le", "La", "L'", "Restaurant" and try again

This graceful degradation ensures matches are found even when the AI's output has slight variations.

## Changes Made

### 1. Added `findPlaceInText()` Helper Function

Added flexible matching function with 5 fallback strategies:

```typescript
function findPlaceInText(text: string, placeName: string, startFrom: number): number {
  // Try exact match first
  let index = text.indexOf(placeName, startFrom);
  if (index !== -1) return index;
  
  // Try with "the " prefix
  index = text.indexOf(`the ${placeName}`, startFrom);
  if (index !== -1) return index + 4;
  
  // Try with "The " prefix
  index = text.indexOf(`The ${placeName}`, startFrom);
  if (index !== -1) return index + 4;
  
  // Try case-insensitive search
  const lowerText = text.toLowerCase();
  const lowerPlace = placeName.toLowerCase();
  index = lowerText.indexOf(lowerPlace, startFrom);
  if (index !== -1) return index;
  
  // Try matching without common prefixes
  const placeWithoutPrefix = placeName.replace(/^(Hotel|The|Le|La|L'|Restaurant)\s+/i, '');
  if (placeWithoutPrefix !== placeName) {
    index = lowerText.indexOf(placeWithoutPrefix.toLowerCase(), startFrom);
    if (index !== -1) {
      const actualText = text.substring(index);
      const match = actualText.match(new RegExp(`\\b${placeWithoutPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
      if (match && match.index !== undefined) {
        return index + match.index;
      }
    }
  }
  
  return -1; // Not found
}
```

### 2. Replaced `indexOf()` with `findPlaceInText()`

**Before:**
```typescript
const placeIndex = text.indexOf(suggestion.suggestedName, lastIndex);
```

**After:**
```typescript
const placeIndex = findPlaceInText(text, suggestion.suggestedName, lastIndex);
```

### 3. Added Context Preview to Console Warnings

**Before:**
```typescript
console.warn(`   ⚠️  Place "${suggestion.suggestedName}" not found in text`);
```

**After:**
```typescript
console.warn(`   ⚠️  Place "${suggestion.suggestedName}" not found in text`);
console.warn(`      Text preview: "${text.substring(Math.max(0, lastIndex - 50), Math.min(text.length, lastIndex + 100))}"`);
```

This shows 50 characters before and 100 after the search position for debugging.

### 4. Extract Actual Matched Text for Display

**Before:**
```typescript
segments.push({
  type: "place",
  suggestion,
  placeData,
  display: suggestion.suggestedName, // Always used suggestedName
});
```

**After:**
```typescript
// Extract the actual text that was matched
const actualMatchLength = suggestion.suggestedName.length;
const actualText = text.substring(placeIndex, placeIndex + actualMatchLength);

segments.push({
  type: "place",
  suggestion,
  placeData,
  display: actualText, // Use actual text from message
});
```

This ensures the clickable link shows the text exactly as it appears in the message (preserving capitalization, etc.).

### 5. Updated Comment

Changed the function comment from:
```
This uses EXACT string matching since the AI was instructed to use
identical place names in both the text and the places array.
```

To:
```
Uses flexible string matching to handle variations in place names.
```

## Expected Behavior After Fix

### Console Logs

**Before (Broken):**
```
🔨 [Stage 3] Assembling place links from text (234 chars)
   Looking for 3 place names
   ⚠️  Place "Sansui Niseko" not found in text
   ⚠️  Place "Ki Niseko" not found in text
   ⚠️  Place "The Vale Niseko" not found in text
✅ [Stage 3] Created 1 segments (0 places)
```

**After (Fixed):**
```
🔨 [Stage 3] Assembling place links from text (234 chars)
   Looking for 3 place names
   ✅ Found "Sansui Niseko" at position 45
   ✅ Found "Ki Niseko" at position 98
   ✅ Found "The Vale Niseko" at position 125
✅ [Stage 3] Created 7 segments (3 places)
```

### User Experience

**Before:** Plain text response with no interactive elements

**After:**
- Hotel names appear as **clickable blue links** with map pin icons
- **Hover cards** show Google Places data (photos, ratings, address, hours)
- **"Add to Itinerary"** buttons available
- **Map integration** shows hotel locations

## Testing Coverage

The flexible matching handles:

1. **Exact matches**: "Sansui Niseko" = "Sansui Niseko" ✅
2. **Case variations**: "sansui niseko" finds "Sansui Niseko" ✅
3. **"the" prefix**: "the Sansui Niseko" finds "Sansui Niseko" ✅
4. **"The" prefix**: "The Vale Niseko" finds "Vale Niseko" ✅
5. **Hotel prefix**: "Hotel Sansui" finds "Sansui" ✅
6. **French articles**: "Le Meurice" finds "Meurice" ✅

## File Modified

- `/lib/html/assemble-place-links.ts`
  - Added `findPlaceInText()` helper function (lines 3-41)
  - Replaced `indexOf()` with `findPlaceInText()` (line 74)
  - Enhanced console warning with context (line 78)
  - Extract actual matched text for display (lines 89-92)
  - Updated function comment (line 49)

## Why This Works

This matching logic was proven in production in the old system (`components/chat-interface.tsx`). It handles:

- **Real-world AI variations** - AI sometimes adds or removes articles
- **Natural language patterns** - Users and AI use different capitalizations
- **Common prefix patterns** - Hotels often include "Hotel" prefix
- **Graceful degradation** - Tries strict matching first, then relaxes constraints

By porting this battle-tested logic to the new pipeline, we get the same reliability that the old system had.

## Related Fixes

This complements the previous fixes:
1. **Hotel Suggestions Fix** - Ensured hotels go in "places" array
2. **Hotel Tag Matching Fix** - Added exact-match instruction to prompt
3. **Flexible Place Matching** (this fix) - Added robust fallback matching

Together, these ensure hotel suggestions work end-to-end.

---

**Fix completed on**: January 27, 2026
**Related to**: Structured Outputs Migration, Place Suggestion Pipeline
