import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assignFlights } from "@/lib/utils/flight-assignment";
import type { FlightExtraction } from "@/lib/schemas/flight-extraction-schema";

/**
 * POST /api/quick-add/preview
 * 
 * Provides detailed preview of what will be created before actually creating reservations
 * Shows flight details, segment assignments, and trip date changes
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
    const { tripId, type, extractedData } = body;

    if (!tripId || typeof tripId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'tripId' parameter" },
        { status: 400 }
      );
    }

    if (type !== "flight") {
      // For now, only support flight preview (hotels/cars are simpler)
      return NextResponse.json({ type, count: 1 });
    }

    // Get trip data
    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: session.user.id,
      },
      include: {
        segments: {
          include: { segmentType: true },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!trip) {
      return NextResponse.json(
        { error: "Trip not found or unauthorized" },
        { status: 404 }
      );
    }

    console.log('[Preview] Trip fetched:', {
      id: trip.id,
      startDate: trip.startDate,
      startDateType: typeof trip.startDate,
      startDateIsDate: trip.startDate instanceof Date,
      endDate: trip.endDate,
      endDateType: typeof trip.endDate,
      endDateIsDate: trip.endDate instanceof Date,
    });

    const flightData = extractedData as FlightExtraction;

    // Helper function to convert 12-hour time to 24-hour format
    const convertTo24Hour = (time: string): string => {
      const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return "12:00";

      let [, hours, minutes, period] = match;
      let hour = parseInt(hours);

      if (period.toUpperCase() === "PM" && hour !== 12) {
        hour += 12;
      } else if (period.toUpperCase() === "AM" && hour === 12) {
        hour = 0;
      }

      return `${hour.toString().padStart(2, "0")}:${minutes}`;
    };

    // Parse flight dates with validation
    const flightsWithDates = flightData.flights.map((flight, index) => {
      // Handle empty strings and null/undefined
      const departureDate = flight.departureDate?.trim() || new Date().toISOString().split('T')[0];
      const arrivalDate = flight.arrivalDate?.trim() || new Date().toISOString().split('T')[0];
      const departureTime = flight.departureTime?.trim() || "12:00 PM";
      const arrivalTime = flight.arrivalTime?.trim() || "12:00 PM";

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(departureDate)) {
        throw new Error(`Invalid departure date format for flight ${index + 1} (${flight.flightNumber || 'unknown'}): "${departureDate}". Expected YYYY-MM-DD format.`);
      }
      if (!dateRegex.test(arrivalDate)) {
        throw new Error(`Invalid arrival date format for flight ${index + 1} (${flight.flightNumber || 'unknown'}): "${arrivalDate}". Expected YYYY-MM-DD format.`);
      }

      const departureDateTime = new Date(`${departureDate}T${convertTo24Hour(departureTime)}`);
      const arrivalDateTime = new Date(`${arrivalDate}T${convertTo24Hour(arrivalTime)}`);

      if (isNaN(departureDateTime.getTime())) {
        throw new Error(`Invalid departure date/time for flight ${index + 1}: ${departureDate} ${departureTime}`);
      }
      if (isNaN(arrivalDateTime.getTime())) {
        throw new Error(`Invalid arrival date/time for flight ${index + 1}: ${arrivalDate} ${arrivalTime}`);
      }

      return {
        ...flight,
        departureDateTime,
        arrivalDateTime,
      };
    });

    // Get ALL segments for automatic assignment
    const allSegmentsForAssignment = trip.segments.map((s) => ({
      id: s.id,
      name: s.name,
      startTime: s.startTime || new Date(),
      endTime: s.endTime || new Date(),
    }));

    // Get ALL segments for user selection (includes type info)
    const allSegments = trip.segments.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.segmentType.name,
      startTime: s.startTime || new Date(),
      endTime: s.endTime || new Date(),
    }));

    console.log('[Preview] Calling assignFlights with:', {
      flightCount: flightsWithDates.length,
      tripStartDate: trip.startDate,
      tripStartDateType: typeof trip.startDate,
      tripEndDate: trip.endDate,
      tripEndDateType: typeof trip.endDate,
    });

    // Assign flights
    const { assignments, tripExtension } = assignFlights(
      flightsWithDates.map((f) => ({
        departureDate: f.departureDateTime,
        arrivalDate: f.arrivalDateTime,
      })),
      {
        startDate: trip.startDate,
        endDate: trip.endDate,
      },
      allSegmentsForAssignment
    );

    // Build detailed preview
    const flightPreviews = flightsWithDates.map((flight, index) => {
      const assignment = assignments[index];
      
      let segmentInfo: {
        action: "create" | "match";
        segmentName: string;
        segmentId?: string;
      };

      if (assignment.shouldCreateSegment) {
        let newSegmentName: string;
        if (assignment.category === "outbound") {
          newSegmentName = `Travel to ${flight.arrivalCity}`;
        } else if (assignment.category === "return") {
          newSegmentName = `Return to ${flight.arrivalCity}`;
        } else {
          newSegmentName = `Flight to ${flight.arrivalCity}`;
        }

        segmentInfo = {
          action: "create",
          segmentName: newSegmentName,
        };
      } else {
        const matchedSegment = allSegmentsForAssignment.find(s => s.id === assignment.segmentId);
        segmentInfo = {
          action: "match",
          segmentName: matchedSegment?.name || "Unknown Segment",
          segmentId: assignment.segmentId,
        };
      }

      return {
        flightNumber: flight.flightNumber,
        carrier: flight.carrier,
        route: `${flight.departureAirport} → ${flight.arrivalAirport}`,
        departureCity: flight.departureCity,
        arrivalCity: flight.arrivalCity,
        departureDateTime: flight.departureDateTime.toISOString(),
        arrivalDateTime: flight.arrivalDateTime.toISOString(),
        category: assignment.category,
        segment: segmentInfo,
        cabin: flight.cabin || undefined,
        seatNumber: flight.seatNumber || undefined,
      };
    });

    // Count by category
    const categoryCounts = {
      outbound: assignments.filter(a => a.category === 'outbound').length,
      inTrip: assignments.filter(a => a.category === 'in-trip').length,
      return: assignments.filter(a => a.category === 'return').length,
    };

    // Trip extension info
    let tripExtensionInfo = null;
    if (tripExtension) {
      tripExtensionInfo = {
        originalStart: trip.startDate.toISOString(),
        originalEnd: trip.endDate.toISOString(),
        newStart: tripExtension.newStartDate.toISOString(),
        newEnd: tripExtension.newEndDate.toISOString(),
      };
    }

    return NextResponse.json({
      type: "flight",
      count: flightData.flights.length,
      categoryCounts,
      flights: flightPreviews,
      tripExtension: tripExtensionInfo,
      confirmationNumber: flightData.confirmationNumber,
      totalCost: flightData.totalCost || undefined,
      currency: flightData.currency || undefined,
      availableSegments: allSegments, // NEW: All segments for dropdown
    });
  } catch (error) {
    console.error("[Quick Add Preview] Error:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
