"use server";

import { initializeJob, updateJobResult, type JobResult } from "@/lib/cache/job-progress";
import { createSingleFlight, createDraftReservation } from "./quick-add-reservation";
import type { FlightExtraction } from "@/lib/schemas/flight-extraction-schema";

/**
 * Process reservations in the background
 * Creates flights one by one, updating progress after each
 */
export async function processReservationsInBackground(
  jobId: string,
  tripId: string,
  type: string,
  extractedData: FlightExtraction,
  segmentAssignments?: Record<number, {
    action: 'create' | 'match';
    segmentId?: string;
    segmentName: string;
  }>
): Promise<JobResult[]> {
  console.log('[Background] Starting job:', {
    jobId,
    tripId,
    flightCount: extractedData.flights?.length || 0
  });

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
