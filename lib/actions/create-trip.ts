"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { redirect } from "next/navigation";
import { queueTripImageGeneration } from "./queue-image-generation";

export async function createTrip(formData: FormData) {
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

  // Determine image handling
  const finalImageUrl = imageUrl || null;
  const imageIsCustom = !!imageUrl;

  // Create trip first
  const trip = await prisma.trip.create({
    data: {
      title,
      description,
      imageUrl: finalImageUrl,
      imageIsCustom,
      startDate,
      endDate,
      userId: session.user.id,
    },
  });

  // Queue image generation if user didn't upload one
  if (!imageUrl) {
    try {
      const queueId = await queueTripImageGeneration(trip.id);
      console.log(`✓ Queued trip image generation: ${queueId}`);
    } catch (error) {
      console.error("❌ Failed to queue trip image generation:", error);
      // Don't fail the trip creation if queue fails
    }
  }

  redirect("/trips");
}
