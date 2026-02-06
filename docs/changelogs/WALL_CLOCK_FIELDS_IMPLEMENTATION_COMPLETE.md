# Wall Clock Fields Implementation - Complete

## Overview

Successfully added human-readable wall clock date/time fields to the `Segment` and `Reservation` database tables. These fields are **NOT used by application code** - they exist purely for easier database inspection and ad-hoc SQL queries.

## What Was Added

### Segment Model
- `wall_start_date` (DATE) - Wall clock date for segment start
- `wall_end_date` (DATE) - Wall clock date for segment end

### Reservation Model
- `wall_start_date` (DATE) - Wall clock date for reservation start
- `wall_start_time` (TIME) - Wall clock time for reservation start
- `wall_end_date` (DATE) - Wall clock date for reservation end
- `wall_end_time` (TIME) - Wall clock time for reservation end

## Implementation Details

### 1. Schema Changes
Updated `prisma/schema.prisma` to add the new fields with PostgreSQL native types:
- `@db.Date` for date-only fields
- `@db.Time` for time-only fields
- All fields are nullable (`DateTime?`)

### 2. Database Triggers
Created PostgreSQL triggers that automatically populate wall clock fields on INSERT/UPDATE:

**Segment Trigger**: `update_segment_wall_clock()`
- Converts UTC timestamps to local dates using `startTimeZoneId` and `endTimeZoneId`
- Runs before every INSERT or UPDATE

**Reservation Trigger**: `update_reservation_wall_clock()`
- Converts UTC timestamps to local dates and times
- Uses `timeZoneId` (preferred) or falls back to `departureTimezone`/`arrivalTimezone`
- Runs before every INSERT or UPDATE

### 3. Backfill
All existing records were backfilled:
- 21 segments updated with wall clock dates
- 37 reservations updated with wall clock dates and times

## Files Modified

1. **prisma/schema.prisma** - Added wall clock fields to models
2. **prisma/migrations/20260128100000_add_wall_clock_fields/migration.sql** - Migration SQL
3. **scripts/add-wall-clock-triggers.ts** - Script to add triggers and backfill data
4. **scripts/verify-wall-clock-fields.ts** - Verification script

## Usage Examples

### Viewing Data in Database

**Segments:**
```sql
SELECT 
  name,
  "startTime" as utc_start,
  "startTimeZoneId" as tz,
  "wall_start_date"
FROM "Segment"
WHERE "startTime" IS NOT NULL
LIMIT 5;
```

**Reservations:**
```sql
SELECT 
  name,
  "startTime" as utc_start,
  "timeZoneId" as tz,
  "wall_start_date",
  "wall_start_time"
FROM "Reservation"
WHERE "startTime" IS NOT NULL
LIMIT 5;
```

### Example Output

**Before (UTC only):**
```
startTime: 2026-05-15T18:00:00.000Z
startTimeZoneId: America/Los_Angeles
```

**After (with wall clock):**
```
startTime: 2026-05-15T18:00:00.000Z
startTimeZoneId: America/Los_Angeles
wall_start_date: 2026-05-15  ← Easy to read!
wall_start_time: 11:00:00     ← Easy to read!
```

## How It Works

1. **Application writes data**: Code continues to use `startTime`, `endTime`, and timezone fields
2. **Trigger fires**: Database automatically converts UTC to local time and populates wall clock fields
3. **You inspect database**: See human-readable dates/times without mental conversion

## Maintenance

### Rebuilding Wall Clock Fields
If triggers fail or data becomes stale, re-run:
```bash
npx tsx scripts/add-wall-clock-triggers.ts
```

### Verifying Data
Check wall clock fields are correct:
```bash
npx tsx scripts/verify-wall-clock-fields.ts
```

### Removing (if needed)
To remove wall clock fields entirely:
```sql
-- Drop triggers
DROP TRIGGER IF EXISTS segment_wall_clock_trigger ON "Segment";
DROP TRIGGER IF EXISTS reservation_wall_clock_trigger ON "Reservation";

-- Drop functions
DROP FUNCTION IF EXISTS update_segment_wall_clock();
DROP FUNCTION IF EXISTS update_reservation_wall_clock();

-- Drop columns
ALTER TABLE "Segment" DROP COLUMN "wall_start_date";
ALTER TABLE "Segment" DROP COLUMN "wall_end_date";
ALTER TABLE "Reservation" DROP COLUMN "wall_start_date";
ALTER TABLE "Reservation" DROP COLUMN "wall_start_time";
ALTER TABLE "Reservation" DROP COLUMN "wall_end_date";
ALTER TABLE "Reservation" DROP COLUMN "wall_end_time";
```

Then remove the fields from `prisma/schema.prisma`.

## Benefits

✅ **Easier Debugging**: See "2026-01-29" instead of "2026-01-29T08:01:00.000Z"  
✅ **Better SQL Queries**: Filter/sort by human-readable dates  
✅ **No Code Changes**: Zero risk to application logic  
✅ **Automatic Updates**: Triggers keep fields in sync  
✅ **PostgreSQL Native**: Uses proper DATE and TIME types  

## Important Notes

- **Not used by application code**: These fields are for human inspection only
- **Automatically maintained**: Triggers update them on every INSERT/UPDATE
- **Can be removed anytime**: No application dependencies
- **Storage overhead**: Minimal (2-4 extra columns per table)

## Verification Results

```
Segments: 21 total, 21 with start date, 21 with end date
Reservations: 37 total, 37 with start date, 37 with start time
```

All existing records successfully populated with wall clock fields!

## Date Created
January 28, 2026

## Status
✅ **COMPLETE** - Wall clock fields are live and working in the database.
