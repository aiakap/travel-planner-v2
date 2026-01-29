# Timezone Date Picker Fix - Complete

## Problem Description

When users selected a date (e.g., January 29th) in the segment edit page date picker, the system was saving it as the wrong date (January 28th) in the database. This occurred specifically for users in timezones behind UTC (like California/PST).

### Root Cause

The issue was in how JavaScript Date objects and ISO strings were being handled:

1. **Date Picker** returns: `"2026-01-29"` (just the date string)
2. **Client code** did: `new Date("2026-01-29").toISOString()`
3. **JavaScript interprets** `new Date("2026-01-29")` as **midnight UTC** on Jan 29
4. **When converted to ISO**: `"2026-01-29T00:00:00.000Z"` (midnight UTC)
5. **In California (UTC-8)**: Midnight UTC on Jan 29 = 4 PM PST on Jan 28

So the user sees "January 29" in the picker but the system stored "January 28 at 4 PM PST" which would display as Jan 28.

### Example Flow (Before Fix)

```
User selects: January 29, 2026
DatePopover returns: "2026-01-29"
Client creates: new Date("2026-01-29") 
  → JavaScript: "This is midnight UTC on Jan 29"
  → In PST: This is 4 PM on Jan 28
Client saves: "2026-01-29T00:00:00.000Z"
Database stores: 2026-01-29T00:00:00.000Z
Display in PST: January 28, 2026 at 4:00 PM
Result: Wrong date! ❌
```

## Solution

The fix follows a simple, human-friendly philosophy:

**"Always store in UTC, but think in local time"**

- When user selects Jan 29 → Store as **12:01 AM Jan 29** in local timezone, converted to UTC
- For end dates → Store as **11:59:59 PM** in local timezone, converted to UTC  
- For display → Convert UTC back to local timezone to show the calendar date
- This makes dates work like humans expect while keeping UTC in the database

### New Utilities

**File**: `lib/utils/date-timezone.ts`

Two main functions:

1. **`dateToUTC(dateStr, timeZoneId, isEndDate)`**
   - Takes a date string like `"2026-01-29"` and timezone ID like `"America/Los_Angeles"`
   - Converts to 12:01 AM (start) or 11:59:59 PM (end) in that timezone
   - Returns UTC ISO string
   - Example: Jan 29 start in PST → `"2026-01-29T08:01:00.000Z"` (12:01 AM PST = 8:01 AM UTC)
   - Example: Jan 29 end in PST → `"2026-01-30T07:59:59.000Z"` (11:59:59 PM PST = 7:59:59 AM UTC next day)

2. **`utcToDate(isoStr, timeZoneId)`**
   - Takes a UTC ISO string and timezone ID
   - Returns the calendar date (YYYY-MM-DD) as it appears in that timezone
   - Example: `"2026-01-29T08:01:00.000Z"` in PST → `"2026-01-29"`

### Implementation Changes

**File**: `app/segment/[id]/edit/client.tsx`

1. **Import the utilities**:
   ```typescript
   import { dateToUTC, utcToDate } from "@/lib/utils/date-timezone"
   ```

2. **Initialize state with timezone-aware dates** (UTC → Local):
   ```typescript
   const [startDate, setStartDate] = useState(
     segment.startTime 
       ? utcToDate(segment.startTime.toISOString(), segment.startTimeZoneId || undefined)
       : ""
   )
   ```

3. **Save dates with timezone awareness** (Local → UTC):
   ```typescript
   // For start dates: 12:01 AM local time
   onChange={(date) => {
     setStartDate(date)
     const isoString = date ? dateToUTC(date, locationCache.startTimeZoneId, false) : null
     save({ startTime: isoString })
     validateSegment()
   }}
   
   // For end dates: 11:59:59 PM local time
   onChange={(date) => {
     setEndDate(date)
     const isoString = date ? dateToUTC(date, endTimeZone, true) : null
     save({ endTime: isoString })
     validateSegment()
   }}
   ```

### Example Flow (After Fix)

