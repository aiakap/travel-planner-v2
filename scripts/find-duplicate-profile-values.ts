/**
 * Script to find duplicate profile values in the database
 * 
 * Run with: npx tsx scripts/find-duplicate-profile-values.ts
 */

import { PrismaClient } from "@/app/generated/prisma/client";

const prisma = new PrismaClient();

async function findDuplicateProfileValues() {
  console.log("\n🔍 Searching for duplicate profile values...\n");

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
    });

    console.log(`📊 Total UserProfileValue records: ${userProfileValues.length}\n`);

    // Group by value text (case-insensitive)
    const valueGroups = new Map<string, typeof userProfileValues>();

    for (const upv of userProfileValues) {
      const normalizedValue = upv.value.value.toLowerCase().trim();
      
      if (!valueGroups.has(normalizedValue)) {
        valueGroups.set(normalizedValue, []);
      }
      valueGroups.get(normalizedValue)!.push(upv);
    }

    // Filter to only show duplicates (more than one entry)
    const duplicates = Array.from(valueGroups.entries())
      .filter(([_, entries]) => entries.length > 1)
      .sort((a, b) => b[1].length - a[1].length); // Sort by count descending

    if (duplicates.length === 0) {
      console.log("✅ No duplicate profile values found!\n");
    } else {
      console.log(`⚠️  Found ${duplicates.length} duplicate value(s):\n`);
      console.log("=".repeat(80));

      for (const [normalizedValue, entries] of duplicates) {
        console.log(`\n📝 Value: "${normalizedValue}" (${entries.length} occurrences)`);
        console.log("-".repeat(60));
        
        for (const entry of entries) {
          console.log(`  • UserProfileValue ID: ${entry.id}`);
          console.log(`    ProfileValue ID: ${entry.valueId}`);
          console.log(`    Original Value: "${entry.value.value}"`);
          console.log(`    Category: ${entry.value.category.name} (slug: ${entry.value.category.slug})`);
          console.log(`    User: ${entry.user.email}`);
          console.log(`    Added: ${entry.addedAt.toISOString()}`);
          if (entry.notes) {
            console.log(`    Notes: ${entry.notes}`);
          }
          console.log();
        }
      }
    }

    // Also show all values grouped by category for context
    console.log("\n" + "=".repeat(80));
    console.log("\n📋 All profile values by category:\n");

    const byCategory = new Map<string, typeof userProfileValues>();
    for (const upv of userProfileValues) {
      const categoryKey = `${upv.value.category.name} (${upv.value.category.slug})`;
      if (!byCategory.has(categoryKey)) {
        byCategory.set(categoryKey, []);
      }
      byCategory.get(categoryKey)!.push(upv);
    }

    const sortedCategories = Array.from(byCategory.entries()).sort((a, b) => 
      a[0].localeCompare(b[0])
    );

    for (const [category, entries] of sortedCategories) {
      console.log(`\n📁 ${category} (${entries.length} values):`);
      for (const entry of entries) {
        const isDuplicate = valueGroups.get(entry.value.value.toLowerCase().trim())!.length > 1;
        const marker = isDuplicate ? "⚠️ " : "  ";
        console.log(`${marker}• ${entry.value.value}`);
      }
    }

    console.log("\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicateProfileValues();
