"use server";

/**
 * Trip data fetcher
 * Fetches trip data from database using Prisma
 * This is a server action that can be called from client components
 */

import { prisma } from "@/lib/prisma";

export async function fetchTripData(userId: string, tripId?: string) {
  if (!tripId) {
    return { trip: null };
  }

  try {
    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
        userId: userId, // Ensure user owns the trip
      },
      include: {
        segments: {
          orderBy: {
            order: "asc",
          },
          include: {
            reservations: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        },
      },
    });

    return { trip };
  } catch (error) {
    console.error("Error fetching trip data:", error);
    return { trip: null };
  }
}
