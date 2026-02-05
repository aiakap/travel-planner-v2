/**
 * Script to clean up duplicate UserProfileValue entries
 * 
 * This script finds all duplicate values (case-insensitive) per user,
 * keeps the OLDEST entry (first added), and deletes the newer duplicates.
 * 
 * Run with: npx tsx scripts/cleanup-duplicate-profile-values.ts
 * 
 * Options:
 *   --dry-run    Preview what would be deleted without actually deleting
 *   --verbose    Show detailed information about each duplicate found
 */

import { PrismaClient } from "@/app/generated/prisma/client";

const prisma = new PrismaClient();

interface DuplicateGroup {
  normalizedValue: string;
  userId: string;
  userEmail: string;
  entries: Array<{
    id: string;
    valueId: string;
    originalValue: string;
    categorySlug: string;
    categoryName: string;
    addedAt: Date;
  }>;
}

async function cleanupDuplicateProfileValues() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isVerbose = args.includes('--verbose');

  console.log("\n🧹 Profile Value Duplicate Cleanup Script");
  console.log("=".repeat(50));
  
  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  } else {
    console.log("⚠️  LIVE MODE - Duplicates will be deleted\n");
  }

  try {
    // Get all UserProfileValue records with their ProfileValue and ProfileCategory
    const userProfileValues = await prisma.userProfileValue.findMany({
      include: {
        value: {
          include: {
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: {
        addedAt: 'asc', // Order by oldest first
      },
    });

    console.log(`📊 Total UserProfileValue records: ${userProfileValues.length}\n`);

    // Group by userId + normalized value text (case-insensitive)
    const duplicateGroups: Map<string, DuplicateGroup> = new Map();

    for (const upv of userProfileValues) {
      const normalizedValue = upv.value.value.toLowerCase().trim();
      const groupKey = `${upv.userId}:${normalizedValue}`;
      
      if (!duplicateGroups.has(groupKey)) {
        duplicateGroups.set(groupKey, {
          normalizedValue,
          userId: upv.userId,
          userEmail: upv.user.email,
          entries: [],
        });
      }
      
      duplicateGroups.get(groupKey)!.entries.push({
        id: upv.id,
        valueId: upv.valueId,
        originalValue: upv.value.value,
        categorySlug: upv.value.category.slug,
        categoryName: upv.value.category.name,
        addedAt: upv.addedAt,
      });
    }

    // Filter to only groups with duplicates (more than one entry)
    const groupsWithDuplicates = Array.from(duplicateGroups.values())
      .filter(group => group.entries.length > 1);

    if (groupsWithDuplicates.length === 0) {
      console.log("✅ No duplicate profile values found! Database is clean.\n");
      return;
    }

    console.log(`⚠️  Found ${groupsWithDuplicates.length} value(s) with duplicates\n`);

    // Collect IDs to delete (all entries except the first/oldest one)
    const idsToDelete: string[] = [];
    
    for (const group of groupsWithDuplicates) {
      // Sort by addedAt to ensure oldest is first (should already be sorted)
      group.entries.sort((a, b) => a.addedAt.getTime() - b.addedAt.getTime());
      
      const [keepEntry, ...duplicateEntries] = group.entries;
      
      if (isVerbose) {
        console.log("-".repeat(50));
        console.log(`📝 Value: "${group.normalizedValue}"`);
        console.log(`   User: ${group.userEmail}`);
        console.log(`   ✅ KEEP: "${keepEntry.originalValue}" (${keepEntry.categoryName})`);
        console.log(`      Added: ${keepEntry.addedAt.toISOString()}`);
        console.log(`      ID: ${keepEntry.id}`);
        
        for (const dup of duplicateEntries) {
          console.log(`   ❌ DELETE: "${dup.originalValue}" (${dup.categoryName})`);
          console.log(`      Added: ${dup.addedAt.toISOString()}`);
          console.log(`      ID: ${dup.id}`);
        }
        console.log();
      }
      
      // Add all duplicate IDs (not the first one) to delete list
      for (const dup of duplicateEntries) {
        idsToDelete.push(dup.id);
      }
    }

    console.log("-".repeat(50));
    console.log(`\n📋 Summary:`);
    console.log(`   Total duplicate groups: ${groupsWithDuplicates.length}`);
    console.log(`   Records to keep: ${groupsWithDuplicates.length}`);
    console.log(`   Records to delete: ${idsToDelete.length}`);
    console.log();

    if (idsToDelete.length === 0) {
      console.log("✅ Nothing to clean up.\n");
      return;
    }

    if (isDryRun) {
      console.log("🔍 DRY RUN COMPLETE");
      console.log(`   Would delete ${idsToDelete.length} duplicate record(s)`);
      console.log("\n   Run without --dry-run to perform the cleanup.\n");
      
      // Show the IDs that would be deleted
      if (isVerbose) {
        console.log("   IDs that would be deleted:");
        for (const id of idsToDelete) {
          console.log(`     - ${id}`);
        }
        console.log();
      }
    } else {
      // Actually delete the duplicates
      console.log(`🗑️  Deleting ${idsToDelete.length} duplicate record(s)...`);
      
      const result = await prisma.userProfileValue.deleteMany({
        where: {
          id: { in: idsToDelete },
        },
      });

      console.log(`✅ Successfully deleted ${result.count} duplicate record(s)\n`);
      
      // Verify cleanup
      const remainingCount = await prisma.userProfileValue.count();
      console.log(`📊 Remaining UserProfileValue records: ${remainingCount}`);
      console.log(`   (was ${userProfileValues.length}, removed ${userProfileValues.length - remainingCount})\n`);
    }

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicateProfileValues();
