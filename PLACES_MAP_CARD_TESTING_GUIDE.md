# Places Map Card Testing Guide

## Quick Start

The `PLACES_MAP_CARD` shows an interactive Google Map with nearby places as clickable pins. Users can explore locations visually and add them to their itinerary with one click.

## Example Prompts

### Basic Map Queries

#### Restaurants
```
"Show me restaurants near the Eiffel Tower"
"Find places to eat near Notre-Dame"
"Show me dining options around the Louvre"
"What restaurants are near our hotel?"
```

#### Cafes & Bars
```
"Show me cafes near the Champs-Élysées"
"Find coffee shops around the Marais"
"Show me bars near our hotel"
"What's a good cafe near the Arc de Triomphe?"
```

#### Activities & Attractions
```
"What can we do near Notre-Dame?"
"Show me attractions near the Eiffel Tower"
"Find museums around the Latin Quarter"
"What activities are near our hotel?"
```

#### Shopping
```
"Show me shopping near the Champs-Élysées"
"Find stores around Le Marais"
"What shopping is near our hotel?"
```

#### Parks & Recreation
```
"Show me parks near the Eiffel Tower"
"Find green spaces around Montmartre"
"What parks are nearby?"
```

### Combined Card Queries

#### Map + Dining Schedule
```
"Show me restaurants near our hotel for each night"
→ Displays PLACES_MAP_CARD + DINING_SCHEDULE_CARD
→ Map shows all options, schedule shows curated suggestions per night
```

#### Map + Activity Table
```
"Show me activities near Notre-Dame"
→ Can display PLACES_MAP_CARD + ACTIVITY_TABLE_CARD
→ Map for visual exploration, table for filtering/sorting
```

### Context-Aware Queries

These work when you have a trip with hotel/location data:

```
"Show me cafes near my hotel"
→ AI finds hotel from trip data
→ Centers map on hotel location

"What's around where we're staying?"
→ Uses hotel/accommodation from trip
→ Shows multiple place types

"Show me restaurants near our first stop"
→ Uses first segment location
→ Centers map there
```

### Radius-Specific Queries

```
"Show me restaurants within 500 meters of the Eiffel Tower"
"Find cafes within walking distance (500m) of our hotel"
"Show me everything within 2km of Notre-Dame"
```

### Multi-Type Queries

```
"Show me restaurants, cafes, and bars near the Louvre"
→ AI might create multiple cards or use general search

"What's near our hotel - food, shopping, and activities?"
→ Comprehensive area exploration
```

## Expected AI Response Format

### Standalone Map
```json
{
  "text": "Here are restaurants near the Eiffel Tower.\n\n[PLACES_MAP_CARD: 48.8584, 2.2945, Eiffel Tower, restaurant, 1000]\n\nI found 15 restaurants within 1km. Click any pin to see details and add to your itinerary.",
  "places": [],
  "transport": [],
  "hotels": []
}
```

### Combined with Other Cards
```json
{
  "text": "I'll show you restaurants near your hotel on a map and organized by night.\n\n[PLACES_MAP_CARD: 48.8566, 2.3522, Hotel Le Meurice, restaurant, 1500]\n\n[DINING_SCHEDULE_CARD: trip_abc123, segment_xyz789]\n\nThe map shows all nearby options, and below you'll find curated suggestions for each night.",
  "places": [],
  "transport": [],
  "hotels": []
}
```

## User Interaction Flow

### Typical Usage
1. User asks: "Show me restaurants near the Eiffel Tower"
2. AI outputs PLACES_MAP_CARD with coordinates
3. Map loads showing:
   - Red center marker (Eiffel Tower)
   - Orange pins (restaurants)
4. User clicks a restaurant pin
5. InfoWindow opens with:
   - Photo
   - Name, rating, reviews
   - Price level
   - Address
   - "Add to Itinerary" button
6. User clicks "Add to Itinerary"
7. Restaurant added to trip
8. Success feedback shown

### Adjusting Search
1. User sees initial results
2. Moves radius slider (500m - 5km)
3. Map refetches with new radius
4. New pins appear/disappear based on radius

### Switching Views
1. User starts in map view
2. Clicks list icon
3. Switches to scrollable list
4. Same places, different presentation
5. Can switch back to map anytime

## Testing Checklist

### Basic Functionality
- [ ] Map loads without errors
- [ ] Center marker appears (red)
- [ ] Place markers appear (colored by type)
- [ ] Clicking marker opens InfoWindow
- [ ] InfoWindow shows correct details
- [ ] "Add to Itinerary" button works
- [ ] Place added to trip successfully

### Radius Control
- [ ] Slider appears in header
- [ ] Moving slider updates value display
- [ ] Changing radius refetches places
- [ ] New pins appear based on radius
- [ ] Loading indicator shows during refetch

### View Modes
- [ ] Map view is default
- [ ] List button switches to list view
- [ ] List shows all places with photos
- [ ] Add buttons work in list view
- [ ] Map button switches back to map

### Place Types
- [ ] Restaurants show orange pins
- [ ] Cafes show amber pins
- [ ] Attractions show green pins
- [ ] Shopping shows purple pins
- [ ] Default places show blue pins

