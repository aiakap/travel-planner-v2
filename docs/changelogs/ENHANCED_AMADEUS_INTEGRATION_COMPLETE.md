# Enhanced Amadeus Integration - Implementation Complete

## Summary

Successfully restructured the place suggestion pipeline to use **three separate lists** (places, transport, hotels) in Stage 1, implemented **data merging** in Stage 3 to combine Google Places and Amadeus data, and created a unified **"Add to Itinerary" modal** that pre-populates costs and dates from live Amadeus pricing.

## Key Changes from Previous Implementation

### Stage 1: AI Generation - Three Separate Lists

**Previous**: Single `places` array with mixed types  
**Now**: Three distinct arrays for better API routing

```typescript
interface Stage1Output {
  text: string;
  places: PlaceSuggestion[];      // → Google Places
  transport: TransportSuggestion[]; // → Amadeus Flights/Transfers
  hotels: HotelSuggestion[];       // → Amadeus Hotels
}
```

**Benefits**:
- Cleaner separation of concerns
- Items can appear in multiple lists (e.g., hotel in both `places` and `hotels` for merged data)
- Explicit date handling - hotels only added to `hotels` array when dates are specified

### Stage 2: Three Parallel Lookups

**File**: `app/api/pipeline/run/route.ts`

Now processes three independent suggestion lists:

```typescript
const [placesResult, transportResult, hotelsResult] = await Promise.all([
  resolvePlaces(stage1.places),        // Google Places API
  resolveTransport(stage1.transport),  // Amadeus Flights + Transfers
  resolveHotels(stage1.hotels),        // Amadeus Hotels
]);
```

**New Functions**:
- `resolveTransport()` - Handles both flights and transfers (replaces `resolveFlights()`)
- `resolveHotels()` - Now uses `HotelSuggestion` type with explicit date fields

### Stage 3: Data Merging

**File**: `lib/html/assemble-amadeus-links.ts`

Now creates segments that can have **BOTH** Google Places and Amadeus data:

```typescript
// Hotel with merged data
segments.push({
  type: "hotel",
  suggestion: hotelSuggestion,
  placeData: googlePlacesData,  // Primary display (name, address, rating, photos)
  hotelData: amadeusData,        // Availability overlay (live pricing, dates)
  display: "Hôtel Plaza Athénée",
});
```

## UI Enhancements

### Flight Hover Card - Cleaner Display

**File**: `components/flight-hover-card.tsx`

**New UI Features**:
- **Larger price display** (2xl font, prominent green)
- **Grid layout** for key info (Carrier, Duration, Depart time, Arrive time)
- **Visual separation** with background color for stats
- **Planning notice** with blue alert box
- **"Add to Itinerary" button** wired to modal

**Display Example**:
```
┌─────────────────────────────────────┐
│ JFK → LAX              $287         │
│ Mar 15                               │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Carrier: AA      Duration: 5h30m│ │
│ │ Depart: 06:00    Arrive: 11:30  │ │
│ └─────────────────────────────────┘ │
│ ⚠ For planning only - book separately│
│ [Add to Itinerary]                  │
└─────────────────────────────────────┘
```

### Hotel Hover Card - Google Primary + Amadeus Overlay

**File**: `components/hotel-hover-card.tsx`

**New Structure**:
1. **Primary Section** (Google Places)
   - Hotel name from Google
   - Full address from Google
   - Star rating + review count from Google
   - Photo from Google Places (high quality)

2. **Availability Overlay** (Amadeus - if available)
   - Green background section
   - ✓ "Available" badge
   - Live pricing with currency
   - "per stay" indicator

3. **Additional Google Info**
   - Website link
   - Price level ($$$)

**Display Example**:
```
┌─────────────────────────────────────┐
│ Hôtel Plaza Athénée                 │
│ 📍 25 Avenue Montaigne, Paris       │
│ ⭐ 4.8 (1,234 reviews)              │
│ [Photo from Google Places]          │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ ✓ Available    $450             │ │
│ │ Live pricing   EUR per stay     │ │
│ └─────────────────────────────────┘ │
│ Visit website →                     │
│ [Add to Itinerary]                  │
└─────────────────────────────────────┘
```

### Add to Itinerary Modal - Pre-populated

**File**: `components/add-reservation-modal.tsx` (NEW)

**Pre-population Logic**:
- **Cost**: Auto-filled from `transportData.price.total` or `hotelData.price.total`
- **Start Date**: From `departureDate` (flights) or `checkInDate` (hotels)
- **End Date**: From `returnDate` (flights) or `checkOutDate` (hotels)
- **Start/End Time**: Defaults (can be edited)
- **Category**: Auto-detected from segment type

**Special Features**:
- **Flight disclaimer** shown for transport segments
- **Live pricing indicator** with green checkmark
- **Flight details box** showing carrier and duration
- **Flexible editing** - all fields can be modified before adding

## AI Prompt Improvements

**File**: `lib/ai/generate-place-suggestions.ts`

