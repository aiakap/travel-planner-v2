/**
 * API Resolution Service
 * Handles parallel fetching from multiple APIs based on place concepts
 */

import type {
  PlaceConcept,
  PlaceCategory,
  RawAPIResults,
  GooglePlaceSourceData,
  YelpBusinessSourceData,
  AmadeusSourceData,
  WeatherSourceData,
} from "@/lib/types/consolidated-place";

import {
  googlePlacesClient,
  yelpClient,
  amadeusClient,
  weatherClient,
  getAPIStatus,
} from "@/lib/api-clients";

import { withRateLimit } from "@/lib/utils/rate-limiter";

// ============================================================================
// Debug Logging
// ============================================================================

const DEBUG_ENABLED = process.env.NODE_ENV === "development" || process.env.CONSOLIDATED_API_DEBUG === "true";

function debugLog(api: string, action: string, details?: any, durationMs?: number) {
  if (!DEBUG_ENABLED) return;
  
  const prefix = `[APIResolution][${api}]`;
  const duration = durationMs !== undefined ? ` (${durationMs}ms)` : "";
  console.log(`${prefix} ${action}${duration}`);
  if (details) {
    console.log(`  ${JSON.stringify(details, null, 2).substring(0, 300)}`);
  }
}

// ============================================================================
// Types
// ============================================================================

export interface ResolutionOptions {
  includeGoogle?: boolean;
  includeYelp?: boolean;
  includeAmadeus?: boolean;
  includeWeather?: boolean;
  weatherCoordinates?: { lat: number; lng: number };
  weatherDates?: { start: string; end: string };
  tripContext?: {
    checkInDate?: string;
    checkOutDate?: string;
    adults?: number;
  };
}

export interface ResolutionResult {
  results: RawAPIResults;
  timing: {
    total: number;
    google: number;
    yelp: number;
    amadeus: number;
    weather?: number;
  };
}

// ============================================================================
// API Routing Logic
// ============================================================================

/**
 * Determine which APIs to query based on place category
 */
function getApisForCategory(category: PlaceCategory): {
  primary: ("google" | "yelp" | "amadeus")[];
  secondary: ("google" | "yelp" | "amadeus")[];
} {
  switch (category) {
    case "restaurant":
    case "cafe":
    case "bar":
    case "nightlife":
      return {
        primary: ["yelp"],
        secondary: ["google"],
      };
    case "hotel":
      return {
        primary: ["google"],
        secondary: ["amadeus"],
      };
    case "attraction":
      return {
        primary: ["google"],
        secondary: ["amadeus"], // For tours/activities
      };
    case "activity":
      return {
        primary: ["amadeus"], // Tours & Activities
        secondary: ["google"],
      };
    case "transport":
      return {
        primary: ["amadeus"],
        secondary: [],
      };
    case "shopping":
      return {
        primary: ["google"],
        secondary: ["yelp"],
      };
    default:
      return {
        primary: ["google"],
        secondary: ["yelp"],
      };
  }
}

// ============================================================================
// Resolution Functions
// ============================================================================

/**
 * Resolve places via Google Places API
 */
