"use server";

const PLACES_API_BASE = "https://maps.googleapis.com/maps/api/place";

function getApiKey(): string | undefined {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
}

interface AutocompleteResult {
  name: string;
  formatted_address: string;
  place_id: string;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

/**
 * Lightweight autocomplete search for places
 * Returns basic info without full details
 */
export async function searchPlacesAutocomplete(
  query: string
): Promise<Array<{
  name: string;
  image: string | null;
  placeId: string;
  lat: number;
  lng: number;
}>> {
  const GOOGLE_PLACES_API_KEY = getApiKey();
  if (!GOOGLE_PLACES_API_KEY) {
    console.error("Google Places API key not configured");
    return [];
  }

  if (query.length < 2) {
    return [];
  }

  try {
    // Use Text Search for simplicity
    const searchUrl = new URL(`${PLACES_API_BASE}/textsearch/json`);
    searchUrl.searchParams.append("query", query);
    searchUrl.searchParams.append("language", "en");
    searchUrl.searchParams.append("key", GOOGLE_PLACES_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();

    if (searchData.status !== "OK" || !searchData.results) {
      return [];
    }

    // Take top 5 results
    const results: AutocompleteResult[] = searchData.results.slice(0, 5);

    // Format results
    return results.map((place) => {
      let imageUrl: string | null = null;

      // Get first photo if available
      if (place.photos && place.photos.length > 0) {
        const photoRef = place.photos[0].photo_reference;
        imageUrl = `${PLACES_API_BASE}/photo?maxwidth=400&photo_reference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
      }

      return {
        name: place.formatted_address || place.name,
        image: imageUrl,
        placeId: place.place_id,
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      };
    });
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}
