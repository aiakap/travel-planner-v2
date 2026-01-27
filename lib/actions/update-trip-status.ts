"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { TripStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateTripStatus(tripId: string, newStatus: TripStatus) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Validate that the new status is not DRAFT
  // DRAFT can only be set during creation, not as a transition
  if (newStatus === TripStatus.DRAFT) {
    throw new Error("Cannot change trip status to DRAFT");
  }

  // Find the trip and verify ownership
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Update the trip status
  await prisma.trip.update({
    where: { id: tripId },
    data: { status: newStatus },
  });

  // Revalidate the manage page to show updated status
  revalidatePath("/manage");

  return { success: true, status: newStatus };
}
