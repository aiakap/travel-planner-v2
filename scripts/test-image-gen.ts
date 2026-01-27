import { prisma } from "../lib/prisma";

async function testImageGeneration() {
  console.log("=== Testing Image Generation Setup ===\n");
  
  // 1. Check for default style
  console.log("1. Checking for default ImagePromptStyle...");
  const defaultStyle = await prisma.imagePromptStyle.findFirst({
    where: { isDefault: true, isActive: true }
  });
  
  if (!defaultStyle) {
    console.error("   ❌ No default style found!");
    const allStyles = await prisma.imagePromptStyle.findMany();
    console.log("   Available styles:", allStyles);
    return;
  }
  console.log(`   ✓ Found: ${defaultStyle.name} (${defaultStyle.id})`);
  
  // 2. Check for trip prompt
  console.log("\n2. Checking for trip prompt with default style...");
  const tripPrompt = await prisma.imagePrompt.findFirst({
    where: {
      styleId: defaultStyle.id,
      category: "trip",
      isActive: true
    },
    include: { style: true }
  });
  
  if (!tripPrompt) {
    console.error("   ❌ No trip prompt found for default style!");
    const allPrompts = await prisma.imagePrompt.findMany({
      where: { styleId: defaultStyle.id },
      select: { id: true, category: true }
    });
    console.log("   Available prompts for this style:", allPrompts);
    return;
  }
  console.log(`   ✓ Found: ${tripPrompt.name}`);
  
  // 3. Check environment
  console.log("\n3. Checking environment variables...");
  const requiredEnvVars = [
    "GOOGLE_CLOUD_PROJECT",
    "GOOGLE_CLOUD_LOCATION", 
    "IMAGE_PROVIDER"
  ];
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✓ ${envVar}: ${process.env[envVar]}`);
    } else {
      console.error(`   ❌ ${envVar}: NOT SET`);
    }
  }
  
  console.log("\n=== Test Complete ===");
}

testImageGeneration()
  .then(() => process.exit(0))
  .catch(error => {
    console.error("Test failed:", error);
    process.exit(1);
  });
