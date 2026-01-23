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
    // Step 1: Search for hotels by city
    const hotelListResponse = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: params.cityCode,
      radius: params.radius || 50,
      radiusUnit: params.radiusUnit || 'KM',
    });

    const hotelIds = hotelListResponse.data
      .slice(0, params.max || 10)
      .map((hotel: any) => hotel.hotelId);

    if (hotelIds.length === 0) {
      return [];
    }

    // Step 2: Get hotel offers with pricing
    const offersResponse = await amadeus.shopping.hotelOffersSearch.get({
      hotelIds: hotelIds.join(','),
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults || 1,
      roomQuantity: params.rooms || 1,
    });

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
