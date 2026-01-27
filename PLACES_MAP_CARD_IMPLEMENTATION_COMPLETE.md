# Places Map Card Implementation - COMPLETE

## Overview

Successfully implemented the `PLACES_MAP_CARD` - an interactive Google Map component that displays nearby places as clickable pins, allowing users to explore and add locations to their itinerary directly from the map.

## What Was Implemented

### 1. Google Places Nearby Search API ✅

**File**: `lib/actions/google-places-nearby.ts`

**Function**: `searchNearbyPlaces(latitude, longitude, radius, type, keyword)`
- Uses Google Places Nearby Search API
- Searches for places within a specified radius
- Supports filtering by place type (restaurant, cafe, tourist_attraction, etc.)
- Returns array of places with full details (name, rating, photos, location, etc.)

**Helper**: `getPhotoUrl(photoReference, maxWidth)`
- Generates photo URLs for place images
- Used by map card to display place photos

### 2. API Endpoint ✅

**File**: `app/api/places/nearby/route.ts`

**Endpoint**: `POST /api/places/nearby`
- Accepts: `lat`, `lng`, `radius`, `type`, `keyword`
- Validates coordinates
- Calls `searchNearbyPlaces` function
- Returns JSON with places array and count

### 3. Location Coordinates Helper ✅

**File**: `lib/actions/get-location-coordinates.ts`

**Function**: `getLocationCoordinates(locationName, tripId)`
- Converts location names to coordinates
- First checks trip data (segments, reservations)
- Falls back to Google Geocoding API
- Returns: `{ lat, lng, name }`

**Use Cases**:
- "Show restaurants near my hotel" → Finds hotel coordinates from trip
- "Show cafes near Eiffel Tower" → Geocodes landmark name

### 4. PlacesMapCard Component ✅

**File**: `app/exp/components/places-map-card.tsx`

**Features**:
- **Interactive Google Map**: Full-featured map with zoom, pan, type selector
- **Colored Markers**: 
  - Red center marker for reference point (hotel, landmark)
  - Color-coded place markers by type:
    - Orange: Restaurants
    - Amber: Cafes/Bars
    - Green: Attractions/Museums
    - Purple: Shopping
    - Blue: Default
- **Click-to-View**: Click any pin to see place details in InfoWindow
- **InfoWindow Content**:
  - Place photo
  - Name, rating, and review count
  - Price level ($ - $$$$)
  - Address
  - "Add to Itinerary" button
- **Radius Control**: Slider to adjust search radius (500m - 5km)
- **View Modes**: Toggle between map view and list view
- **List View**: Scrollable list of places with photos and details
- **Loading States**: Spinner during data fetch
- **Error Handling**: User-friendly error messages

**Props**:
```typescript
interface PlacesMapCardProps {
  centerLat: number;        // Center point latitude
  centerLng: number;        // Center point longitude
  centerName: string;       // Display name for center point
  placeType?: string;       // restaurant, cafe, tourist_attraction, etc.
  radius?: number;          // Search radius in meters (default 1000)
  tripId?: string;          // For adding to trip
  segmentId?: string;       // For adding to segment
}
```

### 5. System Integration ✅

**Type Definitions** - `lib/types/place-pipeline.ts`:
- Added `places_map_card` MessageSegment type

**Card Parser** - `app/exp/lib/parse-card-syntax.ts`:
- Added regex parser for `[PLACES_MAP_CARD: ...]` syntax
- Parses coordinates, name, type, and radius

**Message Renderer** - `app/exp/components/message-segments-renderer.tsx`:
- Added import and render case for PlacesMapCard
- Passes through tripId and segmentId for reservations

**System Prompts** - `app/exp/lib/exp-prompts.ts`:
- Documented card syntax for AI
- Provided usage examples
- Explained when to combine with other cards

## Card Syntax

```
[PLACES_MAP_CARD: {centerLat}, {centerLng}, {centerName}, {placeType}, {radius}]
```

**Parameters**:
- `centerLat`: Latitude of reference point (required)
- `centerLng`: Longitude of reference point (required)
- `centerName`: Display name for reference point (required)
- `placeType`: Place type filter - restaurant, cafe, tourist_attraction, museum, bar, park, shopping_mall (optional)
- `radius`: Search radius in meters, default 1000 (optional)

**Examples**:
```
[PLACES_MAP_CARD: 48.8584, 2.2945, Eiffel Tower, restaurant, 1000]
[PLACES_MAP_CARD: 48.8566, 2.3522, Hotel Le Meurice, cafe, 500]
[PLACES_MAP_CARD: 48.8530, 2.3499, Notre-Dame Cathedral, tourist_attraction, 2000]
```

## Usage Examples

### Example 1: Standalone Map Query
```
User: "Show me restaurants near the Eiffel Tower"

AI Response:
{
  "text": "Here are restaurants near the Eiffel Tower.\n\n[PLACES_MAP_CARD: 48.8584, 2.2945, Eiffel Tower, restaurant, 1000]\n\nI found 15 restaurants within 1km. Click any pin to see details and add to your itinerary.",
  "places": [],
  "transport": [],
  "hotels": []
}

Result:
→ Interactive map displays with 15 orange restaurant pins
→ Red center marker shows Eiffel Tower location
→ User clicks pin → InfoWindow with restaurant details
→ User clicks "Add to Itinerary" → Restaurant added to trip
```

### Example 2: Combined with DINING_SCHEDULE_CARD
```
User: "Show me restaurants near our hotel for each night"

AI Response:
{
  "text": "I'll show you restaurants near your hotel on a map and organized by night.\n\n[PLACES_MAP_CARD: 48.8566, 2.3522, Hotel Le Meurice, restaurant, 1500]\n\n[DINING_SCHEDULE_CARD: trip_abc123, segment_xyz789]\n\nThe map shows all nearby options, and below you'll find curated suggestions for each night.",
  "places": [],
  "transport": [],
  "hotels": []
}

Result:
→ Map displays above dining schedule
→ User can explore map OR use curated list
→ Both provide add-to-itinerary functionality
```

