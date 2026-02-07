# Wall Clock Fields Implementation - Complete

## Overview

Wall clock date/time fields are the **primary source of truth** for Segment and Reservation dates in the database. Application code writes to wall fields, and database triggers automatically calculate UTC timestamps for sorting.

**Architecture**: Wall dates are written by code, UTC is calculated by triggers for sorting only.

## What Was Added

### Segment Model
- `wall_start_date` (DATE) - Wall clock date for segment start (SOURCE OF TRUTH)
- `wall_end_date` (DATE) - Wall clock date for segment end (SOURCE OF TRUTH)

### Reservation Model
- `wall_start_date` (DATE) - Wall clock date for reservation start (SOURCE OF TRUTH)
- `wall_start_time` (TIME) - Wall clock time for reservation start (SOURCE OF TRUTH)
- `wall_end_date` (DATE) - Wall clock date for reservation end (SOURCE OF TRUTH)
- `wall_end_time` (TIME) - Wall clock time for reservation end (SOURCE OF TRUTH)

## Data Flow

```
User Input → Application Code → wall_* fields → Database Trigger → startTime/endTime (UTC)
                                     ↓
                              (Source of Truth)
                              
Display ← Application Code ← wall_* fields
                              
Sorting ← Application Code ← startTime (UTC) ← Trigger
```

## How It Works

1. **Application writes to wall fields**: Code sets `wall_start_date`, `wall_end_date`, etc.
2. **Trigger calculates UTC**: Database trigger computes `startTime`/`endTime` from wall fields + timezone
3. **Application reads wall fields**: For display, code reads from wall fields
4. **UTC used for sorting only**: `startTime.getTime()` is the only valid use of UTC fields

## Implementation Details

### 1. Schema Changes
Updated `prisma/schema.prisma` to add the wall clock fields with PostgreSQL native types:
- `@db.Date` for date-only fields
- `@db.Time` for time-only fields
- All fields are nullable (`DateTime?`)

### 2. Database Triggers (Reversed Direction)
PostgreSQL triggers that automatically calculate UTC from wall clock fields:

**Segment Trigger**: `calculate_segment_utc()`
- Converts wall dates + timezone to UTC timestamps
- Sets `startTime` from `wall_start_date` at midnight in local timezone
- Sets `endTime` from `wall_end_date` at 23:59:59 in local timezone
- Runs before every INSERT or UPDATE

**Reservation Trigger**: `calculate_reservation_utc()`
- Converts wall dates/times + timezone to UTC timestamps
- Uses `timeZoneId` (preferred) or falls back to `departureTimezone`/`arrivalTimezone`
- Runs before every INSERT or UPDATE

### 3. Setting Up Triggers
To set up the reversed triggers (wall → UTC):
```bash
npx tsx scripts/reverse-wall-clock-triggers.ts
```

## Writing Data (Application Code)

### Segments
```typescript
import { stringToPgDate } from '@/lib/utils/local-time';

await prisma.segment.create({
  data: {
    wall_start_date: stringToPgDate('2026-01-29'),
    wall_end_date: stringToPgDate('2026-01-31'),
    startTimeZoneId: 'America/Los_Angeles',
    endTimeZoneId: 'America/Los_Angeles',
    // DO NOT set startTime/endTime - trigger will calculate them
  }
});
```

### Reservations
```typescript
import { stringToPgDate, stringToPgTime } from '@/lib/utils/local-time';

await prisma.reservation.create({
  data: {
    wall_start_date: stringToPgDate('2026-01-29'),
    wall_start_time: stringToPgTime('14:30'),
    wall_end_date: stringToPgDate('2026-01-29'),
    wall_end_time: stringToPgTime('16:00'),
    timeZoneId: 'America/Los_Angeles',
    // DO NOT set startTime/endTime - trigger will calculate them
  }
});
```

## Reading Data (Application Code)

### For Display
```typescript
import { pgDateToString, pgTimeToString } from '@/lib/utils/local-time';

const dateStr = pgDateToString(reservation.wall_start_date); // "2026-01-29"
const timeStr = pgTimeToString(reservation.wall_start_time); // "14:30"
```

### For Sorting (ONLY valid use of UTC)
```typescript
// Sort by UTC timestamp for cross-timezone ordering
reservations.sort((a, b) => 
  (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0)
);
```

## Viewing Data in Database

**Segments:**
```sql
SELECT 
  name,
  "wall_start_date" as local_date,    -- Source of truth
  "startTimeZoneId" as tz,
  "startTime" as utc_calculated       -- Auto-calculated
FROM "Segment"
LIMIT 5;
```

**Reservations:**
```sql
SELECT 
  name,
  "wall_start_date" as local_date,    -- Source of truth
  "wall_start_time" as local_time,    -- Source of truth
  "timeZoneId" as tz,
  "startTime" as utc_calculated       -- Auto-calculated
FROM "Reservation"
LIMIT 5;
```

## Rules (IMPORTANT)

### NEVER DO
- Write to `startTime` or `endTime` on Segments
- Write to `startTime` or `endTime` on Reservations
- Read from UTC fields for display
- Use `new Date("YYYY-MM-DD")` (interprets as UTC midnight)

### ALWAYS DO
- Write to wall fields (`wall_start_date`, `wall_end_date`, etc.)
- Read from wall fields for display
- Use `stringToPgDate()` / `stringToPgTime()` for writing
- Use `pgDateToString()` / `pgTimeToString()` for reading
- Only use UTC fields (`startTime`) for sorting

### Exception: Trip Model
The `Trip` model only has UTC dates (`startDate`, `endDate`) without timezone context.
These CAN be written directly by code since trips don't have location-specific timezones.

## Cursor Rules

See `.cursor/rules/date-handling.md` for comprehensive rules enforced by Cursor.

## Benefits

- **What You See Is What You Store**: No confusing timezone conversions
- **Simpler Code**: No `dateToUTC()` or `utcToDate()` calls needed
- **Fewer Bugs**: Eliminated date-shifting issues across timezones
- **Easier Debugging**: Wall dates are human-readable
- **Proper Sorting**: UTC still available for cross-timezone ordering

## Date Updated
February 8, 2026

## Status
UPDATED - Wall clock fields are now the source of truth, with reversed triggers calculating UTC.
