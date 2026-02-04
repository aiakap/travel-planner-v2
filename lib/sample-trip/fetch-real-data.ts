/**
 * Fetch Real Data for Sample Trips
 * 
 * Fetches actual flight, hotel, restaurant, and activity data from:
 * - Amadeus API (flights, hotels, activities)
 * - Yelp API (restaurants)
 * 
 * Returns data in the format expected by trip-creation-utils.
 */

import {
  searchFlights,
  searchHotels,
  searchToursActivities,
  type FlightOffer,
  type HotelOffer,
} from '@/lib/flights/amadeus-client';
import type {
  FlightSearchParams,
  HotelSearchParams,
  ActivitySearchParams,
  RestaurantSearchParams,
} from '@/lib/ai/generate-sample-itinerary';
import type {
  FlightReservation,
  HotelReservation,
  RestaurantReservation,
  ActivityReservation,
} from '@/lib/seed-data/trip-templates';

// ============================================================================
// TYPES
// ============================================================================

export interface FetchedReservation<T> {
  reservation: T;
  suggestionReason: string;
  profileReferences: string[];
}

export interface YelpBusiness {
  id: string;
  name: string;
  url: string;
  image_url?: string; // Restaurant image from Yelp
  rating: number;
  review_count: number;
  price?: string;
  location: {
    address1: string;
    city: string;
    country: string;
    display_address: string[];
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  categories: Array<{ alias: string; title: string }>;
  phone?: string;
}

// ============================================================================
// FLIGHT FETCHING
// ============================================================================

/**
 * Fetch flight offers from Amadeus and convert to reservation format
 */
export async function fetchFlightReservation(
  search: FlightSearchParams,
  homeAirport: string = 'SFO'
): Promise<FetchedReservation<FlightReservation> | null> {
  try {
    console.log('🛫 Fetching flight:', search.origin, '->', search.destination);
    
    const offers = await searchFlights({
      origin: search.origin || homeAirport,
      destination: search.destination,
      departureDate: search.date,
      adults: 1,
      travelClass: (search.travelClass as any) || 'ECONOMY',
      max: 3,
    });

    if (!offers || offers.length === 0) {
      console.log('⚠️ No flights found for', search.origin, '->', search.destination);
      return null;
    }

    // Pick the best offer (first one is usually cheapest)
    const offer = offers[0];
    const outboundSegment = offer.itineraries[0].segments[0];
    const lastSegment = offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1];

    const reservation: FlightReservation = {
      type: 'Flight',
      status: 'Pending',
      airline: outboundSegment.carrierCode,
      flightNumber: outboundSegment.number,
      departureAirport: {
        name: `${outboundSegment.departure.iataCode} Airport`,
        lat: 0, // Would need airport lookup
        lng: 0,
        timezone: 'UTC', // Would need airport lookup
        code: outboundSegment.departure.iataCode,
      },
      arrivalAirport: {
        name: `${lastSegment.arrival.iataCode} Airport`,
        lat: 0,
        lng: 0,
        timezone: 'UTC',
        code: lastSegment.arrival.iataCode,
      },
      departureTime: outboundSegment.departure.at,
      arrivalTime: lastSegment.arrival.at,
      cost: parseFloat(offer.price.total),
      currency: offer.price.currency,
    };

    return {
      reservation,
      suggestionReason: search.explanation,
      profileReferences: search.profileReferences,
    };
  } catch (error) {
    console.error('Error fetching flight:', error);
    return null;
  }
}

// ============================================================================
// HOTEL FETCHING
// ============================================================================

/**
 * Map location name to IATA city code
 */
function getCityCode(location: string): string {
  const cityCodeMap: Record<string, string> = {
    'paris': 'PAR',
    'london': 'LON',
    'rome': 'ROM',
    'florence': 'FLR',
    'new york': 'NYC',
    'los angeles': 'LAX',
    'san francisco': 'SFO',
    'tokyo': 'TYO',
    'barcelona': 'BCN',
    'madrid': 'MAD',
    'lisbon': 'LIS',
    'amsterdam': 'AMS',
    'berlin': 'BER',
    'munich': 'MUC',
    'vienna': 'VIE',
    'prague': 'PRG',
    'athens': 'ATH',
    'dubai': 'DXB',
    'bangkok': 'BKK',
    'singapore': 'SIN',
    'sydney': 'SYD',
    'melbourne': 'MEL',
    'bali': 'DPS',
    'cancun': 'CUN',
    'mexico city': 'MEX',
    'buenos aires': 'BUE',
  };
  
  const normalized = location.toLowerCase();
  
  for (const [city, code] of Object.entries(cityCodeMap)) {
    if (normalized.includes(city)) {
      return code;
    }
  }
  
  // Return first 3 letters as fallback
  return location.substring(0, 3).toUpperCase();
}

