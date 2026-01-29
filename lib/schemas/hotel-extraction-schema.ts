import { z } from "zod";

/**
 * Hotel Extraction Schema for OpenAI Structured Outputs
 * 
 * This schema is designed to be compatible with OpenAI's Structured Outputs feature.
 * All fields are required (no .optional() or .nullable()) and use empty strings ("") 
 * or 0 as defaults for missing values, ensuring compatibility with Vercel AI SDK's generateObject.
 * 
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */

/**
 * Complete hotel extraction schema for booking confirmations
 * 
 * Extracts all relevant information from hotel confirmation emails
 * All fields are required by the schema - the AI must provide a value for each field.
 */
export const hotelExtractionSchema = z.object({
  confirmationNumber: z.string().describe("Booking confirmation number (e.g., ABC123456789, HT-2026-001)"),
  guestName: z.string().describe("Guest name from reservation (e.g., SMITH/JOHN, Jane Doe)"),
  hotelName: z.string().describe("Hotel name (e.g., Marriott Downtown, Grand Hyatt Tokyo)"),
  address: z.string().describe("Hotel address or empty string if not provided"),
  checkInDate: z.string().min(1).describe("REQUIRED: Check-in date in ISO format YYYY-MM-DD. Convert from formats like 'Friday, January 30, 2026' to '2026-01-30'. NEVER empty."),
  checkInTime: z.string().describe("Check-in time in 12-hour format with AM/PM (e.g., 3:00 PM, 15:00) or empty string if not specified"),
  checkOutDate: z.string().min(1).describe("REQUIRED: Check-out date in ISO format YYYY-MM-DD. Convert from formats like 'Monday, February 2, 2026' to '2026-02-02'. NEVER empty."),
  checkOutTime: z.string().describe("Check-out time in 12-hour format with AM/PM (e.g., 11:00 AM, 12:00 PM) or empty string if not specified"),
  roomType: z.string().describe("Room type (e.g., Deluxe King Room, Standard Queen, Executive Suite) or empty string if not provided"),
  numberOfRooms: z.number().describe("Number of rooms booked or 1 if not specified"),
  numberOfGuests: z.number().describe("Number of guests or 0 if not provided"),
  totalCost: z.number().describe("Total cost as a number or 0 if not provided"),
  currency: z.string().describe("Currency code (e.g., USD, EUR, JPY) or empty string if not provided"),
  bookingDate: z.string().describe("Date of booking in ISO format YYYY-MM-DD or empty string if not provided"),
});

/**
 * TypeScript type inferred from the Zod schema
 * 
 * All fields are required (non-optional). Missing values are represented as empty strings or 0,
 * as instructed by the AI prompt. This ensures full compatibility with OpenAI's structured outputs.
 */
export type HotelExtraction = z.infer<typeof hotelExtractionSchema>;

/**
 * Validates hotel extraction data against the schema
 * 
 * This function provides a type-safe way to validate data with detailed error reporting.
 * Use this when you need to validate data from external sources or API responses.
 * 
 * @param data - The data to validate (typically from OpenAI's generateObject)
 * @returns Object with success flag, validated data, or error message
 * 
 * @example
 * ```typescript
 * const result = validateHotelExtraction(unknownData);
 * if (result.success) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.error('Validation error:', result.error);
 * }
 * ```
 */
export function validateHotelExtraction(data: unknown): {
  success: boolean;
  data?: HotelExtraction;
  error?: string;
} {
  const result = hotelExtractionSchema.safeParse(data);
  
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
