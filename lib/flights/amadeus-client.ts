import Amadeus from 'amadeus';
import { parseAmadeusError, AmadeusParseError } from '@/lib/amadeus/errors';
import { 
  validateFlightOffers, 
  validateHotelOffers,
  formatValidationErrors,
  FlightOfferSchema,
  SimpleHotelOfferSchema,
} from '@/lib/amadeus/schemas';
import { z } from 'zod';

// Initialize Amadeus client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
});

// Export the client for use in other modules
export function getAmadeusClient(): Amadeus {
  return amadeus;
}

export interface FlightSearchParams {
  origin: string; // IATA code (e.g., "JFK")
  destination: string; // IATA code (e.g., "LAX")
  departureDate: string; // YYYY-MM-DD
  returnDate?: string; // YYYY-MM-DD (optional for one-way)
  adults: number; // Number of passengers
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  currencyCode?: string; // Currency for pricing (e.g., "USD", "EUR")
  max?: number; // Max results (default 10)
}

export interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string; // ISO 8601 duration (e.g., "PT5H30M")
    segments: Array<{
      departure: {
        iataCode: string;
        at: string; // ISO 8601 datetime
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string; // Airline code (e.g., "AA")
      number: string; // Flight number
      aircraft: {
        code: string;
      };
      duration: string;
    }>;
  }>;
  validatingAirlineCodes: string[];
}

/**
 * Validate flight dates are within acceptable booking window
 */
function validateFlightDates(departureDate: string, returnDate?: string): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const departure = new Date(departureDate);
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 330); // Amadeus typically allows ~330 days ahead
  
  if (departure < today) {
    throw new Error('Departure date must be in the future');
  }
  
  if (departure > maxDate) {
    console.warn(`⚠️  Departure date (${departureDate}) is more than 330 days from today. Amadeus test environment may not have data.`);
  }
  
  if (returnDate) {
    const returnD = new Date(returnDate);
    if (returnD <= departure) {
      throw new Error('Return date must be after departure date');
    }
  }
}

export async function searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
  // Validate dates first
  validateFlightDates(params.departureDate, params.returnDate);

  // Log request details for debugging
  console.log('🛫 Amadeus Flight Search Request:');
  console.log('  Origin:', params.origin);
  console.log('  Destination:', params.destination);
  console.log('  Departure:', params.departureDate);
  console.log('  Return:', params.returnDate);
  console.log('  Adults:', params.adults);
  console.log('  Class:', params.travelClass);
  console.log('  Currency:', params.currencyCode || 'USD');
  console.log('  Max Results:', params.max || 10);

  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: params.origin,
      destinationLocationCode: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      adults: params.adults.toString(),
      travelClass: params.travelClass,
      currencyCode: params.currencyCode || 'USD',
      max: params.max || 10,
    });

    console.log(`✅ Flight search successful: ${response.data.length} offers found`);
    
    // Validate response with Zod
    const validation = validateFlightOffers(response.data);
    
    if (!validation.success) {
      console.error('Flight offers validation failed:', formatValidationErrors(validation.error));
      throw new AmadeusParseError(
        { zodError: validation.error, rawData: response.data },
        `Invalid flight offers response: ${formatValidationErrors(validation.error)}`
      );
    }

    return validation.data;
  } catch (error: any) {
    // Log full error details for debugging
    console.error('🚨 Amadeus Flight API Error Details:');
    console.error('Error Code:', error.code);
    console.error('Error Description:', error.description);
    
    if (error.response) {
      console.error('Status Code:', error.response.statusCode);
      console.error('Request Path:', error.response.request?.queryPath);
      console.error('Response Body:', error.response.body);
      console.error('Response Result:', JSON.stringify(error.response.result, null, 2));
    }
    
    // Parse into our structured error types
    const parsedError = parseAmadeusError(error);
    console.error('Structured Error:', parsedError.getDebugInfo());
    
    throw parsedError;
  }
}

// ============================================================================
// Hotel Search
// ============================================================================

