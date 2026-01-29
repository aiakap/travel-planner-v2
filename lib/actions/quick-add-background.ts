"use server";

import { initializeJob, updateJobResult, type JobResult } from "@/lib/cache/job-progress";
import { createSingleFlight, createDraftReservation } from "./quick-add-reservation";
import { addHotelsToTrip } from "./add-hotels-to-trip";
import { addCarRentalToTrip } from "./add-car-rentals-to-trip";
import { addTrainsToTrip } from "./add-trains-to-trip";
import { addRestaurantsToTrip } from "./add-restaurants-to-trip";
import { addEventsToTrip } from "./add-events-to-trip";
import { addCruisesToTrip } from "./add-cruises-to-trip";
import { addGenericReservationToTrip } from "./add-generic-reservation-to-trip";
import { addPrivateDriversToTrip } from "./travel/add-private-drivers-to-trip";
import type { FlightExtraction } from "@/lib/schemas/flight-extraction-schema";
import type { HotelExtraction } from "@/lib/schemas/hotel-extraction-schema";
import type { CarRentalExtraction } from "@/lib/schemas/car-rental-extraction-schema";
import type { TrainExtraction } from "@/lib/schemas/train-extraction-schema";
import type { RestaurantExtraction } from "@/lib/schemas/restaurant-extraction-schema";
import type { EventExtraction } from "@/lib/schemas/event-extraction-schema";
import type { CruiseExtraction } from "@/lib/schemas/cruise-extraction-schema";
import type { GenericReservation } from "@/lib/schemas/generic-reservation-schema";
import type { PrivateDriverExtraction } from "@/lib/schemas/extraction/travel/private-driver-extraction-schema";

/**
 * Process reservations in the background
 * Creates reservations one by one, updating progress after each
 */
export async function processReservationsInBackground(
  jobId: string,
  tripId: string,
  type: string,
  extractedData: any,
  segmentAssignments?: Record<number, {
    action: 'create' | 'match';
    segmentId?: string;
    segmentName: string;
  }>
): Promise<JobResult[]> {
  console.log('[Background] Starting job:', {
    jobId,
    tripId,
    type
  });

  // Handle multi-item types (flights, trains) that need per-item processing
  if (type === "flight") {
    return await processFlightReservations(jobId, tripId, extractedData as FlightExtraction, segmentAssignments);
  } else if (type === "train") {
    return await processTrainReservations(jobId, tripId, extractedData as TrainExtraction, segmentAssignments);
  } else {
    // Handle single-item types (hotel, car-rental, restaurant, event, cruise, private-driver, generic)
    return await processSingleReservation(jobId, tripId, type, extractedData, segmentAssignments);
  }
}

/**
 * Process flight reservations (multiple items)
 */
async function processFlightReservations(
  jobId: string,
  tripId: string,
  extractedData: FlightExtraction,
  segmentAssignments?: Record<number, {
    action: 'create' | 'match';
    segmentId?: string;
    segmentName: string;
  }>
): Promise<JobResult[]> {
  const flights = extractedData.flights || [];
  
  // Initialize job progress FIRST
  try {
    initializeJob(jobId, tripId, flights.length);
    console.log('[Background] Job initialized successfully:', jobId)
  } catch (error) {
    console.error('[Background] Failed to initialize job:', error)
    throw error
  }

  const results: JobResult[] = [];

  for (let i = 0; i < flights.length; i++) {
    const flight = flights[i];
    
    try {
      console.log(`[Background] Processing flight ${i + 1}/${flights.length}:`, {
        flightNumber: flight.flightNumber,
        route: `${flight.departureAirport} → ${flight.arrivalAirport}`
      });

      // Create single flight
      const reservationId = await createSingleFlight(
        tripId,
        flight,
        extractedData,
        segmentAssignments?.[i]
      );

      const result: JobResult = {
        index: i,
        status: 'success',
        reservationId
      };

      results.push(result);
      updateJobResult(jobId, i, result);

      console.log(`[Background] Flight ${i + 1} created successfully:`, reservationId);

    } catch (error) {
      console.error(`[Background] Flight ${i + 1} failed:`, error);

      // Create draft reservation with error
      try {
        const draftId = await createDraftReservation(
          tripId,
          flight,
          segmentAssignments?.[i],
          error instanceof Error ? error.message : "Unknown error"
        );

        const result: JobResult = {
          index: i,
          status: 'error',
          reservationId: draftId,
          error: error instanceof Error ? error.message : "Unknown error"
        };

        results.push(result);
        updateJobResult(jobId, i, result);

        console.log(`[Background] Draft created for flight ${i + 1}:`, draftId);
      } catch (draftError) {
        console.error(`[Background] Failed to create draft for flight ${i + 1}:`, draftError);
        
        const result: JobResult = {
          index: i,
          status: 'error',
          error: error instanceof Error ? error.message : "Unknown error"
        };

        results.push(result);
        updateJobResult(jobId, i, result);
      }
    }
  }

  console.log('[Background] Job complete:', {
    jobId,
    total: flights.length,
    successful: results.filter(r => r.status === 'success').length,
    errors: results.filter(r => r.status === 'error').length
  });

  return results;
}

/**
 * Process train reservations (multiple items)
 */
