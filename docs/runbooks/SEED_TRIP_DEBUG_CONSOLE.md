# Seed Trip Debug Console

## Overview

A comprehensive debugging interface for diagnosing issues with seed trip generation. Provides detailed logging, error tracking, and step-by-step visibility into the generation process.

## Access

```
http://localhost:3000/admin/seed-trips-debug
```

## Features

### 1. Real-Time Logging
- **Detailed step tracking**: See every database operation
- **Error pinpointing**: Exact location of failures
- **Performance metrics**: Generation timing
- **Data inspection**: View all intermediate data

### 2. Log Levels
- **INFO** (blue): Normal operation steps
- **SUCCESS** (green): Successful completions
- **WARNING** (orange): Non-critical issues
- **ERROR** (red): Failures with stack traces

### 3. Log Management
- **Download**: Save logs as `.log` file for analysis
- **Clear**: Reset console for new test
- **Auto-scroll**: Always see latest messages
- **Timestamp**: Every log entry timestamped

## How to Use

### Step 1: Search for User
1. Enter user email in search box
2. Click Search or press Enter
3. Select user from results

### Step 2: Generate Trip with Debug Mode
1. Click any trip size button
2. Watch real-time logs appear
3. See detailed progress through generation

### Step 3: Analyze Results
- **Success**: See summary statistics
- **Failure**: Get exact error location and data

## What Gets Logged

### Generation Start
```
[INFO] Starting generation for large trip, user: user_123
[INFO] Template loaded: Grand European Tour
  - segments: 6
  - totalReservations: 47
```

### Database Cache
```
[INFO] Loading database cache...
[INFO] Cache loaded
  - segmentTypes: 5
  - reservationTypes: 30
  - reservationStatuses: 5
```

### Segment Creation
```
[INFO] Processing segment 1/6: Flight to Amsterdam
[INFO] Creating segment with type: Travel
[INFO] Segment created: seg_abc123
```

### Reservation Creation
```
[INFO] Creating 2 reservations for segment...
[INFO]   Reservation 1/2: Flight - United Airlines UA 875
[INFO]     Looking up status: Confirmed
[INFO]     Status ID found: status_xyz
[INFO]     Determining category and type for: Flight
[INFO]     Category: Travel, Type: Flight
[INFO]     Type ID found: type_def
[INFO]     Base data built
[INFO]     Building type-specific data...
[INFO]     Specific data built
[INFO]     Creating reservation in database...
[INFO]   ✓ Reservation created: res_ghi789
```

### Completion
```
[INFO] All segments and reservations created successfully
[INFO] Transaction complete
  - tripId: trip_jkl012
  - segments: 6
  - reservations: 47
[SUCCESS] ✅ Trip generated successfully in 3245ms
```

### Error Example
```
[ERROR]   ✗ Failed to create reservation: Reservation type not found: Activity:Hike
  - type: Hike
  - status: Confirmed
  - error: [stack trace]
[ERROR] ERROR: Trip generation failed
  - error: Reservation type not found: Activity:Hike
  - stack: [full stack trace]
```

## Troubleshooting with Debug Console

### Issue: "Reservation type not found"

**What to look for in logs:**
```
[ERROR] Type not found in cache. Available types: [list]
```

**Solution:**
1. Check if type exists in seed data (`npm run seed`)
2. Verify spelling matches exactly (case-sensitive)
3. Check category:type combination

### Issue: "Segment type not found"

**What to look for in logs:**
```
[ERROR] Segment type not found: RoadTrip
```

**Solution:**
1. Check segment type name in template
2. Verify it exists in database
3. Run seed script if missing

### Issue: Transaction timeout

**What to look for in logs:**
```
[INFO] Processing segment 3/6...
[no further logs]
```

**Solution:**
1. Check for infinite loops in data
2. Verify all dates are valid
3. Look for circular references

### Issue: Invalid coordinates

**What to look for in logs:**
```
[INFO] Specific data built
  - lat: NaN
  - lng: undefined
```

