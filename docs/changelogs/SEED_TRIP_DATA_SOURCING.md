# Seed Trip Data Sourcing Documentation

## Overview

This document explains how the seed trip data was sourced and provides a roadmap for creating an AI-driven trip generation system that can automatically populate trips with real venue data.

## Current Implementation

The seed trip system generates 4 pre-configured trips with real venue data:

1. **Large (21 days)**: Grand European Tour - SF → Amsterdam → Paris → Tuscany
2. **Medium (10 days)**: Paris & Tuscany Escape
3. **Small (5 days)**: Amsterdam Long Weekend  
4. **Micro (2 days)**: Paris Quick Visit

### Data Structure

All venue data is stored in `/lib/seed-data/venue-data.ts` with the following structure:

```typescript
interface VenueLocation {
  name: string;
  placeId?: string;          // Google Place ID
  lat: number;               // Latitude
  lng: number;               // Longitude
  address: string;           // Full address
  city: string;
  country: string;
  timezone: string;          // IANA timezone (e.g., "Europe/Paris")
  url?: string;              // Official website
  phone?: string;
  priceLevel?: number;       // 1-4 scale
  rating?: number;           // 0-5 scale
}
```

## Data Sourcing Methodology

### 1. Manual Curation (Current Approach)

For the seed data, venues were manually curated using:

**Research Sources:**
- Google Maps for coordinates and Place IDs
- Official hotel/restaurant websites for accuracy
- Michelin Guide for high-end restaurants
- TripAdvisor for ratings and reviews
- Official tourism boards for attractions

**Verification Process:**
1. Identify luxury/high-end venues in target cities
2. Look up exact coordinates via Google Maps
3. Extract Google Place ID from Maps URL or API
4. Verify timezone using IANA database
5. Cross-reference with official websites
6. Confirm current operating status

**Example Workflow:**
```
1. Search "Waldorf Astoria Amsterdam" on Google Maps
2. Click on the location → URL contains Place ID
3. Right-click → "What's here?" → Get exact coordinates
4. Visit official website → Verify address and phone
5. Check timezone: Amsterdam = Europe/Amsterdam
6. Store all data in VenueLocation format
```

### 2. Google Places API Integration (Future)

For AI-driven trip generation, use the Google Places API:

#### A. Text Search
```typescript
// Example: Find luxury hotels in Amsterdam
const response = await fetch(
  'https://maps.googleapis.com/maps/api/place/textsearch/json?' +
  'query=luxury+hotels+in+Amsterdam&' +
  'type=lodging&' +
  'key=YOUR_API_KEY'
);

const data = await response.json();
// Extract: place_id, name, formatted_address, geometry.location
```

#### B. Place Details
```typescript
// Get full details for a specific place
const details = await fetch(
  'https://maps.googleapis.com/maps/api/place/details/json?' +
  'place_id=ChIJfxoN7WYJxkcRSZGqVHLqBgE&' +
  'fields=name,formatted_address,geometry,website,formatted_phone_number,rating,price_level&' +
  'key=YOUR_API_KEY'
);
```

#### C. Nearby Search
```typescript
// Find restaurants near a location
const nearby = await fetch(
  'https://maps.googleapis.com/maps/api/place/nearbysearch/json?' +
  'location=52.3676,4.9041&' +
  'radius=5000&' +
  'type=restaurant&' +
  'key=YOUR_API_KEY'
);
```

### 3. Timezone Resolution

Use the Google Timezone API or a library like `luxon`:

```typescript
// Google Timezone API
const timezone = await fetch(
  'https://maps.googleapis.com/maps/api/timezone/json?' +
  'location=52.3676,4.9041&' +
  'timestamp=1458000000&' +
  'key=YOUR_API_KEY'
);

// Returns: { timeZoneId: "Europe/Amsterdam", timeZoneName: "Central European Standard Time" }
```

## Future AI-Driven Trip Generation

### Architecture

```
User Input (Destination, Dates, Budget, Preferences)
    ↓
AI Trip Planner (GPT-4/Claude)
    ↓
Structured Trip Outline (Cities, Activities, Dining)
    ↓
Venue Resolver (Google Places API)
    ↓
Data Enrichment (Coordinates, Timezones, Details)
    ↓
Database Storage (Prisma)
    ↓
Generated Trip
```

