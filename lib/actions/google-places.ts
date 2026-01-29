"use server";

import { GooglePlaceData, GooglePlacePhoto } from "@/lib/types/place-suggestion";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

// Get API key dynamically (supports both GOOGLE_PLACES_API_KEY and GOOGLE_MAPS_API_KEY)
function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

interface PlacesTextSearchResponse {
  results: Array<{
    place_id: string;
    name: string;
    formatted_address: string;
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
  }>;
  status: string;
}

interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
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
      weekday_text?: string[];
    };
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    types?: string[];
  };
  status: string;
}

/**
 * Search for a place using Google Places Text Search API
 */
export async function searchPlace(
  placeName: string,
  locationContext?: string
): Promise<GooglePlaceData | null> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Google Places API key not configured");
    return null;
  }

  try {
    // Construct search query with location context if provided
    const query = locationContext
      ? `${placeName} in ${locationContext}`
      : placeName;

    // First, do a text search to find the place
    const searchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
    searchUrl.searchParams.append("query", query);
    searchUrl.searchParams.append("language", "en");
    searchUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData: PlacesTextSearchResponse = await searchResponse.json();

    if (searchData.status !== "OK" || !searchData.results.length) {
      console.error("Place not found:", searchData.status);
      return null;
    }

    const place = searchData.results[0];

    // Get detailed information about the place
    const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
    detailsUrl.searchParams.append("place_id", place.place_id);
    detailsUrl.searchParams.append("fields", [
      "place_id",
      "name",
      "formatted_address",
      "formatted_phone_number",
      "international_phone_number",
      "website",
      "rating",
      "user_ratings_total",
      "price_level",
      "photos",
      "opening_hours",
      "geometry",
      "types",
    ].join(","));
    detailsUrl.searchParams.append("language", "en");
    detailsUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData: PlaceDetailsResponse = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      console.error("Failed to get place details:", detailsData.status);
      return null;
    }

    const details = detailsData.result;

    // Format photos with URLs
    const photos: GooglePlacePhoto[] | undefined = details.photos
      ? await Promise.all(
          details.photos.map(async (photo) => ({
            photoReference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
            url: await getPhotoUrl(photo.photo_reference, 800), // Get 800px wide photos
          }))
        )
      : undefined;

    return {
      placeId: details.place_id,
      name: details.name,
      formattedAddress: details.formatted_address,
      phoneNumber: details.formatted_phone_number || details.international_phone_number,
      website: details.website,
      rating: details.rating,
      userRatingsTotal: details.user_ratings_total,
      priceLevel: details.price_level,
      photos,
      openingHours: details.opening_hours ? {
        openNow: details.opening_hours.open_now,
        weekdayText: details.opening_hours.weekday_text,
      } : undefined,
      geometry: details.geometry,
      types: details.types,
    };
  } catch (error) {
    console.error("Error searching for place:", error);
    return null;
  }
}

/**
 * Get a photo URL from Google Places
 * Note: This is a pure function but in a "use server" file, so it must be async
 */
export async function getPhotoUrl(photoReference: string, maxWidth: number = 400): Promise<string> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    return "/placeholder.svg";
  }

  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}

/**
 * Extract location context from a trip's segments
 */
export async function getLocationContextForTrip(tripId: string): Promise<string | undefined> {
  const { prisma } = await import("@/lib/prisma");
  
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        segments: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    if (trip?.segments[0]) {
      // Use the first segment's end location as the general trip location
      return trip.segments[0].endTitle;
    }

    return undefined;
  } catch (error) {
    console.error("Error getting location context:", error);
    return undefined;
  }
}

/**
 * Search for places with context awareness and disambiguation
 * Returns multiple results if ambiguous, single result if confident
 */
