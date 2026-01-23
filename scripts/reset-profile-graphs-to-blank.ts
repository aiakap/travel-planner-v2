/**
 * Reset Profile Graphs to Blank Script
 * 
 * This script resets all UserProfileGraph data to blank XML (instead of deleting).
 * This preserves the records but clears all content.
 * 
 * Usage:
 *   npx tsx scripts/reset-profile-graphs-to-blank.ts
 */

import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

// Blank XML structure
const BLANK_XML = `<?xml version="1.0" encoding="UTF-8"?>
<profile>
</profile>`;

async function resetProfileGraphsToBlank() {
  console.log('🔄 Starting profile graph reset to blank...\n');

  try {
    // Count existing profile graphs
    const count = await prisma.userProfileGraph.count();
    console.log(`📊 Found ${count} profile graph(s) to reset\n`);

    if (count === 0) {
      console.log('✅ No profile graphs found. Nothing to reset.');
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

    console.log('📋 Profile graphs to be reset:');
    graphs.forEach((graph, index) => {
      console.log(`   ${index + 1}. ${graph.user.name || 'Unknown'} (${graph.user.email})`);
    });
    console.log('');

    // Reset all profile graphs to blank XML
    const result = await prisma.userProfileGraph.updateMany({
      data: {
        graphData: BLANK_XML
      }
    });
    
    console.log(`✅ Successfully reset ${result.count} profile graph(s) to blank\n`);
    console.log('🎉 All profile graphs are now empty!');
    console.log('   Users can start fresh at /profile/graph\n');
    console.log('   Note: UserProfileGraph records still exist, just with blank data');

  } catch (error) {
    console.error('❌ Error resetting profile graphs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
resetProfileGraphsToBlank()
  .then(() => {
    console.log('✨ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
