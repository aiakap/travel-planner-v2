/**
 * Script to verify wall clock fields are populated correctly
 */

import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Verifying wall clock fields...\n");

  // Check Segments
  console.log("=== SEGMENTS ===");
  const segments = await prisma.$queryRaw<any[]>`
    SELECT 
      id,
      name,
      "startTime" as utc_start,
      "startTimeZoneId" as tz,
      "wall_start_date",
      "endTime" as utc_end,
      "endTimeZoneId" as end_tz,
      "wall_end_date"
    FROM "Segment"
    WHERE "startTime" IS NOT NULL
    LIMIT 5;
  `;

  segments.forEach((seg, i) => {
    console.log(`\nSegment ${i + 1}:`);
    console.log(`  Name: ${seg.name}`);
    console.log(`  UTC Start: ${seg.utc_start}`);
    console.log(`  Timezone: ${seg.tz}`);
    console.log(`  Wall Start Date: ${seg.wall_start_date}`);
    console.log(`  UTC End: ${seg.utc_end}`);
    console.log(`  End Timezone: ${seg.end_tz}`);
    console.log(`  Wall End Date: ${seg.wall_end_date}`);
  });

  // Check Reservations
  console.log("\n\n=== RESERVATIONS ===");
  const reservations = await prisma.$queryRaw<any[]>`
    SELECT 
      id,
      name,
      "startTime" as utc_start,
      "timeZoneId" as tz,
      "wall_start_date",
      "wall_start_time",
      "endTime" as utc_end,
      "wall_end_date",
      "wall_end_time"
    FROM "Reservation"
    WHERE "startTime" IS NOT NULL
    LIMIT 5;
  `;

  reservations.forEach((res, i) => {
    console.log(`\nReservation ${i + 1}:`);
    console.log(`  Name: ${res.name}`);
    console.log(`  UTC Start: ${res.utc_start}`);
    console.log(`  Timezone: ${res.tz}`);
    console.log(`  Wall Start Date: ${res.wall_start_date}`);
    console.log(`  Wall Start Time: ${res.wall_start_time}`);
    console.log(`  UTC End: ${res.utc_end}`);
    console.log(`  Wall End Date: ${res.wall_end_date}`);
    console.log(`  Wall End Time: ${res.wall_end_time}`);
  });

  // Summary
  console.log("\n\n=== SUMMARY ===");
  const segmentStats = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as total,
      COUNT("wall_start_date") as with_start_date,
      COUNT("wall_end_date") as with_end_date
    FROM "Segment";
  `;
  console.log(`Segments: ${segmentStats[0].total} total, ${segmentStats[0].with_start_date} with start date, ${segmentStats[0].with_end_date} with end date`);

  const reservationStats = await prisma.$queryRaw<any[]>`
    SELECT 
      COUNT(*) as total,
      COUNT("wall_start_date") as with_start_date,
      COUNT("wall_start_time") as with_start_time,
      COUNT("wall_end_date") as with_end_date,
      COUNT("wall_end_time") as with_end_time
    FROM "Reservation";
  `;
  console.log(`Reservations: ${reservationStats[0].total} total, ${reservationStats[0].with_start_date} with start date, ${reservationStats[0].with_start_time} with start time`);

  console.log("\n✅ Verification complete!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
