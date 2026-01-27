"use server";

import { GooglePlaceData } from "@/lib/types/place-suggestion";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

// Get API key dynamically
function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

interface NearbySearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    vicinity: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types?: string[];
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    photos?: Array<{
      photo_reference: string;
      height: number;
      width: number;
    }>;
    opening_hours?: {
      open_now?: boolean;
    };
    business_status?: string;
  }>;
  status: string;
  error_message?: string;
}

/**
 * Search for nearby places using Google Places Nearby Search API
 */
export async function searchNearbyPlaces(
  latitude: number,
  longitude: number,
  radius: number = 1000, // in meters
  type?: string, // restaurant, cafe, tourist_attraction, etc.
  keyword?: string
): Promise<GooglePlaceData[]> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Google Places API key not configured");
    return [];
  }

  try {
    const searchUrl = new URL(`${PLACES_API_BASE}/nearbysearch/json`);
    searchUrl.searchParams.append("location", `${latitude},${longitude}`);
    searchUrl.searchParams.append("radius", radius.toString());
    searchUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);
    
    if (type) {
      searchUrl.searchParams.append("type", type);
    }
    
    if (keyword) {
      searchUrl.searchParams.append("keyword", keyword);
    }

    const response = await fetch(searchUrl.toString());
    const data: NearbySearchResponse = await response.json();

    if (data.status !== "OK") {
      console.error("Nearby search failed:", data.status, data.error_message);
      return [];
    }

    // Transform results to GooglePlaceData format
    const places: GooglePlaceData[] = data.results.map((place) => ({
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.vicinity,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      priceLevel: place.price_level,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
      photos: place.photos?.map((photo) => ({
        reference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })),
      openingHours: place.opening_hours
        ? {
            openNow: place.opening_hours.open_now,
          }
        : undefined,
      types: place.types,
    }));

    return places;
  } catch (error) {
    console.error("Error searching nearby places:", error);
    return [];
  }
}

/**
 * Get photo URL for a place photo reference
 */
export async function getPhotoUrl(
  photoReference: string,
  maxWidth: number = 400
): Promise<string> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    return "";
  }

  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}