### Example 3: Activities Near Location
```
User: "What can we do near Notre-Dame?"

AI Response:
{
  "text": "Here are activities and attractions near Notre-Dame.\n\n[PLACES_MAP_CARD: 48.8530, 2.3499, Notre-Dame Cathedral, tourist_attraction, 2000]\n\nI found 23 attractions within 2km including museums, parks, and historic sites.",
  "places": [],
  "transport": [],
  "hotels": []
}

Result:
→ Map with green pins for attractions
→ User can adjust radius slider to see more/fewer results
→ Click pins to add attractions to itinerary
```

### Example 4: Context-Aware from Trip Data
```
User: "Show me cafes near my hotel"

AI Process:
1. Looks up hotel location from trip reservations
2. Finds hotel at coordinates 48.8566, 2.3522
3. Outputs: [PLACES_MAP_CARD: 48.8566, 2.3522, Hotel Le Meurice, cafe, 500]

Result:
→ Map automatically centered on user's hotel
→ Shows nearby cafes within 500m
→ No need for user to specify coordinates
```

## User Interactions

### Map View
1. **Pan & Zoom**: Standard Google Maps controls
2. **Click Center Marker**: Shows reference point info
3. **Click Place Marker**: Opens InfoWindow with details
4. **Add to Itinerary**: Button in InfoWindow creates reservation
5. **Adjust Radius**: Slider updates search area and refetches
6. **Switch to List**: Toggle button switches to list view

### List View
1. **Scroll**: View all places in scrollable list
2. **See Details**: Each card shows photo, rating, address
3. **Add Button**: Quick-add to itinerary
4. **Switch to Map**: Toggle back to map view

## Technical Details

### Google Places API Integration
- **Nearby Search API**: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
- **Parameters**: location, radius, type, keyword, key
- **Returns**: Up to 20 results per request
- **Photo API**: `https://maps.googleapis.com/maps/api/place/photo`

### Place Types Supported
- `restaurant` - Restaurants
- `cafe` - Cafes
- `bar` - Bars
- `tourist_attraction` - Tourist attractions
- `museum` - Museums
- `park` - Parks
- `shopping_mall` - Shopping centers
- `gym` - Fitness centers
- `spa` - Spas
- And many more Google Places types

### Map Library
- **Library**: `@react-google-maps/api`
- **Components**: GoogleMap, Marker, InfoWindow
- **API Key**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Libraries**: ["places"]

### Marker Colors
- **Reference Point**: Red (#EF4444)
- **Restaurants**: Orange (#F97316)
- **Cafes/Bars**: Amber (#F59E0B)
- **Attractions**: Green (#10B981)
- **Shopping**: Purple (#A855F7)
- **Default**: Blue (#3B82F6)

## Files Created/Modified

### New Files (4)
1. `lib/actions/google-places-nearby.ts` - Nearby search function
2. `lib/actions/get-location-coordinates.ts` - Location to coordinates helper
3. `app/api/places/nearby/route.ts` - API endpoint
4. `app/exp/components/places-map-card.tsx` - Map card component

### Modified Files (4)
5. `lib/types/place-pipeline.ts` - Added places_map_card type
6. `app/exp/lib/parse-card-syntax.ts` - Added parser
7. `app/exp/components/message-segments-renderer.tsx` - Added renderer
8. `app/exp/lib/exp-prompts.ts` - Documented card syntax

## Benefits

1. **Visual Discovery**: Users explore places spatially on a map
2. **Proximity Context**: See distance relationships at a glance
3. **One-Click Add**: No navigation away from chat
4. **Flexible Search**: Adjust radius and type on the fly
5. **Combined Views**: Use with other cards (DINING_SCHEDULE_CARD, etc.)
6. **Trip-Aware**: Automatically uses hotel/segment locations
7. **Rich Details**: Photos, ratings, reviews, price levels
8. **Dual Modes**: Map or list view based on preference

## Testing Prompts

### Basic Map Queries
- "Show me restaurants near the Eiffel Tower"
- "What's around our hotel?"
- "Show me activities near Notre-Dame on a map"
- "Find cafes within walking distance of the Louvre"

### Type-Specific
- "Show me museums near the Arc de Triomphe"
- "Find bars near our hotel"
- "Show me parks in the area"
- "What shopping is nearby?"

### Combined with Other Cards
- "Show me restaurants near our hotel for each night" (+ DINING_SCHEDULE_CARD)
- "What can we do near Notre-Dame?" (+ ACTIVITY_TABLE_CARD)

### Context-Aware
- "Show me cafes near my hotel" (uses trip data)
- "What's near where we're staying?" (uses trip data)

## Future Enhancements

1. **Marker Clustering**: Group nearby pins when zoomed out
2. **Route Planning**: Show walking/driving routes to places
3. **Save Favorites**: Star places for later
4. **Share Map**: Export as image or link
5. **Offline Indicators**: Show already-added places differently
6. **Multi-Type Search**: Show multiple types simultaneously
7. **Time-Based Filtering**: Show only places open now
8. **Price Filtering**: Filter by price level

## Conclusion

Successfully implemented a fully-featured interactive map card that enhances the trip planning experience by allowing users to visually explore nearby places and add them to their itinerary with a single click. The card integrates seamlessly with the existing chat system and can be combined with other cards for powerful multi-view experiences.

All TODOs completed, no linter errors, and ready for user testing!
