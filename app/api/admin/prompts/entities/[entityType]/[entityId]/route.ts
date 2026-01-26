import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { entityType: string; entityId: string } }
) {
  try {
    const { entityType, entityId } = params;

    switch (entityType) {
      case "trip": {
        const trip = await prisma.trip.findUnique({
          where: { id: entityId },
          include: {
            user: {
              select: { name: true, email: true }
            },
            segments: {
              select: { id: true, name: true }
            },
            conversations: {
              where: { chatType: "TRIP" },
              include: {
                _count: {
                  select: { messages: true }
                }
              },
              orderBy: { updatedAt: "desc" },
              take: 1
            }
          }
        });

        if (!trip) {
          return NextResponse.json(
            { error: "Trip not found" },
            { status: 404 }
          );
        }

        const conversation = trip.conversations[0];
        const messageCount = conversation?._count.messages || 0;

        return NextResponse.json({
          context: {
            conversationId: conversation?.id,
            chatType: "TRIP" as const,
            messageCount,
            hasExistingTrip: true,
            tripData: {
              id: trip.id,
              title: trip.title,
              startDate: trip.startDate,
              endDate: trip.endDate,
              segmentCount: trip.segments.length
            },
            metadata: {}
          },
          entityInfo: {
            type: "trip",
            id: trip.id,
            title: trip.title,
            description: trip.description,
            startDate: trip.startDate.toISOString(),
            endDate: trip.endDate.toISOString(),
            userName: trip.user.name,
            userEmail: trip.user.email,
            segmentCount: trip.segments.length,
            conversationId: conversation?.id,
            messageCount
          }
        });
      }

      case "segment": {
        const segment = await prisma.segment.findUnique({
          where: { id: entityId },
          include: {
            trip: {
              include: {
                user: {
                  select: { name: true, email: true }
                }
              }
            },
            reservations: {
              select: { id: true, name: true }
            },
            conversations: {
              where: { chatType: "SEGMENT" },
              include: {
                _count: {
                  select: { messages: true }
                }
              },
              orderBy: { updatedAt: "desc" },
              take: 1
            }
          }
        });

        if (!segment) {
          return NextResponse.json(
            { error: "Segment not found" },
            { status: 404 }
          );
        }

        const conversation = segment.conversations[0];
        const messageCount = conversation?._count.messages || 0;

        return NextResponse.json({
          context: {
            conversationId: conversation?.id,
            chatType: "SEGMENT" as const,
            messageCount,
            hasExistingTrip: true,
            tripData: {
              id: segment.trip.id,
              title: segment.trip.title,
              startDate: segment.trip.startDate,
              endDate: segment.trip.endDate
            },
            metadata: {
              segmentId: segment.id,
              segmentName: segment.name
            }
          },
          entityInfo: {
            type: "segment",
            id: segment.id,
            name: segment.name,
            startTitle: segment.startTitle,
            endTitle: segment.endTitle,
            tripTitle: segment.trip.title,
            userName: segment.trip.user.name,
            userEmail: segment.trip.user.email,
            reservationCount: segment.reservations.length,
            conversationId: conversation?.id,
            messageCount
          }
        });
      }

      case "reservation": {
        const reservation = await prisma.reservation.findUnique({
          where: { id: entityId },
          include: {
            segment: {
              include: {
                trip: {
                  include: {
                    user: {
                      select: { name: true, email: true }
                    }
                  }
                }
              }
            },
            reservationType: {
              include: {
                category: true
              }
            },
            conversations: {
              where: { chatType: "RESERVATION" },
              include: {
                _count: {
                  select: { messages: true }
                }
              },
              orderBy: { updatedAt: "desc" },
              take: 1
            }
          }
        });

        if (!reservation) {
          return NextResponse.json(
            { error: "Reservation not found" },
            { status: 404 }
          );
        }

        const conversation = reservation.conversations[0];
        const messageCount = conversation?._count.messages || 0;

        return NextResponse.json({
          context: {
            conversationId: conversation?.id,
            chatType: "RESERVATION" as const,
            messageCount,
            hasExistingTrip: true,
            tripData: {
              id: reservation.segment.trip.id,
              title: reservation.segment.trip.title,
              startDate: reservation.segment.trip.startDate,
              endDate: reservation.segment.trip.endDate
            },
            metadata: {
              reservationId: reservation.id,
              reservationName: reservation.name,
              segmentId: reservation.segment.id,
              segmentName: reservation.segment.name
            }
          },
          entityInfo: {
            type: "reservation",
            id: reservation.id,
            name: reservation.name,
            confirmationNumber: reservation.confirmationNumber,
            reservationType: reservation.reservationType.name,
            category: reservation.reservationType.category.name,
            segmentName: reservation.segment.name,
            tripTitle: reservation.segment.trip.title,
            userName: reservation.segment.trip.user.name,
            userEmail: reservation.segment.trip.user.email,
            conversationId: conversation?.id,
            messageCount
          }
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid entity type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Admin API] Error fetching entity context:", error);
    return NextResponse.json(
      { error: "Failed to fetch entity context" },
      { status: 500 }
    );
  }
}
