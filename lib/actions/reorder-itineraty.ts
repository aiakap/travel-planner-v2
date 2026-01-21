"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";

export async function reorderItinerary(tripId: string, newOrder: string[]) {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }

  await prisma.$transaction(
    newOrder.map((segmentId: string, key: number) =>
      prisma.segment.update({
        where: { id: segmentId },
        data: { order: key },
      })
    )
  );
}
