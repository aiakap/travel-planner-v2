/**
 * Script to add wall clock triggers and backfill existing data
 * This script adds database triggers to automatically populate wall clock fields
 * and backfills existing records.
 */

import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting wall clock triggers and backfill...");

  // Backfill existing Segment data
  console.log("\n1. Backfilling Segment wall clock fields...");
  const segmentResult = await prisma.$executeRaw`
    UPDATE "Segment"
    SET 
      "wall_start_date" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("startTimeZoneId", 'UTC'))::date,
      "wall_end_date" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("endTimeZoneId", 'UTC'))::date
    WHERE "startTime" IS NOT NULL OR "endTime" IS NOT NULL;
  `;
  console.log(`   Updated ${segmentResult} segments`);

  // Backfill existing Reservation data
  console.log("\n2. Backfilling Reservation wall clock fields...");
  const reservationResult = await prisma.$executeRaw`
    UPDATE "Reservation"
    SET 
      "wall_start_date" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "departureTimezone", 'UTC'))::date,
      "wall_start_time" = ("startTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "departureTimezone", 'UTC'))::time,
      "wall_end_date" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "arrivalTimezone", 'UTC'))::date,
      "wall_end_time" = ("endTime" AT TIME ZONE 'UTC' AT TIME ZONE COALESCE("timeZoneId", "arrivalTimezone", 'UTC'))::time
    WHERE "startTime" IS NOT NULL OR "endTime" IS NOT NULL;
  `;
  console.log(`   Updated ${reservationResult} reservations`);

  // Create trigger function for Segment wall clock updates
  console.log("\n3. Creating Segment wall clock trigger function...");
  await prisma.$executeRaw`
    CREATE OR REPLACE FUNCTION update_segment_wall_clock()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW."startTime" IS NOT NULL AND NEW."startTimeZoneId" IS NOT NULL THEN
        NEW."wall_start_date" := (NEW."startTime" AT TIME ZONE 'UTC' AT TIME ZONE NEW."startTimeZoneId")::date;
      END IF;
      
      IF NEW."endTime" IS NOT NULL AND NEW."endTimeZoneId" IS NOT NULL THEN
        NEW."wall_end_date" := (NEW."endTime" AT TIME ZONE 'UTC' AT TIME ZONE NEW."endTimeZoneId")::date;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  console.log("   ✓ Segment trigger function created");

  // Drop trigger if it exists, then create it
  console.log("\n4. Creating Segment wall clock trigger...");
  await prisma.$executeRaw`
    DROP TRIGGER IF EXISTS segment_wall_clock_trigger ON "Segment";
  `;
  await prisma.$executeRaw`
    CREATE TRIGGER segment_wall_clock_trigger
      BEFORE INSERT OR UPDATE ON "Segment"
      FOR EACH ROW
      EXECUTE FUNCTION update_segment_wall_clock();
  `;
  console.log("   ✓ Segment trigger created");

  // Create trigger function for Reservation wall clock updates
  console.log("\n5. Creating Reservation wall clock trigger function...");
  await prisma.$executeRaw`
    CREATE OR REPLACE FUNCTION update_reservation_wall_clock()
    RETURNS TRIGGER AS $$
    DECLARE
      start_tz TEXT;
      end_tz TEXT;
    BEGIN
      -- Determine timezone for start (prefer timeZoneId, fall back to departureTimezone)
      start_tz := COALESCE(NEW."timeZoneId", NEW."departureTimezone", 'UTC');
      
      IF NEW."startTime" IS NOT NULL THEN
        NEW."wall_start_date" := (NEW."startTime" AT TIME ZONE 'UTC' AT TIME ZONE start_tz)::date;
        NEW."wall_start_time" := (NEW."startTime" AT TIME ZONE 'UTC' AT TIME ZONE start_tz)::time;
      END IF;
      
      -- Determine timezone for end (prefer timeZoneId, fall back to arrivalTimezone)
      end_tz := COALESCE(NEW."timeZoneId", NEW."arrivalTimezone", 'UTC');
      
      IF NEW."endTime" IS NOT NULL THEN
        NEW."wall_end_date" := (NEW."endTime" AT TIME ZONE 'UTC' AT TIME ZONE end_tz)::date;
        NEW."wall_end_time" := (NEW."endTime" AT TIME ZONE 'UTC' AT TIME ZONE end_tz)::time;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  console.log("   ✓ Reservation trigger function created");

  // Drop trigger if it exists, then create it
  console.log("\n6. Creating Reservation wall clock trigger...");
  await prisma.$executeRaw`
    DROP TRIGGER IF EXISTS reservation_wall_clock_trigger ON "Reservation";
  `;
  await prisma.$executeRaw`
    CREATE TRIGGER reservation_wall_clock_trigger
      BEFORE INSERT OR UPDATE ON "Reservation"
      FOR EACH ROW
      EXECUTE FUNCTION update_reservation_wall_clock();
  `;
  console.log("   ✓ Reservation trigger created");

  console.log("\n✅ Wall clock triggers and backfill complete!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
