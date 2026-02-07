/**
 * Script to reverse wall clock triggers: Wall -> UTC instead of UTC -> Wall
 * 
 * This changes the data flow so that:
 * - Application code writes to wall_* fields (source of truth)
 * - Database triggers auto-calculate startTime/endTime (UTC) for sorting
 * 
 * Run with: npx tsx scripts/reverse-wall-clock-triggers.ts
 */

import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Reversing wall clock triggers (Wall -> UTC)...\n");

  // Step 1: Drop existing triggers
  console.log("1. Dropping existing triggers...");
  await prisma.$executeRaw`DROP TRIGGER IF EXISTS segment_wall_clock_trigger ON "Segment";`;
  await prisma.$executeRaw`DROP TRIGGER IF EXISTS reservation_wall_clock_trigger ON "Reservation";`;
  console.log("   ✓ Existing triggers dropped\n");

  // Step 2: Create new trigger function for Segment (Wall -> UTC)
  console.log("2. Creating Segment trigger function (Wall -> UTC)...");
  await prisma.$executeRaw`
    CREATE OR REPLACE FUNCTION calculate_segment_utc()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Calculate startTime from wall_start_date + timezone
      -- Sets to midnight in the local timezone, converted to UTC
      IF NEW."wall_start_date" IS NOT NULL AND NEW."startTimeZoneId" IS NOT NULL THEN
        NEW."startTime" := (NEW."wall_start_date"::timestamp AT TIME ZONE NEW."startTimeZoneId") AT TIME ZONE 'UTC';
      ELSIF NEW."wall_start_date" IS NOT NULL THEN
        -- Fallback: treat as UTC if no timezone
        NEW."startTime" := NEW."wall_start_date"::timestamp;
      END IF;
      
      -- Calculate endTime from wall_end_date + timezone
      -- Sets to end of day (23:59:59) in the local timezone, converted to UTC
      IF NEW."wall_end_date" IS NOT NULL AND NEW."endTimeZoneId" IS NOT NULL THEN
        NEW."endTime" := ((NEW."wall_end_date"::timestamp + INTERVAL '23 hours 59 minutes 59 seconds') AT TIME ZONE NEW."endTimeZoneId") AT TIME ZONE 'UTC';
      ELSIF NEW."wall_end_date" IS NOT NULL THEN
        -- Fallback: treat as UTC if no timezone
        NEW."endTime" := NEW."wall_end_date"::timestamp + INTERVAL '23 hours 59 minutes 59 seconds';
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  console.log("   ✓ Segment trigger function created\n");

  // Step 3: Create trigger for Segment
  console.log("3. Creating Segment trigger...");
  await prisma.$executeRaw`
    CREATE TRIGGER segment_calculate_utc_trigger
      BEFORE INSERT OR UPDATE ON "Segment"
      FOR EACH ROW
      EXECUTE FUNCTION calculate_segment_utc();
  `;
  console.log("   ✓ Segment trigger created\n");

  // Step 4: Create new trigger function for Reservation (Wall -> UTC)
  console.log("4. Creating Reservation trigger function (Wall -> UTC)...");
  await prisma.$executeRaw`
    CREATE OR REPLACE FUNCTION calculate_reservation_utc()
    RETURNS TRIGGER AS $$
    DECLARE
      start_tz TEXT;
      end_tz TEXT;
      start_datetime TIMESTAMP;
      end_datetime TIMESTAMP;
    BEGIN
      -- Determine timezone for start (prefer timeZoneId, fall back to departureTimezone)
      start_tz := COALESCE(NEW."timeZoneId", NEW."departureTimezone", 'UTC');
      
      -- Calculate startTime from wall_start_date + wall_start_time + timezone
      IF NEW."wall_start_date" IS NOT NULL THEN
        IF NEW."wall_start_time" IS NOT NULL THEN
          start_datetime := NEW."wall_start_date"::timestamp + NEW."wall_start_time"::interval;
        ELSE
          start_datetime := NEW."wall_start_date"::timestamp; -- Midnight if no time
        END IF;
        NEW."startTime" := (start_datetime AT TIME ZONE start_tz) AT TIME ZONE 'UTC';
      END IF;
      
      -- Determine timezone for end (prefer timeZoneId, fall back to arrivalTimezone)
      end_tz := COALESCE(NEW."timeZoneId", NEW."arrivalTimezone", 'UTC');
      
      -- Calculate endTime from wall_end_date + wall_end_time + timezone
      IF NEW."wall_end_date" IS NOT NULL THEN
        IF NEW."wall_end_time" IS NOT NULL THEN
          end_datetime := NEW."wall_end_date"::timestamp + NEW."wall_end_time"::interval;
        ELSE
          end_datetime := NEW."wall_end_date"::timestamp + INTERVAL '23 hours 59 minutes 59 seconds'; -- End of day if no time
        END IF;
        NEW."endTime" := (end_datetime AT TIME ZONE end_tz) AT TIME ZONE 'UTC';
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  console.log("   ✓ Reservation trigger function created\n");

  // Step 5: Create trigger for Reservation
  console.log("5. Creating Reservation trigger...");
  await prisma.$executeRaw`
    CREATE TRIGGER reservation_calculate_utc_trigger
      BEFORE INSERT OR UPDATE ON "Reservation"
      FOR EACH ROW
      EXECUTE FUNCTION calculate_reservation_utc();
  `;
  console.log("   ✓ Reservation trigger created\n");

  // Step 6: Verify existing data has wall fields populated
  console.log("6. Checking existing data...");
  
  const segmentsWithoutWall = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT COUNT(*) as count FROM "Segment" 
    WHERE "startTime" IS NOT NULL AND "wall_start_date" IS NULL;
  `;
  
  const reservationsWithoutWall = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT COUNT(*) as count FROM "Reservation" 
    WHERE "startTime" IS NOT NULL AND "wall_start_date" IS NULL;
  `;
  
  const segCount = Number(segmentsWithoutWall[0]?.count ?? 0);
  const resCount = Number(reservationsWithoutWall[0]?.count ?? 0);
  
  if (segCount > 0 || resCount > 0) {
    console.log(`   ⚠️  Found ${segCount} segments and ${resCount} reservations without wall dates`);
    console.log("   Running backfill to populate wall dates from existing UTC data...\n");
    
    // Backfill wall dates from UTC (one-time migration)
    if (segCount > 0) {
      await prisma.$executeRaw`
        UPDATE "Segment"
        SET 
          "wall_start_date" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("startTimeZoneId", 'UTC'))::date,
          "wall_end_date" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("endTimeZoneId", 'UTC'))::date
        WHERE "startTime" IS NOT NULL AND "wall_start_date" IS NULL;
      `;
      console.log(`   ✓ Backfilled ${segCount} segments`);
    }
    
    if (resCount > 0) {
      await prisma.$executeRaw`
        UPDATE "Reservation"
        SET 
          "wall_start_date" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "departureTimezone", 'UTC'))::date,
          "wall_start_time" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "departureTimezone", 'UTC'))::time,
          "wall_end_date" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "arrivalTimezone", 'UTC'))::date,
          "wall_end_time" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "arrivalTimezone", 'UTC'))::time
        WHERE "startTime" IS NOT NULL AND "wall_start_date" IS NULL;
      `;
      console.log(`   ✓ Backfilled ${resCount} reservations`);
    }
  } else {
    console.log("   ✓ All records already have wall dates populated\n");
  }

  // Step 7: Drop old trigger functions (cleanup)
  console.log("7. Cleaning up old trigger functions...");
  await prisma.$executeRaw`DROP FUNCTION IF EXISTS update_segment_wall_clock();`;
  await prisma.$executeRaw`DROP FUNCTION IF EXISTS update_reservation_wall_clock();`;
  console.log("   ✓ Old functions dropped\n");

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("✅ Wall clock triggers reversed successfully!");
  console.log("");
  console.log("New data flow:");
  console.log("  1. Application writes to wall_* fields (source of truth)");
  console.log("  2. Database trigger calculates startTime/endTime (UTC)");
  console.log("  3. UTC fields are ONLY used for sorting");
  console.log("");
  console.log("IMPORTANT: Do NOT write to startTime/endTime in application code!");
  console.log("═══════════════════════════════════════════════════════════════");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
