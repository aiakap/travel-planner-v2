# Get Lucky Auto-Trip Generation - Quick Start Guide

## How to Use

1. Navigate to `/exp` page
2. Click the "Surprise me with a trip idea" button (Get Lucky)
3. Watch your trip generate in real-time with progressive stages
4. Automatically navigate to your completed trip

## What Gets Created

A complete trip with:
- **Trip**: Title, description, dates
- **3-5 Segments**: Travel → Stay → Travel pattern
- **Hotels**: 1 per Stay segment
- **Restaurants**: 2-5 per day (based on activity level)
- **Activities**: 2-5 per day (based on activity level)

## Profile Preferences Used

If you have a profile set up, the system uses:
- **Budget Level**: Influences hotel/restaurant quality
- **Activity Level**: Controls number of activities/day
- **Accommodation Preference**: Hotel type selection
- **Travel Pace**: Timing and spacing
- **Hobbies**: Destination selection

## Activity Density

| Your Setting | Activities/Day | Restaurants/Day |
|--------------|----------------|-----------------|
| Relaxed | 1 | 1 |
| Moderate | 2 | 2 |
| Active | 2 | 3 |
| Adventurous | 3 | 3 |

## Generation Process

### Stage 1: Planning (🗺️)
AI generates complete trip structure
**~10 seconds**

### Stage 2: Route (🛣️)
Creates trip and segments in database
**~3 seconds**

### Stage 3: Hotels (🏨)
Creates hotel reservations
**~5-10 seconds**

### Stage 4: Restaurants (🍽️)
Creates restaurant reservations
**~10-15 seconds**

### Stage 5: Activities (🎯)
Creates activity reservations
**~10-15 seconds**

### Stage 6: Complete (✅)
Finalizes and navigates to trip
**~2 seconds**

**Total Time: 40-55 seconds**

## Troubleshooting

### Nothing happens when clicking "Get Lucky"
- Check browser console for errors
- Ensure you're logged in
- Try refreshing the page

### Generation fails partway through
- Check if partial trip was created in `/manage`
- Error stage will show in the loader
- Safe to try again - won't create duplicates

### Trip has fewer items than expected
- Some items may fail Google Places lookup
- Trip is still usable with completed items
- You can manually add missing items

### Activity density doesn't match preference
- Set Activity Level in your profile settings
- Go to profile → Travel Preferences
- Select your preferred activity level

## API Details

**Endpoint**: `POST /api/get-lucky/generate`

**Request Body**:
```json
{
  "profileData": {...},
  "destination": "Paris, France",
  "budgetLevel": "moderate",
  "activityLevel": "Active"
}
```

**Response**: Server-Sent Events (SSE) stream

## Files Reference

### Core Implementation
- `app/api/get-lucky/generate/route.ts` - Main API
- `app/exp/client.tsx` - UI integration (line ~865)
- `app/exp/components/get-lucky-loader.tsx` - Progress UI

### Utilities
- `lib/utils/profile-helpers.ts` - Preference extraction
- `lib/ai/get-lucky-full-generation-prompt.ts` - AI prompt

### Types
- `lib/types/place-pipeline.ts` - Message segment types

## Example Output

```
🗺️ Planning your chapters...
  ✓ 5-day adventure in Barcelona planned

🛣️ Your route:
  Flight to Barcelona (1 day)
  Exploring Barcelona (3 days)
  Return Flight (1 day)

🏨 Finding hotels...
  ✓ Hotel Arts Barcelona (Apr 16-19)

🍽️ Finding restaurants...
  ✓ Cervecería Catalana (Day 2, dinner)
  ✓ El Nacional (Day 2, lunch)
  ✓ Tickets Bar (Day 3, dinner)
  ... (9 total)

🎯 Adding activities...
  ✓ Sagrada Familia tour (Day 2, 10:00 AM)
  ✓ Park Güell visit (Day 2, 2:00 PM)
  ✓ Gothic Quarter tour (Day 3, 11:00 AM)
  ... (12 total)

✅ Your trip is ready!
```

Then automatically navigates to: `/trip/{generated-trip-id}`

## Testing Checklist

- [ ] Click Get Lucky button
- [ ] Watch all stages complete
- [ ] Verify navigation to trip
- [ ] Check trip has segments
- [ ] Check reservations exist
- [ ] Verify times are realistic
- [ ] Try different activity levels
- [ ] Test with/without profile

## Notes

- Generation uses GPT-4 for high-quality suggestions
- All reservations start as "Suggested" or "Planned" status
- You can edit any generated item after creation
- Trip is created in ACTIVE status (not DRAFT)
- Safe to use multiple times - creates new trip each time
