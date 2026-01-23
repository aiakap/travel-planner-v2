/**
 * Clear All Profile Graphs Script
 * 
 * This script clears all UserProfileGraph data from all users.
 * USE WITH CAUTION - This will delete all profile graph data!
 * 
 * Usage:
 *   npx tsx scripts/clear-all-profile-graphs.ts
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function clearAllProfileGraphs() {
  console.log('🗑️  Starting profile graph cleanup...\n');

  try {
    // Count existing profile graphs
    const count = await prisma.userProfileGraph.count();
    console.log(`📊 Found ${count} profile graph(s) to clear\n`);

    if (count === 0) {
      console.log('✅ No profile graphs found. Nothing to clear.');
      return;
    }

    // Get all profile graphs with user info for logging
    const graphs = await prisma.userProfileGraph.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    console.log('📋 Profile graphs to be cleared:');
    graphs.forEach((graph, index) => {
      console.log(`   ${index + 1}. ${graph.user.name || 'Unknown'} (${graph.user.email})`);
    });
    console.log('');

    // Delete all profile graphs
    const result = await prisma.userProfileGraph.deleteMany({});
    
    console.log(`✅ Successfully cleared ${result.count} profile graph(s)\n`);
    console.log('🎉 All profile graphs have been reset to blank state!');
    console.log('   Users can now start fresh at /profile/graph\n');

  } catch (error) {
    console.error('❌ Error clearing profile graphs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
clearAllProfileGraphs()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
