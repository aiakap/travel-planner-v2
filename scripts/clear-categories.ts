import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function clearCategories() {
  console.log('🗑️  Clearing all profile categories...');
  
  try {
    const result = await prisma.profileCategory.deleteMany({});
    console.log(`✅ Deleted ${result.count} categories.`);
  } catch (error) {
    console.error('❌ Error clearing categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearCategories();