### Implementation Steps

#### Step 1: AI Trip Planning Prompt

```typescript
const prompt = `
Generate a ${duration}-day trip to ${destination} for ${travelers}.

Budget: ${budgetLevel}
Activity Level: ${activityLevel}
Preferences: ${preferences}

Return a structured JSON with:
- Daily itinerary
- Suggested hotels (names and general areas)
- Restaurant recommendations (cuisine types, price levels)
- Activities and attractions
- Transportation between locations

Format as:
{
  "days": [
    {
      "date": "2026-05-01",
      "location": "Amsterdam",
      "hotels": [{ "name": "luxury hotel in canal district", "checkIn": "15:00", "checkOut": "11:00" }],
      "activities": [{ "name": "Rijksmuseum", "time": "10:00", "duration": 3 }],
      "dining": [{ "type": "dinner", "cuisine": "Dutch", "priceLevel": "high-end", "time": "19:30" }]
    }
  ]
}
`;
```

#### Step 2: Venue Resolution

```typescript
async function resolveVenue(
  query: string,
  type: 'hotel' | 'restaurant' | 'activity',
  location: { lat: number; lng: number },
  filters: { priceLevel?: number; rating?: number }
): Promise<VenueLocation> {
  
  // 1. Search Google Places
  const searchResults = await googlePlacesTextSearch(query, type, location);
  
  // 2. Filter by criteria
  const filtered = searchResults.filter(place => {
    if (filters.priceLevel && place.price_level !== filters.priceLevel) return false;
    if (filters.rating && place.rating < filters.rating) return false;
    return true;
  });
  
  // 3. Get detailed information
  const topResult = filtered[0];
  const details = await googlePlacesDetails(topResult.place_id);
  
  // 4. Get timezone
  const timezone = await getTimezone(details.geometry.location);
  
  // 5. Return structured venue
  return {
    name: details.name,
    placeId: details.place_id,
    lat: details.geometry.location.lat,
    lng: details.geometry.location.lng,
    address: details.formatted_address,
    city: extractCity(details.address_components),
    country: extractCountry(details.address_components),
    timezone: timezone.timeZoneId,
    url: details.website,
    phone: details.formatted_phone_number,
    priceLevel: details.price_level,
    rating: details.rating,
  };
}
```

#### Step 3: Trip Assembly

```typescript
async function generateAITrip(
  userId: string,
  userInput: TripGenerationInput
): Promise<GeneratedTrip> {
  
  // 1. Get AI-generated trip outline
  const outline = await generateTripOutline(userInput);
  
  // 2. Resolve all venues via Google Places
  const resolvedTrip = await Promise.all(
    outline.days.map(async (day) => ({
      ...day,
      hotels: await Promise.all(
        day.hotels.map(h => resolveVenue(h.name, 'hotel', day.location, { priceLevel: getPriceLevel(userInput.budget) }))
      ),
      activities: await Promise.all(
        day.activities.map(a => resolveVenue(a.name, 'activity', day.location, {}))
      ),
      dining: await Promise.all(
        day.dining.map(d => resolveVenue(d.query, 'restaurant', day.location, { priceLevel: d.priceLevel }))
      ),
    }))
  );
  
  // 3. Transform to database format
  const tripTemplate = transformToTemplate(resolvedTrip);
  
  // 4. Generate trip using existing generator
  return await generateSeedTrip(userId, tripTemplate);
}
```

### API Integration Points

#### Existing Infrastructure

The codebase already has Google Places integration:
- `/lib/actions/google-places.ts` - Place search and details
- `/lib/actions/google-places-nearby.ts` - Nearby search
- `/lib/google-places/resolve-suggestions.ts` - Suggestion resolution

These can be reused for venue resolution.

#### New API Endpoints Needed

1. **POST `/api/trips/generate-ai`**
   - Accept user preferences
   - Call AI for trip outline
   - Resolve venues via Google Places
   - Create trip in database
   - Return trip ID

2. **POST `/api/trips/[tripId]/enhance`**
   - Take existing trip
   - Use AI to suggest additional venues
   - Resolve via Google Places
   - Add to trip

### Data Quality Considerations

