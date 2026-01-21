import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await params;
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const trip = await prisma.trip.findUnique({
    where: { 
      id: tripId,
      userId: session.user.id // Security: only fetch user's own trips
    },
    include: {
      segments: {
        orderBy: { order: "asc" },
        include: {
          segmentType: true,
          reservations: {
            include: {
              reservationType: {
                include: { category: true },
              },
              reservationStatus: true,
            },
            orderBy: { startTime: "asc" },
          },
        },
      },
    },
  });
  
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }
  
  return NextResponse.json(trip);
}
