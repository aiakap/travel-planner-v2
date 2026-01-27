"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FlightExtraction } from "@/lib/schemas/flight-extraction-schema";
import { clusterFlightsByTime, FlightCluster, getClusterSummary } from "@/lib/utils/flight-clustering";
import { findBestSegmentForCluster, SegmentMatch, Segment as SegmentWithType } from "@/lib/utils/segment-matching";
import { suggestSegmentForCluster, SegmentSuggestion } from "@/lib/utils/segment-suggestions";
import { createSegment } from "./create-segment";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";

export interface AddFlightsOptions {
  autoCluster?: boolean; // Default: false (changed to process flights individually)
  maxGapHours?: number; // Default: 48
  createSuggestedSegments?: boolean; // Default: false
}

export interface ClusterResult {
  flights: any[];
  startLocation: string;
  endLocation: string;
  startTime: Date;
  endTime: Date;
  match?: {
    segmentId: string;
    segmentName: string;
    score: number;
    reservations: any[];
  };
  suggestion?: {
    name: string;
    startLocation: string;
    endLocation: string;
    segmentType: string;
    reason: string;
  };
}

export async function addFlightsToTrip(
  tripId: string,
  segmentId: string | null, // Now optional - used for backwards compatibility
  flightData: FlightExtraction,
  options: AddFlightsOptions = {}
) {
  const {
    autoCluster = false, // Changed default: process each flight individually
    maxGapHours = 48,
    createSuggestedSegments = true,
  } = options;

  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify trip ownership
  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    include: { 
      segments: {
        include: {
          segmentType: true,
        },
        orderBy: {
          order: 'asc',
        },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  // If segmentId provided (legacy mode), use old logic
  if (segmentId) {
    const segment = trip.segments.find(s => s.id === segmentId);
    if (!segment) {
      throw new Error("Segment not found or does not belong to this trip");
    }
    return await addFlightsToSingleSegment(segmentId, flightData);
  }

  // Process flights based on autoCluster setting
  if (autoCluster) {
    // OLD BEHAVIOR: Cluster flights by time proximity
    console.log(`📊 Clustering ${flightData.flights.length} flights (max gap: ${maxGapHours}h)`);
    const clusters = clusterFlightsByTime(flightData.flights, maxGapHours);
    console.log(`✂️ Created ${clusters.length} cluster(s)`);

    // Match each cluster to segments
    const matches = clusters.map(cluster => 
      findBestSegmentForCluster(cluster, trip.segments as any)
    );

    // Process each cluster
    const clusterResults: ClusterResult[] = [];

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      const match = matches[i];

      console.log(`\n📦 Cluster ${i + 1}: ${getClusterSummary(cluster)}`);

      let targetSegmentId: string;

      if (match) {
        // Good match found
        console.log(`✅ Matched to segment "${match.segmentName}" (score: ${match.score})`);
        console.log(`   Reason: ${match.reason}`);
        targetSegmentId = match.segmentId;
      } else {
        // No good match - create or suggest new segment
        const suggestion = suggestSegmentForCluster(cluster, trip.segments as any);
        console.log(`💡 No good match found. Suggestion: "${suggestion.name}"`);
        console.log(`   Reason: ${suggestion.reason}`);

        if (createSuggestedSegments) {
          // Create the suggested segment
          console.log(`🔨 Creating suggested segment...`);
          targetSegmentId = await createSegment({
            tripId,
            name: suggestion.name,
            startLocation: suggestion.startLocation,
            endLocation: suggestion.endLocation,
            startTime: suggestion.startTime,
            endTime: suggestion.endTime,
            segmentType: "Flight",
          });
          console.log(`✅ Created segment: ${targetSegmentId}`);
        } else {
          // Return suggestion without creating
          clusterResults.push({
            flights: cluster.flights,
            startLocation: cluster.startLocation,
            endLocation: cluster.endLocation,
            startTime: cluster.startTime,
            endTime: cluster.endTime,
            suggestion: {
              name: suggestion.name,
              startLocation: suggestion.startLocation,
              endLocation: suggestion.endLocation,
              segmentType: suggestion.segmentType,
              reason: suggestion.reason,
            },
          });
          continue; // Skip adding flights for this cluster
        }
      }

      // Add flights to the target segment
      const reservations = await addFlightsToSegment(
        targetSegmentId,
        cluster.flights,
        flightData
      );

      clusterResults.push({
        flights: cluster.flights,
        startLocation: cluster.startLocation,
        endLocation: cluster.endLocation,
        startTime: cluster.startTime,
        endTime: cluster.endTime,
        match: match ? {
          segmentId: match.segmentId,
          segmentName: match.segmentName,
          score: match.score,
          reservations,
        } : undefined,
      });
    }

    const totalReservations = clusterResults.reduce(
      (sum, r) => sum + (r.match?.reservations.length || 0), 
      0
    );

    console.log(`\n✅ Added ${totalReservations} flight reservation(s) across ${clusters.length} cluster(s)`);

    return {
      success: true,
      clusters: clusterResults,
      totalReservations,
    };
  } else {
    // NEW BEHAVIOR: Process each flight individually
    console.log(`✈️ Processing ${flightData.flights.length} flights individually`);
    
    const flightResults: ClusterResult[] = [];

    for (let i = 0; i < flightData.flights.length; i++) {
      const flight = flightData.flights[i];
      
      // Create a single-flight "cluster" for matching
      const singleFlightCluster: FlightCluster = {
        flights: [flight],
        startTime: new Date(`${flight.departureDate}T${convertTo24Hour(flight.departureTime)}`),
        endTime: new Date(`${flight.arrivalDate}T${convertTo24Hour(flight.arrivalTime)}`),
        startLocation: flight.departureCity,
        endLocation: flight.arrivalCity,
        startAirport: flight.departureAirport,
        endAirport: flight.arrivalAirport,
      };

      console.log(`\n✈️ Flight ${i + 1}: ${flight.flightNumber} (${flight.departureAirport} → ${flight.arrivalAirport})`);

      // Match this single flight to best segment
      const match = findBestSegmentForCluster(singleFlightCluster, trip.segments as any);

      let targetSegmentId: string;

      if (match) {
        // Good match found
        console.log(`✅ Matched to segment "${match.segmentName}" (score: ${match.score})`);
        console.log(`   Reason: ${match.reason}`);
        targetSegmentId = match.segmentId;
      } else {
        // No good match - create or suggest new segment
        const suggestion = suggestSegmentForCluster(singleFlightCluster, trip.segments as any);
        console.log(`💡 No good match found. Suggestion: "${suggestion.name}"`);
        console.log(`   Reason: ${suggestion.reason}`);

        if (createSuggestedSegments) {
          // Create the suggested segment
          console.log(`🔨 Creating suggested segment...`);
          targetSegmentId = await createSegment({
            tripId,
            name: suggestion.name,
            startLocation: suggestion.startLocation,
            endLocation: suggestion.endLocation,
            startTime: suggestion.startTime,
            endTime: suggestion.endTime,
            segmentType: "Flight",
          });
          console.log(`✅ Created segment: ${targetSegmentId}`);
        } else {
          // Return suggestion without creating
          flightResults.push({
            flights: [flight],
            startLocation: singleFlightCluster.startLocation,
            endLocation: singleFlightCluster.endLocation,
            startTime: singleFlightCluster.startTime,
            endTime: singleFlightCluster.endTime,
            suggestion: {
              name: suggestion.name,
              startLocation: suggestion.startLocation,
              endLocation: suggestion.endLocation,
              segmentType: suggestion.segmentType,
              reason: suggestion.reason,
            },
          });
          continue; // Skip adding this flight
        }
      }

      // Add this single flight to the target segment
      const reservations = await addFlightsToSegment(
        targetSegmentId,
        [flight],
        flightData
      );

      flightResults.push({
        flights: [flight],
        startLocation: singleFlightCluster.startLocation,
        endLocation: singleFlightCluster.endLocation,
        startTime: singleFlightCluster.startTime,
        endTime: singleFlightCluster.endTime,
        match: match ? {
          segmentId: match.segmentId,
          segmentName: match.segmentName,
          score: match.score,
          reservations,
        } : undefined,
      });
    }

    const totalReservations = flightResults.reduce(
      (sum, r) => sum + (r.match?.reservations.length || 0), 
      0
    );

    console.log(`\n✅ Added ${totalReservations} individual flight reservation(s)`);

    return {
      success: true,
      clusters: flightResults,
      totalReservations,
    };
  }
}

/**
 * Add flights from a cluster to a specific segment
 */
async function addFlightsToSegment(
  segmentId: string,
  flights: any[],
  flightData: FlightExtraction
) {
  // Get cached reservation type and status
  const flightType = await getReservationType("Travel", "Flight");
  const confirmedStatus = await getReservationStatus("Confirmed");

  const createdReservations = [];
  const costPerFlight = flightData.totalCost && flightData.totalCost !== 0 
    ? flightData.totalCost / flightData.flights.length 
    : undefined;

  for (const flight of flights) {
    const reservation = await prisma.reservation.create({
      data: {
        name: `${flight.carrier} ${flight.flightNumber}`,
        confirmationNumber: flightData.confirmationNumber,
        reservationTypeId: flightType.id,
        reservationStatusId: confirmedStatus.id,
        segmentId,
        startTime: new Date(`${flight.departureDate}T${convertTo24Hour(flight.departureTime)}`),
        endTime: new Date(`${flight.arrivalDate}T${convertTo24Hour(flight.arrivalTime)}`),
        cost: costPerFlight,
        currency: flightData.currency && flightData.currency !== "" ? flightData.currency : undefined,
        departureLocation: `${flight.departureCity} (${flight.departureAirport})`,
        arrivalLocation: `${flight.arrivalCity} (${flight.arrivalAirport})`,
        notes: [
          flight.cabin && flight.cabin !== "" ? `Cabin: ${flight.cabin}` : null,
          flight.seatNumber && flight.seatNumber !== "" ? `Seat: ${flight.seatNumber}` : null,
          flight.operatedBy && flight.operatedBy !== "" ? `Operated by: ${flight.operatedBy}` : null,
          flightData.eTicketNumber && flightData.eTicketNumber !== "" ? `E-ticket: ${flightData.eTicketNumber}` : null,
        ].filter(Boolean).join('\n'),
      },
    });

    createdReservations.push(reservation);
  }

  return createdReservations;
}

/**
 * Legacy function for adding all flights to a single segment
 * Used when autoCluster is disabled
 */
async function addFlightsToSingleSegment(
  segmentId: string,
  flightData: FlightExtraction
) {
  const reservations = await addFlightsToSegment(
    segmentId,
    flightData.flights,
    flightData
  );

  return {
    success: true,
    count: reservations.length,
    reservations,
  };
}

// Helper to convert "10:15 AM" to "10:15:00"
function convertTo24Hour(time: string): string {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "12:00:00";
  
  let [_, hours, minutes, period] = match;
  let h = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (period.toUpperCase() === 'AM' && h === 12) h = 0;
  
  return `${h.toString().padStart(2, '0')}:${minutes}:00`;
}
