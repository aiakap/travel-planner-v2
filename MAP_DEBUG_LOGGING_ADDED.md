# Map Debug Logging Added

## Summary

Added comprehensive debug logging to the trip structure map to diagnose why only the first segment is showing. The logging will help identify whether the issue is with missing coordinate data, incorrect route grouping, or rendering problems.

## Changes Made

### File: `components/trip-structure-map.tsx`

Added two `useEffect` hooks with console logging after the `routeGroups` calculation (around line 177):

#### Debug Hook 1: Route Groups Analysis
```typescript
useEffect(() => {
  console.log('=== MAP DEBUG ===');
  console.log('Total segments:', segments.length);
  console.log('Segments with locations:', segmentsWithLocations.length);
  console.log('Route groups:', routeGroups.length);
  routeGroups.forEach((group, idx) => {
    console.log(`Group ${idx}:`, {
      type: group.type,
      segmentCount: group.segments.length,
      segmentIds: group.segments.map(s => s.tempId),
      segmentNames: group.segments.map(s => s.name),
      coords: {
        start: [group.startLat, group.startLng],
        end: [group.endLat, group.endLng]
      }
    });
  });
}, [segments, segmentsWithLocations, routeGroups]);
```

This logs:
- Total number of segments
- Number of segments with location data
- Number of route groups created
- For each group: type, segment count, IDs, names, and coordinates

#### Debug Hook 2: Segment Data Analysis
```typescript
useEffect(() => {
  console.log('=== SEGMENT DATA ===');
  segments.forEach((seg, idx) => {
    console.log(`Segment ${idx}:`, {
      name: seg.name,
      order: seg.order,
      startLocation: seg.startLocation,
      endLocation: seg.endLocation,
      hasCoords: !!(seg.startLat && seg.startLng && seg.endLat && seg.endLng),
      coords: {
        start: [seg.startLat, seg.startLng],
        end: [seg.endLat, seg.endLng]
      }
    });
  });
}, [segments]);
```

This logs:
- Each segment's name and order
- Start and end location names
- Whether the segment has complete coordinate data
- The actual coordinate values

## How to Use

1. **Open the app** in your browser
2. **Navigate to** `/trips/new` page with your Japan trip
3. **Open the browser console** (F12 or Cmd+Option+I)
4. **Look for the debug output** starting with `=== MAP DEBUG ===` and `=== SEGMENT DATA ===`

## What to Look For

### Scenario A: Missing Coordinates
If you see:
```
Segment 1: { hasCoords: true, ... }
Segment 2: { hasCoords: false, coords: { start: [undefined, undefined], end: [undefined, undefined] } }
```

**This means:** The middle or return segment doesn't have location coordinates set.

**Next step:** Check the segment edit modal to ensure coordinates are being saved when locations are selected.

### Scenario B: Incorrect Grouping
If you see:
```
Route groups: 1
Group 0: { type: 'bidirectional', segmentCount: 2, segmentNames: ['Outbound Travel', 'Return Travel'] }
```

**This means:** Segments 1 and 3 are correctly grouped as bidirectional, but segment 2 (Main Stay) is missing.

**Next step:** Check if segment 2 has coordinates. If not, it's being filtered out by `segmentsWithLocations`.

### Scenario C: All Groups Present But Not Rendering
If you see:
```
Route groups: 2
Group 0: { type: 'bidirectional', segmentCount: 2, ... }
Group 1: { type: 'pin', segmentCount: 1, ... }
```

**This means:** All segments are grouped correctly, but there's a rendering issue.

**Next step:** Check the rendering logic in the `GoogleMap` component to ensure all route groups are being mapped and rendered.

### Scenario D: Coordinates Are Identical
If you see segments with the same coordinates:
```
Segment 0: { coords: { start: [37.7749, -122.4194], end: [42.8048, 140.7574] } }
Segment 1: { coords: { start: [42.8048, 140.7574], end: [42.8048, 140.7574] } }
Segment 2: { coords: { start: [42.8048, 140.7574], end: [37.7749, -122.4194] } }
```

**This means:** All segments have proper coordinates and should be rendering.

**Next step:** The issue is likely in the rendering logic or map bounds.

## Expected Console Output (Ideal Case)

For a trip with 3 segments (SF → Niseko, Niseko stay, Niseko → SF):

```
=== SEGMENT DATA ===
Segment 0: {
  name: 'Outbound Travel',
  order: 0,
  startLocation: 'San Francisco, CA, USA',
  endLocation: 'Niseko, Hokkaido, Japan',
  hasCoords: true,
  coords: { start: [37.7749, -122.4194], end: [42.8048, 140.7574] }
}
Segment 1: {
  name: 'Main Stay',
  order: 1,
  startLocation: 'Niseko, Hokkaido, Japan',
  endLocation: 'Niseko, Hokkaido, Japan',
  hasCoords: true,
  coords: { start: [42.8048, 140.7574], end: [42.8048, 140.7574] }
}
Segment 2: {
  name: 'Return Travel',
  order: 2,
  startLocation: 'Niseko, Hokkaido, Japan',
  endLocation: 'San Francisco, CA, USA',
  hasCoords: true,
  coords: { start: [42.8048, 140.7574], end: [37.7749, -122.4194] }
}

=== MAP DEBUG ===
Total segments: 3
Segments with locations: 3
Route groups: 2
Group 0: {
  type: 'bidirectional',
  segmentCount: 2,
  segmentIds: ['temp-xxx-1', 'temp-xxx-3'],
  segmentNames: ['Outbound Travel', 'Return Travel'],
  coords: { start: [37.7749, -122.4194], end: [42.8048, 140.7574] }
}
Group 1: {
  type: 'pin',
  segmentCount: 1,
  segmentIds: ['temp-xxx-2'],
  segmentNames: ['Main Stay'],
  coords: { start: [42.8048, 140.7574], end: [42.8048, 140.7574] }
}
```

## Next Steps

Once you've reviewed the console output:

1. **Share the console logs** with me so I can identify the exact issue
2. **Based on the scenario identified**, I'll implement the appropriate fix:
   - **Scenario A:** Fix coordinate saving in segment edit modal
   - **Scenario B:** Fix the filtering or grouping logic
   - **Scenario C:** Fix the rendering logic
   - **Scenario D:** Fix the map bounds calculation

## Temporary Nature

These debug logs are for diagnostic purposes only and should be removed once the issue is identified and fixed. They will be replaced with the actual fix in the next step.

## No Linter Errors

All changes pass TypeScript and ESLint checks with no errors or warnings.
