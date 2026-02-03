"use server";

import { prisma } from "@/lib/prisma";
import { getAirportTimezone } from "./airport-timezone";
import { localToUTC, pgDateToString, pgTimeToString } from "@/lib/utils/local-time";

/**
 * Enrich a reservation with timezone and location data
 * Runs asynchronously after reservation creation
 * 
 * This follows the "write fast, enrich later" pattern:
 * - Reservations are created immediately with basic data
 * - This function fills in timezone data in the background
 * - Times are recalculated with correct timezone context
 * - Failures don't break the original operation
 * 
 * @param reservationId - ID of the reservation to enrich
 * @param airportCodes - Airport codes for timezone lookup (for flights)
 */
export async function enrichReservation(
  reservationId: string,
  airportCodes?: { departure?: string; arrival?: string }
) {
  console.log(`[Enrichment] Starting reservation ${reservationId}`, airportCodes);

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
    if (airportCodes?.departure && (reservation.wall_start_date || reservation.startTime)) {
      console.log(`[Enrichment] Looking up departure timezone for ${airportCodes.departure}`);
      
      const departureTimezone = await getAirportTimezone(airportCodes.departure);
      
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
        console.warn(`[Enrichment] Could not determine timezone for ${airportCodes.departure}`);
      }
    }

    if (airportCodes?.arrival && (reservation.wall_end_date || reservation.endTime)) {
      console.log(`[Enrichment] Looking up arrival timezone for ${airportCodes.arrival}`);
      
      const arrivalTimezone = await getAirportTimezone(airportCodes.arrival);
      
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
        console.warn(`[Enrichment] Could not determine timezone for ${airportCodes.arrival}`);
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
