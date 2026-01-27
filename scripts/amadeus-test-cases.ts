/**
 * Amadeus API Test Case Definitions
 * 
 * Comprehensive test cases for all 26 Amadeus APIs
 * Uses the same test data as the admin UI
 */

export interface APITestCase {
  id: string;
  name: string;
  apiType: string;
  params: Record<string, any>;
  expectedStatus: 'success' | 'error' | 'deprecated' | 'unknown';
  timeout: number;
  category: 'flight' | 'hotel' | 'airport' | 'activity' | 'transfer';
  sdkMethod: string;
  apiDocUrl?: string;
  notes?: string;
}

export const TEST_CASES: APITestCase[] = [
  // ========================================================================
  // EXISTING APIs (3)
  // ========================================================================
  {
    id: 'flight-search-1',
    name: 'Flight Offers Search (JFK→LAX)',
    apiType: 'flight-search',
    params: {
      originLocationCode: 'JFK',
      destinationLocationCode: 'LAX',
      departureDate: '2026-07-15',
      adults: 1,
      max: 5,
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'flight',
    sdkMethod: 'amadeus.shopping.flightOffersSearch.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search',
    notes: 'Core flight search - should always work'
  },
  {
    id: 'hotel-search-1',
    name: 'Hotel Search (NYC)',
    apiType: 'hotel-search',
    params: {
      cityCode: 'NYC',
      checkInDate: '2026-07-15',
      checkOutDate: '2026-07-18',
      adults: 1,
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'hotel',
    sdkMethod: 'amadeus.shopping.hotelOffersSearch.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search',
    notes: 'Two-step: hotel list → offers'
  },
  {
    id: 'airport-search-1',
    name: 'Airport Search (New York)',
    apiType: 'airport-search',
    params: {
      keyword: 'New York',
      max: 10,
    },
    expectedStatus: 'success',
    timeout: 5000,
    category: 'airport',
    sdkMethod: 'amadeus.referenceData.locations.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/airport-and-city-search',
    notes: 'Has fallback to static data'
  },

  // ========================================================================
  // FLIGHT DISCOVERY (2)
  // ========================================================================
  {
    id: 'flight-inspiration-1',
    name: 'Flight Inspiration Search',
    apiType: 'flight-inspiration',
    params: {
      origin: 'BOS',
      departureDate: '2026-08-01',
      maxPrice: 500,
      oneWay: false,
    },
    expectedStatus: 'unknown',
    timeout: 10000,
    category: 'flight',
    sdkMethod: 'amadeus.shopping.flightDestinations.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/flight-inspiration-search',
    notes: 'May be deprecated or have limited test data'
  },
  {
    id: 'flight-cheapest-dates-1',
    name: 'Flight Cheapest Date Search',
    apiType: 'flight-cheapest-dates',
    params: {
      origin: 'MAD',
      destination: 'BCN',
      departureDate: '2026-08-01,2026-08-31',
      oneWay: false,
    },
    expectedStatus: 'unknown',
    timeout: 10000,
    category: 'flight',
    sdkMethod: 'amadeus.shopping.flightDates.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/flight-cheapest-date-search',
    notes: 'May be deprecated'
  },

  // ========================================================================
  // FLIGHT INTELLIGENCE (2)
  // ========================================================================
  {
    id: 'flight-price-analysis-1',
    name: 'Flight Price Analysis',
    apiType: 'flight-price-analysis',
    params: {
      originIataCode: 'MAD',
      destinationIataCode: 'CDG',
      departureDate: '2026-08-15',
      currencyCode: 'EUR',
      oneWay: true,
    },
    expectedStatus: 'deprecated',
    timeout: 10000,
    category: 'flight',
    sdkMethod: 'amadeus.analytics.itineraryPriceMetrics.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/flight-price-analysis',
    notes: 'DEPRECATED - API decommissioned by Amadeus (error code 41254, status 410)'
  },
  {
    id: 'flight-delay-prediction-1',
    name: 'Flight Delay Prediction',
    apiType: 'flight-delay-prediction',
    params: {
      originLocationCode: 'NCE',
      destinationLocationCode: 'IST',
      departureDate: '2026-08-01',
      departureTime: '18:20:00',
      arrivalDate: '2026-08-01',
      arrivalTime: '22:15:00',
      aircraftCode: '321',
      carrierCode: 'TK',
      flightNumber: '1816',
      duration: 'PT3H55M',
    },
    expectedStatus: 'deprecated',
    timeout: 10000,
    category: 'flight',
    sdkMethod: 'amadeus.travel.predictions.flightDelay.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/flight-delay-prediction',
    notes: 'DEPRECATED - API decommissioned by Amadeus (error code 41254, status 410)'
  },

  // ========================================================================
  // AIRPORT DATA (5)
  // ========================================================================
  {
    id: 'airport-routes-1',
    name: 'Airport Routes',
    apiType: 'airport-routes',
    params: {
      airportCode: 'MAD',
      max: 20,
    },
    expectedStatus: 'unknown',
    timeout: 10000,
    category: 'airport',
    sdkMethod: 'amadeus.airport.directDestinations.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/airport-routes',
    notes: 'Should return list of destinations'
  },
  {
    id: 'airport-nearby-1',
    name: 'Airport Nearest Relevant',
    apiType: 'airport-nearby',
    params: {
      latitude: 40.416775,
      longitude: -3.703790,
      radius: 500,
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'airport',
    sdkMethod: 'amadeus.referenceData.locations.airports.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/airport-nearest-relevant',
    notes: 'Madrid coordinates - should find MAD'
  },
  {
    id: 'airport-ontime-1',
    name: 'Airport On-Time Performance',
    apiType: 'airport-ontime',
    params: {
      airportCode: 'JFK',
      date: '2026-08-15',
    },
    expectedStatus: 'deprecated',
    timeout: 10000,
    category: 'airport',
    sdkMethod: 'amadeus.airport.predictions.onTime.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/airport-on-time-performance',
    notes: 'DEPRECATED - API decommissioned by Amadeus (error code 41254, status 410)'
  },
  {
    id: 'airline-lookup-1',
    name: 'Airline Code Lookup',
    apiType: 'airline-lookup',
    params: {
      airlineCodes: 'BA',
    },
    expectedStatus: 'success',
    timeout: 5000,
    category: 'airport',
    sdkMethod: 'amadeus.referenceData.airlines.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/airline-code-lookup',
    notes: 'Reference data - should work'
  },
  {
    id: 'airline-routes-1',
    name: 'Airline Routes',
    apiType: 'airline-routes',
    params: {
      airlineCode: 'BA',
      max: 20,
    },
    expectedStatus: 'unknown',
    timeout: 10000,
    category: 'airport',
    sdkMethod: 'amadeus.airline.destinations.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/airline-routes',
    notes: 'Should return BA destinations'
  },

  // ========================================================================
  // HOTEL DISCOVERY (5)
  // ========================================================================
  {
    id: 'hotel-list-city-1',
    name: 'Hotel List by City',
    apiType: 'hotel-list-city',
    params: {
      cityCode: 'PAR',
      radius: 5,
      radiusUnit: 'KM',
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'hotel',
    sdkMethod: 'amadeus.referenceData.locations.hotels.byCity.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-list',
    notes: 'Hotel list API - should work'
  },
  {
    id: 'hotel-list-geocode-1',
    name: 'Hotel List by Geocode',
    apiType: 'hotel-list-geocode',
    params: {
      latitude: 48.8566,
      longitude: 2.3522,
      radius: 5,
      radiusUnit: 'KM',
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'hotel',
    sdkMethod: 'amadeus.referenceData.locations.hotels.byGeocode.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-list',
    notes: 'Paris coordinates'
  },
  {
    id: 'hotel-list-ids-1',
    name: 'Hotel List by IDs',
    apiType: 'hotel-list-ids',
    params: {
      hotelIds: 'HLPAR001,HLPAR002',
    },
    expectedStatus: 'error',
    timeout: 10000,
    category: 'hotel',
    sdkMethod: 'amadeus.referenceData.locations.hotels.byHotels.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-list',
    notes: 'Test hotel IDs may not exist'
  },
  {
    id: 'hotel-autocomplete-1',
    name: 'Hotel Name Autocomplete',
    apiType: 'hotel-autocomplete',
    params: {
      keyword: 'PARI',
      subType: 'HOTEL_LEISURE',
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'hotel',
    sdkMethod: 'amadeus.referenceData.locations.hotel.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-name-autocomplete',
    notes: 'Autocomplete should work'
  },
  {
    id: 'hotel-ratings-1',
    name: 'Hotel Ratings',
    apiType: 'hotel-ratings',
    params: {
      hotelIds: 'TELONMFS,ADNYCCTB',
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'hotel',
    sdkMethod: 'amadeus.eReputation.hotelSentiments.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-ratings',
    notes: 'CONFIRMED WORKING - Returns hotel sentiment ratings'
  },

  // ========================================================================
  // ACTIVITIES (2)
  // ========================================================================
  {
    id: 'tours-activities-1',
    name: 'Tours & Activities by Radius',
    apiType: 'tours-activities',
    params: {
      latitude: 40.41436995,
      longitude: -3.69170868,
      radius: 1,
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'activity',
    sdkMethod: 'amadeus.shopping.activities.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/tours-and-activities',
    notes: 'CONFIRMED WORKING - Madrid has excellent test data (117+ activities)'
  },
  {
    id: 'tours-activities-square-1',
    name: 'Tours & Activities by Square',
    apiType: 'tours-activities-square',
    params: {
      north: 41.397158,
      west: 2.160873,
      south: 41.394582,
      east: 2.177181,
    },
    expectedStatus: 'unknown',
    timeout: 15000,
    category: 'activity',
    sdkMethod: 'amadeus.shopping.activities.bySquare.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/tours-and-activities',
    notes: 'Barcelona bounds - increased timeout to 15s (previously timed out)'
  },

  // ========================================================================
  // FLIGHT SERVICES (2)
  // ========================================================================
  {
    id: 'flight-checkin-links-1',
    name: 'Flight Check-in Links',
    apiType: 'flight-checkin-links',
    params: {
      airlineCode: 'BA',
      language: 'en-GB',
    },
    expectedStatus: 'success',
    timeout: 5000,
    category: 'flight',
    sdkMethod: 'amadeus.referenceData.urls.checkinLinks.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/flight-check-in-links',
    notes: 'CONFIRMED WORKING - Returns check-in URLs for airlines'
  },
  {
    id: 'flight-status-1',
    name: 'On-Demand Flight Status',
    apiType: 'flight-status',
    params: {
      carrierCode: 'IB',
      flightNumber: '532',
      scheduledDepartureDate: '2026-08-23',
    },
    expectedStatus: 'success',
    timeout: 10000,
    category: 'flight',
    sdkMethod: 'amadeus.schedule.flights.get()',
    apiDocUrl: 'https://developers.amadeus.com/self-service/category/flights/api-doc/on-demand-flight-status',
    notes: 'CONFIRMED WORKING - Returns empty for future dates (use recent dates for real data)'
  },
];

// Test cases organized by category
export const TEST_CASES_BY_CATEGORY = {
  flight: TEST_CASES.filter(tc => tc.category === 'flight'),
  hotel: TEST_CASES.filter(tc => tc.category === 'hotel'),
  airport: TEST_CASES.filter(tc => tc.category === 'airport'),
  activity: TEST_CASES.filter(tc => tc.category === 'activity'),
  transfer: TEST_CASES.filter(tc => tc.category === 'transfer'),
};

// Count by expected status
export const EXPECTED_COUNTS = {
  success: TEST_CASES.filter(tc => tc.expectedStatus === 'success').length,
  error: TEST_CASES.filter(tc => tc.expectedStatus === 'error').length,
  unknown: TEST_CASES.filter(tc => tc.expectedStatus === 'unknown').length,
  deprecated: TEST_CASES.filter(tc => tc.expectedStatus === 'deprecated').length,
  total: TEST_CASES.length,
};