/**
 * Fetch hotel offers from Amadeus and convert to reservation format
 */
export async function fetchHotelReservation(
  search: HotelSearchParams,
  segmentLocation: { lat: number; lng: number }
): Promise<FetchedReservation<HotelReservation> | null> {
  try {
    console.log('🏨 Fetching hotel:', search.location);
    
    const cityCode = search.cityCode || getCityCode(search.location);
    
    const offers = await searchHotels({
      cityCode,
      checkInDate: search.checkIn,
      checkOutDate: search.checkOut,
      adults: 1,
      max: 5,
    });

    if (!offers || offers.length === 0) {
      console.log('⚠️ No hotels found for', search.location);
      return null;
    }

    // Pick a hotel based on style preference
    const offer = selectHotelByStyle(offers, search.style);
    
    const reservation: HotelReservation = {
      type: 'Hotel',
      status: 'Pending',
      venue: {
        name: offer.name,
        address: formatHotelAddress(offer.address),
        lat: offer.location?.latitude || segmentLocation.lat,
        lng: offer.location?.longitude || segmentLocation.lng,
        timezone: 'UTC', // Would need lookup
      },
      checkInTime: `${search.checkIn}T15:00:00`,
      checkOutTime: `${search.checkOut}T11:00:00`,
      cost: parseFloat(offer.price.total),
      currency: offer.price.currency,
    };

    return {
      reservation,
      suggestionReason: search.explanation,
      profileReferences: search.profileReferences,
    };
  } catch (error) {
    console.error('Error fetching hotel:', error);
    return null;
  }
}

function selectHotelByStyle(offers: HotelOffer[], style: string): HotelOffer {
  // Simple selection - in production, would match hotel characteristics to style
  if (style === 'luxury' || style === 'boutique') {
    // Pick the most expensive
    return offers.reduce((best, current) => 
      parseFloat(current.price.total) > parseFloat(best.price.total) ? current : best
    );
  } else if (style === 'budget') {
    // Pick the cheapest
    return offers.reduce((best, current) => 
      parseFloat(current.price.total) < parseFloat(best.price.total) ? current : best
    );
  }
  // Default: middle of the pack
  const sorted = [...offers].sort((a, b) => 
    parseFloat(a.price.total) - parseFloat(b.price.total)
  );
  return sorted[Math.floor(sorted.length / 2)];
}

function formatHotelAddress(address?: HotelOffer['address']): string {
  if (!address) return 'Address not available';
  const parts = [
    ...(address.lines || []),
    address.postalCode,
    address.cityName,
    address.countryCode,
  ].filter(Boolean);
  return parts.join(', ');
}

// ============================================================================
// RESTAURANT FETCHING (YELP)
// ============================================================================

/**
 * Fetch restaurant from Yelp and convert to reservation format
 */
export async function fetchRestaurantReservation(
  search: RestaurantSearchParams,
  location: { lat: number; lng: number }
): Promise<FetchedReservation<RestaurantReservation> | null> {
  try {
    console.log('🍽️ Fetching restaurant:', search.cuisineType, 'in', search.location);
    
    const yelpApiKey = process.env.YELP_API_KEY;
    if (!yelpApiKey) {
      console.log('⚠️ No Yelp API key configured');
      return createFallbackRestaurant(search, location);
    }

    // Build Yelp search params
    const params = new URLSearchParams({
      latitude: location.lat.toString(),
      longitude: location.lng.toString(),
      categories: mapCuisineToYelpCategory(search.cuisineType),
      price: mapPriceRange(search.priceRange),
      limit: '5',
      sort_by: 'rating',
    });

    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?${params}`,
      {
        headers: {
          Authorization: `Bearer ${yelpApiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.log('⚠️ Yelp API error:', response.status);
      return createFallbackRestaurant(search, location);
    }

    const data = await response.json();
    const businesses: YelpBusiness[] = data.businesses || [];

    if (businesses.length === 0) {
      console.log('⚠️ No restaurants found');
      return createFallbackRestaurant(search, location);
    }

    // Pick the best match
    const business = businesses[0];
    
    const reservation: RestaurantReservation = {
      type: 'Restaurant',
      status: 'Pending',
      venue: {
        name: business.name,
        address: business.location.display_address.join(', '),
        city: business.location.city,
        country: business.location.country || 'United States',
        lat: business.coordinates.latitude,
        lng: business.coordinates.longitude,
        timezone: 'UTC',
        phone: business.phone,
        url: business.url,
        imageUrl: business.image_url, // Capture Yelp image
      },
      reservationTime: getReservationTime(search.date, search.mealType),
      partySize: 2,
      cost: estimateMealCost(search.priceRange),
      currency: 'USD',
      imageUrl: business.image_url, // Also set directly on reservation
    };

    return {
      reservation,
      suggestionReason: search.explanation,
      profileReferences: search.profileReferences,
    };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return createFallbackRestaurant(search, location);
  }
}

