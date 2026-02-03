import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assignFlights } from "@/lib/utils/flight-assignment";
import type { FlightExtraction } from "@/lib/schemas/flight-extraction-schema";
import type { HotelExtraction } from "@/lib/schemas/hotel-extraction-schema";
import type { CarRentalExtraction } from "@/lib/schemas/car-rental-extraction-schema";
import type { TrainExtraction } from "@/lib/schemas/train-extraction-schema";
import type { RestaurantExtraction } from "@/lib/schemas/restaurant-extraction-schema";
import type { EventExtraction } from "@/lib/schemas/event-extraction-schema";
import { createHotelCluster } from "@/lib/utils/hotel-clustering";
import { createCarRentalCluster } from "@/lib/utils/car-rental-clustering";
import { findBestSegmentForHotel, findBestSegmentForCarRental, Segment } from "@/lib/utils/segment-matching";

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

    // Get ALL segments for user selection (includes type info)
    const allSegments = trip.segments.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.segmentType.name,
      startTime: s.startTime || new Date(),
      endTime: s.endTime || new Date(),
    }));

    // Convert segments for matching utilities
    const segmentsForMatching: Segment[] = trip.segments.map((s) => ({
      id: s.id,
      name: s.name,
      startTitle: s.startTitle,
      endTitle: s.endTitle,
      startTime: s.startTime?.toISOString() || null,
      endTime: s.endTime?.toISOString() || null,
      order: s.order,
      segmentType: { name: s.segmentType.name },
    }));

    // Helper function to convert 12-hour time to 24-hour format
    const convertTo24Hour = (time: string): string => {
      if (!time || time === "") return "12:00";
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

    // Handle HOTEL preview
    if (type === "hotel") {
      const hotelData = extractedData as HotelExtraction;
      const cluster = createHotelCluster(hotelData);
      const match = findBestSegmentForHotel(cluster, segmentsForMatching, 50); // Lower threshold
      
      let segmentInfo: { action: "create" | "match"; segmentName: string; segmentId?: string };
      if (match) {
        segmentInfo = {
          action: "match",
          segmentId: match.segmentId,
          segmentName: match.segmentName,
        };
      } else {
        segmentInfo = {
          action: "create",
          segmentName: `Stay in ${hotelData.hotelName.split(' ').slice(0, 3).join(' ')}`,
        };
      }

      const hotelPreview = {
        hotelName: hotelData.hotelName,
        address: hotelData.address,
        checkInDate: hotelData.checkInDate,
        checkInTime: hotelData.checkInTime || "3:00 PM",
        checkOutDate: hotelData.checkOutDate,
        checkOutTime: hotelData.checkOutTime || "11:00 AM",
        roomType: hotelData.roomType,
        numberOfRooms: hotelData.numberOfRooms,
        numberOfGuests: hotelData.numberOfGuests,
        totalCost: hotelData.totalCost,
        currency: hotelData.currency,
        segment: segmentInfo,
      };

      return NextResponse.json({
        type: "hotel",
        count: 1,
        hotels: [hotelPreview],
        confirmationNumber: hotelData.confirmationNumber,
        totalCost: hotelData.totalCost || undefined,
        currency: hotelData.currency || undefined,
        availableSegments: allSegments,
      });
    }

    // Handle CAR RENTAL preview
    if (type === "car-rental") {
      const carData = extractedData as CarRentalExtraction;
      const cluster = createCarRentalCluster(carData);
      const match = findBestSegmentForCarRental(cluster, segmentsForMatching, 50);
      
      let segmentInfo: { action: "create" | "match"; segmentName: string; segmentId?: string };
      if (match) {
        segmentInfo = {
          action: "match",
          segmentId: match.segmentId,
          segmentName: match.segmentName,
        };
      } else {
        const isOneWay = carData.pickupLocation !== carData.returnLocation;
        segmentInfo = {
          action: "create",
          segmentName: isOneWay 
            ? `Drive: ${carData.pickupLocation} to ${carData.returnLocation}`
            : `Car Rental in ${carData.pickupLocation}`,
        };
      }

      const carPreview = {
        company: carData.company,
        vehicleClass: carData.vehicleClass,
        vehicleModel: carData.vehicleModel,
        pickupLocation: carData.pickupLocation,
        pickupAddress: carData.pickupAddress,
        pickupDate: carData.pickupDate,
        pickupTime: carData.pickupTime || "12:00 PM",
        returnLocation: carData.returnLocation,
        returnAddress: carData.returnAddress,
        returnDate: carData.returnDate,
        returnTime: carData.returnTime || "12:00 PM",
        isOneWay: carData.pickupLocation !== carData.returnLocation,
        options: carData.options,
        totalCost: carData.totalCost,
        currency: carData.currency,
        segment: segmentInfo,
      };

      return NextResponse.json({
        type: "car-rental",
        count: 1,
        carRentals: [carPreview],
        confirmationNumber: carData.confirmationNumber,
        totalCost: carData.totalCost || undefined,
        currency: carData.currency || undefined,
        availableSegments: allSegments,
      });
    }

    // Handle TRAIN preview
    if (type === "train") {
      const trainData = extractedData as TrainExtraction;
      
      const trainPreviews = trainData.trains.map((train, index) => {
        // Find best matching segment based on dates
        let segmentInfo: { action: "create" | "match"; segmentName: string; segmentId?: string } = {
          action: "create",
          segmentName: `Train to ${train.arrivalCity.split(',')[0]}`,
        };

        // Try to match by date overlap
        const trainStart = new Date(`${train.departureDate}T${convertTo24Hour(train.departureTime)}`);
        const trainEnd = new Date(`${train.arrivalDate}T${convertTo24Hour(train.arrivalTime)}`);
        
        for (const segment of segmentsForMatching) {
          if (segment.startTime && segment.endTime) {
            const segStart = new Date(segment.startTime);
            const segEnd = new Date(segment.endTime);
            if (trainStart >= segStart && trainEnd <= segEnd) {
              segmentInfo = {
                action: "match",
                segmentId: segment.id,
                segmentName: segment.name,
              };
              break;
            }
          }
        }

        return {
          trainNumber: train.trainNumber,
          operator: train.operator,
          departureStation: train.departureStation,
          departureCity: train.departureCity,
          departureDate: train.departureDate,
          departureTime: train.departureTime,
          departurePlatform: train.departurePlatform,
          arrivalStation: train.arrivalStation,
          arrivalCity: train.arrivalCity,
          arrivalDate: train.arrivalDate,
          arrivalTime: train.arrivalTime,
          class: train.class,
          coach: train.coach,
          seat: train.seat,
          segment: segmentInfo,
        };
      });

      return NextResponse.json({
        type: "train",
        count: trainData.trains.length,
        trains: trainPreviews,
        confirmationNumber: trainData.confirmationNumber,
        totalCost: trainData.totalCost || undefined,
        currency: trainData.currency || undefined,
        availableSegments: allSegments,
      });
    }

    // Handle RESTAURANT preview
    if (type === "restaurant") {
      const restaurantData = extractedData as RestaurantExtraction;
      
      // Try to match by date
      let segmentInfo: { action: "create" | "match"; segmentName: string; segmentId?: string } = {
        action: "create",
        segmentName: `Dining at ${restaurantData.restaurantName}`,
      };

      const reservationDateTime = new Date(`${restaurantData.reservationDate}T${convertTo24Hour(restaurantData.reservationTime)}`);
      
      for (const segment of segmentsForMatching) {
        if (segment.startTime && segment.endTime) {
          const segStart = new Date(segment.startTime);
          const segEnd = new Date(segment.endTime);
          if (reservationDateTime >= segStart && reservationDateTime <= segEnd) {
            segmentInfo = {
              action: "match",
              segmentId: segment.id,
              segmentName: segment.name,
            };
            break;
          }
        }
      }

      const restaurantPreview = {
        restaurantName: restaurantData.restaurantName,
        address: restaurantData.address,
        phone: restaurantData.phone,
        reservationDate: restaurantData.reservationDate,
        reservationTime: restaurantData.reservationTime,
        partySize: restaurantData.partySize,
        specialRequests: restaurantData.specialRequests,
        platform: restaurantData.platform,
        totalCost: restaurantData.cost,
        currency: restaurantData.currency,
        segment: segmentInfo,
      };

      return NextResponse.json({
        type: "restaurant",
        count: 1,
        restaurants: [restaurantPreview],
        confirmationNumber: restaurantData.confirmationNumber,
        totalCost: restaurantData.cost || undefined,
        currency: restaurantData.currency || undefined,
        availableSegments: allSegments,
      });
    }

    // Handle EVENT preview
    if (type === "event") {
      const eventData = extractedData as EventExtraction;
      
      // Try to match by date
      let segmentInfo: { action: "create" | "match"; segmentName: string; segmentId?: string } = {
        action: "create",
        segmentName: eventData.eventName.length > 30 
          ? eventData.eventName.substring(0, 30) + "..."
          : eventData.eventName,
      };

      const eventDateTime = new Date(`${eventData.eventDate}T${convertTo24Hour(eventData.eventTime || "12:00 PM")}`);
      
      for (const segment of segmentsForMatching) {
        if (segment.startTime && segment.endTime) {
          const segStart = new Date(segment.startTime);
          const segEnd = new Date(segment.endTime);
          if (eventDateTime >= segStart && eventDateTime <= segEnd) {
            segmentInfo = {
              action: "match",
              segmentId: segment.id,
              segmentName: segment.name,
            };
            break;
          }
        }
      }

      const eventPreview = {
        eventName: eventData.eventName,
        venueName: eventData.venueName,
        address: eventData.address,
        eventDate: eventData.eventDate,
        eventTime: eventData.eventTime,
        doorsOpenTime: eventData.doorsOpenTime,
        eventType: eventData.eventType,
        tickets: eventData.tickets,
        totalCost: eventData.totalCost,
        currency: eventData.currency,
        platform: eventData.platform,
        specialInstructions: eventData.specialInstructions,
        segment: segmentInfo,
      };

      return NextResponse.json({
        type: "event",
        count: 1,
        events: [eventPreview],
        confirmationNumber: eventData.confirmationNumber,
        totalCost: eventData.totalCost || undefined,
        currency: eventData.currency || undefined,
        availableSegments: allSegments,
      });
    }

    // Handle CRUISE, PRIVATE-DRIVER, GENERIC - simple preview with segment assignment
    if (type === "cruise" || type === "private-driver" || type === "generic") {
      // For these types, show basic preview with segment dropdown
      const genericPreview = {
        type,
        data: extractedData,
        segment: {
          action: "create" as const,
          segmentName: type === "cruise" ? "Cruise" : type === "private-driver" ? "Private Transfer" : "Activity",
        },
      };

      return NextResponse.json({
        type,
        count: 1,
        generic: [genericPreview],
        confirmationNumber: extractedData.confirmationNumber || undefined,
        availableSegments: allSegments,
      });
    }

    // Handle FLIGHT preview (existing logic)
    if (type !== "flight") {
      // Fallback for any unhandled type
      return NextResponse.json({ 
        type, 
        count: 1,
        availableSegments: allSegments,
      });
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

    // Get ALL segments for automatic assignment (flight-specific format)
    const allSegmentsForAssignment = trip.segments.map((s) => ({
      id: s.id,
      name: s.name,
      startTime: s.startTime || new Date(),
      endTime: s.endTime || new Date(),
      startTitle: s.startTitle,
      endTitle: s.endTitle,
      segmentTypeName: s.segmentType?.name,
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
        departureLocation: f.departureCity,
        arrivalLocation: f.arrivalCity,
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
