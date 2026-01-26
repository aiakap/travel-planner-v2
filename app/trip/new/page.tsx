import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TripBuilderClient } from "./components/trip-builder-client";
import { initializeSegmentTypes } from "./lib/segment-types";

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

  return (
    <div className="flex h-screen">
      {/* Left Side - Blank for now */}
      <div className="hidden lg:block w-1/3 bg-white border-r border-gray-200">
        <div className="p-8">
          <div className="text-gray-400 text-sm">
            Left panel placeholder
          </div>
        </div>
      </div>

      {/* Right Side - Trip Builder */}
      <div className="flex-1 overflow-auto">
        <TripBuilderClient segmentTypeMap={segmentTypeMap} />
      </div>
    </div>
  );
}
