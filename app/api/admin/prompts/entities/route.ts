import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");
    const tripId = searchParams.get("tripId");
    const segmentId = searchParams.get("segmentId");

    if (!type) {
      return NextResponse.json(
        { error: "Missing required parameter: type" },
        { status: 400 }
      );
    }

    switch (type) {
      case "users": {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            _count: {
              select: { trips: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 100
        });

        return NextResponse.json({
          users: users.map(user => ({
            id: user.id,
            name: user.name || "Unnamed User",
            email: user.email,
            tripCount: user._count.trips
          }))
        });
      }

      case "trips": {
        if (!userId) {
          return NextResponse.json(
            { error: "Missing required parameter: userId" },
            { status: 400 }
          );
        }

        const trips = await prisma.trip.findMany({
          where: { userId },
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            userId: true,
            _count: {
              select: { segments: true }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 100
        });

        return NextResponse.json({
          trips: trips.map(trip => ({
            id: trip.id,
            title: trip.title,
            startDate: trip.startDate.toISOString(),
            endDate: trip.endDate.toISOString(),
            userId: trip.userId,
            segmentCount: trip._count.segments
          }))
        });
      }

      case "segments": {
        if (!tripId) {
          return NextResponse.json(
            { error: "Missing required parameter: tripId" },
            { status: 400 }
          );
        }

        const segments = await prisma.segment.findMany({
          where: { tripId },
          select: {
            id: true,
            name: true,
            startTitle: true,
            endTitle: true,
            tripId: true,
            order: true,
            _count: {
              select: { reservations: true }
            }
          },
          orderBy: { order: "asc" },
          take: 100
        });

        return NextResponse.json({
          segments: segments.map(segment => ({
            id: segment.id,
            name: segment.name,
            startTitle: segment.startTitle,
            endTitle: segment.endTitle,
            tripId: segment.tripId,
            order: segment.order,
            reservationCount: segment._count.reservations
          }))
        });
      }

      case "reservations": {
        if (!segmentId) {
          return NextResponse.json(
            { error: "Missing required parameter: segmentId" },
            { status: 400 }
          );
        }

        const reservations = await prisma.reservation.findMany({
          where: { segmentId },
          select: {
            id: true,
            name: true,
            confirmationNumber: true,
            segmentId: true,
            reservationType: {
              select: {
                name: true,
                category: {
                  select: { name: true }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" },
          take: 100
        });

        return NextResponse.json({
          reservations: reservations.map(reservation => ({
            id: reservation.id,
            name: reservation.name,
            confirmationNumber: reservation.confirmationNumber,
            segmentId: reservation.segmentId,
            type: reservation.reservationType.name,
            category: reservation.reservationType.category.name
          }))
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid type parameter" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Admin API] Error fetching entities:", error);
    return NextResponse.json(
      { error: "Failed to fetch entities" },
      { status: 500 }
    );
  }
}
