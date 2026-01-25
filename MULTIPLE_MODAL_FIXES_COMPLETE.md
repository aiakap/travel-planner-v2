# Multiple Modal and Card Issues - Fixed

## Summary

Fixed three critical issues affecting the `/exp1` and `/exp` trip pages:
1. Hotel cards not appearing (CRITICAL BUG - wrong import path)
2. Add Reservation functionality failing silently in suggestion modal
3. Delete and Save functionality not working in reservation detail modal

## Changes Made

### 1. Fixed Hotel Card Import Path (CRITICAL)

**File**: `app/api/chat/simple/route.ts` line 10

**Problem**: The API route was importing from the wrong file that doesn't have HOTEL_RESERVATION_CARD parsing.

**Before**:
```typescript
import { parseCardsFromText } from "@/app/exp/lib/parse-card-syntax";
```

**After**:
```typescript
import { parseCardsFromText } from "@/app/exp1/lib/parse-card-syntax";
```

**Impact**: Hotel cards will now render when the AI outputs HOTEL_RESERVATION_CARD syntax.

### 2. Added Debug Logging for Card Parsing

**File**: `app/api/chat/simple/route.ts` after line 329

**Added**:
```typescript
if (cardSegments.length > 0) {
  console.log("   Card types:", cardSegments.map(s => s.type).join(", "));
}
```

**Impact**: Server logs will now show which card types were parsed, making debugging easier.

### 3. Improved Error Handling in Suggestion Modal

**Files**: 
- `components/suggestion-detail-modal.tsx`
- `app/exp1/components/suggestion-detail-modal.tsx`

**Before**: Errors were logged but not shown to user
```typescript
} catch (error) {
  console.error("Error adding to itinerary:", error);
}
```

**After**: Errors are displayed to user with alert
```typescript
} catch (error) {
  console.error("Error adding to itinerary:", error);
  alert(`Failed to add to itinerary: ${error instanceof Error ? error.message : 'Unknown error'}`);
}
```

**Impact**: Users will now see specific error messages when adding reservations fails.

### 4. Implemented onSave Callback in Reservation Modal

**Files**:
- `app/exp1/client.tsx`
- `app/exp/client.tsx`

**Before**: onSave was a TODO stub
```typescript
onSave={(reservation) => {
  // TODO: Implement save reservation
  console.log("Save reservation:", reservation)
}}
```

**After**: onSave calls updateReservationSimple server action
```typescript
onSave={async (reservation) => {
  try {
    const { updateReservationSimple } = await import("@/lib/actions/update-reservation-simple");
    await updateReservationSimple(reservation.id.toString(), {
      vendor: reservation.vendor,
      confirmationNumber: reservation.confirmationNumber,
      contactPhone: reservation.contactPhone,
      contactEmail: reservation.contactEmail,
      website: reservation.website,
      address: reservation.address,
      cost: reservation.cost,
      notes: reservation.notes,
      cancellationPolicy: reservation.cancellationPolicy,
    });
    router.refresh();
  } catch (error) {
    console.error("Error saving reservation:", error);
    alert("Failed to save reservation. Please try again.");
  }
}}
```

**Impact**: Edit functionality now saves changes to the database. The modal's auto-save hook will trigger this callback.

### 5. Fixed Delete Flow to Use Server Action

**File**: `app/exp1/client.tsx` lines 762-786

**Before**: Used API route
```typescript
const response = await fetch(`/api/reservations/${reservationId}`, {
  method: 'DELETE',
})
```

**After**: Uses deleteReservation server action (same as /manage page)
```typescript
const { deleteReservation } = await import("@/lib/actions/delete-reservation");
await deleteReservation(reservationId);
```

**Also improved error messages**:
```typescript
const errorMessage = error instanceof Error ? error.message : 'Unknown error';
alert(`Failed to delete reservation: ${errorMessage}`);
```

**Impact**: Delete functionality now uses the proven server action approach that works on /manage page.

## Testing Checklist

### Test 1: Hotel Card Rendering
- [ ] Open `/exp1`
- [ ] Paste a hotel confirmation email
- [ ] Check server logs for: "Card types: hotel_reservation_card"
- [ ] Verify hotel card appears in the chat UI
- [ ] Click a field in the card
- [ ] Verify auto-save creates reservation in database

### Test 2: Add Reservation from Suggestion Modal
- [ ] Open a trip page
- [ ] Click on a place suggestion to open modal
- [ ] Fill in details and click "Add to Itinerary"
- [ ] If it fails, verify error message is shown
- [ ] If it succeeds, verify reservation appears in timeline

### Test 3: Edit Reservation
- [ ] Open a trip page
- [ ] Click on an existing reservation to open modal
- [ ] Click "Edit" button
- [ ] Change a field (e.g., vendor name)
- [ ] Wait for auto-save indicator
- [ ] Close and reopen modal
- [ ] Verify changes were saved

### Test 4: Delete Reservation
- [ ] Open a trip page
- [ ] Click on an existing reservation to open modal
- [ ] Click "Delete" button
- [ ] Confirm deletion
- [ ] Verify reservation is removed from UI
- [ ] Refresh page to verify it's deleted from database

## Files Modified

1. `app/api/chat/simple/route.ts` - Fixed import path, added logging
2. `components/suggestion-detail-modal.tsx` - Added error handling
3. `app/exp1/components/suggestion-detail-modal.tsx` - Added error handling
4. `app/exp1/client.tsx` - Implemented onSave and fixed delete flow
5. `app/exp/client.tsx` - Implemented onSave

## Root Causes

### Hotel Card Issue
The API route was importing from `/app/exp/lib/parse-card-syntax.ts` which only parses TRIP_CARD, SEGMENT_CARD, and RESERVATION_CARD. The HOTEL_RESERVATION_CARD parsing code exists in `/app/exp1/lib/parse-card-syntax.ts` but wasn't being used.

### Modal Issues
The reservation detail modal's callbacks (onSave, onDelete) were either TODO stubs or using inconsistent approaches. The modal's auto-save hook was calling onSave, which did nothing. Delete was using an API route instead of the server action that works on /manage page.

### Suggestion Modal Issue
Errors were being caught and logged but not displayed to the user, making it impossible to diagnose why adding reservations was failing.

## Expected Outcomes

After these fixes:
- ✅ Hotel cards render when AI outputs HOTEL_RESERVATION_CARD syntax
- ✅ Add Reservation shows clear error messages if it fails
- ✅ Edit functionality saves changes to database via auto-save
- ✅ Delete functionality works using proven server action approach
- ✅ All error messages are user-friendly and informative

## Related Documentation

- `HOTEL_RESERVATION_CARD_IMPLEMENTATION.md` - Original hotel card implementation
- `HOTEL_CARD_FIX_COMPLETE.md` - Previous attempt to fix hotel card (prompt changes)
- `EXP1_API_FIX_COMPLETE.md` - JSON output format fix
- `lib/actions/delete-reservation.ts` - Server action for deleting reservations
- `lib/actions/update-reservation-simple.ts` - Server action for updating reservations
