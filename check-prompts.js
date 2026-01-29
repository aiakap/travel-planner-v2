const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPrompts() {
  console.log('\n=== Checking ImagePromptStyle records ===');
  const styles = await prisma.imagePromptStyle.findMany({
    orderBy: { sortOrder: 'asc' }
  });
  
  for (const style of styles) {
    console.log(`\n${style.name} (${style.slug})`);
    console.log(`  ID: ${style.id}`);
    console.log(`  Active: ${style.isActive}`);
    console.log(`  Default: ${style.isDefault}`);
    
    const prompts = await prisma.imagePrompt.findMany({
      where: { styleId: style.id },
      select: { id: true, name: true, category: true, isActive: true }
    });
    
    console.log(`  Prompts (${prompts.length}):`);
    prompts.forEach(p => {
      console.log(`    - ${p.category}: ${p.name} (active: ${p.isActive})`);
    });
  }
  
  console.log('\n=== Checking for trip category prompts ===');
  const tripPrompts = await prisma.imagePrompt.findMany({
    where: { category: 'trip', isActive: true },
    include: { style: true }
  });
  
  console.log(`\nFound ${tripPrompts.length} active trip prompts:`);
  tripPrompts.forEach(p => {
    console.log(`  - ${p.style?.name || 'NO STYLE'}: ${p.name}`);
  });
  
  await prisma.$disconnect();
}

checkPrompts().catch(console.error);
