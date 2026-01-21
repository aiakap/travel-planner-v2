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
