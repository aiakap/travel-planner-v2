import { PrismaClient } from "../app/generated/prisma/client.js";

const prisma = new PrismaClient();

async function cleanupOrphanedRecords() {
  console.log("🧹 Starting cleanup of orphaned records...\n");

  try {
    // Delete orphaned reservations (reservations without a valid segment)
    const deletedReservations = await prisma.$executeRaw`
      DELETE FROM "Reservation"
      WHERE "segmentId" NOT IN (SELECT id FROM "Segment")
    `;

    console.log(`🗑️  Deleted ${deletedReservations} orphaned reservation(s)`);

    // Delete orphaned segments (segments without a valid trip)
    const deletedSegments = await prisma.$executeRaw`
      DELETE FROM "Segment"
      WHERE "tripId" NOT IN (SELECT id FROM "Trip")
    `;

    console.log(`🗑️  Deleted ${deletedSegments} orphaned segment(s)`);

    console.log("\n" + "=".repeat(50));
    console.log("✅ CLEANUP COMPLETE!");
    console.log(`   Removed ${deletedSegments} orphaned segment(s)`);
    console.log(`   Removed ${deletedReservations} orphaned reservation(s)`);
    console.log("\n💡 Run check-orphaned-records again to verify cleanup.");

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedRecords()
  .catch((error) => {
    console.error("Cleanup failed:", error);
    process.exit(1);
  });
