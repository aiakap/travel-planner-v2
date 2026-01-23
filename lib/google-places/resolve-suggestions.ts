"use server";

import { PlaceSuggestion, GooglePlaceData, PlaceDataMap, Stage2Output } from "@/lib/types/place-pipeline";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

// Get API key dynamically
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
  error_message?: string;
}

interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    url?: string;
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
  error_message?: string;
}

/**
 * Stage 2: Google Places Resolution
 * 
 * Takes a list of place suggestions and resolves each one to real Google Places data.
 * This is a non-AI process that uses the Google Places API.
 */
export async function resolvePlaces(
  suggestions: PlaceSuggestion[]
): Promise<Stage2Output> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error("Google Places API key not configured");
  }

  console.log(`🔍 [Stage 2] Resolving ${suggestions.length} place suggestions`);

  const placeMap: PlaceDataMap = {};
  const errors: Array<{ suggestedName: string; error: string }> = [];

  // Process each suggestion
  for (const suggestion of suggestions) {
    try {
      console.log(`   Processing: ${suggestion.suggestedName}`);
      
      // Step 1: Text search to find the place
      const searchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
      searchUrl.searchParams.append("query", suggestion.searchQuery);
      searchUrl.searchParams.append("language", "en");
      searchUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

      const searchResponse = await fetch(searchUrl.toString());
      const searchData: PlacesTextSearchResponse = await searchResponse.json();

      if (searchData.status !== "OK" || !searchData.results.length) {
        console.warn(`   ⚠️  Place not found: ${suggestion.suggestedName} (${searchData.status})`);
        placeMap[suggestion.suggestedName] = {
          placeId: "",
          name: suggestion.suggestedName,
          formattedAddress: "",
          notFound: true,
        };
        errors.push({
          suggestedName: suggestion.suggestedName,
          error: `Not found: ${searchData.status}${searchData.error_message ? ` - ${searchData.error_message}` : ""}`,
        });
        continue;
      }

      const place = searchData.results[0];

      // Step 2: Get detailed information
      const detailsUrl = new URL(`${PLACES_API_BASE}/details/json`);
      detailsUrl.searchParams.append("place_id", place.place_id);
      detailsUrl.searchParams.append("fields", [
        "place_id",
        "name",
        "formatted_address",
        "formatted_phone_number",
        "international_phone_number",
        "website",
        "url",
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
        console.warn(`   ⚠️  Failed to get details: ${suggestion.suggestedName}`);
        placeMap[suggestion.suggestedName] = {
          placeId: place.place_id,
          name: place.name,
          formattedAddress: place.formatted_address,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          priceLevel: place.price_level,
          location: place.geometry.location,
        };
        errors.push({
          suggestedName: suggestion.suggestedName,
          error: `Details failed: ${detailsData.status}`,
        });
        continue;
      }

      const details = detailsData.result;

      // Build the complete place data
      placeMap[suggestion.suggestedName] = {
        placeId: details.place_id,
        name: details.name,
        formattedAddress: details.formatted_address,
        rating: details.rating,
        userRatingsTotal: details.user_ratings_total,
        priceLevel: details.price_level,
        photos: details.photos?.map(photo => ({
          reference: photo.photo_reference,
          width: photo.width,
          height: photo.height,
        })),
        formattedPhoneNumber: details.formatted_phone_number,
        internationalPhoneNumber: details.international_phone_number,
        website: details.website,
        url: details.url,
        location: details.geometry.location,
        openingHours: details.opening_hours ? {
          openNow: details.opening_hours.open_now,
          weekdayText: details.opening_hours.weekday_text,
        } : undefined,
      };

      console.log(`   ✅ Found: ${details.name} (${details.rating}⭐)`);
    } catch (error) {
      console.error(`   ❌ Error resolving ${suggestion.suggestedName}:`, error);
      placeMap[suggestion.suggestedName] = {
        placeId: "",
        name: suggestion.suggestedName,
        formattedAddress: "",
        notFound: true,
      };
      errors.push({
        suggestedName: suggestion.suggestedName,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  const successCount = Object.values(placeMap).filter(p => !p.notFound).length;
  console.log(`✅ [Stage 2] Resolved ${successCount}/${suggestions.length} places`);

  return {
    placeMap,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Helper function to get a photo URL from Google Places
 * Note: Must be async because this file uses "use server" directive
 */
export async function getPhotoUrl(photoReference: string, maxWidth: number = 400): Promise<string> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    return "/placeholder.svg";
  }

  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`;
}
