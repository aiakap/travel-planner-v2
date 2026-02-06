# Car Rental Segment Creation Fix - Complete ✅

## Issues Fixed

### 1. Missing Required Fields Error ✅

**Error:**
```
Invalid `prisma.segment.create()` invocation:
Argument `startLat` is missing.
```

**Root Cause:** 
The Segment model requires `startLat`, `startLng`, `endLat`, `endLng` as non-nullable Float fields, but the car rental (and hotel) segment creation was not providing these coordinates.

**Solution:**
Added geocoding helper function to both car rental and hotel actions that:
1. Uses Google Maps Geocoding API to get coordinates for locations
2. Falls back to (0, 0) if API key is not configured or geocoding fails
3. Includes coordinates in segment creation

**Files Modified:**
- `lib/actions/add-car-rentals-to-trip.ts` - Added geocoding helper and coordinate fields
- `lib/actions/add-hotels-to-trip.ts` - Added geocoding helper and coordinate fields

**Code Added:**
```typescript
// Geocoding helper
async function geocodeLocation(location: string): Promise<{
  lat: number;
  lng: number;
  formatted: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("Google Maps API key not configured, using default coordinates");
    return { lat: 0, lng: 0, formatted: location };
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted: result.formatted_address,
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  // Fallback to default coordinates
  return { lat: 0, lng: 0, formatted: location };
}
```

**Segment Creation Updated:**
```typescript
// Geocode locations
const startGeo = await geocodeLocation(pickupCity);
const endGeo = await geocodeLocation(returnCity);

const newSegment = await prisma.segment.create({
  data: {
    tripId,
    name: segmentName,
    startTitle: pickupCity,
    startLat: startGeo.lat,  // ✅ Added
    startLng: startGeo.lng,  // ✅ Added
    endTitle: returnCity,
    endLat: endGeo.lat,      // ✅ Added
    endLng: endGeo.lng,      // ✅ Added
    startTime: new Date(`${carRentalData.pickupDate}T${convertTo24Hour(carRentalData.pickupTime)}`),
    endTime: new Date(`${carRentalData.returnDate}T${convertTo24Hour(carRentalData.returnTime)}`),
    order: trip.segments.length,
    segmentTypeId: driveType?.id
  }
});
```

### 2. Manual Segment Selection UI ✅

**Request:**
When no segment matches, show the suggested new segment creation BUT also allow the user to manually choose from existing segments.

**Solution:**
Added manual segment selector dropdown that appears when:
- No matching segment is found (willCreateSegment = true)
- Shows all existing segments for the selected trip
- User can choose to either:
  - Leave empty → creates the suggested new segment
  - Select existing segment → adds to that segment instead

**UI Changes:**

**For Car Rentals:**
```tsx
{carRentalPreview.willCreateSegment ? (
  <>
    <Alert>
      <AlertDescription>
        ⭐ Will create new segment: <strong>{carRentalPreview.suggestedSegmentName}</strong>
        <br />
        <span className="text-xs text-muted-foreground mt-1 block">
          No existing segment matches this car rental
        </span>
      </AlertDescription>
    </Alert>
    
    {/* Manual segment selection */}
    <div className="space-y-2">
      <Label htmlFor="manual-segment-car" className="text-sm">
        Or choose an existing segment:
      </Label>
      <Select
        value={selectedSegmentId}
        onValueChange={(value) => setSelectedSegmentId(value)}
      >
        <SelectTrigger id="manual-segment-car">
          <SelectValue placeholder="Select a segment (optional)" />
        </SelectTrigger>
        <SelectContent>
          {trips.find(t => t.id === selectedTripId)?.segments.map((segment) => (
            <SelectItem key={segment.id} value={segment.id}>
              {segment.name} ({formatDate(segment.startTime || '')} - {formatDate(segment.endTime || '')})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Leave empty to create the suggested new segment
      </p>
    </div>
  </>
) : null}
```

**Handler Updated:**
```typescript
await addCarRentalToTrip({
  tripId: selectedTripId,
  segmentId: selectedSegmentId || null, // Use manual selection if provided
  carRentalData: extractedData,
  options: {
    autoMatch: !selectedSegmentId, // Only auto-match if no manual selection
    minScore: 70,
    createSuggestedSegments: !selectedSegmentId // Only create segment if no manual selection
  }
});
```

**Same Changes Applied to Hotels** for consistency.

## Files Modified

1. **`lib/actions/add-car-rentals-to-trip.ts`**
   - Added geocoding helper function
   - Updated segment creation to include coordinates
   - Added error handling for geocoding failures

2. **`lib/actions/add-hotels-to-trip.ts`**
   - Added geocoding helper function
   - Updated segment creation to include coordinates
   - Added error handling for geocoding failures

3. **`app/admin/email-extract/page.tsx`**
   - Added manual segment selector for car rentals when no match found
   - Added manual segment selector for hotels when no match found
   - Updated handlers to respect manual segment selection
   - Updated auto-match logic to only run when no manual selection

## User Experience

### Before:
1. No match found → Error or forced segment creation
2. No way to manually choose a segment

### After:
1. **Auto-match found:** Shows matched segment with confidence score
2. **No match found:** 
   - Shows suggested new segment name
   - Displays dropdown to manually select from existing segments
   - User can choose: create new OR use existing
3. **Manual selection:** Overrides auto-matching and segment creation

## Benefits

✅ **Fixes critical error** - Segments can now be created successfully
✅ **Better UX** - Users have control over segment assignment
✅ **Flexibility** - Can override auto-matching when needed
✅ **Consistency** - Same behavior for hotels and car rentals
✅ **Graceful fallback** - Works even without Google Maps API key (uses 0,0 coordinates)

## Testing

1. **Test car rental extraction** with Toyota email
2. **Verify segment creation** works without errors
3. **Test manual segment selection** when no match found
4. **Verify auto-matching** still works when match is found
5. **Test hotel extraction** to ensure consistency

## Completion Date

January 27, 2026

## Notes

- Geocoding uses Google Maps API when available
- Falls back to (0, 0) coordinates if API key missing or geocoding fails
- Manual segment selection works for both hotels and car rentals
- Auto-matching is skipped when user manually selects a segment
- Segment creation is skipped when user manually selects a segment
