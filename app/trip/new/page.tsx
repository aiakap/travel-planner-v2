import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { initializeSegmentTypes } from "./lib/segment-types";
import TripBuilderPageClient from "./page-client";

export default async function TripBuilderPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Fetch segment types from database
  const segmentTypes = await prisma.segmentType.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  // Initialize segment type map
  const segmentTypeMap = initializeSegmentTypes(segmentTypes);

  return <TripBuilderPageClient segmentTypeMap={segmentTypeMap} />;
}
