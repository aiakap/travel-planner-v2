# Multi-City Trip Creation - Quick Start Guide

## Overview

The `/exp` interface now supports streamlined multi-city trip creation with automatic segment generation and hidden timeline by default.

## How to Use

### Method 1: Modal Form (Recommended)

1. Navigate to `/exp`
2. Click the blue **"Plan Multi-City Trip"** button
3. Fill in the form:
   ```
   Trip Title: European Adventure (optional)
   Start Date: March 15, 2026
   
   Cities:
   1. Paris, France     [3] days
   2. Rome, Italy       [4] days
   3. Barcelona, Spain  [2] days
   ```
4. Click **"Create Trip"**
5. Trip created with 5 segments:
   - Stay in Paris (3 days)
   - Paris → Rome (Flight)
   - Stay in Rome (4 days)
   - Rome → Barcelona (Flight)
   - Stay in Barcelona (2 days)
6. Timeline is collapsed - click **"View Full Timeline"** to expand

### Method 2: Natural Language (Chat)

Just type one of these patterns:

**Pattern A:** "City X days, City Y days"
```
"Paris 3 days, Rome 4 days, Barcelona 2 days"
```

**Pattern B:** "X days in City, then Y days in City"
```
"3 days in Paris, then 4 days in Rome, then 2 days in Barcelona"
```

**Pattern C:** "Visit City, City, and City for X days each"
```
"Visit Paris, Rome, and Barcelona for a week each"
```

**With start date:**
```
"Paris 3 days, Rome 4 days starting March 15"
```

**With title:**
```
"Paris 3 days, Rome 4 days called 'European Adventure'"
```

## How It Works

### Automatic Segment Creation

The system automatically determines segment types:

**Stay Segments** (for each city)
- Name: "Stay in {City}"
- Duration: As specified by user
- Type: "Other" (generic stay)

**Travel Segments** (between cities, if needed)
- Name: "{City A} → {City B}"
- Duration: 1 day
- Type: "Flight"
- **Created only if:** Travel time > 5 hours

### Travel Time Calculation

Uses Google Distance Matrix API to determine actual travel time:

**Examples:**
- Paris → Rome: ~15 hours driving → **Flight segment created** ✅
- Paris → Versailles: ~1 hour driving → **No travel segment** ❌
- New York → London: ~3,500 km → **Flight segment created** ✅
- Los Angeles → San Francisco: ~6 hours → **Flight segment created** ✅

**Threshold:** 5 hours
- \> 5 hours: Flight segment
- ≤ 5 hours: No segment (assume drive/train within stay)

### Timeline Visibility

**New multi-city trips:**
- Timeline starts **collapsed**
- Shows summary card with stats
- Click "View Full Timeline" to expand

**Existing trips:**
- Timeline **visible** by default
- No change to current behavior

**Single-city trips:**
- Timeline **visible** immediately
- Works exactly as before

## Examples

### Example 1: European Tour

**Input (Modal):**
```
Cities:
1. Paris, France - 3 days
2. Amsterdam, Netherlands - 2 days
3. Berlin, Germany - 3 days
4. Prague, Czech Republic - 2 days
```

**Result:**
- 7 segments total
- 4 stay segments
- 3 flight segments (all >5 hours apart)
- 10 days total

### Example 2: California Road Trip

**Input (Chat):**
```
"San Francisco 2 days, Monterey 1 day, Los Angeles 3 days"
```

**Result:**
- 3 segments total (all stays)
- 0 flight segments (all <5 hours)
- 6 days total
- Assumes driving between cities

### Example 3: Cross-Country

**Input (Modal):**
```
Cities:
1. New York, NY - 3 days
2. Chicago, IL - 2 days
3. Denver, CO - 2 days
4. San Francisco, CA - 3 days
```

**Result:**
- 7 segments total
- 4 stay segments
- 3 flight segments (all >5 hours)
- 10 days total

## Troubleshooting

### Modal Won't Open

**Check:** Is a trip already selected?
**Fix:** Click "New Trip" in trip selector first

### No Flight Segments Created

**Possible reasons:**
1. Cities are close together (<5 hours)
2. Distance Matrix API failed (using fallback)
3. API key not configured

**Check logs:** Look for `[TravelTime]` messages in console

### Timeline Stays Collapsed

**Expected behavior:** Timeline is hidden by default for multi-city trips

**To expand:** Click "View Full Timeline" button in right panel

### Geocoding Fails

**Symptom:** Segments created with (0, 0) coordinates

**Cause:** Google Maps API key missing or invalid

**Fix:** Verify `GOOGLE_MAPS_API_KEY` in `.env`

### API Errors

**Error:** "Failed to create multi-city trip"

**Check:**
1. Console logs for detailed error
2. Database connection
3. API keys configured
4. Network connectivity

## API Reference

### POST /api/trip/create-multi-city

**Request:**
```json
{
  "title": "European Adventure",
  "startDate": "2026-03-15T00:00:00.000Z",
  "cities": [
    { "city": "Paris, France", "durationDays": 3 },
    { "city": "Rome, Italy", "durationDays": 4 }
  ],
  "conversationId": "optional-id"
}
```

**Response:**
```json
{
  "success": true,
  "tripId": "uuid",
  "segments": [...],
  "totalDays": 7,
  "metadata": {
    "duration": 3421,
    "cityCount": 2,
    "segmentCount": 3
  }
}
```

## Tips

1. **Be specific with city names:** "Paris, France" is better than just "Paris"
2. **Use realistic durations:** 1-7 days per city is typical
3. **Start with 2-3 cities:** Test the flow before creating complex trips
4. **Check the preview:** Modal shows route preview before creating
5. **Expand timeline when ready:** Take your time reviewing before viewing details

## What's Next?

After creating your multi-city trip:

1. **Expand timeline** to see full itinerary
2. **Add reservations** to each segment (hotels, activities, restaurants)
3. **Chat about segments** to refine details
4. **Edit segments** to adjust dates or locations
5. **Add flights** by pasting confirmation emails (auto-extract feature)

## Support

**Issues?** Check:
- Browser console for errors
- Server logs for API failures
- `MULTI_CITY_TRIP_FLOW_COMPLETE.md` for detailed documentation

**Questions?** The implementation is fully documented in the completion guide.