```
User selects: January 29, 2026 (start date)
DatePopover returns: "2026-01-29"
Client calls: dateToUTC("2026-01-29", "America/Los_Angeles", false)
  → Converts: 12:01 AM PST on Jan 29 → UTC
  → Returns: "2026-01-29T08:01:00.000Z" (8:01 AM UTC)
Client saves: "2026-01-29T08:01:00.000Z"
Database stores: 2026-01-29T08:01:00.000Z (always UTC)
Display: utcToDate("2026-01-29T08:01:00.000Z", "America/Los_Angeles")
  → Converts: 8:01 AM UTC → PST
  → Returns: "2026-01-29"
Result: Correct date! ✅
```

## Key Benefits

1. **Human-Friendly**: When a user selects "January 29", it stays as January 29 regardless of timezone
2. **Always UTC Storage**: Database stores everything in UTC (industry best practice)
3. **Local Time Display**: Dates convert to the segment's location timezone for display
4. **Precise Time Boundaries**: 
   - Start dates: 12:01 AM (allows reservations after midnight)
   - End dates: 11:59:59 PM (covers the entire day)
5. **DST Handling**: Properly accounts for daylight saving time changes
6. **Consistent Round-Tripping**: Dates loaded from DB display correctly in the picker

## Testing

To verify the fix:

1. ✅ Set a segment location in California (PST/PDT timezone)
2. ✅ Verify the timezone displays in the UI (e.g., "America/Los_Angeles")
3. ✅ Select January 29, 2026 in the start date picker
4. ✅ Save and check the database - should see `2026-01-29T08:01:00.000Z`
5. ✅ Refresh the page
6. ✅ Confirm the date still shows as January 29 (not January 28)
7. ✅ Try the same with end dates - should see `11:59:59 PM` converted to UTC

## Technical Notes

### Why 12:01 AM and 11:59:59 PM?

- **12:01 AM** (not midnight): Avoids ambiguity at day boundaries and allows "midnight reservations" to fall on the correct day
- **11:59:59 PM**: Ensures the segment covers the entire day up to the last second

### Why Not Just Store Date Strings?

We could store just `"2026-01-29"` without time components, but:

- Segments contain reservations with specific times (flights at 3 PM, etc.)
- UTC storage is industry best practice for international apps
- This approach handles both calendar dates AND precise times
- Maintains flexibility for future time-based features

### Philosophy

**"Calendar dates for humans, UTC timestamps for computers"**

Users think in calendar dates ("I'll be in Paris Jan 29-31"). The system needs to:
1. Accept those dates
2. Convert them to precise UTC timestamps using the location's timezone
3. Store UTC in the database
4. Display them back as calendar dates in the location's timezone

This approach is maintainable, clear, and follows best practices.

## Related Files

- `lib/utils/date-timezone.ts` - New utility functions (dateToUTC, utcToDate)
- `lib/utils/date-timezone.test.ts` - Test file to validate conversions
- `app/segment/[id]/edit/client.tsx` - Updated to use timezone-aware conversions
- `components/ui/date-popover.tsx` - Date picker component (unchanged)
- `lib/actions/update-persisted-segment.ts` - Server action (unchanged)

## How to Test the Utilities

Run the test file to validate the conversion logic:

```bash
npx ts-node lib/utils/date-timezone.test.ts
```

Expected output shows conversions for:
- California (PST/PDT)
- New York (EST/EDT)
- UTC
- Both start dates (12:01 AM) and end dates (11:59:59 PM)

## Quick Reference

```typescript
// When saving a date selected by user:
import { dateToUTC } from "@/lib/utils/date-timezone"

const startISO = dateToUTC("2026-01-29", "America/Los_Angeles", false) // 12:01 AM
const endISO = dateToUTC("2026-01-29", "America/Los_Angeles", true)    // 11:59:59 PM

// When displaying a UTC date to user:
import { utcToDate } from "@/lib/utils/date-timezone"

const displayDate = utcToDate("2026-01-29T08:01:00.000Z", "America/Los_Angeles")
// Returns: "2026-01-29"
```

## Status

✅ **COMPLETE** - Timezone-aware date handling implemented with clear UTC storage philosophy
