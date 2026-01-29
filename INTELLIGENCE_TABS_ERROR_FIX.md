# Intelligence Tabs Error Fix - COMPLETE

## Issue
When clicking around on the assistant tabs in /exp1 (view1), users were getting a console error:
```
Error: Unexpected end of JSON input
```

Additionally, the terminal showed 405 (Method Not Allowed) errors:
```
GET /api/trip-intelligence/language?tripId=cmkxiyfs5001jp4fkjizo4d5e 405 in 3416ms
```

## Root Cause
The `useCachedIntelligence` hook was attempting to fetch cached data via GET requests when tabs were clicked:
- The hook made GET requests to API routes like `/api/trip-intelligence/language?tripId=...`
- However, ALL intelligence API routes only implement POST handlers (no GET handlers)
- This resulted in 405 errors with empty response bodies
- When the hook tried to parse the empty response as JSON, it threw "Unexpected end of JSON input"

## Solution
Modified `/app/view1/hooks/use-cached-intelligence.ts` to remove the automatic GET request on cache miss.

### Previous Behavior (Broken)
```typescript
// Cache miss - fetch from API
try {
  setLoading(true)
  const response = await fetch(`${apiEndpoint}?tripId=${tripId}`)
  const result = await response.json() // ❌ Fails when response is 405
  // ...
}
```

### New Behavior (Fixed)
```typescript
// No cache - don't make any API calls
// The view component will show the questions form and make POST request
setData(null)
setLoading(false)
```

## How It Works Now
1. **On Initial Load**: Hook checks cache, finds nothing, returns `null` data
2. **View Component**: Detects `null` data and shows the question form
3. **User Submits Form**: Makes POST request with required data
4. **Response Cached**: Data is stored in cache for subsequent visits
5. **Subsequent Loads**: Hook finds cached data and returns it immediately

## Files Changed
- `app/view1/hooks/use-cached-intelligence.ts` - Removed GET request logic

## Benefits
- ✅ No more "Unexpected end of JSON input" errors
- ✅ No more 405 errors in console
- ✅ Cleaner separation: POST-only API routes
- ✅ Better UX: Users always see question form first, then cached results
- ✅ Consistent behavior across all intelligence tabs

## Testing
Test all intelligence tabs by:
1. Navigate to `/view1/[tripId]`
2. Click through each tab: Packing, Currency, Emergency, Cultural, Activities, Dining, Language, Documents
3. Verify no console errors when switching tabs
4. Fill out question form on first visit
5. Switch to another tab and back - should show cached results
6. Click "Update Preferences" to clear cache and show form again

All tabs should work without errors now!