export async function searchPlaceWithContext(
  placeName: string,
  locationContext: string,
  options?: {
    maxResults?: number;
    includePhotos?: boolean;
  }
): Promise<{
  results: GooglePlaceData[];
  confidence: "high" | "medium" | "low";
  needsDisambiguation: boolean;
}> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Google Places API key not configured");
    return {
      results: [],
      confidence: "low",
      needsDisambiguation: false,
    };
  }

  const maxResults = options?.maxResults || 3;
  const includePhotos = options?.includePhotos !== false;

  try {
    // First search with location context
    const query = `${placeName} in ${locationContext}`;
    
    const searchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
    searchUrl.searchParams.append("query", query);
    searchUrl.searchParams.append("language", "en");
    searchUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData: PlacesTextSearchResponse = await searchResponse.json();

    // If no results with context, try without context
    if (searchData.status !== "OK" || !searchData.results.length) {
      console.log(`[Place Search] No results with context, trying without: "${placeName}"`);
      
      const fallbackUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
      fallbackUrl.searchParams.append("query", placeName);
      fallbackUrl.searchParams.append("language", "en");
      fallbackUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

      const fallbackResponse = await fetch(fallbackUrl.toString());
      const fallbackData: PlacesTextSearchResponse = await fallbackResponse.json();

      if (fallbackData.status !== "OK" || !fallbackData.results.length) {
        return {
          results: [],
          confidence: "low",
          needsDisambiguation: false,
        };
      }

      // Use fallback results but mark as low confidence
      const topResults = fallbackData.results.slice(0, maxResults);
      const detailedResults = await Promise.all(
        topResults.map(place => getPlaceDetails(place.place_id, includePhotos))
      );

      return {
        results: detailedResults.filter((r): r is GooglePlaceData => r !== null),
        confidence: "low",
        needsDisambiguation: topResults.length > 1,
      };
    }

    const results = searchData.results;
    
    // Determine confidence based on results
    let confidence: "high" | "medium" | "low" = "medium";
    let needsDisambiguation = false;

    if (results.length === 1) {
      confidence = "high";
    } else if (results.length <= 3) {
      confidence = "medium";
      needsDisambiguation = true;
    } else {
      confidence = "low";
      needsDisambiguation = true;
    }

    // Get detailed information for top results
    const topResults = results.slice(0, maxResults);
    const detailedResults = await Promise.all(
      topResults.map(place => getPlaceDetails(place.place_id, includePhotos))
    );

    return {
      results: detailedResults.filter((r): r is GooglePlaceData => r !== null),
      confidence,
      needsDisambiguation,
    };
  } catch (error) {
    console.error("Error searching for place with context:", error);
    return {
      results: [],
      confidence: "low",
      needsDisambiguation: false,
    };
  }
}

/**
 * Get detailed place information by place_id
 * Helper function for searchPlaceWithContext
 */
async function getPlaceDetails(
  placeId: string,
  includePhotos: boolean = true
): Promise<GooglePlaceData | null> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    return null;
  }

  try {
    const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
    detailsUrl.searchParams.append("place_id", placeId);
    detailsUrl.searchParams.append("fields", [
      "place_id",
      "name",
      "formatted_address",
      "formatted_phone_number",
      "international_phone_number",
      "website",
      "rating",
      "user_ratings_total",
      "price_level",
      "photos",
      "opening_hours",
      "geometry",
      "types",
    ].join(","));
    detailsUrl.searchParams.append("language", "en");
    detailsUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const detailsResponse = await fetch(detailsUrl.toString());
    const detailsData: PlaceDetailsResponse = await detailsResponse.json();

    if (detailsData.status !== "OK") {
      console.error("Failed to get place details:", detailsData.status);
      return null;
    }

    const details = detailsData.result;

    // Format photos with URLs
    const photos: GooglePlacePhoto[] | undefined = includePhotos && details.photos
      ? await Promise.all(
          details.photos.slice(0, 3).map(async (photo) => ({
            photoReference: photo.photo_reference,
            width: photo.width,
            height: photo.height,
            url: await getPhotoUrl(photo.photo_reference, 800),
          }))
        )
      : undefined;

    return {
      placeId: details.place_id,
      name: details.name,
      formattedAddress: details.formatted_address,
      phoneNumber: details.formatted_phone_number || details.international_phone_number,
      website: details.website,
      rating: details.rating,
      userRatingsTotal: details.user_ratings_total,
      priceLevel: details.price_level,
      photos,
      openingHours: details.opening_hours ? {
        openNow: details.opening_hours.open_now,
        weekdayText: details.opening_hours.weekday_text,
      } : undefined,
      geometry: details.geometry,
      types: details.types,
    };
  } catch (error) {
    console.error("Error getting place details:", error);
    return null;
  }
}
