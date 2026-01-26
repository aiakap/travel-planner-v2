# Context Card Status Bug Fix

## Issue
`Error: Cannot read properties of undefined (reading 'toLowerCase')`

The error occurred in `context-card.tsx` when trying to match the reservation status, because `data.status` was undefined.

## Root Cause
When creating a context card for a reservation, the `data.status` field can be undefined if:
- The reservation data doesn't include a status field
- The reservation is being created for the first time
- The status field is null in the database

The code attempted to call `.toLowerCase()` on undefined:
```typescript
const current = statuses.find((s: {id: string, name: string}) => 
  s.name.toLowerCase() === data.status.toLowerCase()  // ❌ data.status is undefined
);
```

## Solution
Added a safety check to handle undefined status and provide a sensible default:

```typescript
if (data.status) {
  // Match existing status
  const current = statuses.find((s: {id: string, name: string}) => 
    s.name.toLowerCase() === data.status.toLowerCase()
  );
  if (current) {
    setResStatusId(current.id);
    setResStatus(current.name);
  }
} else {
  // Set default status if none provided
  const defaultStatus = statuses.find((s: {id: string, name: string}) => 
    s.name.toLowerCase() === 'pending'
  ) || statuses[0];
  if (defaultStatus) {
    setResStatusId(defaultStatus.id);
    setResStatus(defaultStatus.name);
  }
}
```

## Behavior

### Before Fix
- ❌ App crashed with undefined error
- ❌ Context card couldn't render
- ❌ User couldn't interact with reservation chat

### After Fix
- ✅ Handles undefined status gracefully
- ✅ Sets default status to "Pending" if available
- ✅ Falls back to first available status if "Pending" doesn't exist
- ✅ Context card renders correctly
- ✅ User can update status via dropdown

## Files Modified
- **`app/exp/components/context-card.tsx`** (line ~105-128) - Added undefined check and default status logic

## Related Safety Checks
The component already had optional chaining in `getStatusColor()`:
```typescript
switch (data.status?.toLowerCase()) {  // ✅ Already safe
  case 'confirmed': return 'bg-green-50 border-green-300';
  // ...
}
```

## Testing
✅ Reservation context cards render without errors  
✅ Status dropdown shows available options  
✅ Default status is set to "Pending" when none provided  
✅ Status can be updated via dropdown  

## Status
✅ **Fixed** - Context cards now handle undefined status values gracefully.
