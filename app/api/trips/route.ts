import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const trips = await prisma.trip.findMany({
      where: {
        userId: session.user.id,
        status: { not: 'DRAFT' },
      },
      include: {
        segments: {
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
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, startDate, endDate, imageUrl, status } = body;

    if (!title || !description || !startDate || !endDate) {
      return new Response("Missing required fields", { status: 400 });
    }

    const trip = await prisma.trip.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageUrl: imageUrl || null,
        imageIsCustom: !!imageUrl,
        status: status || 'ACTIVE',
        userId: session.user.id,
      },
      include: {
        segments: {
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
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return Response.json(trip);
  } catch (error) {
    console.error("Error creating trip:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
