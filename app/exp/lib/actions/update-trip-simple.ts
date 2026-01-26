"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateTripSimple(tripId: string, updates: {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const updateData: any = {};
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.startDate) updateData.startDate = new Date(updates.startDate);
  if (updates.endDate) updateData.endDate = new Date(updates.endDate);

  await prisma.trip.update({
    where: { id: tripId },
    data: updateData,
  });

  return { success: true };
}