#### Filtering Criteria
- **Hotels**: Price level 3-4 for luxury, rating > 4.0
- **Restaurants**: Match cuisine type, price level, rating > 4.0
- **Activities**: Verify operating hours, check reviews
- **Flights**: Use Amadeus API (already integrated)

#### Validation
```typescript
function validateVenue(venue: VenueLocation): boolean {
  // Must have coordinates
  if (!venue.lat || !venue.lng) return false;
  
  // Must have valid timezone
  if (!isValidTimezone(venue.timezone)) return false;
  
  // Must have address
  if (!venue.address || venue.address.length < 10) return false;
  
  // For hotels/restaurants, prefer those with websites
  if ((venue.type === 'hotel' || venue.type === 'restaurant') && !venue.url) {
    console.warn(`Venue ${venue.name} missing website`);
  }
  
  return true;
}
```

## Cost Considerations

### Google Places API Pricing (as of 2024)
- **Text Search**: $32 per 1000 requests
- **Place Details**: $17 per 1000 requests (Basic), $32 per 1000 (Contact/Atmosphere)
- **Nearby Search**: $32 per 1000 requests
- **Timezone API**: $5 per 1000 requests

### Optimization Strategies
1. **Cache Results**: Store resolved venues in database for reuse
2. **Batch Requests**: Resolve multiple venues in parallel
3. **Fallback Data**: Use seed data when API limits reached
4. **Rate Limiting**: Implement request throttling
5. **Field Masking**: Only request needed fields from Place Details

### Example Caching Strategy
```typescript
// Check cache first
const cached = await prisma.venueCache.findUnique({
  where: { 
    placeId: placeId 
  },
});

if (cached && isFresh(cached.updatedAt)) {
  return cached.data;
}

// Fetch from API and cache
const venue = await googlePlacesDetails(placeId);
await prisma.venueCache.upsert({
  where: { placeId },
  create: { placeId, data: venue },
  update: { data: venue, updatedAt: new Date() },
});

return venue;
```

## Testing Strategy

### Unit Tests
- Venue resolution logic
- Timezone conversion
- Data validation
- Template transformation

### Integration Tests
- Full trip generation flow
- API error handling
- Database transaction integrity
- Cache hit/miss scenarios

### Manual Testing Checklist
- [ ] Generate trip for each size (large, medium, small, micro)
- [ ] Verify all coordinates are accurate
- [ ] Check timezone data is correct
- [ ] Confirm all reservations have proper start/end times
- [ ] Validate Google Place IDs (if used)
- [ ] Test map markers display correctly
- [ ] Verify trip timeline is chronological
- [ ] Check all reservation types are present (in large trip)
- [ ] Confirm all statuses are represented

## Migration Path

### Phase 1: Current (Manual Seed Data) ✅
- Hardcoded venue data
- 4 pre-configured trips
- Admin UI for generation
- Direct database writes

### Phase 2: Hybrid (AI + Manual Curation)
- AI generates trip outline
- Manual venue selection from curated list
- Google Places for validation
- User approval before creation

### Phase 3: Fully Automated
- AI generates complete trip
- Automatic venue resolution
- Smart filtering and ranking
- Real-time availability checking

## Related Files

- `/lib/seed-data/venue-data.ts` - Venue location data
- `/lib/seed-data/trip-templates.ts` - Trip structure definitions
- `/lib/seed-data/seed-trip-generator.ts` - Database generation logic
- `/app/api/admin/seed-trips/route.ts` - API endpoint
- `/app/admin/seed-trips/page.tsx` - Admin UI

## Future Enhancements

1. **Dynamic Pricing**: Integrate real-time hotel/flight pricing
2. **Availability Checking**: Verify venue operating hours and bookings
3. **Seasonal Adjustments**: Modify suggestions based on travel dates
4. **User Preferences**: Learn from past trips to personalize
5. **Multi-City Optimization**: Smart routing between destinations
6. **Budget Optimization**: Maximize value within budget constraints
7. **Social Integration**: Incorporate friend recommendations
8. **Review Analysis**: Use sentiment analysis on reviews for better filtering

## Conclusion

The seed trip system provides a solid foundation for AI-driven trip generation. By following this data sourcing methodology and leveraging Google Places API, the system can evolve from static seed data to dynamic, personalized trip creation while maintaining data quality and accuracy.
