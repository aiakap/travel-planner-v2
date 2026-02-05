import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function fixAccessibilityStructure() {
  console.log('🔧 Fixing accessibility category structure...\n');

  try {
    // Get the correct parent category (accessibility-mobility)
    const correctParent = await prisma.profileCategory.findUnique({
      where: { slug: 'accessibility-mobility' }
    });

    if (!correctParent) {
      console.log('❌ Could not find accessibility-mobility category');
      return;
    }

    console.log(`✓ Found correct parent: ${correctParent.name} (id: ${correctParent.id})`);

    // Check if accessibility-general already exists under the correct parent
    let generalCategory = await prisma.profileCategory.findFirst({
      where: {
        slug: 'accessibility-general',
        parentId: correctParent.id
      }
    });

    if (!generalCategory) {
      // Find the existing accessibility-general (under wrong parent)
      const existingGeneral = await prisma.profileCategory.findUnique({
        where: { slug: 'accessibility-general' }
      });

      if (existingGeneral) {
        // Move it to the correct parent
        generalCategory = await prisma.profileCategory.update({
          where: { id: existingGeneral.id },
          data: {
            parentId: correctParent.id,
            level: 1,
            sortOrder: 0
          }
        });
        console.log(`✓ Moved "General" subcategory to correct parent`);
      } else {
        // Create it under the correct parent
        generalCategory = await prisma.profileCategory.create({
          data: {
            name: 'General',
            slug: 'accessibility-general-new',
            description: 'General accessibility status',
            level: 1,
            sortOrder: 0,
            parentId: correctParent.id,
            isActive: true
          }
        });
        console.log(`✓ Created "General" subcategory under correct parent`);
      }
    } else {
      console.log(`✓ "General" subcategory already exists under correct parent`);
    }

    // Find the no-accessibility-needs option
    const noNeedsOption = await prisma.profileCategory.findUnique({
      where: { slug: 'no-accessibility-needs' }
    });

    if (noNeedsOption) {
      // Move it to be under the General category
      await prisma.profileCategory.update({
        where: { id: noNeedsOption.id },
        data: {
          parentId: generalCategory.id,
          level: 2,
          sortOrder: 0
        }
      });
      console.log(`✓ Moved "No Special Needs" to correct parent`);
    } else {
      // Create it
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
      console.log(`✓ Created "No Special Needs" option`);
    }

    // Delete the incorrectly placed "Accessibility" category (level 2 one) if it exists
    const wrongAccessibility = await prisma.profileCategory.findFirst({
      where: {
        slug: 'accessibility',
        level: 2
      }
    });

    if (wrongAccessibility) {
      await prisma.profileCategory.delete({
        where: { id: wrongAccessibility.id }
      });
      console.log(`✓ Removed incorrectly placed "Accessibility" category`);
    }

    console.log('\n✅ Fix complete!');

    // Verify the structure
    console.log('\n📋 Verifying structure...');
    const verified = await prisma.profileCategory.findUnique({
      where: { slug: 'accessibility-mobility' },
      include: {
        children: {
          orderBy: { sortOrder: 'asc' },
          include: {
            children: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    if (verified) {
      console.log(`\n${verified.name} (slug: ${verified.slug})`);
      for (const child of verified.children) {
        console.log(`  - ${child.name} (slug: ${child.slug})`);
        for (const grandchild of child.children) {
          console.log(`    - ${grandchild.name} (slug: ${grandchild.slug})`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAccessibilityStructure();
