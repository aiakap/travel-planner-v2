# Google Places Debug Test Guide

## Setup
Comprehensive logging has been added to track the entire flow from AI tool invocation to rendering.

## Test Scenarios

### Scenario 1: Single Place Suggestion
**Prompt**: "Suggest a good restaurant in Paris"

**Expected Behavior**:
- AI calls `suggest_place` tool (check server logs)
- Place name appears as clickable blue link with sparkle icon
- Clicking opens modal with Google Places data
- Modal shows: photo, rating, address, hours, phone, website

### Scenario 2: Multiple Place Suggestions
**Prompt**: "Suggest 3 hotels in Tokyo"

**Expected Behavior**:
- AI calls `suggest_place` tool 3 times (check server logs)
- All 3 hotel names appear as clickable links
- Each link opens its own modal with unique data

### Scenario 3: Activity Suggestions
**Prompt**: "What are some fun activities in Rome?"

**Expected Behavior**:
- AI suggests multiple activities
- Each activity name is clickable
- Modal shows activity details from Google Places

### Scenario 4: Mixed Suggestions
**Prompt**: "Plan a day in Barcelona with breakfast, lunch, dinner, and 2 activities"

**Expected Behavior**:
- AI suggests 5+ places total
- All place names are clickable
- Each opens correct Google Places data

## How to Test

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open browser console** (F12 or Cmd+Option+I)

3. **Navigate to Experience Builder** (`/experience-builder`)

4. **Run test scenarios** and watch console logs

## What to Look For in Console Logs

### Server-Side Logs (Terminal)
Look for these patterns:
```
🔧 [TOOL INVOCATIONS DEBUG]
✨ PLACE SUGGESTION DETECTED: { placeName: "...", category: "...", ... }
```

### Client-Side Logs (Browser Console)
Look for these patterns:
```
🔍 [getPlaceSuggestions] Total suggestions extracted: X
📍 [getPlaceSuggestions] Place names: [...]
🎨 [renderTextWithPlaceLinks] Rendered X/X clickable links
✅ [renderTextWithPlaceLinks] Rendered X/X clickable links
```

### Google Places API Logs
```
🌍 [/api/places] Request received: { placeName: "...", ... }
✅ [/api/places] Place data found: { placeId: "...", ... }
```

## Diagnosing Issues

### Issue: No clickable links appear
**Check logs for**:
- `⚠️ No tool calls made in this response` → AI not calling suggest_place
- `🔍 [getPlaceSuggestions] Total suggestions extracted: 0` → Extraction failing
- `❌ Place name "..." NOT FOUND in text` → Text matching issue

### Issue: Links appear but modal doesn't open
**Check logs for**:
- `🖱️ Place clicked:` → Click handler working
- `⚠️ No tripId available` → Missing trip context
- Check for JavaScript errors

### Issue: Modal opens but no Google Places data
**Check logs for**:
- `🌍 [SuggestionDetailModal] Starting Google Places fetch`
- `❌ Place not found` → Google Places API issue
- Check that `GOOGLE_PLACES_API_KEY` is set in `.env`

## Next Steps After Testing

Based on what you find:

1. **If AI isn't calling suggest_place** → Need to improve system prompt
2. **If extraction is failing** → Need to fix message parsing
3. **If text matching fails** → Need better place name normalization
4. **If Google Places fails** → Need API key or better search logic

## Running Automated Tests

To test Google Places API directly:
```bash
npx tsx scripts/test-places-integration.ts
```

This will verify:
- API key is configured
- API can find places
- Data is properly formatted
