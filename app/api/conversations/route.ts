import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/conversations/route.ts:6',message:'API route entry',data:{url:req.url},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    const session = await auth();

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/conversations/route.ts:11',message:'Auth result',data:{hasSession:!!session,hasUserId:!!session?.user?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion

    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tripId = searchParams.get("tripId");
    
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/conversations/route.ts:20',message:'Parsed tripId',data:{tripId:tripId,hasTripId:!!tripId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});

    if (!tripId) {
      return new Response("tripId is required", { status: 400 });
    }

    // Verify trip belongs to user
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
    });

    if (!trip) {
      return new Response("Trip not found", { status: 404 });
    }

    // Fetch conversations for the trip
    const conversations = await prisma.chatConversation.findMany({
      where: {
        tripId,
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/conversations/route.ts:50',message:'Success - returning conversations',data:{count:conversations.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
    return Response.json(conversations);
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4125d33c-4a62-4eec-868a-42aadac31dd8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api/conversations/route.ts:56',message:'API error caught',data:{errorMessage:error.message,errorStack:error.stack},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
    console.error("[API /api/conversations] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
