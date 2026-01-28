# Timeline Conflict Handling - Fixed

## Issue

1. Runtime error: `dateConflicts is not defined`
2. Malformed trip with overlapping segment dates

## Root Cause

When replacing the conflict resolution modal with the interactive timeline, some old code referencing `dateConflicts` was left in the segment edit page, causing a runtime error.

## Fix Applied

### 1. Removed Old Conflict Panel

**Before** (lines 460-480):
```tsx
{dateConflicts && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
    <AlertCircle />
    <p>{dateConflicts.message}</p>
    <ul>
      {dateConflicts.suggestions.map(...)}
    </ul>
  </div>
)}
```

**After**:
```tsx
{showTimeline && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
    <p className="text-xs text-blue-700">
      💡 Use the timeline below to adjust segment dates and resolve any conflicts
    </p>
  </div>
)}
```

### 2. Added Timeline Toggle Button

Added a "Show/Hide Timeline" button next to the "Dates" label:

```tsx
<div className="flex items-center justify-between mb-2">
  <label>Dates</label>
  <button onClick={() => setShowTimeline(!showTimeline)}>
    {showTimeline ? 'Hide' : 'Show'} Timeline
  </button>
</div>
```

## How to Handle Malformed Trips

If you have a trip with overlapping segments, here's how to fix it:

### Option 1: Use the Interactive Timeline (Recommended)

1. **Open the segment edit page** for any segment in the malformed trip
2. **Click "Show Timeline"** button next to the Dates label
3. **Use the timeline to fix conflicts**:
   - **Drag segment edges** to resize and eliminate overlaps
   - **Drag segment bodies** to move segments
   - **Use lock/unlock** toggle to control behavior:
     - 🔒 **Locked**: Adjusts neighbors to fit within trip dates
     - 🔓 **Unlocked**: Extends trip dates as needed
4. **Click "Save Changes"** to persist the fixes

### Option 2: Manual Date Adjustment

1. **Open each overlapping segment**
2. **Manually adjust dates** using the date pickers
3. **Save each segment** individually

### Option 3: Database Fix (Advanced)

If you have many malformed trips, you can fix them via database:

```sql
-- Find overlapping segments
SELECT 
  t.id as trip_id,
  t.name as trip_name,
  s1.id as segment1_id,
  s1.name as segment1_name,
  s1.start_time as seg1_start,
  s1.end_time as seg1_end,
  s2.id as segment2_id,
  s2.name as segment2_name,
  s2.start_time as seg2_start,
  s2.end_time as seg2_end
FROM "Segment" s1
JOIN "Segment" s2 ON s1.trip_id = s2.trip_id
JOIN "Trip" t ON s1.trip_id = t.id
WHERE s1.order < s2.order
  AND s1.end_time > s2.start_time
ORDER BY t.id, s1.order;
```

## Timeline Features for Conflict Resolution

### Visual Indicators

The timeline shows:
- **Segment positions**: Proportional to trip duration
- **Segment colors**: 8 distinct colors for easy identification
- **Alternating labels**: Above/below to prevent crowding
- **Hover tooltips**: Full segment details

### Interaction Methods

1. **Drag Edges**: Resize segment duration
   - Left edge: Adjust start date
   - Right edge: Adjust end date
   - Minimum: 1 day

2. **Drag Body**: Move entire segment
   - Maintains duration
   - Shifts both start and end dates

3. **Move Arrows**: Precise 1-day adjustments
   - ← Left: Move earlier
   - → Right: Move later

4. **Lock Toggle**: Control trip date behavior
   - 🔒 Locked: Trip dates fixed, neighbors adjust
   - 🔓 Unlocked: Trip dates extend/shrink

### Conflict Prevention

The timeline automatically:
- **Prevents overlaps**: Can't drag segments over each other
- **Enforces minimum duration**: Segments must be at least 1 day
- **Respects boundaries**: Locked mode keeps segments within trip dates
- **Adjusts neighbors**: Locked mode redistributes days between segments

## Example: Fixing Overlapping Segments

**Problem**: 
- Segment 1: Dec 1-5 (5 days)
- Segment 2: Dec 4-8 (5 days) ← Overlaps!
- Trip: Dec 1-10

**Solution using Timeline**:

### Method 1: Resize Segment 1
1. Show timeline
2. Drag Segment 1's right edge left to Dec 3
3. Result: Seg 1 (Dec 1-3), Seg 2 (Dec 4-8) ✓

### Method 2: Move Segment 2
1. Show timeline
2. Drag Segment 2's body right
3. Result: Seg 1 (Dec 1-5), Seg 2 (Dec 6-10) ✓

### Method 3: Extend Trip (Unlocked)
1. Show timeline
2. Toggle to 🔓 Unlocked
3. Drag Segment 2's right edge right
4. Result: Seg 1 (Dec 1-5), Seg 2 (Dec 4-8), Trip (Dec 1-8) ✓

## Benefits

1. **Visual Feedback**: See conflicts immediately
2. **Direct Manipulation**: Fix issues by dragging
3. **Flexible Solutions**: Multiple ways to resolve
4. **Safe Operations**: Prevents invalid states
5. **Immediate Results**: Changes visible in real-time

## Testing

To verify the fix:

1. ✅ Navigate to segment edit page
2. ✅ No runtime error about `dateConflicts`
3. ✅ "Show Timeline" button visible
4. ✅ Clicking button toggles timeline
5. ✅ Timeline displays all segments
6. ✅ Can drag segments to fix overlaps
7. ✅ Changes persist on save

## Related Files

- `app/segment/[id]/edit/client.tsx` - Fixed conflict panel reference
- `components/interactive-timeline-slider.tsx` - Timeline component

## Conclusion

The runtime error has been fixed by removing the old conflict panel code. The interactive timeline now provides a visual, intuitive way to identify and resolve date conflicts in malformed trips.
