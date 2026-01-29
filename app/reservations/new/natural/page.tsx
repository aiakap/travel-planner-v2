import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NaturalLanguageReservationClient } from "./client";

interface PageProps {
  searchParams: Promise<{
    segmentId?: string;
    tripId?: string;
    returnTo?: string;
  }>;
}

export default async function NaturalLanguageReservationPage({ searchParams }: PageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const params = await searchParams;
  const { segmentId, tripId, returnTo } = params;

  if (!segmentId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Missing Segment</h1>
          <p className="text-gray-700 mb-4">
            A segment ID is required to create a reservation. Please navigate from a trip or segment page.
          </p>
          <a
            href="/view1"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Trips
          </a>
        </div>
      </div>
    );
  }

  // Fetch segment and trip data
  const segment = await prisma.segment.findFirst({
    where: {
      id: segmentId,
      trip: {
        userId: session.user.id,
      },
    },
    include: {
      trip: {
        include: {
          segments: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              startTitle: true,
              endTitle: true,
              startTime: true,
              endTime: true,
              startTimeZoneId: true,
            },
          },
        },
      },
      segmentType: true,
      reservations: {
        orderBy: { startTime: "asc" },
        take: 5, // Show first 5 reservations for context
        include: {
          reservationType: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!segment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Segment Not Found</h1>
          <p className="text-gray-700 mb-4">
            The segment you're trying to add a reservation to could not be found or you don't have access to it.
          </p>
          <a
            href="/view1"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Trips
          </a>
        </div>
      </div>
    );
  }

  const trip = segment.trip;

  // Prepare context data for the client
  const contextData = {
    segment: {
      id: segment.id,
      name: segment.name,
      location: segment.startTitle === segment.endTitle 
        ? segment.endTitle 
        : `${segment.startTitle} to ${segment.endTitle}`,
      startDate: segment.startTime?.toISOString() || new Date().toISOString(),
      endDate: segment.endTime?.toISOString() || new Date().toISOString(),
      timezone: segment.startTimeZoneId || "UTC",
      type: segment.segmentType.name,
    },
    trip: {
      id: trip.id,
      title: trip.title,
      startDate: trip.startDate.toISOString(),
      endDate: trip.endDate.toISOString(),
    },
    existingReservations: segment.reservations.map(r => ({
      id: r.id,
      name: r.name,
      category: r.reservationType.category.name,
      startTime: r.startTime?.toISOString(),
    })),
    returnTo: returnTo || `/view1/${trip.id}?tab=journey`,
  };

  return <NaturalLanguageReservationClient context={contextData} />;
}