export interface HotelSearchParams {
  cityCode: string; // IATA city code (e.g., "PAR" for Paris)
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults?: number; // Number of guests (default 1)
  rooms?: number; // Number of rooms (default 1)
  radius?: number; // Search radius in km
  radiusUnit?: 'KM' | 'MILE';
  max?: number; // Max results (default 10)
}

export interface HotelOffer {
  hotelId: string;
  name: string;
  price: {
    total: string;
    currency: string;
  };
  rating?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  address?: {
    lines?: string[];
    postalCode?: string;
    cityName?: string;
    countryCode?: string;
  };
  amenities?: string[];
  media?: Array<{
    uri: string;
    category?: string;
  }>;
  available: boolean;
}

export async function searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
  try {
    console.log('🔍 [AMADEUS] Starting hotel search with params:', JSON.stringify(params, null, 2));
    
    // Step 1: Search for hotels by city
    const hotelListParams = {
      cityCode: params.cityCode,
      radius: params.radius || 50,
      radiusUnit: params.radiusUnit || 'KM',
    };
    console.log('📍 [AMADEUS] Step 1: Calling hotels.byCity.get with:', JSON.stringify(hotelListParams, null, 2));
    
    const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get(hotelListParams);
    
    console.log('✅ [AMADEUS] Step 1 Response received. Status:', hotelListResponse.result?.statusCode);
    console.log('📦 [AMADEUS] Step 1 Data type:', typeof hotelListResponse.data);
    console.log('📦 [AMADEUS] Step 1 Is array:', Array.isArray(hotelListResponse.data));
    console.log('📦 [AMADEUS] Step 1 Data length:', hotelListResponse.data?.length);
    console.log('📦 [AMADEUS] Step 1 Full response:', JSON.stringify(hotelListResponse, null, 2));

    // Check if response has data
    if (!hotelListResponse || !hotelListResponse.data || !Array.isArray(hotelListResponse.data)) {
      console.error('❌ [AMADEUS] Hotel list response missing data or not an array');
      console.error('   Response object:', hotelListResponse);
      return [];
    }

    const hotelIds = hotelListResponse.data
      .slice(0, params.max || 10)
      .map((hotel: any) => hotel.hotelId);

    console.log('🏨 [AMADEUS] Found hotel IDs:', hotelIds);

    if (hotelIds.length === 0) {
      console.log('⚠️  [AMADEUS] No hotel IDs found, returning empty array');
      return [];
    }

    // Step 2: Get hotel offers with pricing
    const offersParams = {
      hotelIds: hotelIds.join(','),
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults || 1,
      roomQuantity: params.rooms || 1,
    };
    console.log('💰 [AMADEUS] Step 2: Calling hotelOffersSearch.get with:', JSON.stringify(offersParams, null, 2));
    
    const offersResponse = await amadeus.shopping.hotelOffersSearch.get(offersParams);
    
    console.log('✅ [AMADEUS] Step 2 Response received. Status:', offersResponse.result?.statusCode);
    console.log('📦 [AMADEUS] Step 2 Data type:', typeof offersResponse.data);
    console.log('📦 [AMADEUS] Step 2 Is array:', Array.isArray(offersResponse.data));
    console.log('📦 [AMADEUS] Step 2 Data length:', offersResponse.data?.length);
    console.log('📦 [AMADEUS] Step 2 Full response:', JSON.stringify(offersResponse, null, 2));

    // Check if response has data
    if (!offersResponse || !offersResponse.data) {
      console.error('Hotel offers response missing data:', offersResponse);
      return [];
    }

    // Ensure data is an array
    if (!Array.isArray(offersResponse.data)) {
      console.error('Hotel offers response data is not an array:', typeof offersResponse.data);
      return [];
    }

    // Validate response with Zod
    const validation = validateHotelOffers(offersResponse.data);
    
    if (!validation.success) {
      console.error('Hotel offers validation failed:', formatValidationErrors(validation.error));
      // If validation fails, try to transform manually with best effort
      console.warn('Continuing with manual transformation despite validation errors');
    }

    // Transform to our format
    const offers: HotelOffer[] = offersResponse.data.map((offer: any) => {
      // Validate individual hotel offer
      const hotelValidation = SimpleHotelOfferSchema.safeParse({
        hotelId: offer.hotel?.hotelId,
        name: offer.hotel?.name,
        price: {
          total: offer.offers?.[0]?.price?.total || '0',
          currency: offer.offers?.[0]?.price?.currency || 'USD',
        },
        rating: offer.hotel?.rating ? parseFloat(offer.hotel.rating) : undefined,
        location: offer.hotel?.latitude && offer.hotel?.longitude
          ? {
              latitude: typeof offer.hotel.latitude === 'string' 
                ? parseFloat(offer.hotel.latitude) 
                : offer.hotel.latitude,
              longitude: typeof offer.hotel.longitude === 'string'
                ? parseFloat(offer.hotel.longitude)
                : offer.hotel.longitude,
            }
          : undefined,
        address: offer.hotel?.address,
        amenities: offer.hotel?.amenities || [],
        media: offer.hotel?.media || [],
        available: offer.available !== false,
      });

      if (hotelValidation.success) {
        return hotelValidation.data;
      }

      // Fallback to manual transformation
      return {
        hotelId: offer.hotel?.hotelId || '',
        name: offer.hotel?.name || 'Unknown Hotel',
        price: {
          total: offer.offers?.[0]?.price?.total || '0',
          currency: offer.offers?.[0]?.price?.currency || 'USD',
        },
        rating: offer.hotel?.rating ? parseFloat(offer.hotel.rating) : undefined,
        location: offer.hotel?.latitude && offer.hotel?.longitude
          ? {
              latitude: typeof offer.hotel.latitude === 'string' 
                ? parseFloat(offer.hotel.latitude) 
                : offer.hotel.latitude,
              longitude: typeof offer.hotel.longitude === 'string'
                ? parseFloat(offer.hotel.longitude)
                : offer.hotel.longitude,
            }
          : undefined,
        address: offer.hotel?.address,
        amenities: offer.hotel?.amenities || [],
        media: offer.hotel?.media || [],
        available: offer.available !== false,
      };
    });

    return offers;
  } catch (error) {
    console.error('Amadeus hotel search error:', error);
    
    // Parse into our structured error types
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

// ============================================================================
// Transfer Search
// ============================================================================

export interface TransferSearchParams {
  startLocationCode: string; // IATA code
  endAddressLine: string;
  endCityName: string;
  endCountryCode: string;
  transferType: 'PRIVATE' | 'SHARED' | 'TAXI' | 'AIRPORT_EXPRESS';
  startDateTime: string; // ISO 8601: "YYYY-MM-DDTHH:mm:ss"
  passengers: number;
}

export interface TransferOffer {
  id: string;
  transferType: string;
  price: {
    total: string;
    currency: string;
  };
  vehicle: {
    code: string;
    category: string;
    description: string;
  };
  quotation: {
    monetaryAmount: string;
    currencyCode: string;
  };
  duration?: string;
}

export async function searchTransfers(params: TransferSearchParams): Promise<TransferOffer[]> {
  try {
    const response = await amadeus.shopping.transferOffers.post(
      JSON.stringify({
        startLocationCode: params.startLocationCode,
        endAddressLine: params.endAddressLine,
        endCityName: params.endCityName,
        endCountryCode: params.endCountryCode,
        transferType: params.transferType,
        startDateTime: params.startDateTime,
        passengers: params.passengers,
      })
    );

    // Map response to TransferOffer interface
    const offers: TransferOffer[] = (response.data || []).map((offer: any) => ({
      id: offer.id,
      transferType: offer.transferType,
      price: {
        total: offer.quotation?.monetaryAmount || "0",
        currency: offer.quotation?.currencyCode || "USD",
      },
      vehicle: {
        code: offer.vehicle?.code || "",
        category: offer.vehicle?.category || "",
        description: offer.vehicle?.description || "",
      },
      quotation: {
        monetaryAmount: offer.quotation?.monetaryAmount || "0",
        currencyCode: offer.quotation?.currencyCode || "USD",
      },
      duration: offer.duration,
    }));

    return offers;
  } catch (error) {
    console.error('Amadeus transfer search error:', error);
    
    // Parse into our structured error types but don't throw
    // Transfer API is less critical, so we return empty array
    const parsedError = parseAmadeusError(error);
    console.warn('Transfer search failed:', parsedError.getUserMessage());
    return [];
  }
}

// ============================================================================
// Flight Inspiration & Discovery
// ============================================================================

export interface FlightInspirationParams {
  origin: string; // IATA code
  departureDate?: string; // YYYY-MM-DD (optional)
  oneWay?: boolean;
  duration?: number; // days
  nonStop?: boolean;
  maxPrice?: number;
  currency?: string;
  max?: number;
}

export async function searchFlightInspiration(params: FlightInspirationParams): Promise<any[]> {
  try {
    console.log('🌟 Flight Inspiration Search Request:', params);
    
    const response = await amadeus.shopping.flightDestinations.get({
      origin: params.origin,
      departureDate: params.departureDate,
      oneWay: params.oneWay,
      duration: params.duration,
      nonStop: params.nonStop,
      maxPrice: params.maxPrice,
      viewBy: 'DESTINATION',
    });

    console.log(`✅ Found ${response.data.length} inspiring destinations`);
    return response.data;
  } catch (error) {
    console.error('Flight inspiration search error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export interface FlightCheapestDateParams {
  origin: string;
  destination: string;
  departureDate?: string; // Can be range: "2026-08-01,2026-08-15"
  oneWay?: boolean;
  duration?: number;
  nonStop?: boolean;
  maxPrice?: number;
  viewBy?: 'DATE' | 'DURATION' | 'WEEK';
}

export async function searchFlightCheapestDates(params: FlightCheapestDateParams): Promise<any[]> {
  try {
    console.log('📅 Flight Cheapest Date Search Request:', params);
    
    const response = await amadeus.shopping.flightDates.get({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      oneWay: params.oneWay,
      duration: params.duration,
      nonStop: params.nonStop,
      maxPrice: params.maxPrice,
      viewBy: params.viewBy || 'DATE',
    });

    console.log(`✅ Found ${response.data.length} date options`);
    return response.data;
  } catch (error) {
    console.error('Flight cheapest date search error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

// ============================================================================
// Flight Intelligence & Prediction
// ============================================================================

export interface FlightPriceAnalysisParams {
  originIataCode: string;
  destinationIataCode: string;
  departureDate: string; // YYYY-MM-DD
  currencyCode?: string;
  oneWay?: boolean;
}

export async function analyzeFlightPrice(params: FlightPriceAnalysisParams): Promise<any> {
  try {
    console.log('💰 Flight Price Analysis Request:', params);
    
    const response = await amadeus.analytics.itineraryPriceMetrics.get({
      originIataCode: params.originIataCode,
      destinationIataCode: params.destinationIataCode,
      departureDate: params.departureDate,
      currencyCode: params.currencyCode || 'USD',
      oneWay: params.oneWay !== false,
    });

    console.log(`✅ Price analysis complete`);
    return response.data;
  } catch (error) {
    console.error('Flight price analysis error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export interface FlightDelayPredictionParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // HH:mm:ss
  arrivalDate: string;
  arrivalTime: string;
  aircraftCode: string;
  carrierCode: string;
  flightNumber: string;
  duration: string; // ISO 8601 (PT2H30M)
}

export async function predictFlightDelay(params: FlightDelayPredictionParams): Promise<any[]> {
  try {
    console.log('⏰ Flight Delay Prediction Request:', params);
    
    const response = await amadeus.travel.predictions.flightDelay.get({
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      departureTime: params.departureTime,
      arrivalDate: params.arrivalDate,
      arrivalTime: params.arrivalTime,
      aircraftCode: params.aircraftCode,
      carrierCode: params.carrierCode,
      flightNumber: params.flightNumber,
      duration: params.duration,
    });

    console.log(`✅ Delay predictions generated`);
    return response.data;
  } catch (error) {
    console.error('Flight delay prediction error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

// ============================================================================
// Airport Intelligence
// ============================================================================

export async function getAirportRoutes(airportCode: string, max: number = 50): Promise<any[]> {
  try {
    console.log(`✈️  Getting routes for airport: ${airportCode}`);
    
    const response = await amadeus.airport.directDestinations.get({
      departureAirportCode: airportCode,
      max,
    });

    console.log(`✅ Found ${response.data.length} routes`);
    return response.data;
  } catch (error) {
    console.error('Airport routes search error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export interface AirportNearbyParams {
  latitude: number;
  longitude: number;
  radius?: number; // km (default: 500)
  sort?: 'relevance' | 'distance' | 'flights' | 'travelers';
}

export async function getNearbyAirports(params: AirportNearbyParams): Promise<any[]> {
  try {
    console.log(`🗺️  Finding nearby airports:`, params);
    
    const response = await amadeus.referenceData.locations.airports.get({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || 500,
      sort: params.sort || 'relevance',
    });

    console.log(`✅ Found ${response.data.length} nearby airports`);
    return response.data;
  } catch (error) {
    console.error('Nearby airport search error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export async function getAirportOnTimePerformance(airportCode: string, date: string): Promise<any> {
  try {
    console.log(`📊 Getting on-time performance for: ${airportCode} on ${date}`);
    
    const response = await amadeus.airport.predictions.onTime.get({
      airportCode,
      date,
    });

    console.log(`✅ On-time performance data retrieved`);
    return response.data;
  } catch (error) {
    console.error('Airport on-time performance error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

// ============================================================================
// Airline Information
// ============================================================================

export async function lookupAirlineCode(airlineCodes: string): Promise<any[]> {
  try {
    console.log(`🔍 Looking up airline codes: ${airlineCodes}`);
    
    const response = await amadeus.referenceData.airlines.get({
      airlineCodes,
    });

    console.log(`✅ Found ${response.data.length} airlines`);
    return response.data;
  } catch (error) {
    console.error('Airline code lookup error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export async function getAirlineRoutes(airlineCode: string, max: number = 50): Promise<any[]> {
  try {
    console.log(`✈️  Getting routes for airline: ${airlineCode}`);
    
    const response = await amadeus.airline.destinations.get({
      airlineCode,
      max,
    });

    console.log(`✅ Found ${response.data.length} destinations`);
    return response.data;
  } catch (error) {
    console.error('Airline routes search error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export async function getFlightCheckinLinks(airlineCode: string, language?: string): Promise<any[]> {
  try {
    console.log(`🔗 Getting check-in links for: ${airlineCode}`);
    
    const response = await amadeus.referenceData.urls.checkinLinks.get({
      airlineCode,
      language: language || 'en-GB',
    });

    console.log(`✅ Found ${response.data.length} check-in links`);
    return response.data;
  } catch (error) {
    console.error('Flight check-in links error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export interface FlightStatusParams {
  carrierCode: string;
  flightNumber: string;
  scheduledDepartureDate: string; // YYYY-MM-DD
  operationalSuffix?: string;
}

export async function getFlightStatus(params: FlightStatusParams): Promise<any[]> {
  try {
    console.log(`📡 Getting flight status:`, params);
    
    const response = await amadeus.schedule.flights.get({
      carrierCode: params.carrierCode,
      flightNumber: params.flightNumber,
      scheduledDepartureDate: params.scheduledDepartureDate,
      operationalSuffix: params.operationalSuffix,
    });

    console.log(`✅ Flight status retrieved`);
    return response.data;
  } catch (error) {
    console.error('Flight status error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

// ============================================================================
// Hotel Discovery
// ============================================================================

export interface HotelListByCityParams {
  cityCode: string;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
  chainCodes?: string;
  amenities?: string;
  ratings?: string;
  hotelSource?: 'ALL' | 'BEDBANK' | 'DIRECTCHAIN';
}

export async function searchHotelsByCity(params: HotelListByCityParams): Promise<any[]> {
  try {
    console.log('🏨 Hotel List by City Request:', params);
    
    const response = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: params.cityCode,
      radius: params.radius || 50,
      radiusUnit: params.radiusUnit || 'KM',
      chainCodes: params.chainCodes,
      amenities: params.amenities,
      ratings: params.ratings,
      hotelSource: params.hotelSource || 'ALL',
    });

    console.log(`✅ Found ${response.data.length} hotels`);
    return response.data;
  } catch (error) {
    console.error('Hotel list by city error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export interface HotelListByGeocodeParams {
  latitude: number;
  longitude: number;
  radius?: number;
  radiusUnit?: 'KM' | 'MILE';
  chainCodes?: string;
  amenities?: string;
  ratings?: string;
  hotelSource?: 'ALL' | 'BEDBANK' | 'DIRECTCHAIN';
}

export async function searchHotelsByGeocode(params: HotelListByGeocodeParams): Promise<any[]> {
  try {
    console.log('🗺️  Hotel List by Geocode Request:', params);
    
    const response = await amadeus.referenceData.locations.hotels.byGeocode.get({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || 50,
      radiusUnit: params.radiusUnit || 'KM',
      chainCodes: params.chainCodes,
      amenities: params.amenities,
      ratings: params.ratings,
      hotelSource: params.hotelSource || 'ALL',
    });

    console.log(`✅ Found ${response.data.length} hotels`);
    return response.data;
  } catch (error) {
    console.error('Hotel list by geocode error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export async function searchHotelsByIds(hotelIds: string): Promise<any[]> {
  try {
    console.log('🏨 Hotel List by IDs Request:', hotelIds);
    
    const response = await amadeus.referenceData.locations.hotels.byHotels.get({
      hotelIds,
    });

    console.log(`✅ Found ${response.data.length} hotels`);
    return response.data;
  } catch (error) {
    console.error('Hotel list by IDs error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export interface HotelNameAutocompleteParams {
  keyword: string;
  subType: 'HOTEL_LEISURE' | 'HOTEL_GDS';
  countryCode?: string;
  lang?: string;
  max?: number;
}

export async function autocompleteHotelName(params: HotelNameAutocompleteParams): Promise<any[]> {
  try {
    console.log('🔍 Hotel Name Autocomplete Request:', params);
    
    const response = await amadeus.referenceData.locations.hotel.get({
      keyword: params.keyword,
      subType: params.subType,
      countryCode: params.countryCode,
      lang: params.lang || 'EN',
      max: params.max || 20,
    });

    console.log(`✅ Found ${response.data.length} hotel suggestions`);
    return response.data;
  } catch (error) {
    console.error('Hotel name autocomplete error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export async function getHotelRatings(hotelIds: string): Promise<any[]> {
  try {
    console.log('⭐ Hotel Ratings Request:', hotelIds);
    
    const response = await amadeus.eReputation.hotelSentiments.get({
      hotelIds,
    });

    console.log(`✅ Found ratings for ${response.data.length} hotels`);
    return response.data;
  } catch (error) {
    console.error('Hotel ratings error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

// ============================================================================
// Destination Content - Tours & Activities
// ============================================================================

export interface ToursActivitiesParams {
  latitude: number;
  longitude: number;
  radius?: number; // km
}

export async function searchToursActivities(params: ToursActivitiesParams): Promise<any[]> {
  try {
    console.log('🎭 Tours & Activities Search Request:', params);
    
    const response = await amadeus.shopping.activities.get({
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius || 1,
    });

    console.log(`✅ Found ${response.data.length} activities`);
    return response.data;
  } catch (error) {
    console.error('Tours & activities search error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export interface ToursActivitiesBySquareParams {
  north: number;
  west: number;
  south: number;
  east: number;
}

export async function searchToursActivitiesBySquare(params: ToursActivitiesBySquareParams): Promise<any[]> {
  try {
    console.log('🗺️  Tours & Activities by Square Request:', params);
    
    const response = await amadeus.shopping.activities.bySquare.get({
      north: params.north,
      west: params.west,
      south: params.south,
      east: params.east,
    });

    console.log(`✅ Found ${response.data.length} activities`);
    return response.data;
  } catch (error) {
    console.error('Tours & activities by square error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}

export async function getActivityDetails(activityId: string): Promise<any> {
  try {
    console.log('🎭 Activity Details Request:', activityId);
    
    const response = await amadeus.shopping.activity(activityId).get();

    console.log(`✅ Activity details retrieved`);
    return response.data;
  } catch (error) {
    console.error('Activity details error:', error);
    const parsedError = parseAmadeusError(error);
    throw parsedError;
  }
}
