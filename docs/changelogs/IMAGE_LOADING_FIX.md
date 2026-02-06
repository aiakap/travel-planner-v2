# Image Loading Fix - Trip Suggestions

## Issue
Trip suggestion images were not loading, but Google Maps were working fine. The hover card on the test chat page was successfully loading images.

## Root Cause
The codebase had **two different `getPhotoUrl` functions**:

1. **`@/lib/actions/google-places`** - Used by `fetchDestinationImage` (NOT working)
2. **`@/lib/google-places/resolve-suggestions`** - Used by hover card (WORKING)

The trip suggestions page was using a complex `fetchDestinationImage` server action that wasn't properly updating state when called from the client component's `useEffect`.

## Solution
Replaced the non-working approach with the proven working approach from the hover card:

### Before (Not Working)
```typescript
import { fetchDestinationImage } from "@/lib/actions/fetch-destination-image";

const imageUrl = await fetchDestinationImage(
  suggestion.destination,
  suggestion.imageQuery,
  suggestion.destinationKeywords
);
```

### After (Working)
```typescript
import { searchPlace } from "@/lib/actions/google-places";
import { getPhotoUrl } from "@/lib/google-places/resolve-suggestions";

const query = suggestion.imageQuery || suggestion.destination;
const place = await searchPlace(query);

if (place?.photos?.[0]?.reference) {
  const photoUrl = await getPhotoUrl(place.photos[0].reference, 800);
  setSuggestionImages(prev => ({ ...prev, [idx]: photoUrl }));
} else {
  // Fallback to Unsplash
  const unsplashUrl = `https://source.unsplash.com/800x600/?${searchTerms},travel`;
  setSuggestionImages(prev => ({ ...prev, [idx]: unsplashUrl }));
}
```

## Key Changes

### File: `app/test/profile-suggestions/client.tsx`

1. **Updated Imports**:
   - Removed: `fetchDestinationImage` from `@/lib/actions/fetch-destination-image`
   - Added: `searchPlace` from `@/lib/actions/google-places`
   - Added: `getPhotoUrl` from `@/lib/google-places/resolve-suggestions`

2. **Simplified Image Fetching Logic**:
   - Call `searchPlace()` with the image query
   - Extract photo reference from place data
   - Call `getPhotoUrl()` to construct the Google Places photo URL
   - Fallback to Unsplash if no photos found
   - Fallback to Unsplash on any errors

## Why This Works

1. **Direct Function Calls**: Uses the same working functions as the hover card
2. **Proper State Updates**: Calls `setSuggestionImages` directly after getting URLs
3. **Progressive Loading**: Each image updates independently as it loads
4. **Error Handling**: Falls back to Unsplash gracefully on any failure

## Image Sources

### Primary: Google Places Photos
- Searches for the destination using `searchPlace()`
- Gets high-quality photos from Google Places API
- Returns URL: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=...&key=...`

### Fallback: Unsplash
- Used when Google Places has no photos or errors occur
- Uses destination keywords for better image matching
- Returns URL: `https://source.unsplash.com/800x600/?keywords,travel`

## Expected Behavior

1. **Cards render immediately** with skeleton loaders
2. **Images load progressively** (1-3 seconds each)
3. **Google Places photos** load for well-known destinations
4. **Unsplash photos** load as fallback for generic locations
5. **Smooth fade-in** when images complete loading

## Testing

To verify the fix works:

1. Navigate to `/test/profile-suggestions`
2. Wait for AI to generate suggestions (loading messages will rotate)
3. Cards should appear with skeleton loaders
4. Images should progressively fade in
5. Check browser console for any errors
6. Check Network tab for successful image requests

## Files Modified

- `app/test/profile-suggestions/client.tsx` - Updated image fetching logic

## Files No Longer Used

- `lib/actions/fetch-destination-image.ts` - Can be removed or kept for other uses

## Related Files

- `lib/google-places/resolve-suggestions.ts` - Contains the working `getPhotoUrl`
- `lib/actions/google-places.ts` - Contains `searchPlace` function
- `components/place-hover-card.tsx` - Reference implementation that works
