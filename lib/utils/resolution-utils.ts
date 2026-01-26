/**
 * Utility functions for reservation resolution
 * These are client-side helpers and not server actions
 */

interface ReservationInput {
  name: string;
  vendor?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

/**
 * Check if a reservation needs resolution
 */
export function needsResolution(reservation: ReservationInput): boolean {
  // Has name or location but missing coordinates
  const hasIdentifier = !!(reservation.name || reservation.vendor || reservation.location);
  const missingCoordinates = !reservation.latitude || !reservation.longitude;
  
  return hasIdentifier && missingCoordinates;
}
