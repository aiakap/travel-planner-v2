import { auth } from "@/auth";
import NewLocationClient from "@/components/new-location";
import { prisma } from "@/lib/prisma";

export default async function NewLocation({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  const session = await auth();
  if (!session) {
    return <div> Please sign in.</div>;
  }

  const lastSegment = await prisma.segment.findFirst({
    where: { tripId, trip: { userId: session.user?.id } },
    orderBy: { order: "desc" },
    select: { endTime: true, endTitle: true },
  });

  const segmentTypes = await prisma.segmentType.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <NewLocationClient
      tripId={tripId}
      lastEndTime={lastSegment?.endTime?.toISOString() ?? null}
      lastEndAddress={lastSegment?.endTitle ?? null}
      segmentTypes={segmentTypes}
    />
  );
}
