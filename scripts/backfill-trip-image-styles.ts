/**
 * Backfill imagePromptStyleId for existing trips
 * 
 * Strategy:
 * 1. If trip has imagePromptId, get that prompt's styleId and set it
 * 2. If no imagePromptId, set to default style (where isDefault: true)
 */

import { prisma } from "../lib/prisma";

async function backfillTripImageStyles() {
  console.log("Starting backfill of trip image styles...\n");

  // Get the default style
  const defaultStyle = await prisma.imagePromptStyle.findFirst({
    where: { isDefault: true, isActive: true },
  });

  if (!defaultStyle) {
    throw new Error("No default style found! Please seed the database first.");
  }

  console.log(`Default style: ${defaultStyle.name} (${defaultStyle.id})\n`);

  // Get all trips
  const trips = await prisma.trip.findMany({
    include: {
      imagePrompt: {
        include: {
          style: true,
        },
      },
    },
  });

  console.log(`Found ${trips.length} trips to process\n`);

  let updatedWithPromptStyle = 0;
  let updatedWithDefaultStyle = 0;
  let alreadySet = 0;

  for (const trip of trips) {
    // Skip if already has a style set
    if (trip.imagePromptStyleId) {
      alreadySet++;
      continue;
    }

    let styleIdToSet: string;

    if (trip.imagePrompt?.style) {
      // Use the style from the existing prompt
      styleIdToSet = trip.imagePrompt.style.id;
      updatedWithPromptStyle++;
      console.log(
        `Trip "${trip.title}" - Setting style from prompt: ${trip.imagePrompt.style.name}`
      );
    } else {
      // Use default style
      styleIdToSet = defaultStyle.id;
      updatedWithDefaultStyle++;
      console.log(
        `Trip "${trip.title}" - Setting default style: ${defaultStyle.name}`
      );
    }

    await prisma.trip.update({
      where: { id: trip.id },
      data: { imagePromptStyleId: styleIdToSet },
    });
  }

  console.log("\n✅ Backfill complete!");
  console.log(`   - Already had style set: ${alreadySet}`);
  console.log(
    `   - Updated with style from prompt: ${updatedWithPromptStyle}`
  );
  console.log(`   - Updated with default style: ${updatedWithDefaultStyle}`);
  console.log(`   - Total processed: ${trips.length}`);
}

backfillTripImageStyles()
  .catch((error) => {
    console.error("Error during backfill:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
