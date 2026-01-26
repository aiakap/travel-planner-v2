import { z } from "zod";

/**
 * Flight Extraction Schema for OpenAI Structured Outputs
 * 
 * This schema is designed to be compatible with OpenAI's Structured Outputs feature
 * when used with Vercel AI SDK's generateObject.
 * 
 * ⚠️ CRITICAL: ALL fields must be truly required (no .optional(), .nullable(), or .default())
 * for the Vercel AI SDK to include them in the JSON Schema's "required" array.
 * The AI prompt must instruct the model to provide empty strings for missing values.
 * 
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */

/**
 * Schema for a single flight segment
 * 
 * Represents one leg of a journey (e.g., SFO -> HND)
 * All fields are required by the schema - the AI must provide a value for each field.
 */
export const flightSegmentSchema = z.object({
  flightNumber: z.string().describe("Full flight number including carrier code (e.g., UA875)"),
  carrier: z.string().describe("Airline name (e.g., United Airlines, All Nippon Airways)"),
  carrierCode: z.string().describe("Two-letter IATA airline code (e.g., UA, NH)"),
  departureAirport: z.string().describe("Departure airport IATA code (e.g., SFO)"),
  departureCity: z.string().describe("Departure city and country (e.g., San Francisco, CA, US)"),
  departureDate: z.string().describe("Departure date in ISO format YYYY-MM-DD (e.g., 2026-01-28)"),
  departureTime: z.string().describe("Departure time in 12-hour format with AM/PM (e.g., 10:15 AM)"),
  arrivalAirport: z.string().describe("Arrival airport IATA code (e.g., HND)"),
  arrivalCity: z.string().describe("Arrival city and country (e.g., Tokyo, JP)"),
  arrivalDate: z.string().describe("Arrival date in ISO format YYYY-MM-DD (e.g., 2026-01-30)"),
  arrivalTime: z.string().describe("Arrival time in 12-hour format with AM/PM (e.g., 02:50 PM)"),
  cabin: z.string().describe("Cabin class (e.g., United Premium Plus, Economy) or empty string if not specified"),
  seatNumber: z.string().describe("Assigned seat number (e.g., 22K) or empty string if not assigned"),
  operatedBy: z.string().describe("Operating airline if codeshare (e.g., All Nippon Airways), or empty string if operated by the carrier"),
});

/**
 * Complete flight extraction schema for booking confirmations
 * 
 * Extracts all relevant information from flight confirmation emails
 * All fields are required by the schema - the AI must provide a value for each field.
 */
export const flightExtractionSchema = z.object({
  confirmationNumber: z.string().describe("Booking confirmation/record locator (e.g., HQYJ5G)"),
  passengerName: z.string().describe("Passenger name from ticket (e.g., KAPLINSKY/ALEXANDER)"),
  flights: z.array(flightSegmentSchema).describe("Array of flight segments (one or more legs of the journey)"),
  eTicketNumber: z.string().describe("E-ticket number (e.g., 0162363753568) or empty string if not provided"),
  purchaseDate: z.string().describe("Date of purchase in ISO format YYYY-MM-DD (e.g., 2026-01-12) or empty string if not provided"),
  totalCost: z.number().describe("Total cost as a number or 0 if not provided"),
  currency: z.string().describe("Currency code (e.g., USD, EUR) or empty string if not provided"),
});

/**
 * TypeScript type inferred from the Zod schema
 * 
 * All fields are required (non-optional). Missing values are represented as empty strings or 0,
 * as instructed by the AI prompt. This ensures full compatibility with OpenAI's structured outputs.
 */
export type FlightExtraction = z.infer<typeof flightExtractionSchema>;

/**
 * Validates flight extraction data against the schema
 * 
 * This function provides a type-safe way to validate data with detailed error reporting.
 * Use this when you need to validate data from external sources or API responses.
 * 
 * @param data - The data to validate (typically from OpenAI's generateObject)
 * @returns Object with success flag, validated data, or error message
 * 
 * @example
 * ```typescript
 * const result = validateFlightExtraction(unknownData);
 * if (result.success) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.error('Validation error:', result.error);
 * }
 * ```
 */
export function validateFlightExtraction(data: unknown): {
  success: boolean;
  data?: FlightExtraction;
  error?: string;
} {
  const result = flightExtractionSchema.safeParse(data);
  
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
    };
  }
  
  return { 
    success: true, 
    data: result.data 
  };
}
