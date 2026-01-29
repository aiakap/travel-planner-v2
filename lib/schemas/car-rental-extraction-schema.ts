import { z } from "zod";

/**
 * Car Rental Extraction Schema for OpenAI Structured Outputs
 * 
 * This schema is designed to be compatible with OpenAI's Structured Outputs feature.
 * All fields are required (no .optional() or .nullable()) and use empty strings ("") 
 * or 0 as defaults for missing values, ensuring compatibility with Vercel AI SDK's generateObject.
 * 
 * @see https://platform.openai.com/docs/guides/structured-outputs
 */

/**
 * Complete car rental extraction schema for booking confirmations
 * 
 * Extracts all relevant information from car rental confirmation emails
 * All fields are required by the schema - the AI must provide a value for each field.
 */
export const carRentalExtractionSchema = z.object({
  confirmationNumber: z.string().describe("Reservation/confirmation number (e.g., 00125899341, RES-2026-ABC)"),
  guestName: z.string().describe("Name of the person who made the reservation (e.g., ANDERSON/THOMAS, Jane Smith)"),
  company: z.string().describe("Car rental company name (e.g., Toyota Rent a Car, Hertz, Enterprise)"),
  vehicleClass: z.string().describe("Vehicle class or category (e.g., W3 Class (SUV / 4WD), Economy, Compact) or empty string"),
  vehicleModel: z.string().describe("Specific vehicle model or similar options (e.g., Harrier, RAV4, or similar) or empty string"),
  pickupLocation: z.string().describe("Pickup location name (e.g., New Chitose Airport Poplar Shop, Downtown Office)"),
  pickupAddress: z.string().describe("Full pickup address or empty string if not provided"),
  pickupDate: z.string().min(1).describe("REQUIRED: Pickup date in ISO format YYYY-MM-DD. Convert from formats like 'Thursday, January 30, 2026' to '2026-01-30'. NEVER empty."),
  pickupTime: z.string().describe("Pickup time in 12-hour format with AM/PM (e.g., 2:00 PM, 14:00) or empty string if not specified"),
  pickupFlightNumber: z.string().describe("Arrival flight number if pickup is at airport (e.g., NH215, UA875) or empty string"),
  returnLocation: z.string().describe("Return/drop-off location name (e.g., New Chitose Airport Poplar Shop, Airport Terminal)"),
  returnAddress: z.string().describe("Full return address or empty string if not provided"),
  returnDate: z.string().min(1).describe("REQUIRED: Return date in ISO format YYYY-MM-DD. Convert from formats like 'Thursday, February 6, 2026' to '2026-02-06'. NEVER empty."),
  returnTime: z.string().describe("Return time in 12-hour format with AM/PM (e.g., 11:00 AM, 11:00) or empty string if not specified"),
  totalCost: z.number().describe("Total estimated cost as a number or 0 if not provided"),
  currency: z.string().describe("Currency code (e.g., USD, EUR, JPY) or empty string if not provided"),
  options: z.array(z.string()).describe("Array of options/accessories (e.g., GPS, Winter Tires, Ski Rack, Child Seat, ETC Card) or empty array"),
  oneWayCharge: z.number().describe("One-way rental charge as a number or 0 if not applicable/round-trip"),
  bookingDate: z.string().describe("Date when the booking was made in ISO format YYYY-MM-DD or empty string if not provided"),
});

/**
 * TypeScript type inferred from the Zod schema
 * 
 * All fields are required (non-optional). Missing values are represented as empty strings or 0,
 * as instructed by the AI prompt. This ensures full compatibility with OpenAI's structured outputs.
 */
export type CarRentalExtraction = z.infer<typeof carRentalExtractionSchema>;

/**
 * Validates car rental extraction data against the schema
 * 
 * This function provides a type-safe way to validate data with detailed error reporting.
 * Use this when you need to validate data from external sources or API responses.
 * 
 * @param data - The data to validate (typically from OpenAI's generateObject)
 * @returns Object with success flag, validated data, or error message
 * 
 * @example
 * ```typescript
 * const result = validateCarRentalExtraction(unknownData);
 * if (result.success) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.error('Validation error:', result.error);
 * }
 * ```
 */
export function validateCarRentalExtraction(data: unknown): {
  success: boolean;
  data?: CarRentalExtraction;
  error?: string;
} {
  const result = carRentalExtractionSchema.safeParse(data);
  
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
