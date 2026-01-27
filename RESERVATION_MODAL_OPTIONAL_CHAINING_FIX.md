# Reservation Modal Optional Chaining Fix

## Issue

Runtime error when opening reservation detail modal:
```
Error: Cannot read properties of undefined (reading 'latitude')
app/exp/components/reservation-detail-modal.tsx (104:40)
```

## Root Cause

The useEffect dependency arrays were accessing nested properties without proper optional chaining:

```typescript
// ❌ BAD - crashes if reservation is undefined
useEffect(() => {
  // ...
}, [selectedReservation?.reservation.latitude])
```

The issue: `selectedReservation?.reservation.latitude` only checks if `selectedReservation` exists, but not if `reservation` exists. If `reservation` is undefined, accessing `.latitude` throws an error.

## Solution

Added two layers of protection:

### 1. Early Return Guard (Primary Fix)

Added a guard at the top of the component's return statement:

```typescript
// Don't render if no reservation data
if (!selectedReservation?.reservation) {
  return null;
}
```

This prevents the entire component from rendering when data is missing, avoiding all downstream errors.

### 2. Optional Chaining in Dependencies (Secondary Fix)

Added proper optional chaining in useEffect dependency arrays:

```typescript
// ✅ GOOD - safely handles undefined reservation
useEffect(() => {
  // ...
}, [selectedReservation?.reservation?.latitude])
```

## Files Modified

### `app/exp/components/reservation-detail-modal.tsx`

**Added early return guard (Line 361-364):**
```typescript
if (!selectedReservation?.reservation) {
  return null;
}
```

**Fixed 3 useEffect dependency arrays:**

1. **Line 104**: Timezone lookup
   - Before: `[selectedReservation?.reservation.latitude, ...]`
   - After: `[selectedReservation?.reservation?.latitude, ...]`

2. **Line 111**: Time display formatting
   - Before: `[selectedReservation?.reservation.startTime, ...]`
   - After: `[selectedReservation?.reservation?.startTime, ...]`

3. **Line 119**: Auto-resolve on modal open
   - Before: `[selectedReservation?.reservation.id]`
   - After: `[selectedReservation?.reservation?.id]`

## Testing

The error should no longer occur when:
- Opening a reservation detail modal
- Switching between reservations
- Modal receives undefined or partial data

---

**Fixed**: January 27, 2026
**Impact**: Prevents crashes when reservation data is incomplete
