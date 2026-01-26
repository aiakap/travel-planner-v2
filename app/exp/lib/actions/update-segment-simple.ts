"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateSegmentSimple(segmentId: string, updates: {
  name?: string;
  startTime?: string;
  endTime?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, trip: { userId: session.user.id } },
  });

  if (!segment) {
    throw new Error("Segment not found");
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.startTime) updateData.startTime = new Date(updates.startTime);
  if (updates.endTime) updateData.endTime = new Date(updates.endTime);

  await prisma.segment.update({
    where: { id: segmentId },
    data: updateData,
  });

  return { success: true };
}
