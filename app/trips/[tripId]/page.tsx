import { auth } from "@/auth";
import TripDetailClient from "@/components/trip-detail";
import { prisma } from "@/lib/prisma";

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

export default async function TripDetail({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  const session = await auth();

  if (!session) {
    return <div> Please sign in.</div>;
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user?.id },
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
  });

  console.log(trip);

  if (!trip) {
    return <div> Trip not found.</div>;
  }

  const timeZoneCache = new Map<string, TimeZoneInfo>();
  const getCachedTimeZone = async (lat: number, lng: number) => {
    const key = `${lat},${lng}`;
    if (!timeZoneCache.has(key)) {
      timeZoneCache.set(key, await getTimeZoneForCoordinates(lat, lng));
    }
    return timeZoneCache.get(key) ?? {};
  };

  const segmentTimeZones = await Promise.all(
    trip.segments.map(async (segment) => {
      const [startTz, endTz] = await Promise.all([
        getCachedTimeZone(segment.startLat, segment.startLng),
        getCachedTimeZone(segment.endLat, segment.endLng),
      ]);

      return [
        segment.id,
        {
          startTimeZoneId: startTz.timeZoneId,
          startTimeZoneName: startTz.timeZoneName,
          endTimeZoneId: endTz.timeZoneId,
          endTimeZoneName: endTz.timeZoneName,
        },
      ] as const;
    })
  );

  return (
    <TripDetailClient
      trip={trip}
      segmentTimeZones={Object.fromEntries(segmentTimeZones)}
    />
  );
}
