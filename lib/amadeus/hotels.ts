/**
 * Amadeus Hotel API Client
 * 
 * Provides functions to search for hotels and get pricing information
 * using the Amadeus Hotel Search API.
 */

import { getAmadeusClient } from '@/lib/flights/amadeus-client';
import { parseAmadeusError } from '@/lib/amadeus/errors';
import { 
  validateHotelOffers,
  formatValidationErrors,
  SimpleHotelOfferSchema,
} from '@/lib/amadeus/schemas';
import { z } from 'zod';
import type { AmadeusHotelData } from '@/lib/types/amadeus-pipeline';

export interface HotelSearchParams {
  cityCode: string; // IATA city code (e.g., "PAR" for Paris, "NYC" for New York)
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults: number; // Number of adult guests
  rooms?: number; // Number of rooms (default 1)
  radius?: number; // Search radius in km (default 5)
  radiusUnit?: 'KM' | 'MILE'; // Unit for radius (default KM)
  hotelName?: string; // Optional hotel name for filtering
  ratings?: string[]; // Hotel star ratings (e.g., ["4", "5"])
  amenities?: string[]; // Required amenities (e.g., ["SWIMMING_POOL", "SPA"])
  priceRange?: string; // Price range (e.g., "100-200")
  currency?: string; // Currency for pricing (default USD)
  maxResults?: number; // Max results to return (default 10)
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
  photos?: string[];
  available: boolean;
}

/**
 * Validate hotel dates are within acceptable booking window
 */
function validateHotelDates(checkInDate: string, checkOutDate: string): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 365); // Hotels typically allow 365 days ahead
  
  if (checkIn < today) {
    throw new Error('Check-in date must be in the future');
  }
  
  if (checkIn > maxDate) {
    console.warn(`⚠️  Check-in date (${checkInDate}) is more than 365 days from today. Data may be limited.`);
  }
  
  if (checkOut <= checkIn) {
    throw new Error('Check-out date must be after check-in date');
  }
  
  // Validate stay duration is reasonable (1-30 nights)
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  if (nights > 30) {
    console.warn(`⚠️  Stay duration (${nights} nights) is quite long. Consider splitting into multiple searches.`);
  }
}

/**
 * Convert hotel name to city code using Amadeus location API
 * Falls back to the name itself if conversion fails
 */
async function resolveLocationToCityCode(location: string): Promise<string> {
  // If it looks like an IATA code already (3 uppercase letters), return it
  if (/^[A-Z]{3}$/.test(location)) {
    return location;
  }
  
  try {
    const amadeus = getAmadeusClient();
    const response = await amadeus.referenceData.locations.get({
      keyword: location,
      subType: 'CITY',
    });
    
    if (response.data && response.data.length > 0) {
      const cityCode = response.data[0].iataCode;
      console.log(`✅ Resolved "${location}" to city code: ${cityCode}`);
      return cityCode;
    }
  } catch (error) {
    console.warn(`⚠️  Could not resolve location "${location}" to city code:`, error);
  }
  
  // Fallback: Return first 3 letters uppercase
  return location.substring(0, 3).toUpperCase();
}

/**
 * Search for hotels by location and dates
 * 
 * @param params - Hotel search parameters
 * @returns Array of hotel offers with pricing
 */
