/**
 * Script to check ProfileValue table for duplicates
 * (same value text appearing across different categories)
 * 
 * Run with: npx tsx scripts/check-profile-value-duplicates.ts
 */

import { PrismaClient } from "@/app/generated/prisma/client";

const prisma = new PrismaClient();

async function checkProfileValueDuplicates() {
  console.log("\n🔍 Checking ProfileValue table for duplicates...\n");

  try {
    // Get all ProfileValue records with their categories
    const profileValues = await prisma.profileValue.findMany({
      include: {
        category: true,
        userValues: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        value: 'asc',
      },
    });

    console.log(`📊 Total ProfileValue records: ${profileValues.length}\n`);

    // Group by value text (case-insensitive)
    const valueGroups = new Map<string, typeof profileValues>();

    for (const pv of profileValues) {
      const normalizedValue = pv.value.toLowerCase().trim();
      
      if (!valueGroups.has(normalizedValue)) {
        valueGroups.set(normalizedValue, []);
      }
      valueGroups.get(normalizedValue)!.push(pv);
    }

    // Filter to only show duplicates (more than one entry)
    const duplicates = Array.from(valueGroups.entries())
      .filter(([_, entries]) => entries.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    if (duplicates.length === 0) {
      console.log("✅ No duplicate ProfileValue entries found!\n");
    } else {
      console.log(`⚠️  Found ${duplicates.length} duplicate value(s):\n`);
      console.log("=".repeat(80));

      for (const [normalizedValue, entries] of duplicates) {
        console.log(`\n📝 Value: "${normalizedValue}" (${entries.length} occurrences)`);
        console.log("-".repeat(60));
        
        for (const entry of entries) {
          console.log(`  • ProfileValue ID: ${entry.id}`);
          console.log(`    Original Value: "${entry.value}"`);
          console.log(`    Category: ${entry.category.name} (slug: ${entry.category.slug})`);
          console.log(`    Used by ${entry.userValues.length} user(s)`);
          if (entry.userValues.length > 0) {
            for (const uv of entry.userValues) {
              console.log(`      - ${uv.user.email}`);
            }
          }
          console.log();
        }
      }
    }

    // Show summary by category
    console.log("\n" + "=".repeat(80));
    console.log("\n📋 ProfileValue count by category:\n");

    const categoryCounts = new Map<string, number>();
    for (const pv of profileValues) {
      const key = `${pv.category.name} (${pv.category.slug})`;
      categoryCounts.set(key, (categoryCounts.get(key) || 0) + 1);
    }

    const sortedCategories = Array.from(categoryCounts.entries()).sort((a, b) => 
      b[1] - a[1]
    );

    for (const [category, count] of sortedCategories) {
      console.log(`  📁 ${category}: ${count} values`);
    }

    console.log("\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfileValueDuplicates();