**Solution:**
1. Check venue data for missing coordinates
2. Verify numbers, not strings
3. Ensure all venues have lat/lng

## Comparing with Regular Console

### Regular Console (`/admin/seed-trips`)
- **Use for**: Quick generation
- **Shows**: Success/failure only
- **Best for**: Production use

### Debug Console (`/admin/seed-trips-debug`)
- **Use for**: Troubleshooting
- **Shows**: Every step + data
- **Best for**: Development, debugging

## Log Download Format

Downloaded logs are plain text with structure:

```
[2026-01-27T10:30:45.123Z] [INFO] Starting generation for large trip
{
  "userId": "user_123",
  "email": "test@example.com"
}

[2026-01-27T10:30:45.234Z] [INFO] Template loaded: Grand European Tour
{
  "segments": 6,
  "totalReservations": 47
}

[2026-01-27T10:30:45.345Z] [ERROR] ❌ Generation failed
{
  "error": "Reservation type not found: Activity:Hike",
  "stack": "Error: Reservation type not found..."
}
```

## Performance Analysis

Use logs to analyze performance:

### Timing Breakdown
```
Total: 3245ms
├─ Cache load: 45ms
├─ Trip create: 12ms
├─ Segment 1: 234ms
│  ├─ Create: 8ms
│  └─ Reservations: 226ms (2 items)
├─ Segment 2: 1456ms
│  ├─ Create: 9ms
│  └─ Reservations: 1447ms (15 items)
...
```

### Bottleneck Identification
Look for:
- Segments with many reservations (slow)
- Repeated type lookups (cache miss)
- Large data objects (memory)

## Common Error Patterns

### Pattern 1: Missing Type
```
[ERROR] Reservation type not found: Travel:Bus
```
**Fix**: Add "Bus" to Travel category in seed data

### Pattern 2: Invalid Date
```
[ERROR] Invalid time value
```
**Fix**: Check date format in template (must be ISO string)

### Pattern 3: Missing Required Field
```
[ERROR] Null constraint violation: name
```
**Fix**: Ensure all reservations have required fields

### Pattern 4: Foreign Key Violation
```
[ERROR] Foreign key constraint failed
```
**Fix**: Verify user ID exists, check relationships

## Debug Mode API

The debug console uses the same API with `debug: true`:

```bash
curl -X POST http://localhost:3000/api/admin/seed-trips \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "tripSize": "large",
    "debug": true
  }'
```

This enables server-side console.log output visible in terminal.

## Best Practices

### 1. Start with Smaller Trips
- Test micro/small first
- Isolate issues faster
- Less data to analyze

### 2. Download Logs for Analysis
- Save before clearing
- Compare successful vs failed runs
- Share with team for help

### 3. Check Server Console Too
- Browser shows client logs
- Server shows database logs
- Both needed for full picture

### 4. Test Incrementally
- Fix one issue at a time
- Regenerate after each fix
- Verify fix before moving on

## Related Files

- `/lib/seed-data/seed-trip-generator.ts` - Generation logic with debug logging
- `/app/api/admin/seed-trips/route.ts` - API with debug mode support
- `/app/admin/seed-trips-debug/page.tsx` - Debug console UI

## Future Enhancements

- [ ] Filter logs by level
- [ ] Search logs by keyword
- [ ] Export logs to JSON
- [ ] Compare multiple runs
- [ ] Performance profiling
- [ ] Automated issue detection
- [ ] Suggested fixes for common errors

## Success Indicators

A successful generation shows:
- ✅ All segments created
- ✅ All reservations created
- ✅ No errors or warnings
- ✅ Reasonable timing (< 5 seconds)
- ✅ Correct counts in summary

## Conclusion

The debug console provides visibility into every step of trip generation, making it easy to:
- **Identify** exact failure points
- **Understand** what data is being processed
- **Fix** issues quickly with detailed context
- **Verify** fixes work correctly

**Use it whenever generation fails or behaves unexpectedly!**
