import { auth } from "@/auth";
import EditTripForm from "@/components/edit-trip-form";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await auth();
  if (!session) {
    redirect("/api/auth/signin");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user?.id },
  });

  if (!trip) {
    return <div>Trip not found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Edit Trip</h1>
      <EditTripForm trip={trip} />
    </div>
  );
}