### Error Handling
- [ ] Shows loading spinner during fetch
- [ ] Shows error message if API fails
- [ ] Handles no results gracefully
- [ ] Handles invalid coordinates

### Integration
- [ ] Works standalone
- [ ] Works combined with DINING_SCHEDULE_CARD
- [ ] Works combined with ACTIVITY_TABLE_CARD
- [ ] TripId/segmentId passed correctly
- [ ] Reservations created with correct data

## Common Issues & Solutions

### Map Not Loading
**Issue**: Map shows loading spinner forever
**Solution**: Check `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is set

### No Places Showing
**Issue**: Map loads but no pins appear
**Solution**: 
- Check Google Places API is enabled
- Verify coordinates are valid
- Try increasing radius
- Check place type is correct

### "Add to Itinerary" Not Working
**Issue**: Button doesn't add place
**Solution**:
- Check tripId or segmentId is provided
- Verify `/api/reservations` endpoint works
- Check browser console for errors

### Photos Not Loading
**Issue**: InfoWindow shows no photos
**Solution**:
- Check Google Places API key has photo access
- Some places may not have photos
- Check network tab for photo URL errors

## Advanced Testing Scenarios

### Scenario 1: Trip Planning from Scratch
```
1. Create new trip: "Plan a trip to Paris"
2. Add hotel: "Book Hotel Le Meurice"
3. Find restaurants: "Show me restaurants near our hotel"
   → Should use hotel coordinates automatically
4. Explore map, add 2-3 restaurants
5. Check itinerary has new reservations
```

### Scenario 2: Multi-Day Planning
```
1. Have existing trip with multiple days
2. "Show me restaurants near our hotel for each night"
   → Should show map + dining schedule
3. Use map to explore visually
4. Use dining schedule for curated picks
5. Add from both sources
```

### Scenario 3: Area Exploration
```
1. "What's around the Louvre?"
2. Adjust radius to see wider area
3. Switch to list view to see all options
4. Filter by type (if multiple types shown)
5. Add various places to itinerary
```

### Scenario 4: Specific Location Hunt
```
1. "Find a cafe near the Eiffel Tower"
2. Map shows cafes within 1km
3. Click several pins to compare
4. Find one with good rating and price
5. Add to itinerary for morning visit
```

## Performance Notes

- Initial load: ~1-2 seconds (map + API call)
- Radius change: ~0.5-1 second (API call only)
- View switch: Instant (no API call)
- Add to itinerary: ~0.5 seconds (reservation creation)

## Browser Compatibility

Tested on:
- Chrome (recommended)
- Firefox
- Safari
- Edge

Mobile:
- Responsive design
- Touch-friendly markers
- Scrollable list view

## API Limits

Google Places API:
- 20 results per nearby search
- Photo requests count separately
- Check quota in Google Cloud Console

## Tips for Best Results

1. **Be Specific**: "restaurants near Eiffel Tower" better than "food near tower"
2. **Use Landmarks**: Well-known places work best for coordinates
3. **Adjust Radius**: Start with 1km, expand if needed
4. **Try List View**: Better for comparing many options
5. **Check Ratings**: Use InfoWindow to see details before adding
6. **Combine Cards**: Use map + schedule for comprehensive planning

## Example Test Session

```
Session: Planning dinner in Paris

1. User: "Show me restaurants near the Eiffel Tower"
   → Map loads with 15 restaurants
   
2. User: Adjusts radius to 1500m
   → Map refetches, now shows 23 restaurants
   
3. User: Clicks pin for "Le Jules Verne"
   → InfoWindow shows: 4.5 stars, $$$$, Michelin-starred
   
4. User: Clicks "Add to Itinerary"
   → Restaurant added, success feedback
   
5. User: Switches to list view
   → Scrolls through all options
   
6. User: Finds "Café de l'Homme" in list
   → Clicks "Add" button
   → Added to itinerary
   
7. User: Switches back to map
   → Explores other areas

Result: 2 restaurants added to trip, ready to schedule
```

## Troubleshooting Commands

If map isn't working, try these in browser console:

```javascript
// Check if Google Maps loaded
console.log(typeof google !== 'undefined' && google.maps);

// Check API key
console.log(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

// Test nearby API directly
fetch('/api/places/nearby', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lat: 48.8584,
    lng: 2.2945,
    radius: 1000,
    type: 'restaurant'
  })
}).then(r => r.json()).then(console.log);
```

## Success Criteria

Map card is working correctly if:
- ✅ Map loads within 2 seconds
- ✅ Pins appear for nearby places
- ✅ InfoWindow shows on pin click
- ✅ "Add to Itinerary" creates reservation
- ✅ Radius slider updates results
- ✅ View toggle switches between map/list
- ✅ No console errors
- ✅ Works on mobile devices
- ✅ Combines with other cards

## Next Steps After Testing

1. Gather user feedback on UX
2. Monitor API usage and costs
3. Optimize loading times
4. Add requested features (clustering, routes, etc.)
5. Expand to more place types
6. Implement advanced filtering
