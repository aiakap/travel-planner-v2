import { auth } from "@/auth";
import EditSegmentForm from "@/components/edit-segment-form";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function EditSegmentPage({
  params,
}: {
  params: Promise<{ tripId: string; segmentId: string }>;
}) {
  const { tripId, segmentId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, tripId, trip: { userId: session.user?.id } },
  });

  if (!segment) {
    return <div>Segment not found.</div>;
  }

  const segmentTypes = await prisma.segmentType.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Edit Segment</h1>
      <EditSegmentForm segment={segment} segmentTypes={segmentTypes} />
    </div>
  );
}
