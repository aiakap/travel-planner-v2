"use server";

import { prisma } from "@/lib/prisma";
import { getAirportTimezone } from "./airport-timezone";
import { dateTimeLocalToUTC } from "@/lib/utils/date-timezone";

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
    if (airportCodes?.departure && reservation.startTime) {
      console.log(`[Enrichment] Looking up departure timezone for ${airportCodes.departure}`);
      
      const departureTimezone = await getAirportTimezone(airportCodes.departure);
      
      if (departureTimezone) {
        updates.departureTimezone = departureTimezone;
        
        // Recalculate startTime with correct timezone
        // The current time was stored assuming server timezone, but it should be airport timezone
        // Extract the wall clock time (what the user sees: "10:15 AM")
        const currentTime = new Date(reservation.startTime);
        const wallClockTime = `${currentTime.getUTCFullYear()}-${String(currentTime.getUTCMonth() + 1).padStart(2, '0')}-${String(currentTime.getUTCDate()).padStart(2, '0')}T${String(currentTime.getUTCHours()).padStart(2, '0')}:${String(currentTime.getUTCMinutes()).padStart(2, '0')}`;
        
        console.log(`[Enrichment] Recalculating startTime:`, {
          original: reservation.startTime,
          wallClock: wallClockTime,
          timezone: departureTimezone
        });
        
        // Convert wall clock time to correct UTC using proper timezone
        const correctedUTC = dateTimeLocalToUTC(wallClockTime, departureTimezone);
        updates.startTime = new Date(correctedUTC);
        
        console.log(`[Enrichment] Corrected startTime:`, {
          from: reservation.startTime,
          to: updates.startTime
        });
      } else {
        console.warn(`[Enrichment] Could not determine timezone for ${airportCodes.departure}`);
      }
    }

    if (airportCodes?.arrival && reservation.endTime) {
      console.log(`[Enrichment] Looking up arrival timezone for ${airportCodes.arrival}`);
      
      const arrivalTimezone = await getAirportTimezone(airportCodes.arrival);
      
      if (arrivalTimezone) {
        updates.arrivalTimezone = arrivalTimezone;
        
        // Recalculate endTime with correct timezone
        const currentTime = new Date(reservation.endTime);
        const wallClockTime = `${currentTime.getUTCFullYear()}-${String(currentTime.getUTCMonth() + 1).padStart(2, '0')}-${String(currentTime.getUTCDate()).padStart(2, '0')}T${String(currentTime.getUTCHours()).padStart(2, '0')}:${String(currentTime.getUTCMinutes()).padStart(2, '0')}`;
        
        console.log(`[Enrichment] Recalculating endTime:`, {
          original: reservation.endTime,
          wallClock: wallClockTime,
          timezone: arrivalTimezone
        });
        
        const correctedUTC = dateTimeLocalToUTC(wallClockTime, arrivalTimezone);
        updates.endTime = new Date(correctedUTC);
        
        console.log(`[Enrichment] Corrected endTime:`, {
          from: reservation.endTime,
          to: updates.endTime
        });
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
