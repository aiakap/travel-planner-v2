"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteTrip(tripId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      userId: session.user.id,
    },
  });

  if (!trip) {
    throw new Error("Trip not found or unauthorized");
  }

  // Cascade delete will automatically delete segments and their reservations
  await prisma.trip.delete({
    where: { id: tripId },
  });

  revalidatePath("/trips");
  revalidatePath("/manage");
  
  return { success: true };
}


