import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { initializeSegmentTypes } from "@/app/trip/new/lib/segment-types";
import { getUserHomeLocation } from "@/lib/actions/profile-actions";
import PlacesClient from "./client";

export const metadata = {
  title: "Build Your Journey",
  description: "Pick destinations and build your journey using an interactive tile-based builder"
};

export default async function PlacesPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/suggestions/places");
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
    <PlacesClient 
      segmentTypeMap={segmentTypeMap} 
      homeLocation={homeLocation}
    />
  );
}
