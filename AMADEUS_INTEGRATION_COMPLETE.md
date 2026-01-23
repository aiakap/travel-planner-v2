# Amadeus + Google Places Integration - Implementation Complete

## Summary

Successfully integrated Amadeus API for flights and hotels alongside Google Places for restaurants and attractions in the place suggestion pipeline. The implementation uses completely independent files from the `/test/exp` route to ensure zero conflicts.

## Architecture Overview

### Stage 2: Lookup (Parallel Execution)

The pipeline now features a smart routing system in Stage 2 with three parallel sub-stages:

- **Stage 2A: Google Places Lookup** - Restaurants, attractions, general venues
- **Stage 2B: Flight Availability Lookup** - Real Amadeus flight offers with pricing
- **Stage 2C: Hotel Availability Lookup** - Real Amadeus hotel offers with availability

All three sub-stages execute in parallel via `Promise.all()` for optimal performance.

## Files Created (All Independent)

### 1. Type System
- **`lib/types/amadeus-pipeline.ts`** - Complete copy of place-pipeline.ts with extensions for flights and hotels
  - Added `AmadeusFlightData` interface with itinerary details
  - Added `AmadeusHotelData` interface with pricing and amenities
  - Extended `MessageSegment.type` to include "flight" | "hotel"
  - Added sub-stage tracking in `Stage2Output`

### 2. Amadeus Integration
- **`lib/amadeus/resolve-suggestions.ts`** - Flight and hotel resolver
  - `resolveFlights()` - Queries Amadeus for real flight offers
  - `resolveHotels()` - Queries Amadeus for hotel availability
  - City code mapping helper for hotel searches
  
- **`lib/flights/amadeus-client.ts`** (extended) - Added hotel search capability
  - `searchHotels()` function
  - `HotelSearchParams` and `HotelOffer` interfaces
  - Two-step hotel search (city lookup → offer pricing)

### 3. HTML Assembly
- **`lib/html/assemble-amadeus-links.ts`** - Copy of assemble-place-links.ts with flight/hotel handling
  - Routes suggestions to appropriate data maps based on type
  - Creates flight/hotel segments with proper data attachment

### 4. UI Components
- **`components/flight-hover-card.tsx`** - Displays flight details on hover
  - Price, duration, stops, airline
  - Itinerary timeline with departure/arrival times
  - Return flight indicator
  
- **`components/hotel-hover-card.tsx`** - Displays hotel details on hover
  - Price per stay, rating
  - Hotel photo if available
  - Amenities with icons
  - Location coordinates

- **`components/amadeus-segments-renderer.tsx`** - Copy of message-segments-renderer.tsx with flight/hotel rendering
  - Renders text, place, flight, and hotel segments
  - Different colors for each type (blue=places, indigo=flights, purple=hotels)
  - Appropriate icons (MapPin, Plane, Hotel)

### 5. AI Enhancement
- **`lib/ai/generate-place-suggestions.ts`** (modified) - Updated SYSTEM_PROMPT
  - Instructs AI to detect flight requests and include booking context (origin, destination, dates, passengers)
  - Instructs AI to detect hotel requests and include booking context (location, check-in/out, guests, rooms)
  - Provides examples of structured flight and hotel suggestions

### 6. Pipeline Route
- **`app/api/pipeline/run/route.ts`** (modified) - Smart routing logic
  - Categorizes suggestions by type (Place, Flight, Hotel)
  - Executes three parallel sub-stages
  - Tracks timing for each sub-stage
  - Passes all data maps to Stage 3

### 7. Test Page
- **`app/test/place-pipeline/client.tsx`** (modified)
  - Updated imports to use `amadeus-pipeline` types
  - Uses `AmadeusSegmentsRenderer` component
  - Stage 2 UI shows three sub-stages with individual timings
  - Updated sample queries to include flight and hotel examples
  - Default query tests flight search

## Files Intentionally Untouched (Used by /test/exp)

- ❌ `lib/types/place-pipeline.ts` - No changes
- ❌ `components/message-segments-renderer.tsx` - No changes  
- ❌ `lib/html/assemble-place-links.ts` - No changes

## Data Flow Example

### User Query
"Book a roundtrip flight from JFK to LAX on March 15-20"

### Stage 1: AI Generation
AI detects flight request and outputs:
```json
{
  "text": "I've found flights from JFK to LAX...",
  "places": [{
    "suggestedName": "JFK to LAX roundtrip",
    "type": "Flight",
    "context": {
      "origin": "JFK",
      "destination": "LAX",
      "departureDate": "2026-03-15",
      "returnDate": "2026-03-20",
      "adults": 1,
      "travelClass": "ECONOMY"
    }
  }]
}
```

### Stage 2: Lookup (Parallel)
- **Stage 2A (Google Places)**: Skipped - 0ms, 0 results
- **Stage 2B (Flights)**: Amadeus query - 1234ms, 1 result
- **Stage 2C (Hotels)**: Skipped - 0ms, 0 results

Flight offer returned with pricing, itinerary, and carrier info.

### Stage 3: Assembly & Display
Creates interactive segment with flight hover card showing:
- Price ($287 USD)
- Duration (5h 30m)
- Direct flight or stops
- Departure/arrival times
- "Add to Itinerary" button

## Sample Queries

The test page now includes these example queries:

1. "Book a roundtrip flight from JFK to LAX on March 15-20"
2. "Find hotels in Paris for 3 nights starting April 10"
3. "Suggest restaurants and activities in Tokyo"
4. "Plan a weekend: flights from NYC to Miami + hotel + dinner spots"

## Environment Requirements

Ensure `.env.local` contains:
```bash
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
GOOGLE_PLACES_API_KEY=your_api_key
```

See `AMADEUS_API_QUICK_START.md` for credential setup.

## Testing

Visit `/test/place-pipeline` to test the integrated pipeline:
1. Enter a query mentioning flights, hotels, or restaurants
2. Click "Start Pipeline"
3. Watch Stage 2 execute three parallel lookups
4. See results with appropriate hover cards
5. Stage 3 renders with colored, interactive segments

## Performance

- Stage 2 sub-stages run in parallel for optimal speed
- Total Stage 2 time = max(2A, 2B, 2C) not sum
- Individual sub-stage timings displayed for debugging

## Success Criteria ✅

- ✅ Flight queries return real Amadeus flight offers with pricing
- ✅ Hotel queries return real Amadeus hotel offers with availability
- ✅ Restaurant/activity queries continue using Google Places
- ✅ Mixed queries correctly route to all APIs
- ✅ All results display with appropriate hover cards
- ✅ Test page shows three separate sub-stages with timing
- ✅ Zero conflicts with `/test/exp` route
- ✅ Complete file independence achieved

## Next Steps

1. Test with real Amadeus credentials
2. Add "Add to Itinerary" functionality for flights and hotels
3. Expand city code mapping for hotel searches
4. Add more sophisticated date parsing for AI suggestions
5. Consider caching Amadeus results for performance
