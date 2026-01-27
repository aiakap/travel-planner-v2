import { z } from "zod";

/**
 * EXP Response Schema for OpenAI Structured Outputs
 * 
 * This schema defines the structured output format for the /exp chat endpoint.
 * It replaces the old card syntax parsing system with proper structured JSON.
 * 
 * CRITICAL: OpenAI Structured Outputs requires ALL properties to be in the "required" array.
 * - Cannot use .default() or .optional()
 * - All fields must be present in every response
 * - For optional data, AI must provide empty strings ("") or 0 for numbers
 * - For optional arrays, AI must provide empty arrays ([])
 * 
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */

// ============================================================================
// Place Suggestion Schemas (for Google Places API)
// ============================================================================

const placeSuggestionSchema = z.object({
  suggestedName: z.string().describe("Exact name as it appears in the text"),
  category: z.enum(["Stay", "Eat", "Do", "Transport"]).describe("Category of place"),
  type: z.string().describe("Specific type (e.g., Hotel, Restaurant, Museum, Flight)"),
  searchQuery: z.string().describe("Optimized query for Google Places API"),
  context: z.object({
    dayNumber: z.number().describe("Day number in trip, use 0 if not specified"),
    timeOfDay: z.string().describe("Time of day: morning, afternoon, evening, or empty string"),
    specificTime: z.string().describe("Specific time like 7:00 PM or empty string"),
    notes: z.string().describe("Additional context or recommendations, or empty string"),
  }).describe("Context information for the place"),
  segmentId: z.string().describe("Segment ID if place belongs to a specific segment, or empty string"),
});

// ============================================================================
// Transport Suggestion Schemas (for Amadeus API)
// ============================================================================

const transportSuggestionSchema = z.object({
  suggestedName: z.string().describe("Name of transport (e.g., JFK to Paris flight)"),
  type: z.enum(["Flight", "Transfer", "Train", "Bus"]).describe("Type of transport"),
  origin: z.string().describe("Origin IATA code or location"),
  destination: z.string().describe("Destination IATA code or location"),
  departureDate: z.string().describe("Departure date in YYYY-MM-DD format"),
  departureTime: z.string().describe("Departure time in HH:mm format or empty string"),
  returnDate: z.string().describe("Return date for roundtrip in YYYY-MM-DD format or empty string"),
  adults: z.number().describe("Number of adults, use 1 if not specified"),
  travelClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]).describe("Travel class, use ECONOMY if not specified"),
  transferType: z.enum(["PRIVATE", "SHARED", "TAXI", "AIRPORT_EXPRESS"]).describe("Transfer type for transfers, use PRIVATE if not specified"),
});

// ============================================================================
// Hotel Suggestion Schemas (for Amadeus API)
// ============================================================================

const hotelSuggestionSchema = z.object({
  suggestedName: z.string().describe("Name of hotel"),
  location: z.string().describe("City name or IATA code"),
  checkInDate: z.string().describe("Check-in date in YYYY-MM-DD format"),
  checkOutDate: z.string().describe("Check-out date in YYYY-MM-DD format"),
  guests: z.number().describe("Number of guests, use 2 if not specified"),
  rooms: z.number().describe("Number of rooms, use 1 if not specified"),
  searchQuery: z.string().describe("Search query for Google Places fallback"),
});

// ============================================================================
// Card Schemas (structured cards displayed in chat UI)
// ============================================================================

/**
 * Trip Card - Shows a trip overview with dates
 */
export const tripCardSchema = z.object({
  type: z.literal("trip_card"),
  tripId: z.string().describe("Trip ID from database"),
  title: z.string().describe("Trip title"),
  startDate: z.string().describe("Start date in YYYY-MM-DD format"),
  endDate: z.string().describe("End date in YYYY-MM-DD format"),
  description: z.string().describe("Trip description or empty string if not provided"),
});

/**
 * Segment Card - Shows a trip segment (stay, flight, etc.)
 */
export const segmentCardSchema = z.object({
  type: z.literal("segment_card"),
  segmentId: z.string().describe("Segment ID from database"),
  name: z.string().describe("Segment name"),
  segmentType: z.string().describe("Type of segment (Stay, Flight, etc.)"),
  startLocation: z.string().describe("Starting location"),
  endLocation: z.string().describe("Ending location"),
  startTime: z.string().describe("Start time in ISO format or empty string if not provided"),
  endTime: z.string().describe("End time in ISO format or empty string if not provided"),
});