async function processTrainReservations(
  jobId: string,
  tripId: string,
  extractedData: TrainExtraction,
  segmentAssignments?: Record<number, {
    action: 'create' | 'match';
    segmentId?: string;
    segmentName: string;
  }>
): Promise<JobResult[]> {
  const trains = extractedData.trains || [];
  
  initializeJob(jobId, tripId, trains.length);
  const results: JobResult[] = [];

  for (let i = 0; i < trains.length; i++) {
    const train = trains[i];
    
    try {
      console.log(`[Background] Processing train ${i + 1}/${trains.length}:`, {
        trainNumber: train.trainNumber,
        route: `${train.departureCity} → ${train.arrivalCity}`
      });

      // Use train-specific action handler
      const result = await addTrainsToTrip(
        tripId,
        segmentAssignments?.[i]?.segmentId || null,
        extractedData,
        {
          autoCluster: false,
          maxGapHours: 48,
          createSuggestedSegments: !segmentAssignments?.[i]?.segmentId
        }
      );

      const jobResult: JobResult = {
        index: i,
        status: 'success',
        reservationId: result.reservationId || ''
      };

      results.push(jobResult);
      updateJobResult(jobId, i, jobResult);

      console.log(`[Background] Train ${i + 1} created successfully`);

    } catch (error) {
      console.error(`[Background] Train ${i + 1} failed:`, error);
      
      const jobResult: JobResult = {
        index: i,
        status: 'error',
        error: error instanceof Error ? error.message : "Unknown error"
      };

      results.push(jobResult);
      updateJobResult(jobId, i, jobResult);
    }
  }

  return results;
}

/**
 * Process single reservation (hotel, car-rental, restaurant, event, cruise, private-driver, generic)
 */
async function processSingleReservation(
  jobId: string,
  tripId: string,
  type: string,
  extractedData: any,
  segmentAssignments?: Record<number, {
    action: 'create' | 'match';
    segmentId?: string;
    segmentName: string;
  }>
): Promise<JobResult[]> {
  initializeJob(jobId, tripId, 1);
  const results: JobResult[] = [];

  try {
    console.log(`[Background] Processing ${type} reservation`);

    let result: any;
    const assignment = segmentAssignments?.[0];

    // Call appropriate action handler based on type
    switch (type) {
      case "hotel":
        result = await addHotelsToTrip({
          tripId,
          segmentId: assignment?.segmentId || null,
          hotelData: extractedData as HotelExtraction,
          options: {
            autoMatch: !assignment?.segmentId,
            minScore: 70,
            createSuggestedSegments: !assignment?.segmentId
          }
        });
        break;
        
      case "car-rental":
        result = await addCarRentalToTrip({
          tripId,
          segmentId: assignment?.segmentId || null,
          carRentalData: extractedData as CarRentalExtraction,
          options: {
            autoMatch: !assignment?.segmentId,
            minScore: 70,
            createSuggestedSegments: !assignment?.segmentId
          }
        });
        break;
        
      case "restaurant":
        result = await addRestaurantsToTrip({
          tripId,
          segmentId: assignment?.segmentId || null,
          restaurantData: extractedData as RestaurantExtraction,
          options: {
            autoMatch: !assignment?.segmentId,
            minScore: 70,
            createSuggestedSegments: !assignment?.segmentId
          }
        });
        break;
        
      case "event":
        result = await addEventsToTrip({
          tripId,
          segmentId: assignment?.segmentId || null,
          eventData: extractedData as EventExtraction,
          options: {
            autoMatch: !assignment?.segmentId,
            minScore: 70,
            createSuggestedSegments: !assignment?.segmentId
          }
        });
        break;
        
      case "cruise":
        result = await addCruisesToTrip({
          tripId,
          segmentId: assignment?.segmentId || null,
          cruiseData: extractedData as CruiseExtraction,
          options: {
            autoMatch: !assignment?.segmentId,
            createSuggestedSegments: !assignment?.segmentId
          }
        });
        break;
        
      case "private-driver":
        result = await addPrivateDriversToTrip({
          tripId,
          segmentId: assignment?.segmentId || null,
          privateDriverData: extractedData as PrivateDriverExtraction,
          options: {
            autoMatch: !assignment?.segmentId,
            minScore: 70,
            createSuggestedSegments: !assignment?.segmentId
          }
        });
        break;
        
      case "generic":
        result = await addGenericReservationToTrip({
          tripId,
          segmentId: assignment?.segmentId || null,
          reservationData: extractedData as GenericReservation,
          options: {
            autoMatch: !assignment?.segmentId,
            minScore: 70,
            createSuggestedSegments: !assignment?.segmentId
          }
        });
        break;
        
      default:
        throw new Error(`Unsupported reservation type: ${type}`);
    }

    const jobResult: JobResult = {
      index: 0,
      status: 'success',
      reservationId: result?.reservationId || result?.id || ''
    };

    results.push(jobResult);
    updateJobResult(jobId, 0, jobResult);

    console.log(`[Background] ${type} created successfully`);

  } catch (error) {
    console.error(`[Background] ${type} failed:`, error);
    
    const jobResult: JobResult = {
      index: 0,
      status: 'error',
      error: error instanceof Error ? error.message : "Unknown error"
    };

    results.push(jobResult);
    updateJobResult(jobId, 0, jobResult);
  }

  return results;
}

/**
 * Process flight reservations (multiple items) - original function
 */
async function processFlightReservations(
  jobId: string,
  tripId: string,
  extractedData: FlightExtraction,
  segmentAssignments?: Record<number, {
    action: 'create' | 'match';
    segmentId?: string;
    segmentName: string;
  }>
): Promise<JobResult[]> {
  const flights = extractedData.flights || [];
  
  // Initialize job progress FIRST
  try {
    initializeJob(jobId, tripId, flights.length);
    console.log('[Background] Job initialized successfully:', jobId)
  } catch (error) {
    console.error('[Background] Failed to initialize job:', error)
    throw error
  }

  const results: JobResult[] = [];

  for (let i = 0; i < flights.length; i++) {
    const flight = flights[i];
