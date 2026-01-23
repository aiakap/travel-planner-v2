/**
 * Zod Validation Schemas for Amadeus API Responses
 * 
 * Based on official Amadeus API response structures
 * Provides runtime validation to catch API changes early
 */

import { z } from 'zod';

// ============================================================================
// Flight Schemas
// ============================================================================

/**
 * Flight segment location schema
 */
const FlightLocationSchema = z.object({
  iataCode: z.string(),
  terminal: z.string().optional(),
  at: z.string(), // ISO 8601 datetime
});

/**
 * Flight aircraft schema
 */
const AircraftSchema = z.object({
  code: z.string(),
});

/**
 * Flight segment schema
 */
const FlightSegmentSchema = z.object({
  departure: FlightLocationSchema,
  arrival: FlightLocationSchema,
  carrierCode: z.string(),
  number: z.string(),
  aircraft: AircraftSchema,
  duration: z.string(), // ISO 8601 duration
  id: z.string().optional(),
  numberOfStops: z.number().optional(),
  blacklistedInEU: z.boolean().optional(),
  operating: z.object({
    carrierCode: z.string().optional(),
  }).optional(),
});

/**
 * Flight itinerary schema
 */
const FlightItinerarySchema = z.object({
  duration: z.string(), // ISO 8601 duration
  segments: z.array(FlightSegmentSchema),
});

/**
 * Price schema
 */
const PriceSchema = z.object({
  currency: z.string(),
  total: z.string(),
  base: z.string().optional(),
  fees: z.array(z.object({
    amount: z.string(),
    type: z.string(),
  })).optional(),
  grandTotal: z.string().optional(),
});

/**
 * Fare details by segment schema
 */
const FareDetailsBySegmentSchema = z.object({
  segmentId: z.string(),
  cabin: z.string(),
  fareBasis: z.string().optional(),
  brandedFare: z.string().optional(),
  class: z.string().optional(),
  includedCheckedBags: z.object({
    quantity: z.number().optional(),
    weight: z.number().optional(),
    weightUnit: z.string().optional(),
  }).optional(),
});

/**
 * Traveler pricing schema
 */
const TravelerPricingSchema = z.object({
  travelerId: z.string(),
  fareOption: z.string(),
  travelerType: z.string(),
  price: PriceSchema,
  fareDetailsBySegment: z.array(FareDetailsBySegmentSchema),
});

/**
 * Complete flight offer schema
 */
export const FlightOfferSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  source: z.string().optional(),
  instantTicketingRequired: z.boolean().optional(),
  nonHomogeneous: z.boolean().optional(),
  oneWay: z.boolean().optional(),
  lastTicketingDate: z.string().optional(),
  numberOfBookableSeats: z.number().optional(),
  itineraries: z.array(FlightItinerarySchema),
  price: PriceSchema,
  pricingOptions: z.object({
    fareType: z.array(z.string()).optional(),
    includedCheckedBagsOnly: z.boolean().optional(),
  }).optional(),
  validatingAirlineCodes: z.array(z.string()),
  travelerPricings: z.array(TravelerPricingSchema).optional(),
  // Choice prediction fields (optional)
  choiceProbability: z.string().optional(),
});

/**
 * Flight offers array schema
 */
export const FlightOffersSchema = z.array(FlightOfferSchema);

// ============================================================================
// Hotel Schemas
// ============================================================================

/**
 * Hotel geocode schema
 */
const GeoCodeSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

/**
 * Hotel address schema
 */
const HotelAddressSchema = z.object({
  lines: z.array(z.string()).optional(),
  postalCode: z.string().optional(),
  cityName: z.string().optional(),
  countryCode: z.string().optional(),
});

/**
 * Hotel contact schema
 */
const HotelContactSchema = z.object({
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().optional(),
});

/**
 * Room type estimated schema
 */
const RoomTypeEstimatedSchema = z.object({
  category: z.string().optional(),
  beds: z.number().optional(),
  bedType: z.string().optional(),
});

/**
 * Room description schema
 */
const RoomDescriptionSchema = z.object({
  text: z.string().optional(),
  lang: z.string().optional(),
});

/**
 * Room schema
 */
const RoomSchema = z.object({
  type: z.string().optional(),
  typeEstimated: RoomTypeEstimatedSchema.optional(),
  description: RoomDescriptionSchema.optional(),
});

/**
 * Guests schema
 */
const GuestsSchema = z.object({
  adults: z.number(),
  childAges: z.array(z.number()).optional(),
});

/**
 * Price variations schema
 */
const PriceVariationsSchema = z.object({
  average: z.object({
    base: z.string().optional(),
    total: z.string().optional(),
  }).optional(),
  changes: z.array(z.object({
    startDate: z.string(),
    endDate: z.string(),
    base: z.string().optional(),
    total: z.string().optional(),
  })).optional(),
});

/**
 * Hotel price schema (extended from base price)
 */
