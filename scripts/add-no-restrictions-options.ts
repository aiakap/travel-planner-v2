import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function addNoRestrictionsOptions() {
  console.log('🌱 Adding "No Restrictions" options...\n');

  try {
    // 1. Add "No Restrictions (I eat everything)" to dietary category
    const dietaryCategory = await prisma.profileCategory.findUnique({
      where: { slug: 'dietary' }
    });

    if (dietaryCategory) {
      const existingNoRestrictions = await prisma.profileCategory.findUnique({
        where: { slug: 'no-dietary-restrictions' }
      });

      if (!existingNoRestrictions) {
        await prisma.profileCategory.create({
          data: {
            name: 'No Restrictions (I eat everything)',
            slug: 'no-dietary-restrictions',
            description: 'No dietary restrictions',
            level: 2,
            sortOrder: 0,
            parentId: dietaryCategory.id,
            isActive: true
          }
        });
        console.log('✓ Added: No Restrictions (I eat everything) to Dietary');
      } else {
        console.log('⏭️  Skipped: No Restrictions option already exists in Dietary');
      }
    } else {
      console.log('⚠️  Warning: Dietary category not found');
    }

    // 2. Add "No Special Needs" to accessibility category
    // First, create the "accessibility-general" subcategory if it doesn't exist
    const accessibilityCategory = await prisma.profileCategory.findUnique({
      where: { slug: 'accessibility' }
    });

    if (accessibilityCategory) {
      let generalCategory = await prisma.profileCategory.findUnique({
        where: { slug: 'accessibility-general' }
      });

      if (!generalCategory) {
        generalCategory = await prisma.profileCategory.create({
          data: {
            name: 'General',
            slug: 'accessibility-general',
            description: 'General accessibility status',
            level: 1,
            sortOrder: 0,
            parentId: accessibilityCategory.id,
            isActive: true
          }
        });
        console.log('✓ Added: General subcategory to Accessibility');
      }

      const existingNoNeeds = await prisma.profileCategory.findUnique({
        where: { slug: 'no-accessibility-needs' }
      });

      if (!existingNoNeeds) {
        await prisma.profileCategory.create({
          data: {
            name: 'No Special Needs',
            slug: 'no-accessibility-needs',
            description: 'No accessibility requirements',
            level: 2,
            sortOrder: 0,
            parentId: generalCategory.id,
            isActive: true
          }
        });
        console.log('✓ Added: No Special Needs to Accessibility');
      } else {
        console.log('⏭️  Skipped: No Special Needs option already exists');
      }
    } else {
      console.log('⚠️  Warning: Accessibility category not found');
    }

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Error adding options:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addNoRestrictionsOptions();
