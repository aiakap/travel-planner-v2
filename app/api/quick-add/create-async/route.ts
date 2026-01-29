import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateJobId } from "@/lib/cache/job-progress";
import { processReservationsInBackground } from "@/lib/actions/quick-add-background";
import type { FlightExtraction } from "@/lib/schemas/flight-extraction-schema";

/**
 * POST /api/quick-add/create-async
 * 
 * Starts background processing of reservations and returns immediately
 * Client polls /api/quick-add/status/[jobId] for progress updates
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { tripId, type, extractedData, segmentAssignments } = body;

    if (!tripId || typeof tripId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'tripId' parameter" },
        { status: 400 }
      );
    }

    if (!type || !["flight", "hotel", "car-rental"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reservation type" },
        { status: 400 }
      );
    }

    if (!extractedData) {
      return NextResponse.json(
        { error: "Missing 'extractedData' parameter" },
        { status: 400 }
      );
    }

    // Generate unique job ID
    const jobId = generateJobId();

    console.log('[CreateAsync] Starting background job:', {
      jobId,
      tripId,
      type,
      flightCount: extractedData.flights?.length || 0
    });

    // Start background processing (don't await)
    processReservationsInBackground(
      jobId,
      tripId,
      type,
      extractedData as FlightExtraction,
      segmentAssignments
    ).catch((error) => {
      console.error('[CreateAsync] Background processing failed:', error);
    });

    // Return immediately
    return NextResponse.json({
      jobId,
      message: "Processing started",
      flightCount: extractedData.flights?.length || 0,
      tripId
    });

  } catch (error) {
    console.error("[CreateAsync] Error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to start background processing" },
      { status: 500 }
    );
  }
}
