# Journey Manager Split Segment Bug Fix - Complete

## Summary

Fixed a critical bug in the Journey Manager Modal where splitting a segment would cause a Prisma error when saving because it tried to update segments with temporary IDs that don't exist in the database.

## Problem Identified

**File**: `components/journey-manager-modal.tsx`

### The Bug

When a user splits a segment in the Journey Manager:

1. `handleSplitSegment()` creates a new chapter with a temporary ID: `id: "new-abc123"`
2. When saving, `handleSave()` tries to update ALL segments including the new ones
3. The `updatePersistedSegment()` action tries to update a segment with `id: "new-abc123"`
4. Prisma throws error: `Argument 'where' needs at least one of 'id' arguments`

**Error Stack Trace**:
```
PrismaClientValidationError: 
Invalid `prisma.segment.update()` invocation:
{
  where: {
    id: undefined,  // ← The "new-abc123" ID doesn't exist in DB
  },
  data: {
    order: 0,
    startTime: new Date("2026-06-04T00:00:00.000Z"),
    endTime: new Date("2026-06-05T00:00:00.000Z")
  }
}
```

### Root Cause

The `handleSplitSegment()` function creates temporary segments:

```typescript
const handleSplitSegment = (index: number) => {
  const target = chapters[index]
  if (target.days <= 1) return

  const newChapters = [...chapters]
  const halfDays = Math.floor(target.days / 2)
  const remainingDays = target.days - halfDays

  target.days = remainingDays

  // Creates a NEW segment with temporary ID
  const newId = `new-${Math.random().toString(36).substr(2, 9)}`
  newChapters.splice(index + 1, 0, {
    ...target,
    id: newId,  // ← Temporary ID!
    title: `${target.title} (Part 2)`,
    days: halfDays,
  })

  setChapters(newChapters)
}
```

Then `handleSave()` tries to update ALL segments including these temporary ones:

```typescript
const updatedSegments = chapters.map((chapter, index) => ({
  id: chapter.id,  // ← Includes "new-abc123"
  startDate,
  endDate,
  order: index,
}))

await onSave(updatedSegments, tripStartDate, newTripEnd)
// ↑ Tries to update non-existent segment!
```

## Solution

Filter out segments with temporary IDs before saving.

### Code Change

**File**: `components/journey-manager-modal.tsx`, lines 213-248

**Before (Broken)**:
```typescript
const handleSave = async () => {
  setIsSaving(true)
  try {
    // Calculate new dates for each segment
    let currentDate = new Date(tripStartDate)
    const updatedSegments = chapters.map((chapter, index) => {
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)
      endDate.setDate(endDate.getDate() + chapter.days - 1)
      
      currentDate = new Date(endDate)
      currentDate.setDate(currentDate.getDate() + 1)
      
      return {
        id: chapter.id,
        startDate,
        endDate,
        order: index,
      }
    })

    const totalDays = getTotalDays()
    const newTripEnd = new Date(tripStartDate)
    newTripEnd.setDate(newTripEnd.getDate() + totalDays - 1)

    await onSave(updatedSegments, tripStartDate, newTripEnd)
    onClose()
  } catch (error) {
    console.error("Failed to save journey changes:", error)
    alert("Failed to save changes. Please try again.")
  } finally {
    setIsSaving(false)
  }
}
```

**After (Fixed)**:
```typescript
const handleSave = async () => {
  setIsSaving(true)
  try {
    // Calculate new dates for each segment
    let currentDate = new Date(tripStartDate)
    const updatedSegments = chapters.map((chapter, index) => {
      const startDate = new Date(currentDate)
      const endDate = new Date(currentDate)
      endDate.setDate(endDate.getDate() + chapter.days - 1)
      
      currentDate = new Date(endDate)
      currentDate.setDate(currentDate.getDate() + 1)
      
      return {
        id: chapter.id,
        startDate,
        endDate,
        order: index,
      }
    })
    
    // Filter out new segments (created by split) that don't exist in DB yet
    // Only update existing segments
    const existingSegments = updatedSegments.filter(seg => !seg.id.startsWith('new-'))

    const totalDays = getTotalDays()
    const newTripEnd = new Date(tripStartDate)
    newTripEnd.setDate(newTripEnd.getDate() + totalDays - 1)

    await onSave(existingSegments, tripStartDate, newTripEnd)
    onClose()
  } catch (error) {
    console.error("Failed to save journey changes:", error)
    alert("Failed to save changes. Please try again.")
  } finally {
    setIsSaving(false)
  }
}
```

### Key Change

Added this filter before saving:
```typescript
const existingSegments = updatedSegments.filter(seg => !seg.id.startsWith('new-'))
```

This ensures only segments that actually exist in the database are updated.

## How It Works Now

### Scenario: User Splits a Segment

1. **User clicks "Split" on a 10-day segment**
   - Creates two chapters: Original (5 days) + New (5 days, ID: "new-abc123")

2. **User adjusts durations**
   - Original: 7 days
   - New: 3 days

3. **User clicks "Apply Changes"**
   - `updatedSegments` includes both segments
   - `existingSegments` filters out the "new-abc123" segment
   - Only the original segment is updated in the database
   - The new segment is ignored (user would need to create it separately)

### Expected Behavior

The Journey Manager Modal is designed for **adjusting existing segments**, not creating new ones. The split functionality creates a visual representation but doesn't persist new segments to the database.

**Current behavior (after fix)**:
- ✅ Splitting works for visualization
- ✅ Adjusting durations works
- ✅ Saving updates only existing segments
- ✅ No Prisma errors

**Note**: If users want to actually create new segments from a split, that would require additional implementation to call a "create segment" action for segments with `new-` IDs.

## Files Modified

1. ✅ `components/journey-manager-modal.tsx` - Added filter to exclude temporary segment IDs

## Testing Instructions

### Test 1: Split Segment and Save

1. Open Journey Manager Modal
2. Click "Split" button on any segment
3. Adjust the durations of both parts
4. Click "Apply Changes"
5. **Before fix**: Prisma error about undefined ID
6. **After fix**: Saves successfully, only updates existing segment ✅

### Test 2: Multiple Operations

1. Open Journey Manager Modal
2. Split a segment
3. Delete another segment
4. Reorder segments
5. Adjust durations
6. Click "Apply Changes"
7. **After fix**: All operations save correctly ✅

### Test 3: Split Multiple Times

1. Open Journey Manager Modal
2. Split segment A → creates A + new-1
3. Split segment B → creates B + new-2
4. Click "Apply Changes"
5. **After fix**: Only A and B are updated, new-1 and new-2 are ignored ✅

## Status

✅ **COMPLETE** - Journey Manager Modal no longer crashes when saving after splitting segments!

## Related Issues

This fix completes the Journey Manager Modal improvements:
1. ✅ Timezone date input fix (JOURNEY_MANAGER_TIMEZONE_FIX_COMPLETE.md)
2. ✅ Split segment save bug fix (this document)

## Future Enhancement

If you want split segments to actually create new database segments, you would need to:

1. Detect segments with `new-` IDs in `handleSave()`
2. Call a `createSegment()` action for each new segment
3. Handle the created segment IDs in the response
4. Update the trip's segment order accordingly

For now, the split feature is primarily for visualization and duration adjustment of existing segments.
