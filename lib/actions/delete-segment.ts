"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteSegment(segmentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      trip: {
        userId: session.user.id,
      },
    },
    include: {
      trip: true,
    },
  });

  if (!segment) {
    throw new Error("Segment not found or unauthorized");
  }

  // Reservations will be cascade deleted due to onDelete: Cascade in schema
  await prisma.segment.delete({
    where: { id: segmentId },
  });

  revalidatePath(`/trips/${segment.trip.id}`);
  revalidatePath("/manage");
  return { success: true, tripId: segment.trip.id };
}