/**
 * Reservation Card - Shows a reservation with details
 */
export const reservationCardSchema = z.object({
  type: z.literal("reservation_card"),
  reservationId: z.string().describe("Reservation ID from database"),
  name: z.string().describe("Reservation name"),
  category: z.string().describe("Category (Stay, Eat, Do, Transport)"),
  reservationType: z.string().describe("Specific type (Hotel, Restaurant, etc.)"),
  status: z.string().describe("Status (Confirmed, Pending, etc.)"),
  cost: z.number().describe("Cost amount or 0 if not provided"),
  currency: z.string().describe("Currency code (USD, EUR, etc.) or empty string if not provided"),
  location: z.string().describe("Location address or empty string if not provided"),
  startTime: z.string().describe("Start time in ISO format or empty string if not provided"),
  endTime: z.string().describe("End time in ISO format or empty string if not provided"),
  imageUrl: z.string().describe("Image URL or empty string if not provided"),
  vendor: z.string().describe("Vendor name or empty string if not provided"),
});

/**
 * Hotel Reservation Card - Shows detailed hotel booking info
 * Used when user pastes hotel confirmation emails
 */
export const hotelReservationCardSchema = z.object({
  type: z.literal("hotel_reservation_card"),
  reservationId: z.string().describe("Reservation ID if already saved or empty string for new"),
  hotelName: z.string().describe("Hotel name"),
  confirmationNumber: z.string().describe("Booking confirmation number or empty string if not provided"),
  checkInDate: z.string().describe("Check-in date in YYYY-MM-DD format"),
  checkInTime: z.string().describe("Check-in time (e.g., 3:00 PM) or empty string if not provided"),
  checkOutDate: z.string().describe("Check-out date in YYYY-MM-DD format"),
  checkOutTime: z.string().describe("Check-out time (e.g., 12:00 PM) or empty string if not provided"),
  nights: z.number().describe("Number of nights or 0 if not provided"),
  guests: z.number().describe("Number of guests or 0 if not provided"),
  rooms: z.number().describe("Number of rooms or 0 if not provided"),
  roomType: z.string().describe("Room type description or empty string if not provided"),
  address: z.string().describe("Hotel address or empty string if not provided"),
  totalCost: z.number().describe("Total cost or 0 if not provided"),
  currency: z.string().describe("Currency code or empty string if not provided"),
  contactPhone: z.string().describe("Contact phone number or empty string if not provided"),
  contactEmail: z.string().describe("Contact email or empty string if not provided"),
  cancellationPolicy: z.string().describe("Cancellation policy or empty string if not provided"),
  imageUrl: z.string().describe("Hotel image URL or empty string if not provided"),
  url: z.string().describe("Hotel website URL or empty string if not provided"),
});

/**
 * Dining Schedule Card - Shows restaurant suggestions for each night
 */
export const diningScheduleCardSchema = z.object({
  type: z.literal("dining_schedule_card"),
  tripId: z.string().describe("Trip ID"),
  segmentId: z.string().describe("Segment ID if specific to a segment or empty string"),
});

/**
 * Activity Table Card - Shows activities with filtering
 */
export const activityTableCardSchema = z.object({
  type: z.literal("activity_table_card"),
  location: z.string().describe("Location for activities"),
  segmentId: z.string().describe("Segment ID if specific to a segment or empty string"),
  categories: z.string().describe("Pipe-separated categories (Tours|Museums|Food) or empty string"),
});

/**
 * Flight Comparison Card - Shows flight options
 */
export const flightComparisonCardSchema = z.object({
  type: z.literal("flight_comparison_card"),
  origin: z.string().describe("Origin airport IATA code"),
  destination: z.string().describe("Destination airport IATA code"),
  departDate: z.string().describe("Departure date in YYYY-MM-DD format"),
  returnDate: z.string().describe("Return date in YYYY-MM-DD format or empty string for one-way"),
  passengers: z.number().describe("Number of passengers, default 1"),
});

/**
 * Budget Breakdown Card - Shows cost summary
 */
