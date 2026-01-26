# Infinite Loop Fix - useEffect Dependencies

## Problem Identified

From the debug logs and user's XML data:

1. **Infinite Loop**: The useEffect in `chat-layout.tsx` was running constantly (every ~500ms) because `config`, `userId`, and `params` were in the dependency array, and `config` is an object whose reference changes on every render.

2. **Data IS Being Written**: The XML shows tons of duplicate "Triathlon" entries, proving that writes ARE working.

3. **UI Not Updating**: The constant refetching (infinite loop) was preventing the UI from stabilizing and showing new data.

## Root Cause

```typescript
useEffect(() => {
  if (refreshTrigger > 0) {
    // refetch data
  }
}, [refreshTrigger, config, userId, params]); // ❌ config changes every render!
```

The `config` object is created fresh on every render of the parent component, so its reference changes constantly, causing the useEffect to run infinitely.

## Solution

Changed the dependency array to only include `refreshTrigger`:

```typescript
useEffect(() => {
  if (refreshTrigger > 0) {
    // refetch data
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [refreshTrigger]); // ✅ Only refreshTrigger
```

This is safe because:
- `config`, `userId`, and `params` don't change during the component's lifecycle
- We only want to refetch when `refreshTrigger` changes (when user clicks Accept)
- The `eslint-disable` is intentional and documented

## Expected Behavior After Fix

1. ✅ No more infinite loop
2. ✅ useEffect only runs when refreshTrigger increments (after Accept click)
3. ✅ UI will update once after each Accept click
4. ✅ Right panel will show newly added items

## Files Modified

- `app/object/_core/chat-layout.tsx` - Fixed useEffect dependencies

## Testing

After this fix:
1. Click Accept on AUTO_ADD card
2. useEffect should run ONCE
3. Right panel should update with new item
4. No more constant refetching
