/**
 * Amadeus API Client Wrapper
 * Standardized wrapper for Amadeus API calls with consolidated place types
 * This wraps the existing amadeus-client.ts and adds Tours & Activities support
 */

import type { AmadeusSourceData } from "@/lib/types/consolidated-place";
import * as amadeusClient from "@/lib/flights/amadeus-client";

// Re-export types from the underlying client
export type {
  FlightSearchParams,
  FlightOffer,
  HotelSearchParams,
  HotelOffer,
  TransferSearchParams,
  TransferOffer,
  ToursActivitiesParams,
  FlightInspirationParams,
  HotelListByCityParams,
} from "@/lib/flights/amadeus-client";

// ============================================================================
// Types for Consolidated Pipeline
// ============================================================================

export interface AmadeusSearchResult {
  data: AmadeusSourceData[];
  total: number;
  timing: number;
  error?: string;
}

export interface AmadeusHotelSearchOptions {
  cityCode?: string;
  coordinates?: { lat: number; lng: number };
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  rooms?: number;
  radius?: number;
  maxResults?: number;
}

export interface AmadeusActivitySearchOptions {
  coordinates: { lat: number; lng: number };
  radius?: number;
  maxResults?: number;
}

export interface AmadeusFlightSearchOptions {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  travelClass?: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  maxResults?: number;
}

// ============================================================================
// Core Wrapper Functions
// ============================================================================

/**
 * Search for hotels with consolidated data format
 */