export async function searchHotelsByLocation(params: HotelSearchParams): Promise<HotelOffer[]> {
  // Validate dates first
  validateHotelDates(params.checkInDate, params.checkOutDate);
  
  // Log request details for debugging
  console.log('🏨 Amadeus Hotel Search Request:');
  console.log('  City Code:', params.cityCode);
  console.log('  Check-in:', params.checkInDate);
  console.log('  Check-out:', params.checkOutDate);
  console.log('  Adults:', params.adults);
  console.log('  Rooms:', params.rooms || 1);
  console.log('  Radius:', params.radius || 5, params.radiusUnit || 'KM');
  console.log('  Currency:', params.currency || 'USD');

  try {
    const amadeus = getAmadeusClient();
    
    // Build search parameters
    const searchParams: any = {
      cityCode: params.cityCode,
      checkInDate: params.checkInDate,
      checkOutDate: params.checkOutDate,
      adults: params.adults,
      roomQuantity: params.rooms || 1,
      radius: params.radius || 5,
      radiusUnit: params.radiusUnit || 'KM',
      currency: params.currency || 'USD',
      paymentPolicy: 'NONE', // Don't require payment details for search
      includeClosed: false, // Only show available hotels
      bestRateOnly: true, // Return best rate per hotel
    };
    
    // Add optional filters
    if (params.ratings && params.ratings.length > 0) {
      searchParams.ratings = params.ratings.join(',');
    }
    if (params.amenities && params.amenities.length > 0) {
      searchParams.amenities = params.amenities.join(',');
    }
    if (params.priceRange) {
      searchParams.priceRange = params.priceRange;
    }
    if (params.hotelName) {
      searchParams.hotelName = params.hotelName;
    }
    
    // Make API request
    const response = await amadeus.shopping.hotelOffersSearch.get(searchParams);
    
    console.log(`✅ Amadeus returned ${response.data?.length || 0} hotel offers`);
    
    // Validate response structure
    const validation = validateHotelOffers(response.data);
    if (!validation.success) {
      console.error('❌ Hotel offers validation failed:', formatValidationErrors(validation.error));
      // Continue with unvalidated data but log the error
    }
    
    // Transform to our internal format
    const hotels: HotelOffer[] = [];
    const maxResults = params.maxResults || 10;
    
    for (const hotelData of (response.data || []).slice(0, maxResults)) {
      try {
        // Get the cheapest offer for this hotel
        const cheapestOffer = hotelData.offers?.sort((a: any, b: any) => 
          parseFloat(a.price.total) - parseFloat(b.price.total)
        )[0];
        
        if (!cheapestOffer) continue;
        
        hotels.push({
          hotelId: hotelData.hotel.hotelId,
          name: hotelData.hotel.name,
          price: {
            total: cheapestOffer.price.total,
            currency: cheapestOffer.price.currency,
          },
          rating: hotelData.hotel.rating ? parseFloat(hotelData.hotel.rating) : undefined,
          location: (hotelData.hotel.latitude && hotelData.hotel.longitude) ? {
            latitude: typeof hotelData.hotel.latitude === 'string' 
              ? parseFloat(hotelData.hotel.latitude) 
              : hotelData.hotel.latitude,
            longitude: typeof hotelData.hotel.longitude === 'string'
              ? parseFloat(hotelData.hotel.longitude)
              : hotelData.hotel.longitude,
          } : undefined,
          address: hotelData.hotel.address ? {
            lines: hotelData.hotel.address.lines,
            postalCode: hotelData.hotel.address.postalCode,
            cityName: hotelData.hotel.address.cityName,
            countryCode: hotelData.hotel.address.countryCode,
          } : undefined,
          amenities: hotelData.hotel.amenities,
          photos: hotelData.hotel.media?.map((m: any) => m.uri),
          available: hotelData.available,
        });
      } catch (parseError) {
        console.error('❌ Error parsing hotel offer:', parseError);
        // Continue with next hotel
      }
    }
    
    console.log(`✅ Successfully parsed ${hotels.length} hotel offers`);
    return hotels;
    
  } catch (error) {
    const parsedError = parseAmadeusError(error);
    console.error('❌ Amadeus hotel search failed:', parsedError);
    throw new Error(`Hotel search failed: ${parsedError.message}`);
  }
}

/**
 * Get hotel offers for specific hotel IDs
 * Useful when you know the hotel ID and want detailed pricing
 * 
 * @param hotelIds - Array of Amadeus hotel IDs
 * @param checkInDate - Check-in date (YYYY-MM-DD)
 * @param checkOutDate - Check-out date (YYYY-MM-DD)
 * @param adults - Number of adult guests
 * @param rooms - Number of rooms (default 1)
 * @returns Array of hotel offers
 */
