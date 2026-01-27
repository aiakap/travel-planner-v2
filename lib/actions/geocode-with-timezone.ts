"use server";

import { getTimeZoneForLocation } from "./timezone";

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted: string;
}

interface GeocodeWithTimezoneResult extends GeocodeResult {
  timeZoneId: string | null;
  timeZoneName: string | null;
}

/**
 * Geocode an address using Google Geocoding API
 */
async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.append("address", address);
    url.searchParams.append("key", apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      console.error("Geocoding API error:", response.status);
      return null;
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.results?.[0]) {
      console.error("Geocoding API returned error:", data.status);
      return null;
    }

    const result = data.results[0];
    const location = result.geometry.location;

    return {
      lat: location.lat,
      lng: location.lng,
      formatted: result.formatted_address,
    };
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

/**
 * Geocode an address and fetch its timezone information in one call
 * This is a convenience function that combines geocoding and timezone lookup
 * 
 * @param address - The address to geocode
 * @param timestamp - Optional timestamp for timezone lookup (defaults to current time)
 * @returns Geocoded location with timezone information, or null if geocoding fails
 */
export async function geocodeWithTimezone(
  address: string,
  timestamp?: Date
): Promise<GeocodeWithTimezoneResult | null> {
  // First, geocode the address
  const geocodeResult = await geocodeAddress(address);
  
  if (!geocodeResult) {
    return null;
  }

  // Then fetch timezone for the coordinates
  const ts = timestamp ? Math.floor(timestamp.getTime() / 1000) : undefined;
  const timezone = await getTimeZoneForLocation(
    geocodeResult.lat,
    geocodeResult.lng,
    ts
  );

  return {
    ...geocodeResult,
    timeZoneId: timezone?.timeZoneId ?? null,
    timeZoneName: timezone?.timeZoneName ?? null,
  };
}

/**
 * Geocode multiple addresses with timezone information in parallel
 * Useful for segment creation where you need start and end locations
 * 
 * @param addresses - Array of addresses to geocode
 * @param timestamps - Optional array of timestamps (same length as addresses)
 * @returns Array of geocoded locations with timezone information
 */
export async function geocodeMultipleWithTimezone(
  addresses: string[],
  timestamps?: Date[]
): Promise<(GeocodeWithTimezoneResult | null)[]> {
  return Promise.all(
    addresses.map((address, index) => 
      geocodeWithTimezone(address, timestamps?.[index])
    )
  );
}
