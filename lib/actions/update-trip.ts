"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { redirect } from "next/navigation";
import { queueTripImageGeneration } from "./queue-image-generation";

export async function updateTrip(tripId: string, formData: FormData) {
  const session = await auth();
  if (!session || !session.user?.id) {
    throw new Error("Not authenticated.");
  }

  const title = formData.get("title")?.toString();
  const description = formData.get("description")?.toString();
  const imageUrl = formData.get("imageUrl")?.toString();
  const startDateStr = formData.get("startDate")?.toString();
  const endDateStr = formData.get("endDate")?.toString();

  if (!title || !description || !startDateStr || !endDateStr) {
    throw new Error("All fields are required.");
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Fetch existing trip to check for changes
  const existingTrip = await prisma.trip.findUnique({
    where: { id: tripId, userId: session.user.id },
    include: { segments: true },
  });

  if (!existingTrip) {
    throw new Error("Trip not found.");
  }

  // Check if name or description changed
  const nameOrDescChanged =
    title !== existingTrip.title || description !== existingTrip.description;

  // Prepare update data
  const updateData: any = {
    title,
    description,
    startDate,
    endDate,
  };

  // Handle image logic
  if (imageUrl && imageUrl !== existingTrip.imageUrl) {
    // User uploaded a new custom image
    updateData.imageUrl = imageUrl;
    updateData.imageIsCustom = true;
    updateData.imagePromptId = null;
  }

  // Update the trip first
  await prisma.trip.update({
    where: { id: tripId, userId: session.user.id },
    data: updateData,
  });

  // Queue image regeneration if it's not a custom image
  if (!imageUrl || imageUrl === existingTrip.imageUrl) {
    if (!existingTrip.imageIsCustom) {
      try {
        await queueTripImageGeneration(tripId, existingTrip.imagePromptId || undefined);
      } catch (error) {
        console.error("Failed to queue trip image:", error);
      }
    }
  }

  redirect("/trips");

  await prisma.trip.update({
    where: { id: tripId, userId: session.user.id },
    data: updateData,
  });

}


