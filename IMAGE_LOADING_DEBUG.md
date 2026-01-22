# Image Loading Debug Guide

## Issue
Location images are not loading on the Trip Suggestions page, but Google Maps are loading correctly.

## Changes Made for Debugging

### 1. Enhanced Console Logging

**File**: `app/test/profile-suggestions/client.tsx`

Added detailed logging to track the image fetching process:
- When image fetching starts
- For each individual image fetch attempt
- When image URLs are received
- When rendering cards with image URLs

**File**: `components/trip-suggestion-card.tsx`

Added logging for:
- When images successfully load
- When images fail to load

### 2. Fixed Skeleton Display Logic

**File**: `components/trip-suggestion-card.tsx`

**Before**: Skeleton only showed when `imageUrl` existed
```typescript
{!imageLoaded && !imageError && imageUrl && (
  <div className="skeleton">...</div>
)}
```

**After**: Skeleton shows whenever image hasn't loaded yet
```typescript
{!imageLoaded && !imageError && (
  <div className="skeleton">...</div>
)}
```

This ensures the skeleton displays immediately when cards render, even before image URLs arrive.

### 3. Added Image State Reset

**File**: `components/trip-suggestion-card.tsx`

Added `useEffect` to reset image loading state when `imageUrl` prop changes:
```typescript
React.useEffect(() => {
  if (imageUrl) {
    setImageLoaded(false);
    setImageError(false);
  }
}, [imageUrl]);
```

This ensures proper re-rendering when images load progressively.

## How to Debug

### 1. Open Browser Console

Navigate to: `http://localhost:3000/test/profile-suggestions`

### 2. Check Console Output

You should see logs in this order:

```
Starting to fetch images for 4 suggestions
Fetching image 0 for: [destination] [imageQuery]
Fetching image 1 for: [destination] [imageQuery]
Fetching image 2 for: [destination] [imageQuery]
Fetching image 3 for: [destination] [imageQuery]
Image 0 fetched: [URL]
Image 1 fetched: [URL]
Image 2 fetched: [URL]
Image 3 fetched: [URL]
Rendering card 0, imageUrl: [URL]
Rendering card 1, imageUrl: [URL]
Rendering card 2, imageUrl: [URL]
Rendering card 3, imageUrl: [URL]
Image loaded: [URL]
Image loaded: [URL]
Image loaded: [URL]
Image loaded: [URL]
```

### 3. Common Issues to Check

#### Issue 1: No "Fetching image" logs
**Problem**: `useEffect` not triggering
**Check**: Verify `tripSuggestions` state is being set correctly

#### Issue 2: "Fetching image" but no "Image fetched"
**Problem**: Server action failing
**Check**: 
- Google Places API key is configured
- Network tab for failed requests
- Server console for errors

#### Issue 3: "Image fetched" with placeholder.svg
**Problem**: Google Places search failing, falling back to Unsplash
**Check**:
- Google Places API quota
- API key permissions
- Search query format

#### Issue 4: "Image fetched" but "Image failed to load"
**Problem**: CORS or invalid URL
**Check**:
- Network tab for image request
- CORS headers
- URL format (especially Unsplash)

#### Issue 5: Images load but don't display
**Problem**: CSS or rendering issue
**Check**:
- Image `opacity` class is transitioning
- `imageLoaded` state is being set
- No z-index conflicts

## Image Sources

### Google Places (Primary)
- Uses `searchPlace()` to find location
- Gets photo reference from place details
- Constructs photo URL with API key
- Should work for well-known destinations

### Unsplash (Fallback)
- Uses source.unsplash.com API
- Format: `https://source.unsplash.com/800x600/?[keywords],travel`
- Should always return an image (random if no match)

## Environment Variables to Check

```bash
# In .env.local
GOOGLE_PLACES_API_KEY=your_key_here
# OR
GOOGLE_MAPS_API_KEY=your_key_here
```

The code checks both variables, using `GOOGLE_PLACES_API_KEY` first.

## Testing Steps

1. **Test with known locations**:
   - Try "Eiffel Tower Paris" - should get Google Places image
   - Try "Golden Gate Bridge" - should get Google Places image

2. **Test with generic locations**:
   - Try "Beach vacation" - likely falls back to Unsplash
   - Check if Unsplash images load

3. **Test with no API key**:
   - Temporarily remove API key
   - Should fall back to Unsplash for all images

4. **Test error handling**:
   - Use invalid image URL
   - Should show MapPin icon placeholder

## Expected Behavior

### Stage 1: Cards Render (Immediate)
- 4 cards appear with skeleton loaders
- Pulsing gray background with MapPin icon
- All text content visible

### Stage 2: Images Load (1-5 seconds)
- Each card's skeleton fades out
- Image fades in with 500ms transition
- Gradient overlay appears on image
- Cards update independently

### Stage 3: Complete (All loaded)
- All images visible
- Hover effects work
- No skeleton loaders visible

## Next Steps if Still Not Working

1. **Check Network Tab**:
   - Look for failed image requests
   - Check response status codes
   - Verify URLs are correct

2. **Check Server Logs**:
   - Look for Google Places API errors
   - Check for rate limiting
   - Verify API key is valid

3. **Simplify Test**:
   - Hardcode an image URL in `suggestionImages` state
   - If that works, issue is with `fetchDestinationImage`
   - If that doesn't work, issue is with rendering

4. **Check API Quotas**:
   - Google Places API has daily limits
   - Check Google Cloud Console for quota usage
   - May need to enable billing for higher limits

## Temporary Workaround

If images still won't load, you can force Unsplash for all images:

```typescript
// In app/test/profile-suggestions/client.tsx
const imageUrl = `https://source.unsplash.com/800x600/?${suggestion.destinationKeywords.join(',')},travel`;
setSuggestionImages(prev => ({ ...prev, [idx]: imageUrl }));
```

This bypasses Google Places entirely and uses only Unsplash.
