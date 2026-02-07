# Local Time Refactor - Complete

> **This is the authoritative reference for date handling in the travel planner.**
> See also: `.cursor/rules/date-handling.md` for Cursor-enforced rules.

## Overview

This refactor introduces a new date/time handling philosophy for the travel planner application. Instead of converting all times to UTC and back, we now store local "wall clock" times directly in the database with timezone context.

**Philosophy**: "What you see is what you store" - dates are stored exactly as the user sees them, eliminating complex timezone conversions and the bugs that come with them.

**Key Rule**: Wall dates are the source of truth. UTC fields are system-managed and only used for sorting.

## Problem Solved

Previously, dates were:
1. Entered by user (e.g., "Jan 29, 2026")
2. Converted to UTC with arbitrary time (12:01 AM local → UTC)
3. Stored in database as UTC
4. Converted back to local time for display

This caused issues with:
- Date shifting across timezones (Jan 29 becoming Jan 28 or Jan 30)
- Complex conversion logic prone to bugs
- Difficulty debugging date issues
- DST edge cases

## New Approach

Now dates are:
1. Entered by user (e.g., "Jan 29, 2026")
2. Stored directly as `wall_start_date = 2026-01-29` + `timeZoneId = "America/Los_Angeles"`
3. Displayed directly from storage (no conversion needed)
4. UTC time auto-calculated separately for sorting/filtering

## New Files

### `lib/types/local-time.ts`

TypeScript interfaces for local time data:

- `LocalDateTime` - Represents a local date/time with timezone context
- `SegmentLocalDates` - Local date data for segments
- `ReservationLocalDates` - Local date/time data for reservations
- `SegmentLocalDateInput` / `ReservationLocalDateInput` - Input types for create/update
- `SegmentLocalDatePrismaData` / `ReservationLocalDatePrismaData` - Prisma-ready data
- `buildSegmentLocalDateData()` / `buildReservationLocalDateData()` - Helper functions

### `lib/utils/local-time.ts`

Utilities for working with local times:

| Function | Purpose |
|----------|---------|
| `localToUTC()` | Convert local time to UTC for sorting (the only conversion needed) |
| `formatLocalDate()` | Display formatting (iso, short, long, full, weekday) |
| `formatLocalTime()` | Time formatting (12h or 24h) |
| `formatLocalDateRange()` | Format date ranges like "Jan 29 - Feb 5" |
| `parseToLocalComponents()` | Parse datetime-local input |
| `toDateTimeLocal()` | Combine date and time for form inputs |
| `getLocalDayNumber()` | Extract day number from date |
| `getLocalWeekday()` | Get weekday name from date |
| `getLocalMonth()` | Get month name from date |
| `isValidTimezone()` | Validate IANA timezone identifier |
| `getLocalDateRange()` | Generate array of dates between start/end |
| `pgDateToString()` | Convert PostgreSQL DATE to YYYY-MM-DD |
| `pgTimeToString()` | Convert PostgreSQL TIME to HH:mm |
| `stringToPgDate()` | Convert YYYY-MM-DD to PostgreSQL DATE |
| `stringToPgTime()` | Convert HH:mm to PostgreSQL TIME |

## Updated Server Actions

The following server actions were updated to use `wall_*` database fields:

- `lib/actions/add-flights-to-trip.ts`
- `lib/actions/add-location.ts`
- `lib/actions/adjust-segment-dates.ts`
- `lib/actions/create-multi-city-trip.ts`
- `lib/actions/create-reservation-simple.ts`
- `lib/actions/create-reservation.ts`
- `lib/actions/create-segment.ts`
- `lib/actions/quick-add-reservation.ts`
- `lib/actions/update-persisted-segment.ts`
- `lib/actions/update-reservation-simple.ts`
- `lib/actions/update-reservation.ts`
- `lib/actions/update-segment-simple.ts`
- `lib/actions/update-segment.ts`

## Updated UI Components

- `components/ui/date-popover.tsx` - Now handles local dates without UTC conversion
- `app/view1/components/journey-view.tsx` - Updated for local date display
- `app/view1/lib/view-utils.ts` - Enhanced date utilities
- `app/reservation/[id]/edit/client.tsx` - Edit form updates
- `app/segment/[id]/edit/client.tsx` - Edit form updates

## Migration

### For New Code

Use the new utilities directly:

```typescript
import { localToUTC, formatLocalDate, pgDateToString } from '@/lib/utils/local-time';

// Writing to database
const prismaData = {
  wall_start_date: stringToPgDate('2026-01-29'),
  wall_start_time: stringToPgTime('14:30'),
  timeZoneId: 'America/Los_Angeles',
  startTime: localToUTC('2026-01-29', '14:30', 'America/Los_Angeles'), // For sorting
};

// Reading from database
const displayDate = formatLocalDate(reservation.wall_start_date, 'short'); // "Jan 29"
const displayTime = formatLocalTime(reservation.wall_start_time, '12h'); // "2:30 PM"
```

### For Existing Data

Run the migration script to populate `wall_*` fields from existing UTC data:

```bash
# Preview changes
npx ts-node scripts/migrate-to-local-time.ts --dry-run --verbose

# Apply migration
npx ts-node scripts/migrate-to-local-time.ts
```

## Deprecated Functions

The following functions in `lib/utils/date-timezone.ts` are now deprecated:

| Old Function | New Approach |
|--------------|--------------|
| `dateToUTC()` | Write to `wall_*` fields + use `localToUTC()` for UTC field |
| `utcToDate()` | Read from `wall_start_date`/`wall_end_date` with `pgDateToString()` |
| `formatTimeInTimezone()` | Read from `wall_start_time`/`wall_end_time` with `pgTimeToString()` |
| `utcToDateTimeLocal()` | Use `toDateTimeLocal()` with wall values |
| `dateTimeLocalToUTC()` | Use `parseToLocalComponents()` + `localToUTC()` |

## Database Schema

The `wall_*` fields in the database:

### Segments
- `wall_start_date` (DATE) - Local start date
- `wall_end_date` (DATE) - Local end date
- `startTimeZoneId` (VARCHAR) - Start location timezone
- `endTimeZoneId` (VARCHAR) - End location timezone

### Reservations
- `wall_start_date` (DATE) - Local start date
- `wall_start_time` (TIME) - Local start time
- `wall_end_date` (DATE) - Local end date
- `wall_end_time` (TIME) - Local end time
- `timeZoneId` (VARCHAR) - Reservation timezone

## Testing

Use the test script to verify the refactor:

```bash
npx ts-node scripts/test-local-time-refactor.ts
```

## Date Completed

February 2, 2026
