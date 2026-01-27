# Image Generation Recovery Tool - COMPLETE

**Date**: January 27, 2026  
**Status**: ✅ Complete

## Summary

Added a utility to the `/manage` page that identifies all trips, segments, and reservations missing images for the current user and provides an easy interface to queue image generation individually or in bulk.

## Problem Solved

After the schema migration to `ImagePromptStyle`, the Prisma client wasn't immediately regenerated in the running dev server, causing image generation to fail for newly created trips. This tool provides a recovery mechanism and ongoing utility for managing missing images.

## Implementation

### 1. Server Component Query

**File**: [`app/manage/page.tsx`](app/manage/page.tsx)

Added queries to find entities without images:

```typescript
const missingImages = {
  trips: await prisma.trip.findMany({
    where: {
      userId: session.user?.id,
      OR: [{ imageUrl: null }, { imageUrl: "" }]
    },
    select: { id: true, title: true, startDate: true, endDate: true },
    orderBy: { createdAt: 'desc' }
  }),
  
  segments: await prisma.segment.findMany({
    where: {
      trip: { userId: session.user?.id },
      OR: [{ imageUrl: null }, { imageUrl: "" }]
    },
    // ... includes trip info for context
  }),
  
  reservations: await prisma.reservation.findMany({
    where: {
      segment: { trip: { userId: session.user?.id } },
      OR: [{ imageUrl: null }, { imageUrl: "" }]
    },
    // ... includes segment and trip info for context
  })
};
```

### 2. Bulk Queue Server Action

**File**: [`lib/actions/queue-image-generation.ts`](lib/actions/queue-image-generation.ts)

Created `queueBulkImageGeneration()` function:

```typescript
export async function queueBulkImageGeneration(params: {
  tripIds?: string[];
  segmentIds?: string[];
  reservationIds?: string[];
}) {
  const results = {
    trips: { success: 0, failed: 0 },
    segments: { success: 0, failed: 0 },
    reservations: { success: 0, failed: 0 }
  };
  
  // Iterates through each array and calls appropriate queue function
  // Tracks successes and failures
  // Returns results summary
  
  return results;
}
```

### 3. Missing Images Component

**File**: [`components/missing-images-section.tsx`](components/missing-images-section.tsx) (NEW)

Created a collapsible component that:
- Shows a yellow alert banner when items are missing images
- Displays count: "X items missing images"
- Collapses/expands on click
- Contains:
  - "Generate All X Images" button (bulk action)
  - Sections for Trips, Segments, Reservations
  - Individual "Generate" button for each item
- Reloads page on success to show updated list

### 4. Integration

**File**: [`components/manage-client.tsx`](components/manage-client.tsx)

- Added `MissingImagesSection` import
- Updated `ManageClientProps` interface with `missingImages` prop
- Added component to JSX between stats overview and status filter
- Destructured `missingImages` from props

## User Interface

### Collapsed State
```
┌─────────────────────────────────────────────┐
│ ⚠ 5 items missing images              [▼]  │
└─────────────────────────────────────────────┘
```

### Expanded State
```
┌─────────────────────────────────────────────┐
│ ⚠ 5 items missing images              [▲]  │
├─────────────────────────────────────────────┤
│ [Generate All 5 Images]                     │
│                                             │
│ Trips (2)                                   │
│ • Big Euro Adventure         [Generate]     │
│ • Summer Vacation           [Generate]     │
│                                             │
│ Segments (2)                                │
│ • Paris to Rome             [Generate]     │
│   Big Euro Adventure                        │
│ • Rome to Venice            [Generate]     │
│   Big Euro Adventure                        │
│                                             │
│ Reservations (1)                            │
│ • Eiffel Tower Tour         [Generate]     │
│   Big Euro Adventure                        │
└─────────────────────────────────────────────┘
```

## User Flow

1. **Navigate to `/manage`**: User views their trips
2. **Alert appears** (if items missing images): Yellow banner shows count
3. **Click to expand**: User sees detailed list
4. **Options**:
   - Click "Generate All" → Queues all missing images at once
   - Click individual "Generate" → Queues just that item's image
5. **Loading state**: Buttons show "Queueing..." during action
6. **Success**: Page reloads, list updates (items removed as they're queued)

## Features

### Smart Filtering
- Only shows current user's entities
- Checks for both `null` and `""` (empty string) imageUrl
- Orders by creation date (most recent first)

### Context Display
- Segments show which trip they belong to
- Reservations show which trip they belong to
- Helps user identify items quickly

### Error Handling
- Individual failures don't stop bulk operations
- Errors logged to console
- User sees alert on failure

### Non-Intrusive Design
- Only appears when there are missing images
- Collapsed by default
- Yellow warning color (not error red)
- Positioned logically before trip list

## Files Modified

1. [`app/manage/page.tsx`](app/manage/page.tsx) - Added missing images query
2. [`lib/actions/queue-image-generation.ts`](lib/actions/queue-image-generation.ts) - Added bulk queue function
3. [`components/missing-images-section.tsx`](components/missing-images-section.tsx) - Created new component
4. [`components/manage-client.tsx`](components/manage-client.tsx) - Integrated component

## Technical Details

### Query Performance
- Uses selective `select` to minimize data transfer
- Includes only necessary related data (trip title, segment name)
- Indexed on `userId` for fast filtering

### Action Performance
- Bulk action processes items sequentially (not parallel)
- Prevents overwhelming the image queue
- Returns detailed results for monitoring

### State Management
- Simple loading state per item (Record<string, boolean>)
- Bulk loading state (boolean)
- No complex state - relies on page reload for updates

## Benefits

1. **Immediate Problem Solver**: Recovers from the migration issue
2. **Ongoing Utility**: Useful for any future image generation failures
3. **User-Friendly**: Simple, clear interface
4. **Flexible**: Works for trips, segments, and reservations
5. **Current User Only**: Respects multi-tenancy
6. **Non-Blocking**: Doesn't interfere with normal manage page usage

## Future Enhancements (Optional)

- Add real-time updates (polling or websockets) instead of page reload
- Show queue status (queued, processing, complete, failed)
- Add retry mechanism for failed generations
- Allow style selection when queueing
- Add batch size limits for very large bulk operations
- Add success/error toasts instead of alerts

## Testing

To test the recovery tool:

1. **Verify component appears**: 
   - Navigate to `/manage`
   - If you have trips without images, should see yellow banner

2. **Test individual generation**:
   - Expand the banner
   - Click "Generate" on a trip
   - Page should reload
   - Check that item is removed from list (or image appears)

3. **Test bulk generation**:
   - Expand the banner
   - Click "Generate All X Images"
   - Page should reload
   - All items should be queued

4. **Verify queue processor**:
   - Check image queue table in database
   - Confirm items are being processed
   - Verify images are generated and uploaded

## Root Cause Addressed

The original issue was that the Prisma client wasn't regenerated after the schema migration. This has been resolved by:
1. Running `npx prisma generate` to regenerate the client
2. Dev server picking up the new client (auto-restart)

This recovery tool provides a safety net for:
- Any trips created during the brief window when client was stale
- Future image generation failures
- Manual image regeneration needs

## Conclusion

The image generation recovery tool is now live on the `/manage` page. It provides a simple, effective way to queue image generation for any trips, segments, or reservations that are missing images. The tool is user-scoped, non-intrusive, and handles both individual and bulk operations gracefully.

---

✅ All implementation complete. Ready for use.
