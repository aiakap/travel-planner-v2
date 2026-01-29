import { NextRequest, NextResponse } from "next/server";
import { quickAddReservation } from "@/lib/actions/quick-add-reservation";
import type { FlightExtraction } from "@/lib/schemas/flight-extraction-schema";
import type { HotelExtraction } from "@/lib/schemas/hotel-extraction-schema";
import type { CarRentalExtraction } from "@/lib/schemas/car-rental-extraction-schema";

/**
 * POST /api/quick-add/create
 * 
 * Creates reservations from extracted data
 * Handles segment creation, matching, and trip date extension
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripId, type, extractedData, segmentAssignments } = body;

    console.log('[Create] Request received:', {
      tripId,
      type,
      extractedDataKeys: extractedData ? Object.keys(extractedData) : 'null',
      flightCount: type === 'flight' && extractedData?.flights ? extractedData.flights.length : 'N/A',
      hasSegmentAssignments: !!segmentAssignments,
    });

    if (!tripId || typeof tripId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'tripId' parameter" },
        { status: 400 }
      );
    }

    if (!type || !["flight", "hotel", "car-rental"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reservation type. Must be 'flight', 'hotel', or 'car-rental'" },
        { status: 400 }
      );
    }

    if (!extractedData) {
      return NextResponse.json(
        { error: "Missing 'extractedData' parameter" },
        { status: 400 }
      );
    }

    // Process the reservation(s)
    const result = await quickAddReservation(
      tripId,
      type as "flight" | "hotel" | "car-rental",
      extractedData as FlightExtraction | HotelExtraction | CarRentalExtraction,
      segmentAssignments
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Quick Add Create] Error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create reservations" },
      { status: 500 }
    );
  }
}
