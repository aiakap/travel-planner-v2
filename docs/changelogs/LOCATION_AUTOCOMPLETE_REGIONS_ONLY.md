# Location Autocomplete - Geographic Places Only

## Change Summary

Modified the location autocomplete to only show geographic places (cities, states, regions, countries, neighborhoods) and exclude specific street addresses.

## What Changed

**File**: `lib/actions/address-validation.ts`

**Function**: `getPlaceAutocompleteSuggestions()`

**Change**: Added `types=(regions)` parameter to Google Places Autocomplete API call

### Before
```typescript
const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
  input
)}&key=${apiKey}`;
```

### After
```typescript
const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
  input
)}&types=(regions)&key=${apiKey}`;
```

## What `types=(regions)` Includes

The `(regions)` type collection restricts results to geographic areas:

✅ **Included**:
- **Cities**: `locality` (e.g., "Paris", "Tokyo", "New York")
- **Neighborhoods**: `sublocality`, `neighborhood` (e.g., "Brooklyn", "Shibuya")
- **Administrative Areas**: `administrative_area_level_1`, `administrative_area_level_2` (e.g., "California", "Île-de-France")
- **Countries**: `country` (e.g., "France", "Japan")
- **Postal Codes**: `postal_code` (e.g., "75001", "10001")
- **Regions**: General geographic regions

❌ **Excluded**:
- **Street Addresses**: `street_address`, `route` (e.g., "123 Main St")
- **Premise**: Specific building addresses
- **Subpremise**: Apartment/unit numbers
- **Establishments**: Individual businesses, hotels, restaurants (unless they're also a neighborhood/area)

## Impact

### User Experience
- Users can now search for:
  - Cities: "Paris", "London", "Tokyo"
  - States/Provinces: "California", "Ontario", "Bavaria"
  - Countries: "France", "Japan", "Italy"
  - Neighborhoods: "SoHo", "Montmartre", "Shibuya"
  - Regions: "Tuscany", "Provence", "New England"
  - Postal codes: "75001", "SW1A 1AA"

- Users will NOT see:
  - Specific street addresses: "123 Main Street"
  - Building names with addresses: "Empire State Building, 20 W 34th St"
  - Individual business addresses

### Where This Applies

This change affects all location autocomplete inputs throughout the application:

1. **Segment Edit Page** (`/segment/[id]/edit`)
   - Start location input
   - End location input

2. **Trip Creation** (`/trip/new`)
   - Destination inputs

3. **Any Component Using** `LocationAutocompleteInput`
   - All location fields use this shared component
   - Consistent behavior across the app

## Technical Details

### Google Places API Types

The `(regions)` type is a **type collection** (note the parentheses) that groups multiple individual types:

```
(regions) includes:
  - locality
  - sublocality
  - postal_code
  - country
  - administrative_area_level_1
  - administrative_area_level_2
  - neighborhood
```

This is different from individual types like `locality` or `country`, which would be too restrictive.

### API Request Example

**Before**:
```
GET https://maps.googleapis.com/maps/api/place/autocomplete/json
  ?input=paris
  &key=API_KEY
  
Returns: Paris (city), Paris Street, Paris Restaurant, 123 Paris Ave, etc.
```

**After**:
```
GET https://maps.googleapis.com/maps/api/place/autocomplete/json
  ?input=paris
  &types=(regions)
  &key=API_KEY
  
Returns: Paris (city), Paris (TX), Paris (Ontario), etc. (only geographic places)
```

## Testing

To verify the change works correctly:

1. **Navigate to segment edit page**
   - Go to `/view1`
   - Click edit icon on any segment
   - Click on location input

2. **Test geographic places** (should appear):
   - Type "paris" → Should show "Paris, France", "Paris, TX", etc.
   - Type "california" → Should show "California, USA"
   - Type "brooklyn" → Should show "Brooklyn, NY, USA"
   - Type "75001" → Should show postal code areas

3. **Test addresses** (should NOT appear):
   - Type "123 main street" → Should show cities/areas named "Main", not addresses
   - Type "empire state building" → Should not show the building address
   - Type "times square" → May show the neighborhood/area, not specific addresses

## Benefits

1. **Better UX**: Users don't have to scroll through irrelevant street addresses
2. **Faster Search**: Fewer results to filter through
3. **Clearer Intent**: Makes it obvious the app wants geographic areas, not addresses
4. **Consistent Data**: All locations are at the same level of geographic granularity
5. **Better for Travel Planning**: Travel segments are typically between cities/regions, not addresses

## Potential Edge Cases

### Landmarks as Neighborhoods
Some famous landmarks that are also neighborhoods/areas may still appear:
- "Times Square" (neighborhood in NYC)
- "Montmartre" (neighborhood in Paris)
- "Shibuya" (district in Tokyo)

This is intentional and desirable for travel planning.

### Small Towns
Very small towns or villages should still appear as they are classified as `locality`.

### Airports
Major airports classified as neighborhoods/areas may appear:
- "JFK" might show "Jamaica, Queens" (the neighborhood)
- But not "John F. Kennedy International Airport" as an establishment

If you need airports specifically, consider adding a separate airport search feature.

## Future Enhancements

If needed, we could:

1. **Add Airport Support**: Create a separate autocomplete for airports using `types=airport`
2. **Add Establishment Support**: For hotels/restaurants, use `types=establishment`
3. **Hybrid Search**: Allow toggling between regions and establishments
4. **Custom Filtering**: Add client-side filtering based on place types
5. **Icons by Type**: Show different icons for cities vs. neighborhoods vs. countries

## Related Files

- `lib/actions/address-validation.ts` - Modified function
- `components/ui/location-autocomplete-input.tsx` - Uses this function
- `app/segment/[id]/edit/client.tsx` - Uses the component
- `app/trip/new/page.tsx` - Also uses location autocomplete

## Documentation

Google Places API Types Reference:
- [Place Types](https://developers.google.com/maps/documentation/places/web-service/supported_types)
- [Autocomplete Type Collections](https://developers.google.com/maps/documentation/places/web-service/autocomplete#place_types)

## Conclusion

Successfully restricted location autocomplete to geographic places only, improving the user experience for travel planning by showing only relevant cities, regions, and neighborhoods while excluding specific street addresses.
