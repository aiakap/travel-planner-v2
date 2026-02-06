# Amadeus Hotel Search - Debug Logging Added

## Summary

Added comprehensive debug logging to track exactly what's being sent to Amadeus API and what's coming back. This will help identify the root cause of the "Cannot read properties of undefined (reading 'map')" error.

## Changes Made

### 1. Backend Client: `lib/flights/amadeus-client.ts`

Added detailed logging for both API calls in the `searchHotels` function:

#### Step 1 Logging (Hotels by City):
```typescript
console.log('🔍 [AMADEUS] Starting hotel search with params:', params);
console.log('📍 [AMADEUS] Step 1: Calling hotels.byCity.get with:', hotelListParams);
console.log('✅ [AMADEUS] Step 1 Response received. Status:', hotelListResponse.result?.statusCode);
console.log('📦 [AMADEUS] Step 1 Data type:', typeof hotelListResponse.data);
console.log('📦 [AMADEUS] Step 1 Is array:', Array.isArray(hotelListResponse.data));
console.log('📦 [AMADEUS] Step 1 Data length:', hotelListResponse.data?.length);
console.log('📦 [AMADEUS] Step 1 Full response:', JSON.stringify(hotelListResponse, null, 2));
```

#### Step 2 Logging (Hotel Offers):
```typescript
console.log('🏨 [AMADEUS] Found hotel IDs:', hotelIds);
console.log('💰 [AMADEUS] Step 2: Calling hotelOffersSearch.get with:', offersParams);
console.log('✅ [AMADEUS] Step 2 Response received. Status:', offersResponse.result?.statusCode);
console.log('📦 [AMADEUS] Step 2 Data type:', typeof offersResponse.data);
console.log('📦 [AMADEUS] Step 2 Is array:', Array.isArray(offersResponse.data));
console.log('📦 [AMADEUS] Step 2 Data length:', offersResponse.data?.length);
console.log('📦 [AMADEUS] Step 2 Full response:', JSON.stringify(offersResponse, null, 2));
```

### 2. API Route: `app/api/amadeus-test/route.ts`

Added logging at the route level and included debug info in responses:

#### Request Logging:
```typescript
console.log('🔍 [API ROUTE] Hotel search request received');
console.log('📋 [API ROUTE] Parameters:', JSON.stringify(hotelParams, null, 2));
```

#### Success Response with Debug:
```typescript
{
  success: true,
  type: 'hotel',
  params: hotelParams,
  results: hotels,
  count: hotels.length,
  meta: { ... },
  debug: {
    requestParams: hotelParams,
    resultCount: hotels.length,
    sampleResult: hotels[0] || null
  }
}
```

#### Error Response with Debug:
```typescript
{
  success: false,
  type: 'hotel',
  params: hotelParams,
  error: { ... },
  meta: { ... },
  debug: {
    requestParams: hotelParams,
    errorType: error.constructor.name,
    errorString: String(error)
  }
}
```

## How to Use

### 1. Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Open Browser Console
- Open DevTools (F12 or Cmd+Option+I)
- Go to Console tab
- Keep it open while testing

### 3. Test Hotel Search
Navigate to: `http://localhost:3000/admin/apis/amadeus`

Try searching with:
- **Valid city**: NYC, LON, PAR
- **Invalid city**: XXX, ZZZ

### 4. Review Logs

#### In Terminal (Server Console):
Look for:
```
🔍 [AMADEUS] Starting hotel search with params: ...
📍 [AMADEUS] Step 1: Calling hotels.byCity.get with: ...
✅ [AMADEUS] Step 1 Response received. Status: ...
📦 [AMADEUS] Step 1 Data type: ...
📦 [AMADEUS] Step 1 Is array: ...
```

#### On Page (API Response Viewer):
The response JSON will now include a `debug` object with:
- `requestParams` - What was sent to Amadeus
- `resultCount` / `sampleResult` - What came back (if success)
- `errorType` / `errorString` - Error details (if failure)

## What to Look For

### If Step 1 Fails:
```
❌ [AMADEUS] Hotel list response missing data or not an array
   Response object: { ... }
```
**Problem**: The `hotels.byCity.get()` call is returning unexpected data

### If Step 2 Fails:
```
🏨 [AMADEUS] Found hotel IDs: ['HOTEL123', 'HOTEL456']
💰 [AMADEUS] Step 2: Calling hotelOffersSearch.get with: { hotelIds: '...' }
❌ [AMADEUS] Step 2 Response missing data
```
**Problem**: The `hotelOffersSearch.get()` call is returning unexpected data

### Common Issues to Check:

1. **Response Structure**
   - Check `Data type:` - should be "object" with array inside
   - Check `Is array:` - depends on SDK version
   - Check `Data length:` - should be > 0 for results

2. **API Parameters**
   - Verify `cityCode` is valid IATA code
   - Verify dates are in YYYY-MM-DD format
   - Verify dates are in the future

3. **Response Content**
   - Look at `Full response:` to see actual structure
   - Compare with Amadeus API documentation
   - Check if response has `data` property or different structure

## Expected Log Flow (Success)

```
🔍 [API ROUTE] Hotel search request received
📋 [API ROUTE] Parameters: { cityCode: "NYC", ... }
🔍 [AMADEUS] Starting hotel search with params: { cityCode: "NYC", ... }
📍 [AMADEUS] Step 1: Calling hotels.byCity.get with: { cityCode: "NYC", radius: 50, radiusUnit: "KM" }
✅ [AMADEUS] Step 1 Response received. Status: 200
📦 [AMADEUS] Step 1 Data type: object
📦 [AMADEUS] Step 1 Is array: true
📦 [AMADEUS] Step 1 Data length: 10
🏨 [AMADEUS] Found hotel IDs: ['HOTEL1', 'HOTEL2', ...]
💰 [AMADEUS] Step 2: Calling hotelOffersSearch.get with: { hotelIds: "HOTEL1,HOTEL2", ... }
✅ [AMADEUS] Step 2 Response received. Status: 200
📦 [AMADEUS] Step 2 Data type: object
📦 [AMADEUS] Step 2 Is array: true
📦 [AMADEUS] Step 2 Data length: 5
✅ [API ROUTE] Success: Found 5 hotel offers in 3500ms
```

## Next Steps

1. **Run the test** and capture all logs
2. **Share the logs** showing what Step 1 and Step 2 return
3. **Compare to Amadeus docs** to see what's wrong
4. **Fix the issue** based on what we learn

## Files Modified

1. `lib/flights/amadeus-client.ts` - Added detailed Amadeus SDK logging
2. `app/api/amadeus-test/route.ts` - Added route-level logging and debug response

---

**Status**: ✅ Debug logging added
**Next**: Restart server, test, and review logs to find the issue
