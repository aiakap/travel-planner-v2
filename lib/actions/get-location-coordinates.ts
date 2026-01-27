"use server";

import { prisma } from "@/lib/prisma";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

// Get API key dynamically
function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_address: string;
  }>;
  status: string;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  name: string;
}

/**
 * Get coordinates for a location name
 * First tries to find in trip data, then falls back to Google Geocoding API
 */
export async function getLocationCoordinates(
  locationName: string,
  tripId?: string
): Promise<LocationCoordinates | null> {
  // If tripId provided, try to find location in trip data first
  if (tripId) {
    const tripLocation = await findLocationInTrip(tripId, locationName);
    if (tripLocation) {
      return tripLocation;
    }
  }

  // Fall back to Google Geocoding API
  return await geocodeLocation(locationName);
}

/**
 * Find location coordinates in trip segments or reservations
 */
async function findLocationInTrip(
  tripId: string,
  locationName: string
): Promise<LocationCoordinates | null> {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        segments: {
          include: {
            reservations: true,
          },
        },
      },
    });

    if (!trip) return null;

    const lowerLocationName = locationName.toLowerCase();

    // Check segments
    for (const segment of trip.segments) {
      // Check start location
      if (
        segment.startTitle?.toLowerCase().includes(lowerLocationName) &&
        segment.startLat &&
        segment.startLng
      ) {
        return {
          lat: segment.startLat,
          lng: segment.startLng,
          name: segment.startTitle,
        };
      }

      // Check end location
      if (
        segment.endTitle?.toLowerCase().includes(lowerLocationName) &&
        segment.endLat &&
        segment.endLng
      ) {
        return {
          lat: segment.endLat,
          lng: segment.endLng,
          name: segment.endTitle,
        };
      }

      // Check reservations
      for (const reservation of segment.reservations) {
        if (
          reservation.vendor?.toLowerCase().includes(lowerLocationName) &&
          reservation.latitude &&
          reservation.longitude
        ) {
          return {
            lat: reservation.latitude,
            lng: reservation.longitude,
            name: reservation.vendor,
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding location in trip:", error);
    return null;
  }
}

/**
 * Geocode a location name using Google Geocoding API
 */
async function geocodeLocation(
  locationName: string
): Promise<LocationCoordinates | null> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Google Places API key not configured");
    return null;
  }

  try {
    const geocodeUrl = new URL(
      "https://maps.googleapis.com/maps/api/geocode/json"
    );
    geocodeUrl.searchParams.append("address", locationName);
    geocodeUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const response = await fetch(geocodeUrl.toString());
    const data: GeocodeResponse = await response.json();

    if (data.status !== "OK" || !data.results.length) {
      console.error("Geocoding failed:", data.status);
      return null;
    }

    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      name: result.formatted_address,
    };
  } catch (error) {
    console.error("Error geocoding location:", error);
    return null;
  }
}
