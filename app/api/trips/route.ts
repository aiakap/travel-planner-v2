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
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:39',message:'Prisma query complete - raw result',data:{tripCount:trips.length,firstTripSegments:trips[0]?.segments?.map(s=>({id:s.id,name:s.name,reservationsCount:s.reservations?.length,reservationIds:s.reservations?.map(r=>r.id)}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    
    // #region agent log - Direct reservation count check
    if (trips.length > 0 && trips[0].segments.length > 0) {
      const firstSegmentId = trips[0].segments[0].id;
      const directReservationCount = await prisma.reservation.count({
        where: { segmentId: firstSegmentId }
      });
      fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:46',message:'Direct reservation count for first segment',data:{segmentId:firstSegmentId,directCount:directReservationCount},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    }
    // #endregion

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:40',message:'API returning trips data',data:{tripCount:trips.length,firstTripId:trips[0]?.id,firstTripSegmentsCount:trips[0]?.segments?.length,firstTripHasSegments:!!trips[0]?.segments,sampleSegment:trips[0]?.segments?.[0]},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H3,H4'})}).catch(()=>{});
    // #endregion
    return Response.json(trips);
  } catch (error: any) {
    console.error("[API /api/trips] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
