/**
 * Journey Architect Chat API Route
 * 
 * Handles chat messages for the journey structure builder
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processJourneyArchitectChat } from "@/lib/ai/journey-architect-chat";

export const maxDuration = 60;

interface InMemorySegment {
  tempId: string;
  name: string;
  segmentType: string;
  startLocation: string;
  endLocation: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  order: number;
}

interface InMemoryTrip {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  segments: InMemorySegment[];
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { message, conversationHistory, currentTrip } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!currentTrip) {
      return NextResponse.json(
        { error: "Current trip state is required" },
        { status: 400 }
      );
    }

    console.log("📨 [Journey Architect API] Processing message from user:", session.user.id);
    console.log("📝 [Journey Architect API] User message:", message);
    console.log("📊 [Journey Architect API] Current trip:", {
      title: currentTrip.title || "No title",
      segments: currentTrip.segments?.length || 0
    });

    // Process the message with AI
    const aiResponse = await processJourneyArchitectChat(
      message,
      conversationHistory || [],
      currentTrip
    );

    console.log("🤖 [Journey Architect API] AI response generated");
    console.log("✨ [Journey Architect API] Trip updates:", aiResponse.tripUpdates ? "Yes" : "No");
    console.log("✨ [Journey Architect API] Segments to add:", aiResponse.segmentsToAdd?.length || 0);

    // Return response with updates
    return NextResponse.json({
      success: true,
      message: aiResponse.message,
      tripUpdates: aiResponse.tripUpdates || null,
      segmentsToAdd: aiResponse.segmentsToAdd || []
    });

  } catch (error) {
    console.error("❌ [Journey Architect API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
