"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TrainExtraction } from "@/lib/schemas/train-extraction-schema";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";
import { findBestSegmentForCluster } from "@/lib/utils/segment-matching";

interface AddTrainsOptions {
  autoCluster?: boolean;
  maxGapHours?: number;
  createSuggestedSegments?: boolean;
}

/**
 * Add train bookings to a trip
 * 
 * Processes each train segment individually and creates reservations.
 * Can auto-match to existing segments or create new ones.
 */
export async function addTrainsToTrip(
  tripId: string,
  segmentId: string | null,
  trainData: TrainExtraction,
  options: AddTrainsOptions = {}
) {
  const {
    autoCluster = false,
    maxGapHours = 48,
    createSuggestedSegments = true
  } = options;

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  console.log(`🚂 Adding ${trainData.trains.length} train(s) to trip ${tripId}`);

  // Verify trip ownership and get segments
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    include: { 
      segments: {
        include: {
          segmentType: true
        },
        orderBy: { order: 'asc' }
      }
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // Get reservation type and status
  const trainType = await getReservationType("Travel", "Train");
  const confirmedStatus = await getReservationStatus("Confirmed");

  // Helper to convert time to 24-hour format for date construction
  const convertTo24Hour = (time: string): string => {
    const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) {
      // Already in 24-hour format or just return as-is
      return time.includes(':') ? time : "12:00";
    }
    
    let [_, hours, minutes, period] = match;
    let h = parseInt(hours);
    
    if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    
    return `${h.toString().padStart(2, '0')}:${minutes}`;
  };

  // Process each train individually
  const createdReservations = [];

  for (const train of trainData.trains) {
    console.log(`🚂 Processing train ${train.trainNumber}: ${train.departureCity} → ${train.arrivalCity}`);

    // Create a cluster for this single train (for segment matching)
    const singleTrainCluster = {
      flights: [train], // Reuse flight matching logic structure
      startTime: new Date(`${train.departureDate}T${convertTo24Hour(train.departureTime)}`),
      endTime: new Date(`${train.arrivalDate}T${convertTo24Hour(train.arrivalTime)}`),
      startLocation: train.departureCity,
      endLocation: train.arrivalCity,
      startAirport: train.departureStationCode || train.departureStation,
      endAirport: train.arrivalStationCode || train.arrivalStation,
    };

    let targetSegmentId = segmentId;

    // Auto-match to segment if no manual selection
    if (!targetSegmentId) {
      const match = findBestSegmentForCluster(singleTrainCluster, trip.segments);
      
      if (match) {
        targetSegmentId = match.segmentId;
        console.log(`✅ Auto-matched to segment: ${match.segmentName} (score: ${match.score})`);
      } else if (createSuggestedSegments) {
        console.log(`⭐ Creating new segment for train journey`);
        
        // Create a new "Travel" segment for this train
        const travelType = await prisma.segmentType.findFirst({
          where: { name: "Travel" }
        });

        if (!travelType) {
          throw new Error("Travel segment type not found. Run database seed.");
        }

        // Determine segment name
        const segmentName = `${train.departureCity.split(',')[0]} to ${train.arrivalCity.split(',')[0]}`;

        // Create the segment
        const newSegment = await prisma.segment.create({
          data: {
            name: segmentName,
            tripId: trip.id,
            segmentTypeId: travelType.id,
            startTitle: train.departureStation,
            startLat: 0, // TODO: Could geocode station locations
            startLng: 0,
            endTitle: train.arrivalStation,
            endLat: 0,
            endLng: 0,
            startTime: singleTrainCluster.startTime,
            endTime: singleTrainCluster.endTime,
            order: trip.segments.length,
          },
        });

        targetSegmentId = newSegment.id;
        console.log(`✅ Created new segment: ${segmentName}`);
      }
    }

    if (!targetSegmentId) {
      console.warn(`⚠️ No segment found for train ${train.trainNumber}, skipping`);
      continue;
    }

    // Build reservation name
    const reservationName = `${train.operator} ${train.trainNumber}`;

    // Build notes with additional details
    const notesLines = [
      `Train: ${train.trainNumber}`,
      `Operator: ${train.operator}`,
      `Class: ${train.class}`,
    ];

    if (train.coach) notesLines.push(`Coach: ${train.coach}`);
    if (train.seat) notesLines.push(`Seat: ${train.seat}`);
    if (train.departurePlatform) notesLines.push(`Departure Platform: ${train.departurePlatform}`);
    if (train.arrivalPlatform) notesLines.push(`Arrival Platform: ${train.arrivalPlatform}`);
    if (train.duration) notesLines.push(`Duration: ${train.duration}`);
    if (trainData.passengers.length > 0) {
      notesLines.push(`Passengers: ${trainData.passengers.map(p => p.name).join(', ')}`);
    }

    const notes = notesLines.join('\n');

    // Create the reservation
    const reservation = await prisma.reservation.create({
      data: {
        name: reservationName,
        confirmationNumber: trainData.confirmationNumber,
        notes,
        reservationTypeId: trainType.id,
        reservationStatusId: confirmedStatus.id,
        segmentId: targetSegmentId,
        startTime: singleTrainCluster.startTime,
        endTime: singleTrainCluster.endTime,
        cost: trainData.trains.length > 1 
          ? trainData.totalCost / trainData.trains.length 
          : trainData.totalCost,
        currency: trainData.currency || undefined,
        departureLocation: `${train.departureStation} (${train.departureCity})`,
        arrivalLocation: `${train.arrivalStation} (${train.arrivalCity})`,
        vendor: train.operator,
      },
    });

    createdReservations.push(reservation);
    console.log(`✅ Created train reservation: ${reservationName}`);
  }

  console.log(`✅ Successfully added ${createdReservations.length} train reservation(s) to trip`);

  return {
    success: true,
    reservations: createdReservations,
    count: createdReservations.length,
  };
}
