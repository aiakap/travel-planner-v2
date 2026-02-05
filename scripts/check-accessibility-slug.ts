import { PrismaClient } from '../app/generated/prisma';

const prisma = new PrismaClient();

async function checkAccessibilitySlug() {
  // Find all categories related to accessibility
  const categories = await prisma.profileCategory.findMany({
    where: {
      OR: [
        { slug: { contains: 'accessibility' } },
        { name: { contains: 'Accessibility' } }
      ]
    },
    include: {
      children: {
        include: {
          children: true
        }
      }
    }
  });

  console.log('Found accessibility categories:');
  for (const cat of categories) {
    console.log(`\n- ${cat.name} (slug: "${cat.slug}", level: ${cat.level})`);
    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        console.log(`  - ${child.name} (slug: "${child.slug}", level: ${child.level})`);
        if (child.children && child.children.length > 0) {
          for (const grandchild of child.children) {
            console.log(`    - ${grandchild.name} (slug: "${grandchild.slug}")`);
          }
        }
      }
    }
  }

  await prisma.$disconnect();
}

checkAccessibilitySlug();