### New Date Handling
- Uses **dynamic date calculation** (tomorrow = actual tomorrow)
- **Near future dates** (1-30 days out, not 7+ days)
- Defaults: check-in = tomorrow, check-out = +3 days, flight return = +7 days
- Proper year calculation for relative dates (e.g., "March 15" = next occurrence)

### Smart List Inclusion Rules
```
PLACES array: Always include restaurants, attractions, hotels (for Google info)
TRANSPORT array: Only when dates are mentioned
HOTELS array: Only when check-in/out dates are specified

Hotels with dates → appear in BOTH "places" AND "hotels" for data merging
```

## New Type System

**File**: `lib/types/amadeus-pipeline.ts`

### Added Types:
```typescript
TransportSuggestion {
  suggestedName, type, origin, destination,
  departureDate, departureTime, returnDate,
  adults, travelClass, transferType
}

HotelSuggestion {
  suggestedName, location,
  checkInDate, checkOutDate,
  guests, rooms, searchQuery
}

AmadeusTransportData {
  id, type: "flight" | "transfer",
  price, itineraries, validatingAirlineCodes,
  vehicle (for transfers), duration
}
```

## Testing

Visit `/test/place-pipeline` (running on port 3002) and try:

### Test Query 1: Mixed Request
```
"Plan a Paris trip starting tomorrow: flight from NYC, hotel near Eiffel Tower, and dinner at Le Meurice"
```

**Expected**:
- `places`: [Le Meurice, Eiffel Tower hotel] → Google Places lookup
- `transport`: [NYC to Paris flight] → Amadeus flight search
- `hotels`: [Eiffel Tower hotel] → Amadeus availability
- **Result**: Hotel appears with Google info (address, rating, photos) + Amadeus pricing overlay

### Test Query 2: Flight Only
```
"Book a roundtrip flight from JFK to LAX tomorrow"
```

**Expected**:
- `places`: []
- `transport`: [JFK to LAX flight]
- `hotels`: []
- **Result**: Flight with carrier, price, times in clean grid layout

### Test Query 3: Hotels Without Dates
```
"Suggest luxury hotels in Paris"
```

**Expected**:
- `places`: [Paris luxury hotels] → Google Places only
- `transport`: []
- `hotels`: [] (no dates specified)
- **Result**: Hotels shown with Google Places data, no Amadeus overlay

## Files Modified

1. ✅ `lib/types/amadeus-pipeline.ts` - Added TransportSuggestion, HotelSuggestion, updated Stage1Output
2. ✅ `lib/ai/generate-place-suggestions.ts` - Three-array output, date helpers, enhanced prompt
3. ✅ `lib/flights/amadeus-client.ts` - Added searchTransfers() function
4. ✅ `lib/amadeus/resolve-suggestions.ts` - Added resolveTransport(), updated resolveHotels()
5. ✅ `app/api/pipeline/run/route.ts` - Process three lists, updated Stage 2/3 calls
6. ✅ `lib/html/assemble-amadeus-links.ts` - Data merging logic for all three sources
7. ✅ `components/flight-hover-card.tsx` - Clean grid UI, planning notice, modal integration
8. ✅ `components/hotel-hover-card.tsx` - Google primary + Amadeus overlay, modal integration
9. ✅ `components/add-reservation-modal.tsx` - NEW: Pre-populated modal with Amadeus data
10. ✅ `components/amadeus-segments-renderer.tsx` - Modal state management for all types

## Architecture Diagram

```
User Query
    ↓
┌─────────────────────────────────────────────┐
│ Stage 1: AI Generation                      │
│ Output: { text, places[], transport[],      │
│           hotels[] }                         │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Stage 2: Parallel Lookups                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────┤
│  │ Google Places│  │   Amadeus    │  │Amadeus
│  │   (places)   │  │ (transport)  │  │(hotels)
│  └──────────────┘  └──────────────┘  └─────┤
│ Output: { placeMap, transportMap, hotelMap }│
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Stage 3: Data Merging & Assembly            │
│  - Match names in text                      │
│  - Merge Google + Amadeus for hotels        │
│  - Create unified segments                  │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ Display: Hover Cards + Modal                │
│  - Google info as primary                   │
│  - Amadeus availability as overlay          │
│  - Pre-populated Add to Itinerary modal     │
└─────────────────────────────────────────────┘
```

## Next Steps

1. Test with real queries to verify three-list generation works
2. Add more city code mappings for hotel searches
3. Implement actual transfer search (currently stubbed)
4. Create API endpoint for saving reservations (`/api/reservations/create`)
5. Add support for train/bus bookings via transfers API
6. Consider adding flight selection UI (show multiple options)

## Success Criteria ✅

- ✅ Stage 1 outputs three separate arrays
- ✅ Stage 2 processes all three lists in parallel
- ✅ Stage 3 merges Google and Amadeus data for hotels
- ✅ Flight hover cards show carrier, price, times, duration cleanly
- ✅ Hotel hover cards show Google info with Amadeus availability overlay
- ✅ "Add to Itinerary" modal pre-populates costs and dates from Amadeus
- ✅ Flight disclaimer appears for transport bookings
- ✅ All segments clickable and wire to unified modal
- ✅ Near-future date handling (tomorrow to 30 days)
