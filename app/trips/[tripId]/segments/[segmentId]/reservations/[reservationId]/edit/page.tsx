import { auth } from "@/auth";
import ReservationForm from "@/components/reservation-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function EditReservationPage({
  params,
}: {
  params: Promise<{
    tripId: string;
    segmentId: string;
    reservationId: string;
  }>;
}) {
  const { tripId, segmentId, reservationId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Please sign in.</div>;
  }

  // Fetch reservation and verify ownership
  const reservation = await prisma.reservation.findFirst({
    where: {
      id: reservationId,
      segmentId: segmentId,
      segment: {
        tripId: tripId,
        trip: {
          userId: session.user.id,
        },
      },
    },
    include: {
      reservationType: {
        include: {
          category: true,
        },
      },
      reservationStatus: true,
      segment: {
        include: {
          trip: true,
        },
      },
    },
  });

  if (!reservation) {
    return <div>Reservation not found.</div>;
  }

  // Fetch categories with their types
  const categories = await prisma.reservationCategory.findMany({
    include: {
      types: {
        orderBy: {
          name: "asc",
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch statuses
  const statuses = await prisma.reservationStatus.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/trips/${tripId}`}>
          <Button variant="outline">← Back to Trip</Button>
        </Link>
      </div>

      <div className="bg-white p-6 shadow rounded-lg">
        <h1 className="text-3xl font-bold mb-2">Edit Reservation</h1>
        <p className="text-gray-600 mb-6">
          Segment: {reservation.segment.name || `${reservation.segment.startTitle} → ${reservation.segment.endTitle}`}
        </p>

        <ReservationForm
          segmentId={segmentId}
          reservation={reservation}
          categories={categories}
          statuses={statuses}
        />
      </div>
    </div>
  );
}


