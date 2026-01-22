"use server";

import { generateSuggestionMapUrl as generateMapUrl } from "@/lib/map-url-generator";

/**
 * Server Action wrapper for generating map URLs
 * Required to be async due to "use server" directive
 * For client components, import directly from @/lib/map-url-generator
 */
export async function generateSuggestionMapUrl(
  suggestion: {
    destinationLat: number;
    destinationLng: number;
    keyLocations: Array<{ lat: number; lng: number; name: string }>;
    tripType: string;
  },
  width: number = 300,
  height: number = 150
): Promise<string> {
  return generateMapUrl(suggestion, width, height);
}

/**
 * Geocode a destination if coordinates are missing
 */
export async function geocodeDestination(destination: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${apiKey}`
    );
    
    const data = await response.json();
    if (data.results?.[0]?.geometry?.location) {
      return {
        lat: data.results[0].geometry.location.lat,
        lng: data.results[0].geometry.location.lng,
      };
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
  }
  
  return null;
}
