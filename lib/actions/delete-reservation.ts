"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteReservation(reservationId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify reservation belongs to user via segment -> trip
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      segment: {
        trip: {
          userId: session.user.id,
        },
      },
    },
    include: {
      segment: {
        include: {
          trip: true,
        },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found or unauthorized");
  }

  await prisma.reservation.delete({
    where: { id: reservationId },
  });

  revalidatePath(`/trips/${reservation.segment.trip.id}`);
  return { success: true };
}