async function resolveGooglePlaces(
  concepts: PlaceConcept[]
): Promise<Map<string, GooglePlaceSourceData>> {
  const results = new Map<string, GooglePlaceSourceData>();

  if (concepts.length === 0) {
    debugLog("Google", "Skipped - no concepts to resolve");
    return results;
  }

  debugLog("Google", `Starting resolution for ${concepts.length} concepts`, {
    concepts: concepts.map(c => c.name),
  });

  const searchPromises = concepts.map(async (concept) => {
    const startTime = Date.now();
    try {
      debugLog("Google", `Searching for: "${concept.name}"`);
      
      const searchResult = await withRateLimit("google", () =>
        googlePlacesClient.search({
          query: concept.name,
          locationContext: concept.location?.city
            ? `${concept.location.city}${concept.location.country ? ", " + concept.location.country : ""}`
            : undefined,
          coordinates: concept.location?.coordinates,
          maxResults: 1,
          includePhotos: true,
        })
      );

      const duration = Date.now() - startTime;
      
      if (searchResult.places.length > 0) {
        const place = searchResult.places[0];
        results.set(concept.name, place);
        debugLog("Google", `Found: "${concept.name}" -> "${place.name}"`, {
          placeId: place.placeId,
          rating: place.rating,
          address: place.formattedAddress?.substring(0, 50),
        }, duration);
      } else {
        debugLog("Google", `No results for: "${concept.name}"`, null, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      debugLog("Google", `ERROR for "${concept.name}": ${errorMsg}`, null, duration);
      console.error(
        `[APIResolution] Google Places error for "${concept.name}":`,
        error
      );
    }
  });

  await Promise.allSettled(searchPromises);
  debugLog("Google", `Completed: ${results.size}/${concepts.length} resolved`);
  return results;
}

/**
 * Resolve places via Yelp API
 */
async function resolveYelp(
  concepts: PlaceConcept[]
): Promise<Map<string, YelpBusinessSourceData>> {
  const results = new Map<string, YelpBusinessSourceData>();

  if (concepts.length === 0) {
    debugLog("Yelp", "Skipped - no concepts to resolve");
    return results;
  }

  debugLog("Yelp", `Starting resolution for ${concepts.length} concepts`, {
    concepts: concepts.map(c => c.name),
  });

  const searchPromises = concepts.map(async (concept) => {
    const startTime = Date.now();
    try {
      const location = concept.location?.city
        ? `${concept.location.city}${concept.location.country ? ", " + concept.location.country : ""}`
        : undefined;

      debugLog("Yelp", `Searching for: "${concept.name}" in ${location || "unknown"}`);

      const searchResult = await withRateLimit("yelp", () =>
        yelpClient.search({
          term: concept.name,
          location,
          coordinates: concept.location?.coordinates,
          limit: 3,
          sortBy: "best_match",
        })
      );

      const duration = Date.now() - startTime;

      // Find the best match
      if (searchResult.businesses.length > 0) {
        // Try to find exact name match first
        const exactMatch = searchResult.businesses.find(
          (b) => b.name.toLowerCase() === concept.name.toLowerCase()
        );
        const selected = exactMatch || searchResult.businesses[0];
        results.set(concept.name, selected);
        
        debugLog("Yelp", `Found: "${concept.name}" -> "${selected.name}"`, {
          id: selected.id,
          rating: selected.rating,
          reviewCount: selected.reviewCount,
          exactMatch: !!exactMatch,
          totalResults: searchResult.businesses.length,
        }, duration);
      } else {
        debugLog("Yelp", `No results for: "${concept.name}"`, null, duration);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      debugLog("Yelp", `ERROR for "${concept.name}": ${errorMsg}`, null, duration);
      console.error(
        `[APIResolution] Yelp error for "${concept.name}":`,
        error
      );
    }
  });

  await Promise.allSettled(searchPromises);
  debugLog("Yelp", `Completed: ${results.size}/${concepts.length} resolved`);
  return results;
}

/**
 * Resolve places via Amadeus API (for hotels and activities)
 */
async function resolveAmadeus(
  concepts: PlaceConcept[],
  tripContext?: ResolutionOptions["tripContext"]
): Promise<Map<string, AmadeusSourceData>> {
  const results = new Map<string, AmadeusSourceData>();

  if (concepts.length === 0) {
    debugLog("Amadeus", "Skipped - no concepts to resolve");
    return results;
  }

  // Separate hotels and activities
  const hotelConcepts = concepts.filter((c) => c.category === "hotel");
  const activityConcepts = concepts.filter(
    (c) => c.category === "activity" || c.category === "attraction"
  );

  debugLog("Amadeus", `Starting resolution for ${concepts.length} concepts`, {
    hotels: hotelConcepts.length,
    activities: activityConcepts.length,
    tripContext: tripContext ? { checkIn: tripContext.checkInDate, checkOut: tripContext.checkOutDate } : "none",
  });

  // Resolve hotels
  if (hotelConcepts.length > 0 && tripContext?.checkInDate && tripContext?.checkOutDate) {
    debugLog("Amadeus", `Resolving ${hotelConcepts.length} hotels`);
    
    const hotelPromises = hotelConcepts.map(async (concept) => {
      const startTime = Date.now();
      try {
        if (!concept.location?.coordinates) {
          debugLog("Amadeus", `Skipping hotel "${concept.name}" - no coordinates`);
          return;
        }

        debugLog("Amadeus", `Searching hotel: "${concept.name}"`);

        const searchResult = await withRateLimit("amadeus", () =>
          amadeusClient.searchHotels({
            coordinates: concept.location!.coordinates!,
            checkInDate: tripContext.checkInDate!,
            checkOutDate: tripContext.checkOutDate!,
            adults: tripContext.adults || 1,
            maxResults: 3,
          })
        );

        const duration = Date.now() - startTime;

        if (searchResult.data.length > 0) {
          // Try to match by name
          const match = searchResult.data.find(
            (h) =>
              h.hotelName?.toLowerCase().includes(concept.name.toLowerCase()) ||
              concept.name.toLowerCase().includes(h.hotelName?.toLowerCase() || "")
          );
          const selected = match || searchResult.data[0];
          results.set(concept.name, selected);
          
          debugLog("Amadeus", `Found hotel: "${concept.name}" -> "${selected.hotelName}"`, {
            hotelId: selected.hotelId,
            price: selected.price,
            nameMatch: !!match,
          }, duration);
        } else {
          debugLog("Amadeus", `No hotel results for: "${concept.name}"`, null, duration);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        debugLog("Amadeus", `ERROR hotel "${concept.name}": ${errorMsg}`, null, duration);
        console.error(
          `[APIResolution] Amadeus hotel error for "${concept.name}":`,
          error
        );
      }
    });

    await Promise.allSettled(hotelPromises);
  } else if (hotelConcepts.length > 0) {
    debugLog("Amadeus", `Skipping ${hotelConcepts.length} hotels - no trip context dates`);
  }

  // Resolve activities
  if (activityConcepts.length > 0) {
    debugLog("Amadeus", `Resolving ${activityConcepts.length} activities`);
    
    const activityPromises = activityConcepts.map(async (concept) => {
      const startTime = Date.now();
      try {
        if (!concept.location?.coordinates) {
          debugLog("Amadeus", `Skipping activity "${concept.name}" - no coordinates`);
          return;
        }

        debugLog("Amadeus", `Searching activity: "${concept.name}"`);

        const searchResult = await withRateLimit("amadeus", () =>
          amadeusClient.searchActivities({
            coordinates: concept.location!.coordinates!,
            radius: 5,
            maxResults: 5,
          })
        );

        const duration = Date.now() - startTime;

        if (searchResult.data.length > 0) {
          // Try to match by name
          const match = searchResult.data.find(
            (a) =>
              a.activityName
                ?.toLowerCase()
                .includes(concept.name.toLowerCase()) ||
              concept.name
                .toLowerCase()
                .includes(a.activityName?.toLowerCase() || "")
          );
          const selected = match || searchResult.data[0];
          results.set(concept.name, selected);
          
          debugLog("Amadeus", `Found activity: "${concept.name}" -> "${selected.activityName}"`, {
            activityId: selected.activityId,
            price: selected.price,
            nameMatch: !!match,
          }, duration);
        } else {
          debugLog("Amadeus", `No activity results for: "${concept.name}"`, null, duration);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        debugLog("Amadeus", `ERROR activity "${concept.name}": ${errorMsg}`, null, duration);
        console.error(
          `[APIResolution] Amadeus activity error for "${concept.name}":`,
          error
        );
      }
    });

    await Promise.allSettled(activityPromises);
  }

  debugLog("Amadeus", `Completed: ${results.size}/${concepts.length} resolved`);
  return results;
}

/**
 * Get weather data for a location
 */
async function resolveWeather(
  coordinates: { lat: number; lng: number },
  dates?: { start: string; end: string }
): Promise<WeatherSourceData | undefined> {
  const startTime = Date.now();
  
  debugLog("Weather", "Fetching weather data", {
    coordinates,
    dates,
  });
  
  try {
    const result = await withRateLimit("weather", () =>
      weatherClient.getForecast({
        coordinates,
        dates,
      })
    );

    const duration = Date.now() - startTime;
    
    if (result.weather) {
      debugLog("Weather", "Weather data retrieved", {
        temperature: result.weather.temperature,
        conditions: result.weather.conditions,
      }, duration);
    } else {
      debugLog("Weather", "No weather data returned", null, duration);
    }

    return result.weather || undefined;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    debugLog("Weather", `ERROR: ${errorMsg}`, null, duration);
    console.error("[APIResolution] Weather error:", error);
    return undefined;
  }
}

// ============================================================================
// Main Resolution Function
// ============================================================================

/**
 * Resolve all APIs in parallel for a list of place concepts
 */
export async function resolveAllAPIs(
  concepts: PlaceConcept[],
  options: ResolutionOptions = {}
): Promise<ResolutionResult> {
  const startTime = Date.now();
  const apiStatus = getAPIStatus();

  debugLog("RESOLVER", "=== Starting API Resolution ===", {
    totalConcepts: concepts.length,
    apiStatus,
    options: {
      includeGoogle: options.includeGoogle !== false,
      includeYelp: options.includeYelp !== false,
      includeAmadeus: options.includeAmadeus !== false,
      includeWeather: options.includeWeather !== false,
      hasWeatherCoords: !!options.weatherCoordinates,
      hasTripContext: !!options.tripContext,
    },
  });

  // Determine which concepts go to which APIs
  const googleConcepts: PlaceConcept[] = [];
  const yelpConcepts: PlaceConcept[] = [];
  const amadeusConcepts: PlaceConcept[] = [];

  concepts.forEach((concept) => {
    const apis = getApisForCategory(concept.category);

    // Add to primary APIs
    if (apis.primary.includes("google") && apiStatus.google && options.includeGoogle !== false) {
      googleConcepts.push(concept);
    }
    if (apis.primary.includes("yelp") && apiStatus.yelp && options.includeYelp !== false) {
      yelpConcepts.push(concept);
    }
    if (apis.primary.includes("amadeus") && apiStatus.amadeus && options.includeAmadeus !== false) {
      amadeusConcepts.push(concept);
    }

    // Add to secondary APIs if not already in primary
    apis.secondary.forEach((api) => {
      if (api === "google" && !apis.primary.includes("google") && apiStatus.google && options.includeGoogle !== false) {
        googleConcepts.push(concept);
      }
      if (api === "yelp" && !apis.primary.includes("yelp") && apiStatus.yelp && options.includeYelp !== false) {
        yelpConcepts.push(concept);
      }
      if (api === "amadeus" && !apis.primary.includes("amadeus") && apiStatus.amadeus && options.includeAmadeus !== false) {
        amadeusConcepts.push(concept);
      }
    });
  });

  debugLog("RESOLVER", "Concept routing complete", {
    google: googleConcepts.length,
    yelp: yelpConcepts.length,
    amadeus: amadeusConcepts.length,
  });

  // Initialize results
  const results: RawAPIResults = {
    google: new Map(),
    yelp: new Map(),
    amadeus: new Map(),
    errors: [],
    timing: {
      google: 0,
      yelp: 0,
      amadeus: 0,
    },
  };

  debugLog("RESOLVER", "Executing parallel API calls...");

  // Execute all API calls in parallel
  const [googleResult, yelpResult, amadeusResult, weatherResult] =
    await Promise.allSettled([
      // Google Places
      (async () => {
        const start = Date.now();
        const data = await resolveGooglePlaces(googleConcepts);
        results.timing.google = Date.now() - start;
        return data;
      })(),

      // Yelp
      (async () => {
        const start = Date.now();
        const data = await resolveYelp(yelpConcepts);
        results.timing.yelp = Date.now() - start;
        return data;
      })(),

      // Amadeus
      (async () => {
        const start = Date.now();
        const data = await resolveAmadeus(amadeusConcepts, options.tripContext);
        results.timing.amadeus = Date.now() - start;
        return data;
      })(),

      // Weather (optional)
      (async () => {
        if (
          options.includeWeather !== false &&
          options.weatherCoordinates &&
          apiStatus.weather
        ) {
          const start = Date.now();
          const data = await resolveWeather(
            options.weatherCoordinates,
            options.weatherDates
          );
          results.timing.weather = Date.now() - start;
          return data;
        }
        debugLog("Weather", "Skipped - no coordinates or disabled");
        return undefined;
      })(),
    ]);

  // Collect results
  if (googleResult.status === "fulfilled") {
    results.google = googleResult.value;
    debugLog("RESOLVER", `Google: ${results.google.size} results`, null, results.timing.google);
  } else {
    debugLog("RESOLVER", `Google: FAILED - ${googleResult.reason?.message}`);
    results.errors.push({
      source: "google",
      query: "batch",
      error: googleResult.reason?.message || "Unknown error",
    });
  }

  if (yelpResult.status === "fulfilled") {
    results.yelp = yelpResult.value;
    debugLog("RESOLVER", `Yelp: ${results.yelp.size} results`, null, results.timing.yelp);
  } else {
    debugLog("RESOLVER", `Yelp: FAILED - ${yelpResult.reason?.message}`);
    results.errors.push({
      source: "yelp",
      query: "batch",
      error: yelpResult.reason?.message || "Unknown error",
    });
  }

  if (amadeusResult.status === "fulfilled") {
    results.amadeus = amadeusResult.value;
    debugLog("RESOLVER", `Amadeus: ${results.amadeus.size} results`, null, results.timing.amadeus);
  } else {
    debugLog("RESOLVER", `Amadeus: FAILED - ${amadeusResult.reason?.message}`);
    results.errors.push({
      source: "amadeus",
      query: "batch",
      error: amadeusResult.reason?.message || "Unknown error",
    });
  }

  if (weatherResult.status === "fulfilled" && weatherResult.value) {
    results.weather = weatherResult.value;
    debugLog("RESOLVER", `Weather: available`, null, results.timing.weather);
  }

  const totalTime = Date.now() - startTime;
  debugLog("RESOLVER", "=== API Resolution Complete ===", {
    googleResults: results.google.size,
    yelpResults: results.yelp.size,
    amadeusResults: results.amadeus.size,
    weatherAvailable: !!results.weather,
    errors: results.errors.length,
    timing: {
      google: results.timing.google,
      yelp: results.timing.yelp,
      amadeus: results.timing.amadeus,
      weather: results.timing.weather,
      total: totalTime,
    },
  }, totalTime);

  return {
    results,
    timing: {
      total: totalTime,
      google: results.timing.google,
      yelp: results.timing.yelp,
      amadeus: results.timing.amadeus,
      weather: results.timing.weather,
    },
  };
}

/**
 * Resolve a single place concept across all relevant APIs
 */
export async function resolveSinglePlace(
  concept: PlaceConcept,
  options: ResolutionOptions = {}
): Promise<{
  google?: GooglePlaceSourceData;
  yelp?: YelpBusinessSourceData;
  amadeus?: AmadeusSourceData;
  weather?: WeatherSourceData;
  timing: Record<string, number>;
}> {
  const result = await resolveAllAPIs([concept], options);

  return {
    google: result.results.google.get(concept.name),
    yelp: result.results.yelp.get(concept.name),
    amadeus: result.results.amadeus.get(concept.name),
    weather: result.results.weather,
    timing: result.timing,
  };
}

// ============================================================================
// Exports
// ============================================================================

export const apiResolutionService = {
  resolveAll: resolveAllAPIs,
  resolveSingle: resolveSinglePlace,
  getApisForCategory,
};

export default apiResolutionService;
