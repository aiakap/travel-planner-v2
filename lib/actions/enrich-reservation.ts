"use server";

import { prisma } from "@/lib/prisma";
import { getAirportTimezone } from "./airport-timezone";
import { localToUTC, pgDateToString, pgTimeToString } from "@/lib/utils/local-time";
import { searchPlace } from "./google-places";
import { queueReservationImageGeneration } from "./queue-image-generation";

/**
 * Log an image enrichment attempt for debugging and analytics
 */
async function logImageEnrichment(params: {
  reservationId: string;
  reservationName: string;
  searchQuery: string | null;
  source: "google_places" | "ai_generation";
  status: "success" | "no_results" | "api_error" | "timeout";
  errorMessage?: string;
  errorCode?: string;
  photoUrl?: string;
}) {
  try {
    await prisma.imageEnrichmentLog.create({
      data: {
        reservationId: params.reservationId,
        reservationName: params.reservationName,
        searchQuery: params.searchQuery,
        source: params.source,
        status: params.status,
        errorMessage: params.errorMessage,
        errorCode: params.errorCode,
        photoUrl: params.photoUrl,
      },
    });
  } catch (e) {
    console.error("[ImageEnrichment] Failed to log:", e);
  }
}

/**
 * Enrich a reservation with timezone, location, and image data
 * Runs asynchronously after reservation creation
 * 
 * This follows the "write fast, enrich later" pattern:
 * - Reservations are created immediately with basic data
 * - This function fills in timezone data and images in the background
 * - Times are recalculated with correct timezone context
 * - Failures don't break the original operation
 * 
 * @param reservationId - ID of the reservation to enrich
 * @param context - Context for enrichment:
 *   - departureAirport/arrivalAirport: For flights (timezone lookup + image from arrival airport)
 *   - locationQuery: For other reservations (e.g., "Marriott Hotel 123 Main St New York")
 */
