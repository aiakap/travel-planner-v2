import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { initializeSegmentTypes } from "./lib/segment-types";
import { getUserHomeLocation } from "@/lib/actions/profile-actions";
import TripBuilderPageClient from "./page-client";

export default async function TripBuilderPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Fetch segment types and home location in parallel
  const [segmentTypes, homeLocation] = await Promise.all([
    prisma.segmentType.findMany({
      select: {
        id: true,
        name: true,
      },
    }),
    getUserHomeLocation().catch(() => null),
  ]);

  // Initialize segment type map
  const segmentTypeMap = initializeSegmentTypes(segmentTypes);

  return (
    <TripBuilderPageClient 
      segmentTypeMap={segmentTypeMap} 
      homeLocation={homeLocation}
    />
  );
}
