# Itinerary Modal Cleanup - Implementation Complete

## Summary

Successfully cleaned up both add-to-itinerary modals with improved UX, English-only content, subtle status indicators, and smart time scheduling.

## Changes Implemented

### 1. Force English Language in Google Places API ✅

**Files Modified:**
- `lib/actions/google-places.ts`
- `lib/google-places/resolve-suggestions.ts`

**Changes:**
- Added `language=en` parameter to all Google Places API calls (Text Search and Place Details)
- Ensures all place data (addresses, opening hours, etc.) returns in English

### 2. Created Status Icon Indicator Component ✅

**New File:**
- `components/status-icon-indicator.tsx`

**Features:**
- Small, subtle icon display (Lightbulb for suggested, Calendar for planned, CheckCircle for confirmed)
- Hover card shows status description
- Click to open popover with all status options
- Compact design (~16px icons) with subdued colors
- Built with Radix UI components (HoverCard + Popover)

### 3. Enhanced Smart Scheduling Durations ✅

**File Modified:**
- `lib/smart-scheduling.ts`

**New Duration Defaults:**
- Movies/Cinema: 2 hours
- Theater/Shows: 2.5 hours
- Coffee/Café: 1 hour
- Meals (general): 1.5 hours
- Shopping/Markets: 2 hours
- Spa/Wellness: 2 hours
- Museums/Galleries: 2 hours
- Tours: 3 hours

**Exported:**
- Made `getDefaultTimeForType()` function public for use in modals
- Added `getSegmentDuration()` function for hotel segment logic

### 4. Updated SuggestionDetailModal ✅

**File Modified:**
- `components/suggestion-detail-modal.tsx`

**Changes:**
- **Removed:** Street View preview section completely
- **Removed:** Large status selector dropdown
- **Added:** StatusIconIndicator next to title (small, subtle)
- **Added:** Collapsible end time section:
  - Start time always visible
  - Duration shown by default (e.g., "Duration: 2 hours")
  - "Customize end time" button to expand
  - End time field hidden by default, collapsible
- **Auto-expand:** End time automatically shown for hotels (Stay) and Travel categories
- **Hotel Logic:** For Stay category with segmentId, automatically spans entire segment duration
  - Fetches segment start/end dates
  - Sets check-in time to 15:00, check-out to 11:00
  - Updates scheduling reason to explain segment duration

### 5. Updated AddReservationModal ✅

**File Modified:**
- `components/add-reservation-modal.tsx`

**Changes:**
- **Added:** StatusIconIndicator next to modal title
- **Added:** Collapsible end time section (same as SuggestionDetailModal)
  - Duration display by default
  - "Customize end time" button
  - Collapsible end time field
- **Auto-expand:** End time automatically shown for hotels and flights (transport)
- **Smart Defaults:** Uses activity-specific durations from smart-scheduling

### 6. Hotel Segment Duration Logic ✅

**Implementation:**
- Added `getSegmentDuration()` function to fetch segment start/end dates
- SuggestionDetailModal checks if suggestion is Stay category with segmentId
- Automatically sets hotel dates to span entire segment
- Shows informative scheduling reason explaining the duration
- Falls back to trip dates if segment dates unavailable

## Technical Details

### Component Architecture

```
StatusIconIndicator (new)
├─ HoverCard (for tooltip on hover)
│  └─ Shows status name and description
└─ Popover (for status selection on click)
   └─ List of all status options with icons

SuggestionDetailModal (updated)
├─ Header: Title + StatusIconIndicator
├─ Collapsible Time Section
│  ├─ Start Time (always visible)
│  ├─ Duration Display (when collapsed)
│  └─ End Time (expandable)
└─ Smart Scheduling for Hotels

AddReservationModal (updated)
├─ Header: Title + StatusIconIndicator
└─ Collapsible Time Section (same pattern)
```

### API Changes

All Google Places API calls now include:
```typescript
searchUrl.searchParams.append("language", "en");
detailsUrl.searchParams.append("language", "en");
```

### Duration Calculation

Both modals now include shared helper functions:
```typescript
calculateDuration(start, end): number  // Returns hours
formatDuration(hours): string          // Returns formatted string
```

## User Experience Improvements

1. **Cleaner Interface:** Removed clutter (street view, large dropdowns)
2. **Subtle Status:** Small icon with hover tooltip instead of large selector
3. **Smart Defaults:** Activity-specific durations (meals, movies, etc.)
4. **Collapsible Times:** Simpler flow with option to customize
5. **English Only:** Consistent language across all place data
6. **Hotel Intelligence:** Automatically spans segment duration

## Testing Recommendations

- [ ] Verify Google Places returns English text (addresses, hours)
- [ ] Confirm street view removed from modals
- [ ] Test status icon hover tooltip shows correctly
- [ ] Test clicking status icon opens selection popover
- [ ] Verify end time is collapsed by default for activities/dining
- [ ] Verify end time is expanded by default for hotels/flights
- [ ] Test "Customize end time" button expands/collapses section
- [ ] Test hotel suggestions with segmentId span entire segment
- [ ] Verify smart durations work (meals 1.5h, movies 2h, etc.)
- [ ] Test both modals have consistent behavior

## Files Modified

1. `lib/actions/google-places.ts` - English language parameter
2. `lib/google-places/resolve-suggestions.ts` - English language parameter
3. `lib/smart-scheduling.ts` - Added getSegmentDuration, imports from scheduling-utils
4. `lib/scheduling-utils.ts` - New file with getDefaultTimeForType (pure utility)
5. `components/status-icon-indicator.tsx` - New component (created)
6. `components/suggestion-detail-modal.tsx` - UI cleanup, collapsible times, hotel logic
7. `components/add-reservation-modal.tsx` - UI cleanup, collapsible times

## Breaking Changes

None. All changes are backward compatible.

## Build Fix Applied

**Issue:** Next.js 15 requires all exported functions in files with `"use server"` to be async.

**Solution:** Moved `getDefaultTimeForType` to a new file `lib/scheduling-utils.ts` without the `"use server"` directive, since it's a pure utility function that doesn't need server-side execution. The function is now imported where needed.

## Notes

- Status icon uses Radix UI primitives (HoverCard + Popover) for accessibility
- Hotel segment duration logic only works when segmentId is available
- End time auto-expands for Stay and Travel categories for better UX
- All duration calculations maintain minute precision
- Format handles various time spans (minutes, hours, mixed)

---

**Implementation Date:** January 22, 2026
**Status:** ✅ Complete - All todos finished, no linter errors
