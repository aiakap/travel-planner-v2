# Race Condition Fix - Trip Not Found Error

## Problem
The "Trip not found" error was caused by a race condition in the auto-save effect:

1. User interacts → `hasUserInteracted` becomes `true`
2. Effect runs → Creates trip in DB → Calls `setTripId(id)`
3. Setting `tripId` state triggers the effect **again** (because `tripId` was in the dependency array)
4. Second run tries to call `updateTripMetadata` and `syncSegments` immediately
5. The trip may not be fully committed yet, or segments don't have `dbId` values
6. Server actions throw "Trip not found" error

## Solution Implemented

### 1. Use Ref Instead of State for Trip ID Logic

**File:** `app/trip/new1/components/trip-builder-client.tsx`

**Changes:**
- Added `tripIdRef` to track the trip ID without triggering re-renders
- Updated auto-save effect to use `tripIdRef.current` for all logic
- Removed `tripId` from the effect dependency array
- Keep `setTripId()` only for UI display purposes

**Before:**
```typescript
useEffect(() => {
  if (!tripId) {
    const id = await createDraftTrip({...});
    setTripId(id); // This triggers the effect again!
  } else {
    await updateTripMetadata(tripId, {...});
  }
}, [..., tripId]); // tripId in dependencies causes double-trigger
```

**After:**
```typescript
const tripIdRef = useRef<string | null>(null);

useEffect(() => {
  if (!tripIdRef.current) {
    const id = await createDraftTrip({...});
    tripIdRef.current = id; // Doesn't trigger re-render
    setTripId(id); // Only for UI display
  } else {
    await updateTripMetadata(tripIdRef.current, {...});
  }
}, [..., hasUserInteracted]); // tripId removed from dependencies
```

### 2. Added Debug Logging

**File:** `app/trip/new1/actions/trip-builder-actions.ts`

**Changes:**
- Added console logs in all server actions to track:
  - When actions are called
  - What trip ID is being looked up
  - What user ID is making the request
  - Whether the trip was found
  - Success/failure of operations

**Benefits:**
- Easy to debug issues by checking browser console
- Can see exact sequence of operations
- Can identify authorization vs. not-found issues

## How It Works Now

### Correct Flow

```
User edits journey name
  ↓
hasUserInteracted = true
  ↓
Effect triggers (first time)
  ↓
tripIdRef.current is null → Create trip
  ↓
tripIdRef.current = "abc123"
setTripId("abc123") for UI
  ↓
Effect does NOT trigger again (tripId not in deps)
  ↓
User edits again
  ↓
Effect triggers (data changed)
  ↓
tripIdRef.current = "abc123" → Update trip
  ↓
Success!
```

## Testing Results

### Test Scenarios
1. ✅ Fresh page load → No saves, no errors
2. ✅ First edit → Creates trip (check console: "✅ Created draft trip: [id]")
3. ✅ Subsequent edits → Updates trip (check console: "✅ Saved trip updates")
4. ✅ No "Trip not found" errors
5. ✅ Only one trip created per session
6. ✅ Save status displays correctly

### Console Output Example
```
🔄 Auto-save triggered, tripIdRef.current: null
📝 Creating new draft trip...
✅ Created draft trip: cm123abc456
🔄 Auto-save triggered, tripIdRef.current: cm123abc456
💾 Updating existing trip: cm123abc456
🔍 updateTripMetadata: Looking for trip cm123abc456 for user cmkf2ddpm0000p49kv17s3o8v
✅ updateTripMetadata: Found trip cm123abc456
🔍 syncSegments: Looking for trip cm123abc456 for user cmkf2ddpm0000p49kv17s3o8v, syncing 3 segments
✅ syncSegments: Found trip cm123abc456 with 0 existing segments
✅ Saved trip updates
```

## Key Insights

### Why Refs Work Better Here
- **State changes trigger re-renders** and re-run effects with state in dependencies
- **Refs persist across renders** without causing re-renders
- Perfect for tracking values that affect logic but shouldn't trigger effects

### When to Use This Pattern
- Any time you need to track a value that determines branching logic (create vs update)
- When the value is set inside an effect and you don't want to re-trigger
- When you want to decouple internal logic from UI state

## Files Modified

1. `app/trip/new1/components/trip-builder-client.tsx`
   - Added `tripIdRef`
   - Updated auto-save effect
   - Removed `tripId` from dependencies
   - Added debug logging

2. `app/trip/new1/actions/trip-builder-actions.ts`
   - Added debug logging to all functions
   - Improved error messages with context
   - Better error tracking

## Related Documentation

- See `FIXES.md` for the initial interaction tracking fix
- See main `README.md` for overall trip builder documentation
