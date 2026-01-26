import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get session - for admin panel, allow without strict auth check
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      // Return empty array if no user instead of error
      return NextResponse.json({
        success: true,
        trips: [],
      });
    }

    // Fetch user's trips with segments
    const trips = await prisma.trip.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        segments: {
          select: {
            id: true,
            name: true,
            startTitle: true,
            endTitle: true,
            startTime: true,
            endTime: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      trips,
    });
  } catch (error: any) {
    console.error("Error fetching user trips:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch trips",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
