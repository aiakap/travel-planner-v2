/**
 * Migration script to update existing GitHub accounts with new fields
 * Run this after applying the schema migration
 */

import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function migrateExistingAccounts() {
  console.log("Starting account migration...\n");
  
  try {
    // Get all users with their accounts
    const users = await prisma.user.findMany({
      include: {
        accounts: true
      }
    });
    
    console.log(`Found ${users.length} users`);
    
    let updatedCount = 0;
    
    for (const user of users) {
      if (user.accounts.length === 0) {
        console.log(`⚠️  User ${user.email} has no accounts`);
        continue;
      }
      
      // Find the oldest account (first one created)
      const oldestAccount = user.accounts.sort((a, b) => 
        a.createdAt.getTime() - b.createdAt.getTime()
      )[0];
      
      // Update all accounts for this user
      for (const account of user.accounts) {
        const isPrimary = account.id === oldestAccount.id;
        
        await prisma.account.update({
          where: { id: account.id },
          data: {
            isPrimaryLogin: isPrimary,
            canLogin: true,
            syncStatus: "active",
            // Don't set lastLoginAt - let it be null until next login
          }
        });
        
        updatedCount++;
        console.log(`✓ Updated ${account.provider} account for ${user.email} (primary: ${isPrimary})`);
      }
    }
    
    console.log(`\n✅ Migration completed! Updated ${updatedCount} accounts`);
    
    // Verify migration
    const stats = await prisma.account.groupBy({
      by: ['provider', 'isPrimaryLogin', 'canLogin', 'syncStatus'],
      _count: true
    });
    
    console.log("\nAccount statistics:");
    console.table(stats);
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateExistingAccounts();
