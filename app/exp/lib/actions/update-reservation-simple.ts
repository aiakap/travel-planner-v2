"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateReservationSimple(reservationId: string, updates: {
  name?: string;
  confirmationNumber?: string;
  cost?: number;
  startTime?: string;
  endTime?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      segment: { trip: { userId: session.user.id } },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found");
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.confirmationNumber !== undefined) 
    updateData.confirmationNumber = updates.confirmationNumber;
  if (updates.cost !== undefined) updateData.cost = updates.cost;
  if (updates.startTime) updateData.startTime = new Date(updates.startTime);
  if (updates.endTime) updateData.endTime = new Date(updates.endTime);

  await prisma.reservation.update({
    where: { id: reservationId },
    data: updateData,
  });

  return { success: true };
}
