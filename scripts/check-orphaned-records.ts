import { PrismaClient } from "../app/generated/prisma/client.js";

const prisma = new PrismaClient();

async function checkOrphanedRecords() {
  console.log("🔍 Checking for orphaned records...\n");

  // Check for orphaned segments (segments without a valid trip)
  const orphanedSegments = await prisma.$queryRaw<Array<{ id: string; name: string; tripId: string }>>`
    SELECT s.id, s.name, s."tripId"
    FROM "Segment" s
    LEFT JOIN "Trip" t ON s."tripId" = t.id
    WHERE t.id IS NULL
  `;

  // Check for orphaned reservations (reservations without a valid segment)
  const orphanedReservations = await prisma.$queryRaw<Array<{ id: string; name: string; segmentId: string }>>`
    SELECT r.id, r.name, r."segmentId"
    FROM "Reservation" r
    LEFT JOIN "Segment" s ON r."segmentId" = s.id
    WHERE s.id IS NULL
  `;

  // Results
  console.log("📊 ORPHANED SEGMENTS:");
  if (orphanedSegments.length === 0) {
    console.log("✅ No orphaned segments found!");
  } else {
    console.log(`❌ Found ${orphanedSegments.length} orphaned segment(s):`);
    orphanedSegments.forEach(seg => {
      console.log(`   - ID: ${seg.id}, Name: ${seg.name}, TripID: ${seg.tripId}`);
    });
  }

  console.log("\n📊 ORPHANED RESERVATIONS:");
  if (orphanedReservations.length === 0) {
    console.log("✅ No orphaned reservations found!");
  } else {
    console.log(`❌ Found ${orphanedReservations.length} orphaned reservation(s):`);
    orphanedReservations.forEach(res => {
      console.log(`   - ID: ${res.id}, Name: ${res.name}, SegmentID: ${res.segmentId}`);
    });
  }

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📝 SUMMARY:");
  console.log(`   Total orphaned segments: ${orphanedSegments.length}`);
  console.log(`   Total orphaned reservations: ${orphanedReservations.length}`);
  
  if (orphanedSegments.length > 0 || orphanedReservations.length > 0) {
    console.log("\n⚠️  Would you like to clean up these orphaned records?");
    console.log("   Run: npm run cleanup-orphaned-records");
  } else {
    console.log("\n✨ Database is clean! No orphaned records found.");
  }

  await prisma.$disconnect();
}

checkOrphanedRecords()
  .catch((error) => {
    console.error("Error checking orphaned records:", error);
    process.exit(1);
  });
