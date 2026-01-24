import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

// Valid segment types that should exist in the database
const VALID_SEGMENT_TYPES = [
  "Travel",
  "Stay",
  "Tour",
  "Retreat",
  "Road Trip",
];

async function main() {
  console.log("🔍 Starting segment type cleanup...\n");

  try {
    // Fetch all segment types from the database
    const allSegmentTypes = await prisma.segmentType.findMany({
      include: {
        _count: {
          select: { segments: true },
        },
      },
      orderBy: { name: "asc" },
    });

    console.log(`📊 Found ${allSegmentTypes.length} segment type(s) in database:\n`);

    // Separate valid and orphaned types
    const validTypes: typeof allSegmentTypes = [];
    const orphanedTypes: typeof allSegmentTypes = [];

    for (const type of allSegmentTypes) {
      if (VALID_SEGMENT_TYPES.includes(type.name)) {
        validTypes.push(type);
      } else {
        orphanedTypes.push(type);
      }
    }

    // Display valid types
    console.log("✅ Valid segment types:");
    for (const type of validTypes) {
      console.log(
        `   - ${type.name} (${type._count.segments} segment${type._count.segments !== 1 ? "s" : ""})`
      );
    }

    if (orphanedTypes.length === 0) {
      console.log("\n✨ No orphaned segment types found! Database is clean.");
      return;
    }

    // Display orphaned types
    console.log("\n⚠️  Orphaned segment types found:");
    for (const type of orphanedTypes) {
      console.log(
        `   - ${type.name} (${type._count.segments} segment${type._count.segments !== 1 ? "s" : ""})`
      );
    }

    // Process orphaned types
    console.log("\n🧹 Processing orphaned types...\n");

    let deletedCount = 0;
    let skippedCount = 0;

    for (const type of orphanedTypes) {
      if (type._count.segments > 0) {
        console.log(
          `⏭️  Skipping "${type.name}" - ${type._count.segments} segment(s) still reference it`
        );
        console.log(
          `   ⚠️  WARNING: This segment type is in use but not in the valid list!`
        );
        console.log(
          `   You may need to manually migrate these segments to a valid type.`
        );
        skippedCount++;
      } else {
        console.log(`🗑️  Deleting unused segment type: "${type.name}"`);
        await prisma.segmentType.delete({
          where: { id: type.id },
        });
        deletedCount++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📋 CLEANUP SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Valid segment types: ${validTypes.length}`);
    console.log(`🗑️  Deleted orphaned types: ${deletedCount}`);
    console.log(`⏭️  Skipped (in use): ${skippedCount}`);
    console.log("=".repeat(60));

    if (skippedCount > 0) {
      console.log(
        "\n⚠️  WARNING: Some orphaned segment types are still in use by segments."
      );
      console.log(
        "You should manually update those segments to use valid segment types."
      );
    } else if (deletedCount > 0) {
      console.log("\n✨ Database cleanup completed successfully!");
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
