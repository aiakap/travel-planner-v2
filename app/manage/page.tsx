import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ManageClient from "@/components/manage-client";

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

export default async function ManagePage() {
  const session = await auth();

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-700 text-xl">
        Please sign in to manage your trips.
      </div>
    );
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session.user?.id },
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

  const segmentTypes = await prisma.segmentType.findMany();
  const reservationCategories = await prisma.reservationCategory.findMany({
    include: { types: true },
  });
  const reservationStatuses = await prisma.reservationStatus.findMany();

  // Collect all segment timezone info
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

  return (
    <ManageClient
      trips={trips}
      segmentTypes={segmentTypes}
      reservationCategories={reservationCategories}
      reservationStatuses={reservationStatuses}
      segmentTimeZones={allSegmentTimeZones}
    />
  );
}


