import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        segments: {
          include: {
            segmentType: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!trip) {
      return new Response("Trip not found", { status: 404 });
    }

    return Response.json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
