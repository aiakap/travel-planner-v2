"use server";

/**
 * Journey data fetcher
 * Fetches trip and segment data for the Journey Architect
 */

import { prisma } from "@/lib/prisma";

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function fetchJourneyData(userId: string, params?: Record<string, any>) {
  try {
    // If tripId provided, fetch that specific trip
    if (params?.tripId) {
      const trip = await prisma.trip.findUnique({
        where: { 
          id: params.tripId,
          userId // Ensure user owns this trip
        },
        include: {
          segments: {
            include: { segmentType: true },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (trip) {
        const segmentTypes = await prisma.segmentType.findMany();
        return {
          trip,
          segments: trip.segments,
          segmentTypes,
          hasData: trip.segments.length > 0
        };
      }
    }

    // Otherwise, find the most recent draft trip
    let trip = await prisma.trip.findFirst({
      where: { 
        userId, 
        status: 'DRAFT'
      },
      include: {
        segments: {
          include: { segmentType: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    // If no draft trip exists and autoCreate is true, create one
    if (!trip && params?.autoCreate !== false) {
      trip = await prisma.trip.create({
        data: {
          title: "New Journey",
          description: "",
          startDate: new Date(),
          endDate: addDays(new Date(), 7),
          userId,
          status: 'DRAFT',
          permissions: 'PRIVATE'
        },
        include: {
          segments: {
            include: { segmentType: true },
            orderBy: { order: 'asc' }
          }
        }
      });
    }

    const segmentTypes = await prisma.segmentType.findMany();

    return {
      trip: trip || null,
      segments: trip?.segments || [],
      segmentTypes,
      hasData: (trip?.segments?.length || 0) > 0
    };
  } catch (error) {
    console.error("Error fetching journey data:", error);
    
    // Return empty state
    return {
      trip: null,
      segments: [],
      segmentTypes: [],
      hasData: false
    };
  }
}