const HotelPriceSchema = PriceSchema.extend({
  variations: PriceVariationsSchema.optional(),
  taxes: z.array(z.object({
    amount: z.string().optional(),
    currency: z.string().optional(),
    code: z.string().optional(),
    included: z.boolean().optional(),
  })).optional(),
});

/**
 * Cancellation policy schema
 */
const CancellationSchema = z.object({
  deadline: z.string().optional(),
  amount: z.string().optional(),
  type: z.string().optional(),
  description: z.object({
    text: z.string().optional(),
  }).optional(),
});

/**
 * Policies schema
 */
const PoliciesSchema = z.object({
  paymentType: z.string().optional(),
  cancellation: CancellationSchema.optional(),
  guarantee: z.object({
    acceptedPayments: z.object({
      methods: z.array(z.string()).optional(),
    }).optional(),
  }).optional(),
});

/**
 * Hotel offer schema
 */
const HotelOfferSchema = z.object({
  id: z.string(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  rateCode: z.string().optional(),
  room: RoomSchema.optional(),
  guests: GuestsSchema.optional(),
  price: HotelPriceSchema,
  policies: PoliciesSchema.optional(),
  self: z.string().optional(),
});

/**
 * Hotel information schema
 */
const HotelInfoSchema = z.object({
  type: z.string().optional(),
  hotelId: z.string(),
  chainCode: z.string().optional(),
  dupeId: z.number().optional(),
  name: z.string(),
  rating: z.string().optional(),
  cityCode: z.string().optional(),
  latitude: z.union([z.number(), z.string()]).optional(),
  longitude: z.union([z.number(), z.string()]).optional(),
  hotelDistance: z.object({
    distance: z.number().optional(),
    distanceUnit: z.string().optional(),
  }).optional(),
  address: HotelAddressSchema.optional(),
  contact: HotelContactSchema.optional(),
  amenities: z.array(z.string()).optional(),
  media: z.array(z.object({
    uri: z.string(),
    category: z.string().optional(),
  })).optional(),
});

/**
 * Complete hotel offer with hotel info schema
 */
export const HotelOfferWithInfoSchema = z.object({
  type: z.string().optional(),
  hotel: HotelInfoSchema,
  available: z.boolean(),
  offers: z.array(HotelOfferSchema),
  self: z.string().optional(),
});

/**
 * Hotel offers array schema
 */
export const HotelOffersSchema = z.array(HotelOfferWithInfoSchema);

/**
 * Simplified hotel offer for our internal use
 */
export const SimpleHotelOfferSchema = z.object({
  hotelId: z.string(),
  name: z.string(),
  price: z.object({
    total: z.string(),
    currency: z.string(),
  }),
  rating: z.number().optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  address: z.object({
    lines: z.array(z.string()).optional(),
    postalCode: z.string().optional(),
    cityName: z.string().optional(),
    countryCode: z.string().optional(),
  }).optional(),
  amenities: z.array(z.string()).optional(),
  media: z.array(z.object({
    uri: z.string(),
    category: z.string().optional(),
  })).optional(),
  available: z.boolean(),
});

// ============================================================================
// Location/City Schemas
// ============================================================================

/**
 * City search result schema
 */
export const CitySchema = z.object({
  type: z.string(),
  subType: z.string(),
  name: z.string(),
  detailedName: z.string().optional(),
  id: z.string(),
  iataCode: z.string(),
  address: z.object({
    cityName: z.string().optional(),
    cityCode: z.string().optional(),
    countryName: z.string().optional(),
    countryCode: z.string().optional(),
    regionCode: z.string().optional(),
  }).optional(),
  geoCode: GeoCodeSchema.optional(),
});

/**
 * Cities array schema
 */
export const CitiesSchema = z.array(CitySchema);

// ============================================================================
// Pagination Metadata Schema
// ============================================================================

/**
 * Pagination links schema
 */
export const PaginationLinksSchema = z.object({
  self: z.string().optional(),
  next: z.string().optional(),
  previous: z.string().optional(),
  last: z.string().optional(),
  first: z.string().optional(),
  up: z.string().optional(),
});

/**
 * Response metadata schema
 */
export const ResponseMetaSchema = z.object({
  count: z.number().optional(),
  links: PaginationLinksSchema.optional(),
});

// ============================================================================
// Validation Helper Functions
// ============================================================================

/**
 * Validate flight offers with detailed error reporting
 */
export function validateFlightOffers(data: unknown) {
  return FlightOffersSchema.safeParse(data);
}

/**
 * Validate hotel offers with detailed error reporting
 */
export function validateHotelOffers(data: unknown) {
  return HotelOffersSchema.safeParse(data);
}

/**
 * Validate cities with detailed error reporting
 */
export function validateCities(data: unknown) {
  return CitiesSchema.safeParse(data);
}

/**
 * Format Zod validation errors for logging
 */
export function formatValidationErrors(errors: z.ZodError): string {
  return errors.errors
    .map(err => `${err.path.join('.')}: ${err.message}`)
    .join('; ');
}
