import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateTotalDistance } from "@/lib/utils";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import LandingPage from "@/components/landing-page";

// Helper function to get timezone info
type TimeZoneInfo = {
  timeZoneId?: string;
  timeZoneName?: string;
};

async function getTimeZoneForCoordinates(
  lat: number,
  lng: number
): Promise<TimeZoneInfo> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {};
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`
  );

  if (!response.ok) {
    return {};
  }

  const data = await response.json();
  if (data.status !== "OK") {
    return {};
  }

  return {
    timeZoneId: data.timeZoneId,
    timeZoneName: data.timeZoneName,
  };
}

export default async function HomePage() {
  const session = await auth();

  // If not logged in, show marketing landing page
  if (!session?.user?.id) {
    return <LandingPage />;
  }

  // Logged in - fetch user's trips and show dashboard
  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: {
      segments: {
        orderBy: { order: "asc" },
        include: {
          segmentType: true,
          reservations: {
            include: {
              reservationType: {
                include: {
                  category: true,
                },
              },
              reservationStatus: true,
            },
            orderBy: {
              startTime: "asc",
            },
          },
        },
      },
    },
    orderBy: { startDate: "desc" },
  });

  // Calculate travel stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = trips.filter(
    (trip) => new Date(trip.startDate) >= today
  );

  // Calculate countries visited (from segment locations)
  const countriesVisited = new Set<string>();
  trips.forEach((trip) => {
    trip.segments.forEach((segment) => {
      // Extract country from location titles
      // This is a simple approach - you might want to enhance this
      const startCountry = segment.startTitle?.split(",").pop()?.trim();
      const endCountry = segment.endTitle?.split(",").pop()?.trim();
      if (startCountry) countriesVisited.add(startCountry);
      if (endCountry) countriesVisited.add(endCountry);
    });
  });

  // Calculate total distance
  const allSegments = trips.flatMap((trip) => trip.segments);
  const totalDistanceKm = calculateTotalDistance(
    allSegments.map((seg) => ({
      startLat: seg.startLat,
      startLng: seg.startLng,
      endLat: seg.endLat,
      endLng: seg.endLng,
    }))
  );

  const stats = {
    totalTrips: trips.length,
    countriesVisited,
    totalDistanceKm,
    upcomingTrips: upcomingTrips.length,
  };

  // Get timezone info for all segments
  const timeZoneCache = new Map<string, TimeZoneInfo>();
  const getCachedTimeZone = async (lat: number, lng: number) => {
    const key = `${lat},${lng}`;
    if (!timeZoneCache.has(key)) {
      timeZoneCache.set(key, await getTimeZoneForCoordinates(lat, lng));
    }
    return timeZoneCache.get(key) ?? {};
  };

  const allSegmentTimeZones: Record<
    string,
    {
      startTimeZoneId?: string;
      startTimeZoneName?: string;
      endTimeZoneId?: string;
      endTimeZoneName?: string;
    }
  > = {};

  for (const trip of trips) {
    for (const segment of trip.segments) {
      const [startTz, endTz] = await Promise.all([
        getCachedTimeZone(segment.startLat, segment.startLng),
        getCachedTimeZone(segment.endLat, segment.endLng),
      ]);

      allSegmentTimeZones[segment.id] = {
        startTimeZoneId: startTz.timeZoneId,
        startTimeZoneName: startTz.timeZoneName,
        endTimeZoneId: endTz.timeZoneId,
        endTimeZoneName: endTz.timeZoneName,
      };
    }
  }

  const userName = session.user.name?.split(" ")[0] || "Traveler";

  return (
    <DashboardPage
      trips={trips}
      stats={stats}
      userName={userName}
      segmentTimeZones={allSegmentTimeZones}
    />
  );
}