export const budgetBreakdownCardSchema = z.object({
  type: z.literal("budget_breakdown_card"),
  tripId: z.string().describe("Trip ID"),
});

/**
 * Day Plan Card - Shows daily itinerary
 */
export const dayPlanCardSchema = z.object({
  type: z.literal("day_plan_card"),
  tripId: z.string().describe("Trip ID"),
  date: z.string().describe("Date in YYYY-MM-DD format"),
  segmentId: z.string().describe("Segment ID if specific to a segment or empty string"),
});

/**
 * Places Map Card - Shows places on interactive map
 */
export const placesMapCardSchema = z.object({
  type: z.literal("places_map_card"),
  centerLat: z.number().describe("Center latitude"),
  centerLng: z.number().describe("Center longitude"),
  centerName: z.string().describe("Name of center point"),
  placeType: z.string().describe("Type of places to show (restaurant, museum, etc.) or empty string"),
  radius: z.number().describe("Search radius in meters, default 1000"),
});

// ============================================================================
// Union Type for All Cards
// ============================================================================

/**
 * Union of all card types
 * Using z.union() instead of z.discriminatedUnion() because OpenAI's
 * Structured Outputs doesn't support oneOf (only anyOf is supported)
 * The AI will return an array of these in the response
 */
export const cardSchema = z.union([
  tripCardSchema,
  segmentCardSchema,
  reservationCardSchema,
  hotelReservationCardSchema,
  diningScheduleCardSchema,
  activityTableCardSchema,
  flightComparisonCardSchema,
  budgetBreakdownCardSchema,
  dayPlanCardSchema,
  placesMapCardSchema,
]);

// ============================================================================
// Main Response Schema
// ============================================================================

/**
 * Complete response schema for /exp endpoint
 * This is what OpenAI will return when using generateObject()
 * 
 * NOTE: OpenAI Structured Outputs requires ALL fields to be in the required array.
 * We cannot use .default() - instead we instruct the AI to use empty arrays when no data.
 */
export const expResponseSchema = z.object({
  text: z.string().describe("Natural language response to the user (WITHOUT embedded card syntax)"),
  cards: z.array(cardSchema).describe("Structured cards to display in the UI, use empty array if none"),
  places: z.array(placeSuggestionSchema).describe("Place suggestions for Google Places lookup, use empty array if none"),
  transport: z.array(transportSuggestionSchema).describe("Transport suggestions for Amadeus API, use empty array if none"),
  hotels: z.array(hotelSuggestionSchema).describe("Hotel suggestions for Amadeus API, use empty array if none"),
});

// ============================================================================
// TypeScript Types
// ============================================================================

export type TripCard = z.infer<typeof tripCardSchema>;
export type SegmentCard = z.infer<typeof segmentCardSchema>;
export type ReservationCard = z.infer<typeof reservationCardSchema>;
export type HotelReservationCard = z.infer<typeof hotelReservationCardSchema>;
export type DiningScheduleCard = z.infer<typeof diningScheduleCardSchema>;
export type ActivityTableCard = z.infer<typeof activityTableCardSchema>;
export type FlightComparisonCard = z.infer<typeof flightComparisonCardSchema>;
export type BudgetBreakdownCard = z.infer<typeof budgetBreakdownCardSchema>;
export type DayPlanCard = z.infer<typeof dayPlanCardSchema>;
export type PlacesMapCard = z.infer<typeof placesMapCardSchema>;

export type Card = z.infer<typeof cardSchema>;
export type PlaceSuggestion = z.infer<typeof placeSuggestionSchema>;
export type TransportSuggestion = z.infer<typeof transportSuggestionSchema>;
export type HotelSuggestion = z.infer<typeof hotelSuggestionSchema>;
export type ExpResponse = z.infer<typeof expResponseSchema>;

// ============================================================================
// Validation Function
// ============================================================================

/**
 * Validates exp response data against the schema
 * 
 * @param data - The data to validate (typically from OpenAI's generateObject)
 * @returns Object with success flag, validated data, or error message
 */
export function validateExpResponse(data: unknown): {
  success: boolean;
  data?: ExpResponse;
  error?: string;
} {
  const result = expResponseSchema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues
        .map((e: any) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
    };
  }
  
  return { 
    success: true, 
    data: result.data 
  };
}