export async function enrichReservation(
  reservationId: string,
  context?: {
    // For flights - airport codes
    departureAirport?: string;
    arrivalAirport?: string;
    // For any reservation - explicit search query for image
    locationQuery?: string;
  }
) {
  console.log(`[Enrichment] Starting reservation ${reservationId}`, context);

  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) {
      console.error(`[Enrichment] Reservation ${reservationId} not found`);
      return null;
    }

    const updates: any = {};

    // Enrich timezone data for flights (point-to-point reservations)
    if (context?.departureAirport && (reservation.wall_start_date || reservation.startTime)) {
      console.log(`[Enrichment] Looking up departure timezone for ${context.departureAirport}`);
      
      const departureTimezone = await getAirportTimezone(context.departureAirport);
      
      if (departureTimezone) {
        updates.departureTimezone = departureTimezone;
        
        // Read wall clock time from the correct fields (wall_start_date, wall_start_time)
        // These contain the local time as the user sees it (e.g., "10:15 AM")
        const wallDate = pgDateToString(reservation.wall_start_date);
        const wallTime = pgTimeToString(reservation.wall_start_time) || "00:00";
        
        if (wallDate) {
          console.log(`[Enrichment] Recalculating startTime from wall clock:`, {
            wallDate,
            wallTime,
            timezone: departureTimezone
          });
          
          // Convert wall clock time to correct UTC using proper timezone
          updates.startTime = localToUTC(wallDate, wallTime, departureTimezone);
          
          console.log(`[Enrichment] Corrected startTime:`, {
            from: reservation.startTime,
            to: updates.startTime
          });
        }
      } else {
        console.warn(`[Enrichment] Could not determine timezone for ${context.departureAirport}`);
      }
    }

    if (context?.arrivalAirport && (reservation.wall_end_date || reservation.endTime)) {
      console.log(`[Enrichment] Looking up arrival timezone for ${context.arrivalAirport}`);
      
      const arrivalTimezone = await getAirportTimezone(context.arrivalAirport);
      
      if (arrivalTimezone) {
        updates.arrivalTimezone = arrivalTimezone;
        
        // Read wall clock time from the correct fields (wall_end_date, wall_end_time)
        const wallDate = pgDateToString(reservation.wall_end_date);
        const wallTime = pgTimeToString(reservation.wall_end_time) || "00:00";
        
        if (wallDate) {
          console.log(`[Enrichment] Recalculating endTime from wall clock:`, {
            wallDate,
            wallTime,
            timezone: arrivalTimezone
          });
          
          updates.endTime = localToUTC(wallDate, wallTime, arrivalTimezone);
          
          console.log(`[Enrichment] Corrected endTime:`, {
            from: reservation.endTime,
            to: updates.endTime
          });
        }
      } else {
        console.warn(`[Enrichment] Could not determine timezone for ${context.arrivalAirport}`);
      }
    }

    // Always try to get an image if none exists and not a custom image
    if (!reservation.imageUrl && !reservation.imageIsCustom) {
      let searchQuery: string | null = null;
      
      // Build search query based on available context
      if (context?.arrivalAirport) {
        // Flights: use arrival airport
        searchQuery = `${context.arrivalAirport} airport`;
      } else if (context?.departureAirport) {
        // Fallback to departure airport
        searchQuery = `${context.departureAirport} airport`;
      } else if (context?.locationQuery) {
        // Explicit location query passed in
        searchQuery = context.locationQuery;
      } else if (reservation.location) {
        // Use reservation location + name
        searchQuery = `${reservation.name} ${reservation.location}`;
      } else if (reservation.name) {
        // Last resort: just the name
        searchQuery = reservation.name;
      }
      
      if (searchQuery) {
        console.log(`[Enrichment] Searching for image with query: "${searchQuery}"`);
        
        try {
          const placeData = await searchPlace(searchQuery);
          
          if (placeData?.photos?.[0]?.url) {
            updates.imageUrl = placeData.photos[0].url;
            console.log(`[Enrichment] Found Google Places image for ${reservation.name}`);
            
            await logImageEnrichment({
              reservationId,
              reservationName: reservation.name,
              searchQuery,
              source: "google_places",
              status: "success",
              photoUrl: placeData.photos[0].url,
            });
          } else {
            console.log(`[Enrichment] No Google Places photo found for query: "${searchQuery}"`);
            
            await logImageEnrichment({
              reservationId,
              reservationName: reservation.name,
              searchQuery,
              source: "google_places",
              status: "no_results",
            });
            
            // Queue AI image generation as fallback
            console.log(`[Enrichment] Queuing AI image generation for ${reservation.name}`);
            queueReservationImageGeneration(reservationId).catch((err) => {
              console.error(`[Enrichment] Failed to queue AI image generation:`, err);
              logImageEnrichment({
                reservationId,
                reservationName: reservation.name,
                searchQuery: null,
                source: "ai_generation",
                status: "api_error",
                errorMessage: err.message,
              });
            });
          }
        } catch (error: any) {
          console.error(`[Enrichment] Google Places API error:`, error);
          
          await logImageEnrichment({
            reservationId,
            reservationName: reservation.name,
            searchQuery,
            source: "google_places",
            status: "api_error",
            errorMessage: error.message,
            errorCode: error.code,
          });
          
          // Still try AI generation on API error
          console.log(`[Enrichment] Falling back to AI image generation after API error`);
          queueReservationImageGeneration(reservationId).catch((err) => {
            console.error(`[Enrichment] Failed to queue AI image generation:`, err);
          });
        }
      } else {
        console.log(`[Enrichment] No search query could be built for reservation ${reservationId}`);
        
        // Queue AI generation if no search query available
        queueReservationImageGeneration(reservationId).catch((err) => {
          console.error(`[Enrichment] Failed to queue AI image generation:`, err);
        });
      }
    }

    // Update reservation if we have enrichments
    if (Object.keys(updates).length > 0) {
      console.log(`[Enrichment] Updating reservation ${reservationId} with:`, Object.keys(updates));
      
      await prisma.reservation.update({
        where: { id: reservationId },
        data: updates
      });
      
      console.log(`[Enrichment] Successfully enriched reservation ${reservationId}`);
      return updates;
    } else {
      console.log(`[Enrichment] No updates needed for reservation ${reservationId}`);
      return null;
    }
    
  } catch (error) {
    console.error(`[Enrichment] Error enriching reservation ${reservationId}:`, error);
    // Don't throw - enrichment failures shouldn't break the flow
    return null;
  }
}
