/**
 * Backfill Script: Populate Timezone Data for Existing Segments
 * 
 * This script fetches timezone information for all segments that have coordinates
 * but are missing timezone data (startTimeZoneId, endTimeZoneId).
 * 
 * Usage:
 *   npx tsx scripts/backfill-segment-timezones.ts [--dry-run] [--limit=N]
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --limit=N    Only process first N segments (useful for testing)
 */

import { prisma } from "../lib/prisma";
import { getSegmentTimeZones } from "../lib/actions/timezone";

interface BackfillStats {
  total: number;
  processed: number;
  updated: number;
  skipped: number;
  errors: number;
}

async function backfillSegmentTimezones(dryRun: boolean = false, limit?: number) {
  console.log("🔍 Starting segment timezone backfill...\n");
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes will be made)" : "LIVE UPDATE"}`);
  if (limit) {
    console.log(`Limit: Processing first ${limit} segments`);
  }
  console.log("");

  const stats: BackfillStats = {
    total: 0,
    processed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Find all segments with coordinates but missing timezone data
    const segments = await prisma.segment.findMany({
      where: {
        OR: [
          { startTimeZoneId: null },
          { endTimeZoneId: null },
        ],
        AND: [
          { startLat: { not: 0 } },
          { startLng: { not: 0 } },
          { endLat: { not: 0 } },
          { endLng: { not: 0 } },
        ],
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    stats.total = segments.length;
    console.log(`📊 Found ${stats.total} segments needing timezone data\n`);

    if (stats.total === 0) {
      console.log("✅ All segments already have timezone data!");
      return stats;
    }

    // Process each segment
    for (const segment of segments) {
      stats.processed++;
      
      try {
        console.log(`[${stats.processed}/${stats.total}] Processing segment: ${segment.name}`);
        console.log(`  ID: ${segment.id}`);
        console.log(`  Start: ${segment.startTitle} (${segment.startLat}, ${segment.startLng})`);
        console.log(`  End: ${segment.endTitle} (${segment.endLat}, ${segment.endLng})`);

        // Fetch timezone information
        const timezones = await getSegmentTimeZones(
          segment.startLat,
          segment.startLng,
          segment.endLat,
          segment.endLng,
          segment.startTime || undefined,
          segment.endTime || undefined
        );

        if (!timezones.start && !timezones.end) {
          console.log(`  ⚠️  Could not fetch timezone data - skipping`);
          stats.skipped++;
          console.log("");
          continue;
        }

        console.log(`  Start TZ: ${timezones.start?.timeZoneId || "N/A"} (${timezones.start?.timeZoneName || "N/A"})`);
        console.log(`  End TZ: ${timezones.end?.timeZoneId || "N/A"} (${timezones.end?.timeZoneName || "N/A"})`);

        if (!dryRun) {
          // Update the segment with timezone data
          await prisma.segment.update({
            where: { id: segment.id },
            data: {
              startTimeZoneId: timezones.start?.timeZoneId ?? null,
              startTimeZoneName: timezones.start?.timeZoneName ?? null,
              endTimeZoneId: timezones.end?.timeZoneId ?? null,
              endTimeZoneName: timezones.end?.timeZoneName ?? null,
            },
          });
          console.log(`  ✅ Updated successfully`);
        } else {
          console.log(`  ℹ️  Would update (dry run)`);
        }

        stats.updated++;
        console.log("");

        // Rate limiting to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`  ❌ Error processing segment:`, error);
        stats.errors++;
        console.log("");
      }
    }

    // Print summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 BACKFILL SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total segments found:     ${stats.total}`);
    console.log(`Segments processed:       ${stats.processed}`);
    console.log(`Segments updated:         ${stats.updated}`);
    console.log(`Segments skipped:         ${stats.skipped}`);
    console.log(`Errors encountered:       ${stats.errors}`);
    console.log("=".repeat(60));

    if (dryRun) {
      console.log("\n💡 This was a dry run. Run without --dry-run to apply changes.");
    } else {
      console.log("\n✅ Backfill complete!");
    }

  } catch (error) {
    console.error("\n❌ Fatal error during backfill:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }

  return stats;
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const limitArg = args.find(arg => arg.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1]) : undefined;

// Run the backfill
backfillSegmentTimezones(dryRun, limit)
  .then((stats) => {
    process.exit(stats.errors > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });
