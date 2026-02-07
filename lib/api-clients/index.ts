/**
 * API Clients Index
 * Centralized exports for all API client wrappers
 */

// Google Places
export { default as googlePlacesClient } from "./google-places-client";
export {
  searchPlaces as searchGooglePlaces,
  getPlaceDetails as getGooglePlaceDetails,
  searchNearby as searchGoogleNearby,
  getPhotoUrl as getGooglePhotoUrl,
  isConfigured as isGoogleConfigured,
  type GooglePlacesSearchOptions,
  type GooglePlacesSearchResult,
  type GooglePlaceDetailsOptions,
} from "./google-places-client";

// Yelp
export { default as yelpClient } from "./yelp-client";
export {
  searchBusinesses as searchYelpBusinesses,
  getBusinessDetails as getYelpBusinessDetails,
  searchRestaurants as searchYelpRestaurants,
  searchHotels as searchYelpHotels,
  searchActivities as searchYelpActivities,
  isConfigured as isYelpConfigured,
  type YelpSearchOptions,
  type YelpSearchResult,
  type YelpBusinessDetailsResult,
} from "./yelp-client";

// Amadeus
export { default as amadeusClient } from "./amadeus-client-wrapper";
export {
  searchHotelsConsolidated as searchAmadeusHotels,
  searchActivitiesConsolidated as searchAmadeusActivities,
  searchFlightsConsolidated as searchAmadeusFlights,
  getActivityDetails as getAmadeusActivityDetails,
  searchNearbyAirports,
  isConfigured as isAmadeusConfigured,
  // Re-export raw client functions
  searchFlights,
  searchHotels,
  searchTransfers,
  searchToursActivities,
  searchFlightInspiration,
  type AmadeusSearchResult,
  type AmadeusHotelSearchOptions,
  type AmadeusActivitySearchOptions,
  type AmadeusFlightSearchOptions,
} from "./amadeus-client-wrapper";

// Weather
export { default as weatherClient } from "./weather-client";
export {
  getForecast as getWeatherForecast,
  getCurrentWeather,
  getMultiDayWeather,
  getWeatherIconUrl,
  isConfigured as isWeatherConfigured,
  type WeatherForecastOptions,
  type WeatherForecastResult,
  type CurrentWeatherResult,
} from "./weather-client";

// ============================================================================
// Aggregated API Status
// ============================================================================

export interface APIStatus {
  google: boolean;
  yelp: boolean;
  amadeus: boolean;
  weather: boolean;
}

/**
 * Check configuration status of all APIs
 */
export function getAPIStatus(): APIStatus {
  // Import dynamically to avoid circular dependencies
  const googleConfigured = !!(
    process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY
  );
  const yelpConfigured = !!process.env.YELP_API_KEY;
  const amadeusConfigured = !!(
    process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET
  );
  const weatherConfigured = !!process.env.OPENWEATHER_API_KEY;

  return {
    google: googleConfigured,
    yelp: yelpConfigured,
    amadeus: amadeusConfigured,
    weather: weatherConfigured,
  };
}

/**
 * Get list of configured APIs
 */
export function getConfiguredAPIs(): string[] {
  const status = getAPIStatus();
  const configured: string[] = [];

  if (status.google) configured.push("google");
  if (status.yelp) configured.push("yelp");
  if (status.amadeus) configured.push("amadeus");
  if (status.weather) configured.push("weather");

  return configured;
}