export async function searchHotelsConsolidated(
  options: AmadeusHotelSearchOptions
): Promise<AmadeusSearchResult> {
  const startTime = Date.now();

  try {
    let cityCode = options.cityCode;

    // If only coordinates provided, we need to find nearby hotels by geocode
    if (!cityCode && options.coordinates) {
      const hotels = await amadeusClient.searchHotelsByGeocode({
        latitude: options.coordinates.lat,
        longitude: options.coordinates.lng,
        radius: options.radius || 50,
        radiusUnit: "KM",
      });

      if (!hotels || hotels.length === 0) {
        return {
          data: [],
          total: 0,
          timing: Date.now() - startTime,
        };
      }

      // Get hotel IDs and search for offers
      const hotelIds = hotels
        .slice(0, options.maxResults || 10)
        .map((h: any) => h.hotelId)
        .join(",");

      // For now, return basic hotel info without pricing
      // (pricing requires hotelOffersSearch which needs specific hotelIds)
      const consolidatedData: AmadeusSourceData[] = hotels
        .slice(0, options.maxResults || 10)
        .map((hotel: any) => ({
          type: "hotel" as const,
          hotelId: hotel.hotelId,
          hotelName: hotel.name,
          location: hotel.geoCode
            ? {
                latitude: hotel.geoCode.latitude,
                longitude: hotel.geoCode.longitude,
              }
            : undefined,
          address: hotel.address?.countryCode,
        }));

      return {
        data: consolidatedData,
        total: hotels.length,
        timing: Date.now() - startTime,
      };
    }

    // Use city code search
    if (!cityCode) {
      return {
        data: [],
        total: 0,
        timing: Date.now() - startTime,
        error: "City code or coordinates required",
      };
    }

    const hotels = await amadeusClient.searchHotels({
      cityCode,
      checkInDate: options.checkInDate,
      checkOutDate: options.checkOutDate,
      adults: options.adults || 1,
      rooms: options.rooms || 1,
      radius: options.radius || 50,
      max: options.maxResults || 10,
    });

    const consolidatedData: AmadeusSourceData[] = hotels.map((hotel) => ({
      type: "hotel" as const,
      hotelId: hotel.hotelId,
      hotelName: hotel.name,
      hotelRating: hotel.rating,
      hotelAmenities: hotel.amenities,
      hotelPhotos: hotel.media?.map((m) => m.uri),
      price: hotel.price
        ? {
            amount: hotel.price.total,
            currency: hotel.price.currency,
          }
        : undefined,
      location: hotel.location
        ? {
            latitude: hotel.location.latitude,
            longitude: hotel.location.longitude,
          }
        : undefined,
      address: hotel.address?.lines?.join(", "),
      available: hotel.available,
      availabilityDetails: {
        checkIn: options.checkInDate,
        checkOut: options.checkOutDate,
        travelers: options.adults || 1,
      },
    }));

    return {
      data: consolidatedData,
      total: hotels.length,
      timing: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[AmadeusClientWrapper] Hotel search error:", error);
    return {
      data: [],
      total: 0,
      timing: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search for tours and activities with consolidated data format
 */
export async function searchActivitiesConsolidated(
  options: AmadeusActivitySearchOptions
): Promise<AmadeusSearchResult> {
  const startTime = Date.now();

  try {
    const activities = await amadeusClient.searchToursActivities({
      latitude: options.coordinates.lat,
      longitude: options.coordinates.lng,
      radius: options.radius || 5,
    });

    const consolidatedData: AmadeusSourceData[] = activities
      .slice(0, options.maxResults || 20)
      .map((activity: any) => ({
        type: "activity" as const,
        activityId: activity.id,
        activityName: activity.name,
        activityDescription: activity.shortDescription || activity.description,
        activityDuration: activity.duration,
        activityBookingUrl: activity.bookingLink,
        price: activity.price
          ? {
              amount: activity.price.amount,
              currency: activity.price.currencyCode,
            }
          : undefined,
        location: activity.geoCode
          ? {
              latitude: activity.geoCode.latitude,
              longitude: activity.geoCode.longitude,
            }
          : undefined,
      }));

    return {
      data: consolidatedData,
      total: activities.length,
      timing: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[AmadeusClientWrapper] Activities search error:", error);
    return {
      data: [],
      total: 0,
      timing: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search for flights with consolidated data format
 */
export async function searchFlightsConsolidated(
  options: AmadeusFlightSearchOptions
): Promise<AmadeusSearchResult> {
  const startTime = Date.now();

  try {
    const flights = await amadeusClient.searchFlights({
      origin: options.origin,
      destination: options.destination,
      departureDate: options.departureDate,
      returnDate: options.returnDate,
      adults: options.adults,
      travelClass: options.travelClass,
      max: options.maxResults || 10,
    });

    const consolidatedData: AmadeusSourceData[] = flights.map((flight) => ({
      type: "flight" as const,
      price: {
        amount: flight.price.total,
        currency: flight.price.currency,
      },
      flightOffers: [
        {
          id: flight.id,
          price: flight.price,
          itineraries: flight.itineraries.map((itinerary) => ({
            duration: itinerary.duration,
            segments: itinerary.segments.map((segment) => ({
              departure: segment.departure,
              arrival: segment.arrival,
              carrierCode: segment.carrierCode,
              number: segment.number,
            })),
          })),
        },
      ],
    }));

    return {
      data: consolidatedData,
      total: flights.length,
      timing: Date.now() - startTime,
    };
  } catch (error) {
    console.error("[AmadeusClientWrapper] Flight search error:", error);
    return {
      data: [],
      total: 0,
      timing: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get activity details by ID
 */
export async function getActivityDetails(
  activityId: string
): Promise<AmadeusSourceData | null> {
  try {
    const activity = await amadeusClient.getActivityDetails(activityId);

    if (!activity) {
      return null;
    }

    return {
      type: "activity" as const,
      activityId: activity.id,
      activityName: activity.name,
      activityDescription: activity.description,
      activityDuration: activity.duration,
      activityBookingUrl: activity.bookingLink,
      price: activity.price
        ? {
            amount: activity.price.amount,
            currency: activity.price.currencyCode,
          }
        : undefined,
      location: activity.geoCode
        ? {
            latitude: activity.geoCode.latitude,
            longitude: activity.geoCode.longitude,
          }
        : undefined,
    };
  } catch (error) {
    console.error("[AmadeusClientWrapper] Activity details error:", error);
    return null;
  }
}

/**
 * Search for nearby airports
 */
export async function searchNearbyAirports(options: {
  coordinates: { lat: number; lng: number };
  radius?: number;
  maxResults?: number;
}): Promise<any[]> {
  try {
    const airports = await amadeusClient.getNearbyAirports({
      latitude: options.coordinates.lat,
      longitude: options.coordinates.lng,
      radius: options.radius || 500,
      sort: "relevance",
    });

    return airports.slice(0, options.maxResults || 10);
  } catch (error) {
    console.error("[AmadeusClientWrapper] Nearby airports error:", error);
    return [];
  }
}

/**
 * Check if Amadeus API is configured
 */
export function isConfigured(): boolean {
  return !!(
    process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET
  );
}

// ============================================================================
// Re-export underlying client functions for direct access
// ============================================================================

export const {
  searchFlights,
  searchHotels,
  searchTransfers,
  searchToursActivities,
  searchToursActivitiesBySquare,
  searchFlightInspiration,
  searchFlightCheapestDates,
  getAirportRoutes,
  getNearbyAirports,
  lookupAirlineCode,
  getAirlineRoutes,
  getFlightCheckinLinks,
  getFlightStatus,
  searchHotelsByCity,
  searchHotelsByGeocode,
  searchHotelsByIds,
  autocompleteHotelName,
  getHotelRatings,
} = amadeusClient;

// ============================================================================
// Exports
// ============================================================================

export const amadeusClientWrapper = {
  searchHotels: searchHotelsConsolidated,
  searchActivities: searchActivitiesConsolidated,
  searchFlights: searchFlightsConsolidated,
  getActivityDetails,
  searchNearbyAirports,
  isConfigured,
  // Direct access to underlying client
  raw: amadeusClient,
};

export default amadeusClientWrapper;
