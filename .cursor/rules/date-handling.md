# Date Handling Rules

## Core Principle

**Wall dates are the source of truth** for all date/time operations except sorting.
UTC fields (`startTime`/`endTime`) are system-managed and should **NEVER be written to by application code**.

## Architecture

| Model | Wall Fields (Code Uses) | UTC Fields (System/Sort Only) |
|-------|------------------------|------------------------------|
| **Trip** | None (UTC-only is fine) | `startDate`, `endDate` |
| **Segment** | `wall_start_date`, `wall_end_date` | `startTime`, `endTime` |
| **Reservation** | `wall_start_date`, `wall_start_time`, `wall_end_date`, `wall_end_time` | `startTime`, `endTime` |

## NEVER DO

### Writing to UTC Fields
```typescript
// ❌ FORBIDDEN - Never write to startTime/endTime on Segments or Reservations
await prisma.segment.create({
  data: {
    startTime: new Date(someDate),  // ❌ NO!
    endTime: new Date(someDate),    // ❌ NO!
  }
});

await prisma.reservation.update({
  data: {
    startTime: someDateTime,  // ❌ NO!
    endTime: someDateTime,    // ❌ NO!
  }
});
```

### Reading UTC for Display
```typescript
// ❌ FORBIDDEN - Don't read UTC fields for display
const displayDate = reservation.startTime.toISOString().split('T')[0];  // ❌ NO!
const hours = new Date(segment.startTime).getHours();  // ❌ NO!
```

### Parsing Date Strings Unsafely
```typescript
// ❌ FORBIDDEN - Interprets as UTC midnight, causes timezone shifts
const date = new Date("2026-01-29");  // ❌ NO!
```

## ALWAYS DO

### Writing Wall Fields for Segments
```typescript
import { stringToPgDate } from '@/lib/utils/local-time';

// ✅ CORRECT - Write to wall fields only
await prisma.segment.create({
  data: {
    wall_start_date: stringToPgDate('2026-01-29'),
    wall_end_date: stringToPgDate('2026-01-31'),
    startTimeZoneId: 'America/Los_Angeles',
    endTimeZoneId: 'America/Los_Angeles',
    // startTime/endTime will be auto-calculated by database trigger
  }
});
```

### Writing Wall Fields for Reservations
```typescript
import { stringToPgDate, stringToPgTime } from '@/lib/utils/local-time';

// ✅ CORRECT - Write to wall fields only
await prisma.reservation.create({
  data: {
    wall_start_date: stringToPgDate('2026-01-29'),
    wall_start_time: stringToPgTime('14:30'),
    wall_end_date: stringToPgDate('2026-01-29'),
    wall_end_time: stringToPgTime('16:00'),
    timeZoneId: 'America/Los_Angeles',
    // startTime/endTime will be auto-calculated by database trigger
  }
});
```

### Reading Wall Fields
```typescript
import { pgDateToString, pgTimeToString } from '@/lib/utils/local-time';

// ✅ CORRECT - Read from wall fields
const dateStr = pgDateToString(reservation.wall_start_date);  // "2026-01-29"
const timeStr = pgTimeToString(reservation.wall_start_time);  // "14:30"
```

### Parsing Date Parts Safely
```typescript
// ✅ CORRECT - Parse date parts to avoid UTC interpretation
const [year, month, day] = "2026-01-29".split('-').map(Number);
const date = new Date(year, month - 1, day);  // Local midnight, not UTC
```

## Sorting Exception

For sorting across timezones, you **MAY read** (never write) UTC fields:

```typescript
// ✅ ALLOWED - Reading UTC for sorting only
reservations.sort((a, b) => 
  (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0)
);

segments.sort((a, b) => 
  (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0)
);
```

This is the **ONLY** valid use of UTC fields in application code.

## Key Utilities

Import from `@/lib/utils/local-time`:

| Function | Purpose | Direction |
|----------|---------|-----------|
| `stringToPgDate(str)` | Convert "YYYY-MM-DD" to PostgreSQL DATE | Writing |
| `stringToPgTime(str)` | Convert "HH:mm" to PostgreSQL TIME | Writing |
| `pgDateToString(date)` | Convert PostgreSQL DATE to "YYYY-MM-DD" | Reading |
| `pgTimeToString(time)` | Convert PostgreSQL TIME to "HH:mm" | Reading |
| `formatLocalDate(date, format)` | Display formatting (iso, short, long, full) | Display |
| `formatLocalTime(time, format)` | Time formatting (12h or 24h) | Display |

## Database Triggers

PostgreSQL triggers automatically calculate UTC fields from wall fields:

- **Segment**: `startTime`/`endTime` calculated from `wall_start_date`/`wall_end_date` + timezone
- **Reservation**: `startTime`/`endTime` calculated from all wall fields + `timeZoneId`

You do NOT need to (and must NOT) set these fields in application code.

## Trip Dates (Exception)

The `Trip` model only has UTC date fields (`startDate`, `endDate`) without timezone context.
These ARE written directly by code since trips don't have location-specific timezones.

```typescript
// ✅ ALLOWED for Trip only
await prisma.trip.create({
  data: {
    startDate: new Date(startDateStr),
    endDate: new Date(endDateStr),
  }
});
```

## Quick Reference

| Action | Segment | Reservation | Trip |
|--------|---------|-------------|------|
| Write dates | `wall_start_date`, `wall_end_date` | `wall_start_date`, `wall_end_date` | `startDate`, `endDate` |
| Write times | N/A | `wall_start_time`, `wall_end_time` | N/A |
| Read dates | `pgDateToString(wall_start_date)` | `pgDateToString(wall_start_date)` | `startDate` |
| Read times | N/A | `pgTimeToString(wall_start_time)` | N/A |
| Sort by | `startTime.getTime()` | `startTime.getTime()` | `startDate.getTime()` |
