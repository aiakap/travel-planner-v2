"use server";

import { prisma } from "@/lib/prisma";
import { getTimeZoneForLocation } from "./timezone";

/**
 * Get timezone for an airport code using hybrid lookup:
 * 1. Check database cache (AirportTimezone table)
 * 2. If not found, query Google Places API
 * 3. Cache result in database for future lookups
 * 
 * @param airportCode - IATA airport code (e.g., "SFO", "JFK", "LHR")
 * @returns IANA timezone identifier (e.g., "America/Los_Angeles") or null if not found
 */
export async function getAirportTimezone(airportCode: string): Promise<string | null> {
  if (!airportCode) return null;
  
  const code = airportCode.toUpperCase().trim();
  
  // Step 1: Check database cache
  try {
    const cached = await prisma.airportTimezone.findUnique({
      where: { code }
    });
    
    if (cached) {
      console.log(`[AirportTZ] Cache hit for ${code}: ${cached.timeZoneId}`);
      return cached.timeZoneId;
    }
  } catch (error) {
    console.error(`[AirportTZ] Cache lookup error for ${code}:`, error);
    // Continue to Google API lookup
  }
  
  console.log(`[AirportTZ] Cache miss for ${code}, querying Google...`);
  
  // Step 2: Query Google Places API
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('[AirportTZ] GOOGLE_MAPS_API_KEY not configured');
      return null;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(code + ' airport')}&key=${apiKey}`,
      { next: { revalidate: 86400 } } // Cache for 24 hours
    );
    
    if (!response.ok) {
      console.error(`[AirportTZ] Google API error for ${code}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.warn(`[AirportTZ] No results from Google for ${code}:`, data.status);
      return null;
    }
    
    const result = data.results[0];
    const location = result.geometry.location;
    const lat = location.lat;
    const lng = location.lng;
    
    console.log(`[AirportTZ] Found coordinates for ${code}:`, { lat, lng });
    
    // Get timezone from coordinates
    const timezone = await getTimeZoneForLocation(lat, lng);
    
    if (timezone?.timeZoneId) {
      // Step 3: Cache in database
      try {
        await prisma.airportTimezone.create({
          data: {
            code,
            timeZoneId: timezone.timeZoneId,
            airportName: result.formatted_address,
            latitude: lat,
            longitude: lng
          }
        });
        
        console.log(`[AirportTZ] Cached ${code}: ${timezone.timeZoneId}`);
      } catch (cacheError) {
        // Ignore cache errors (might be duplicate key if concurrent requests)
        console.error(`[AirportTZ] Failed to cache ${code}:`, cacheError);
      }
      
      return timezone.timeZoneId;
    }
    
    console.warn(`[AirportTZ] No timezone found for ${code} at (${lat}, ${lng})`);
    return null;
    
  } catch (error) {
    console.error(`[AirportTZ] Error looking up ${code}:`, error);
    return null;
  }
}

/**
 * Batch lookup multiple airport codes
 * More efficient than individual lookups
 */
export async function getAirportTimezones(
  airportCodes: string[]
): Promise<Record<string, string | null>> {
  const results: Record<string, string | null> = {};
  
  // Lookup all codes in parallel
  await Promise.all(
    airportCodes.map(async (code) => {
      results[code] = await getAirportTimezone(code);
    })
  );
  
  return results;
}
