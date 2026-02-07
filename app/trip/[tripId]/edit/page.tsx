import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { initializeSegmentTypes } from "../../new/lib/segment-types";
import { getUserHomeLocation } from "@/lib/actions/profile-actions";
import TripEditPageClient from "./client";

interface PageProps {
  params: Promise<{ tripId: string }>;
}

export default async function TripEditPage({ params }: PageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const { tripId } = await params;

  // Fetch trip with segments, segment types, and home location in parallel
  const [trip, segmentTypes, homeLocation] = await Promise.all([
    prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
      include: {
        segments: {
          orderBy: { order: "asc" },
          include: {
            segmentType: true,
          },
        },
      },
    }),
    prisma.segmentType.findMany({
      select: {
        id: true,
        name: true,
      },
    }),
    getUserHomeLocation().catch(() => null),
  ]);

  if (!trip) {
    notFound();
  }

  // Initialize segment type map
  const segmentTypeMap = initializeSegmentTypes(segmentTypes);

  return (
    <TripEditPageClient
      segmentTypeMap={segmentTypeMap}
      homeLocation={homeLocation}
      initialTrip={{
        id: trip.id,
        title: trip.title,
        startDate: trip.startDate,
        endDate: trip.endDate,
        description: trip.description,
      }}
      initialSegments={trip.segments.map((seg) => ({
        id: seg.id,
        name: seg.name,
        days: seg.days,
        startTitle: seg.startTitle,
        imageUrl: seg.imageUrl,
        startLat: seg.startLat,
        startLng: seg.startLng,
        segmentType: seg.segmentType,
      }))}
    />
  );
}