export async function getHotelOffers(
  hotelIds: string[],
  checkInDate: string,
  checkOutDate: string,
  adults: number,
  rooms: number = 1
): Promise<HotelOffer[]> {
  validateHotelDates(checkInDate, checkOutDate);
  
  console.log('🏨 Fetching hotel offers for specific hotels:', hotelIds.join(', '));
  
  const hotels: HotelOffer[] = [];
  
  // Fetch offers for each hotel
  for (const hotelId of hotelIds) {
    try {
      const amadeus = getAmadeusClient();
      const response = await amadeus.shopping.hotelOffersSearch.get({
        hotelIds: hotelId,
        checkInDate,
        checkOutDate,
        adults,
        roomQuantity: rooms,
      });
      
      if (response.data && response.data.length > 0) {
        const hotelData = response.data[0];
        const cheapestOffer = hotelData.offers?.sort((a: any, b: any) => 
          parseFloat(a.price.total) - parseFloat(b.price.total)
        )[0];
        
        if (cheapestOffer) {
          hotels.push({
            hotelId: hotelData.hotel.hotelId,
            name: hotelData.hotel.name,
            price: {
              total: cheapestOffer.price.total,
              currency: cheapestOffer.price.currency,
            },
            rating: hotelData.hotel.rating ? parseFloat(hotelData.hotel.rating) : undefined,
            location: (hotelData.hotel.latitude && hotelData.hotel.longitude) ? {
              latitude: typeof hotelData.hotel.latitude === 'string'
                ? parseFloat(hotelData.hotel.latitude)
                : hotelData.hotel.latitude,
              longitude: typeof hotelData.hotel.longitude === 'string'
                ? parseFloat(hotelData.hotel.longitude)
                : hotelData.hotel.longitude,
            } : undefined,
            address: hotelData.hotel.address,
            amenities: hotelData.hotel.amenities,
            photos: hotelData.hotel.media?.map((m: any) => m.uri),
            available: hotelData.available,
          });
        }
      }
    } catch (error) {
      console.error(`❌ Error fetching offers for hotel ${hotelId}:`, error);
      // Continue with next hotel
    }
  }
  
  return hotels;
}

/**
 * Parse Amadeus hotel response and convert to AmadeusHotelData format
 * 
 * @param hotelOffer - Hotel offer from searchHotelsByLocation or getHotelOffers
 * @returns Formatted hotel data for our pipeline
 */
export function parseHotelResponse(hotelOffer: HotelOffer): AmadeusHotelData {
  return {
    hotelId: hotelOffer.hotelId,
    name: hotelOffer.name,
    price: hotelOffer.price,
    rating: hotelOffer.rating,
    location: hotelOffer.location,
    address: hotelOffer.address?.lines?.join(', '),
    amenities: hotelOffer.amenities,
    photos: hotelOffer.photos,
    available: hotelOffer.available,
    notFound: false,
  };
}

/**
 * Search hotels by name and location with automatic city code resolution
 * 
 * @param hotelName - Name or description of the hotel
 * @param location - City name or location
 * @param checkInDate - Check-in date (YYYY-MM-DD)
 * @param checkOutDate - Check-out date (YYYY-MM-DD)
 * @param adults - Number of adult guests
 * @param rooms - Number of rooms
 * @returns Hotel data or null if not found
 */
export async function searchHotelByName(
  hotelName: string,
  location: string,
  checkInDate: string,
  checkOutDate: string,
  adults: number = 2,
  rooms: number = 1
): Promise<AmadeusHotelData | null> {
  try {
    // Resolve location to city code
    const cityCode = await resolveLocationToCityCode(location);
    
    // Search hotels
    const hotels = await searchHotelsByLocation({
      cityCode,
      checkInDate,
      checkOutDate,
      adults,
      rooms,
      hotelName, // Use hotel name as filter
      maxResults: 5, // Get top 5 matches
    });
    
    if (hotels.length === 0) {
      console.log(`⚠️  No hotels found for "${hotelName}" in ${location}`);
      return {
        hotelId: '',
        name: hotelName,
        price: { total: '0', currency: 'USD' },
        available: false,
        notFound: true,
      };
    }
    
    // Return the first match (best match)
    const bestMatch = hotels[0];
    console.log(`✅ Found hotel: ${bestMatch.name} - ${bestMatch.price.currency} ${bestMatch.price.total}`);
    return parseHotelResponse(bestMatch);
    
  } catch (error) {
    console.error(`❌ Error searching for hotel "${hotelName}":`, error);
    return {
      hotelId: '',
      name: hotelName,
      price: { total: '0', currency: 'USD' },
      available: false,
      notFound: true,
    };
  }
}

/**
 * Calculate number of nights between check-in and check-out
 * @deprecated Use calculateNights from @/lib/utils/date-utils instead
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, nights); // Minimum 1 night
}
