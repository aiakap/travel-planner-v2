import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Fetch all trips with full relations for the user
    const trips = await prisma.trip.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        segments: {
          orderBy: { order: "asc" },
          include: {
            segmentType: true,
            reservations: {
              include: {
                reservationType: {
                  include: {
                    category: true,
                  },
                },
                reservationStatus: true,
              },
              orderBy: { startTime: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(trips);
  } catch (error: any) {
    console.error("[API /api/trips] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
