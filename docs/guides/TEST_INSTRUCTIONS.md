# 🧪 Testing the Place Suggestion Pipeline

## Quick Start (2 Minutes)

### 1. Start Your Server
```bash
npm run dev
```

### 2. Open Test Page
Navigate to: **http://localhost:3000/test/place-pipeline**

### 3. Run Your First Test
- Input: `suggest 2 hotels in Paris`
- Click: **Start Pipeline**
- Watch: All 3 stages complete automatically

### 4. Verify Success
You should see:
- ✅ **Stage 1**: AI generates structured JSON with place names
- ✅ **Stage 2**: Google Places finds both hotels with ratings/photos
- ✅ **Stage 3**: Text shows clickable place links with 📍 icons

## Sample Test Queries

Try these to test different scenarios:

### Hotels
```
suggest 2 hotels in Paris
```
Expected: 2 luxury hotel suggestions with ratings 4.5+

### Restaurants
```
where should I eat dinner in Tokyo?
```
Expected: 2-3 restaurant suggestions with cuisine types

### Activities
```
plan activities for day 3 in Dubai
```
Expected: Multiple activity suggestions (museums, tours, etc.)

### Transportation
```
find transportation from JFK to Manhattan
```
Expected: Multiple transport options (taxi, train, bus)

### Edge Cases

**Vague Query:**
```
show me something cool in NYC
```
Expected: Should still generate valid JSON and resolve places

**Multiple Locations:**
```
suggest hotels in Paris and Rome
```
Expected: Places from both cities

**Specific Requirements:**
```
find a romantic restaurant in Venice with a view
```
Expected: Specific restaurant suggestions matching criteria

## What to Look For

### Stage 1: AI Generation ✨

**Success Indicators:**
- Valid JSON output (not broken)
- `text` field has natural, conversational language
- `places` array has structured objects
- Each place has: `suggestedName`, `category`, `type`, `searchQuery`
- Place names in `text` **exactly match** `suggestedName` in array

**Red Flags:**
- ❌ JSON parsing errors
- ❌ Missing required fields
- ❌ Place names don't match between text and array
- ❌ Empty places array when text mentions places

### Stage 2: Google Places Resolution 🗺️

**Success Indicators:**
- 90%+ places found successfully
- Each place has: `placeId`, `name`, `formattedAddress`
- Most places have: `rating`, `photos`, `website`
- Timing: 2-5 seconds

**Red Flags:**
- ❌ All places showing "Not found"
- ❌ API key errors
- ❌ Missing critical fields (placeId, name)
- ❌ Timing > 10 seconds

### Stage 3: HTML Assembly 🔗

**Success Indicators:**
- All places from Stage 1 become clickable links
- Text formatting preserved (spacing, punctuation)
- Links have 📍 icon
- Timing: < 100ms

**Red Flags:**
- ❌ Place names not found in text (should never happen!)
- ❌ Segments array empty
- ❌ Links not rendering correctly

## Interactive Features

### Collapsible Sections
- Click stage headers to expand/collapse
- Auto-expands as stages complete

### Copy JSON
- Click "Copy JSON" button on any stage
- Paste into your code editor to inspect

### Export Results
- Click "Export Full Result as JSON" at bottom
- Downloads complete pipeline output
- Great for debugging or documentation

### Status Badges
- 🔵 Running - Stage in progress
- ✅ Complete - Stage succeeded
- ❌ Error - Stage failed

## Common Issues & Solutions

### Issue: Stage 1 Returns Invalid JSON

**Symptoms:**
- Error message: "AI did not return valid JSON"
- Stage 1 shows red error badge

**Solution:**
1. Check API key is set: `OPENAI_API_KEY`
2. Verify OpenAI API is accessible
3. Try a simpler query

### Issue: Stage 2 Shows "Not Found" for All Places

**Symptoms:**
- All places marked "Not found in Google Places"
- Red badges on all place cards

**Solution:**
1. Check API key: `GOOGLE_PLACES_API_KEY` or `GOOGLE_MAPS_API_KEY`
2. Verify Google Places API is enabled in console
3. Check query is specific enough

### Issue: Stage 3 Shows 0 Clickable Links

**Symptoms:**
- Message: "Rendered 0/X clickable links"
- No 📍 icons in preview

**Solution:**
- This should NEVER happen if Stage 1 works correctly
- If it does, check Stage 1 output - names must match exactly
- Report as bug with full JSON export

### Issue: Server Won't Start

**Symptoms:**
- Network interface errors
- Port already in use

**Solution:**
```bash
# Kill existing process
pkill -f "next dev"

# Start on different port
PORT=3002 npm run dev
```

## Performance Benchmarks

**Good Performance:**
- Stage 1: 1-3 seconds
- Stage 2: 2-5 seconds
- Stage 3: < 100ms
- Total: 3-8 seconds

**Slow Performance:**
- Stage 1 > 5 seconds → Check OpenAI API
- Stage 2 > 10 seconds → Too many places or API issues
- Stage 3 > 500ms → Report as bug

## Testing Checklist

Use this before integrating into chat:

- [ ] ✅ Test page loads without errors
- [ ] ✅ Can enter custom queries
- [ ] ✅ Sample queries all work
- [ ] ✅ Stage 1 generates valid JSON
- [ ] ✅ Place names match in text and array
- [ ] ✅ Stage 2 resolves 90%+ places
- [ ] ✅ Can see place ratings and addresses
- [ ] ✅ Stage 3 creates clickable links
- [ ] ✅ All place names have 📍 icons
- [ ] ✅ Can copy JSON from each stage
- [ ] ✅ Can export full results
- [ ] ✅ Error handling works (try gibberish)
- [ ] ✅ Timing is acceptable (< 10s total)

## API Testing (Optional)

Test the API directly with curl:

```bash
curl -X POST http://localhost:3000/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "query": "suggest 2 hotels in Paris"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "stage1": { "text": "...", "places": [...], "timing": 1234 },
    "stage2": { "placeMap": {...}, "timing": 2345 },
    "stage3": { "segments": [...], "timing": 12 }
  }
}
```

## Next Steps After Testing

Once testing is successful:

1. ✅ **Mark as validated**
2. 📋 **Choose integration approach** (see PIPELINE_INTEGRATION_GUIDE.md)
3. 🔨 **Implement in chat interface**
4. 🧪 **Test end-to-end** in real conversations
5. 🚀 **Deploy to production**

## Need Help?

- **Quick reference**: See `PIPELINE_README.md`
- **Integration guide**: See `PIPELINE_INTEGRATION_GUIDE.md`
- **Architecture details**: See `IMPLEMENTATION_COMPLETE.md`
- **Bug reports**: Export JSON and share full output

---

**Happy Testing! 🎉**

The pipeline is designed to be bulletproof. If something breaks, it's a bug - not expected behavior.
