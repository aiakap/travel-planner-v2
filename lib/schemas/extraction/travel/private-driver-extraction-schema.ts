/**
 * Private Driver / Transfer Extraction Schema
 * 
 * Schema for extracting private driver and airport transfer booking information.
 * 
 * Key characteristics:
 * - Has both pickup AND dropoff locations (unlike taxi)
 * - Includes specific driver details (name, phone, vehicle)
 * - Contains meeting/waiting instructions
 * - Often includes vehicle details (type, plate number)
 * - May specify transfer duration
 * 
 * ⚠️ CRITICAL: ALL fields must be truly required (no .optional(), .nullable(), or .default())
 * for the Vercel AI SDK to include them in the JSON Schema's "required" array.
 * The AI prompt must instruct the model to provide empty strings for missing values.
 */

import { z } from "zod";
import { baseExtractionFields } from "@/lib/schemas/base-extraction-schema";

/**
 * Complete private driver extraction schema
 * 
 * All fields are required - AI must provide values (empty strings, 0, or false for missing data)
 */
export const privateDriverExtractionSchema = z.object({
  ...baseExtractionFields,
  
  // Driver information
  driverName: z.string().describe("Name of the assigned driver (e.g., 'Marumoto, Mr', 'John Smith') or empty string if not provided"),
  driverPhone: z.string().describe("Contact phone number for the driver or empty string"),
  
  // Vehicle information
  vehicleType: z.string().describe("Type or model of vehicle (e.g., 'Alphard', 'Mercedes S-Class', 'SUV') or empty string if not provided"),
  plateNumber: z.string().describe("Vehicle license plate number or empty string if not provided"),
  
  // Company/service information
  company: z.string().describe("Transfer company or service name (e.g., 'tabi pirka LLC', 'Blacklane') or empty string if not provided"),
  
  // Pickup details
  pickupLocation: z.string().describe("Pickup location name (e.g., 'New Chitose Airport (CTS)', 'Hotel Lobby') or empty string if not provided"),
  pickupAddress: z.string().describe("Full pickup address or empty string if not provided"),
  pickupDate: z.string().min(1).describe("REQUIRED: Pickup date in ISO format YYYY-MM-DD. Convert from formats like 'Thursday, January 30, 2026' to '2026-01-30'. NEVER empty."),
  pickupTime: z.string().describe("Pickup time (e.g., '14:00', '2:00 PM') or empty string if not specified"),
  pickupInstructions: z.string().describe("Specific pickup instructions or meeting point details (e.g., 'arrival hall after baggage claim') or empty string"),
  
  // Dropoff details
  dropoffLocation: z.string().describe("Dropoff/destination location name (e.g., 'SANSUI NISEKO', 'Downtown Hotel') or empty string if not provided"),
  dropoffAddress: z.string().describe("Full dropoff address or empty string if not provided"),
  
  // Transfer details
  transferDuration: z.string().describe("Estimated transfer/drive time (e.g., '2-2.5 hours', '45 minutes') or empty string"),
  waitingInstructions: z.string().describe("How driver will identify passenger (e.g., 'showing a name board', 'holding sign with your name') or empty string"),
  
  // Passenger details
  passengerCount: z.number().describe("Number of passengers or 1 if not specified"),
  luggageDetails: z.string().describe("Luggage information (e.g., '2 ski bags', '3 suitcases') or empty string"),
  
  // Additional services
  meetAndGreet: z.boolean().describe("Whether meet and greet service is included or false if not mentioned"),
  specialRequests: z.string().describe("Any special requests or requirements (e.g., 'child seat', 'wheelchair accessible') or empty string"),
});

/**
 * TypeScript type inferred from the schema
 */
export type PrivateDriverExtraction = z.infer<typeof privateDriverExtractionSchema>;

/**
 * Validate private driver extraction data against the schema
 * 
 * @param data - The data to validate
 * @returns Object with success flag, validated data, or error message
 */
export function validatePrivateDriverExtraction(data: unknown): {
  success: boolean;
  data?: PrivateDriverExtraction;
  error?: string;
} {
  const result = privateDriverExtractionSchema.safeParse(data);
  
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