function mapCuisineToYelpCategory(cuisine: string): string {
  const cuisineMap: Record<string, string> = {
    'italian': 'italian',
    'japanese': 'japanese',
    'french': 'french',
    'mexican': 'mexican',
    'chinese': 'chinese',
    'indian': 'indpak',
    'thai': 'thai',
    'vietnamese': 'vietnamese',
    'korean': 'korean',
    'mediterranean': 'mediterranean',
    'american': 'newamerican',
    'seafood': 'seafood',
    'steakhouse': 'steak',
    'farm-to-table': 'farmtotable',
    'vegetarian': 'vegetarian',
    'vegan': 'vegan',
    'pizza': 'pizza',
    'sushi': 'sushi',
    'tapas': 'tapas',
    'brunch': 'breakfast_brunch',
  };
  
  const normalized = cuisine.toLowerCase();
  for (const [key, value] of Object.entries(cuisineMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return 'restaurants';
}

function mapPriceRange(range: string): string {
  const priceMap: Record<string, string> = {
    '$': '1',
    '$$': '1,2',
    '$$$': '2,3',
    '$$$$': '3,4',
  };
  return priceMap[range] || '2';
}

function getReservationTime(date: string, mealType: 'breakfast' | 'lunch' | 'dinner'): string {
  const timeMap: Record<string, string> = {
    'breakfast': '09:00:00',
    'lunch': '12:30:00',
    'dinner': '19:30:00',
  };
  return `${date}T${timeMap[mealType]}`;
}

function estimateMealCost(priceRange: string): number {
  const costMap: Record<string, number> = {
    '$': 15,
    '$$': 35,
    '$$$': 75,
    '$$$$': 150,
  };
  return costMap[priceRange] || 40;
}

function createFallbackRestaurant(
  search: RestaurantSearchParams,
  location: { lat: number; lng: number }
): FetchedReservation<RestaurantReservation> {
  const reservation: RestaurantReservation = {
    type: 'Restaurant',
    status: 'Pending',
    venue: {
      name: `${search.cuisineType} Restaurant (To Be Booked)`,
      address: search.location,
      lat: location.lat,
      lng: location.lng,
      timezone: 'UTC',
    },
    reservationTime: getReservationTime(search.date, search.mealType),
    partySize: 2,
    cost: estimateMealCost(search.priceRange),
    currency: 'USD',
    notes: `Suggested: ${search.cuisineType} ${search.mealType}`,
  };

  return {
    reservation,
    suggestionReason: search.explanation,
    profileReferences: search.profileReferences,
  };
}

// ============================================================================
// ACTIVITY FETCHING
// ============================================================================

/**
 * Fetch activity from Amadeus and convert to reservation format
 */
export async function fetchActivityReservation(
  search: ActivitySearchParams,
  location: { lat: number; lng: number }
): Promise<FetchedReservation<ActivityReservation> | null> {
  try {
    console.log('🎭 Fetching activity:', search.query);
    
    const activities = await searchToursActivities({
      latitude: location.lat,
      longitude: location.lng,
      radius: 10,
    });

    if (!activities || activities.length === 0) {
      console.log('⚠️ No activities found');
      return createFallbackActivity(search, location);
    }

    // Find best match based on query and type
    const activity = findBestActivityMatch(activities, search);
    
    const reservation: ActivityReservation = {
      type: mapActivityType(search.type),
      status: 'Pending',
      venue: {
        name: activity.name || search.query,
        address: activity.geoCode 
          ? `${activity.geoCode.latitude}, ${activity.geoCode.longitude}`
          : search.query,
        lat: activity.geoCode?.latitude || location.lat,
        lng: activity.geoCode?.longitude || location.lng,
        timezone: 'UTC',
        url: activity.bookingLink,
      },
      startTime: getActivityTime(search.date, search.timeOfDay),
      endTime: getActivityEndTime(search.date, search.timeOfDay, search.estimatedDuration),
      cost: activity.price?.amount ? parseFloat(activity.price.amount) : (search.estimatedCost || 50),
      currency: activity.price?.currencyCode || 'USD',
    };

    return {
      reservation,
      suggestionReason: search.explanation,
      profileReferences: search.profileReferences,
    };
  } catch (error) {
    console.error('Error fetching activity:', error);
    return createFallbackActivity(search, location);
  }
}

function findBestActivityMatch(activities: any[], search: ActivitySearchParams): any {
  // Score activities based on query match
  const queryWords = search.query.toLowerCase().split(/\s+/);
  const typeWords = search.type.toLowerCase().split(/\s+/);
  
  let bestMatch = activities[0];
  let bestScore = 0;
  
  for (const activity of activities) {
    let score = 0;
    const name = (activity.name || '').toLowerCase();
    const description = (activity.shortDescription || '').toLowerCase();
    
    for (const word of queryWords) {
      if (name.includes(word)) score += 10;
      if (description.includes(word)) score += 5;
    }
    
    for (const word of typeWords) {
      if (name.includes(word)) score += 8;
      if (description.includes(word)) score += 3;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = activity;
    }
  }
  
  return bestMatch;
}

function mapActivityType(type: string): 'Tour' | 'Museum' | 'Excursion' | 'Spa & Wellness' | 'Hike' | 'Event Tickets' {
  const typeMap: Record<string, any> = {
    'museum': 'Museum',
    'tour': 'Tour',
    'outdoor': 'Excursion',
    'hiking': 'Hike',
    'spa': 'Spa & Wellness',
    'wellness': 'Spa & Wellness',
    'culinary': 'Tour',
    'concert': 'Event Tickets',
    'show': 'Event Tickets',
    'event': 'Event Tickets',
  };
  
  const normalized = type.toLowerCase();
  for (const [key, value] of Object.entries(typeMap)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  return 'Tour';
}

function getActivityTime(date: string, timeOfDay: 'morning' | 'afternoon' | 'evening'): string {
  const timeMap: Record<string, string> = {
    'morning': '09:00:00',
    'afternoon': '14:00:00',
    'evening': '19:00:00',
  };
  return `${date}T${timeMap[timeOfDay]}`;
}

function getActivityEndTime(date: string, timeOfDay: 'morning' | 'afternoon' | 'evening', durationHours: number): string {
  const startHour = {
    'morning': 9,
    'afternoon': 14,
    'evening': 19,
  }[timeOfDay];
  
  const endHour = startHour + durationHours;
  const hours = Math.floor(endHour);
  const minutes = Math.round((endHour - hours) * 60);
  
  return `${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

function createFallbackActivity(
  search: ActivitySearchParams,
  location: { lat: number; lng: number }
): FetchedReservation<ActivityReservation> {
  const reservation: ActivityReservation = {
    type: mapActivityType(search.type),
    status: 'Pending',
    venue: {
      name: search.query,
      address: 'To Be Confirmed',
      lat: location.lat,
      lng: location.lng,
      timezone: 'UTC',
    },
    startTime: getActivityTime(search.date, search.timeOfDay),
    endTime: getActivityEndTime(search.date, search.timeOfDay, search.estimatedDuration),
    cost: search.estimatedCost || 50,
    currency: 'USD',
    notes: `Suggested: ${search.type}`,
  };

  return {
    reservation,
    suggestionReason: search.explanation,
    profileReferences: search.profileReferences,
  };
}

// ============================================================================
// BATCH FETCHING
// ============================================================================

export interface BatchFetchResult {
  flights: Array<FetchedReservation<FlightReservation>>;
  hotels: Array<FetchedReservation<HotelReservation>>;
  restaurants: Array<FetchedReservation<RestaurantReservation>>;
  activities: Array<FetchedReservation<ActivityReservation>>;
  errors: string[];
}

/**
 * Fetch all data for a segment in parallel
 */
export async function fetchSegmentData(
  flightSearch: FlightSearchParams | undefined,
  hotelSearch: HotelSearchParams | undefined,
  restaurantSearches: RestaurantSearchParams[],
  activitySearches: ActivitySearchParams[],
  segmentLocation: { lat: number; lng: number },
  homeAirport?: string
): Promise<BatchFetchResult> {
  const result: BatchFetchResult = {
    flights: [],
    hotels: [],
    restaurants: [],
    activities: [],
    errors: [],
  };

  // Fetch in parallel
  const promises: Promise<void>[] = [];

  // Flight
  if (flightSearch) {
    promises.push(
      fetchFlightReservation(flightSearch, homeAirport)
        .then(res => { if (res) result.flights.push(res); })
        .catch(e => result.errors.push(`Flight: ${e.message}`))
    );
  }

  // Hotel
  if (hotelSearch) {
    promises.push(
      fetchHotelReservation(hotelSearch, segmentLocation)
        .then(res => { if (res) result.hotels.push(res); })
        .catch(e => result.errors.push(`Hotel: ${e.message}`))
    );
  }

  // Restaurants
  for (const search of restaurantSearches) {
    promises.push(
      fetchRestaurantReservation(search, segmentLocation)
        .then(res => { if (res) result.restaurants.push(res); })
        .catch(e => result.errors.push(`Restaurant: ${e.message}`))
    );
  }

  // Activities
  for (const search of activitySearches) {
    promises.push(
      fetchActivityReservation(search, segmentLocation)
        .then(res => { if (res) result.activities.push(res); })
        .catch(e => result.errors.push(`Activity: ${e.message}`))
    );
  }

  await Promise.all(promises);
  
  return result;
}
