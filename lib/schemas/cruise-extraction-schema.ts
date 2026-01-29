/**
 * Cruise Booking Extraction Schema
 * 
 * Zod schema for extracting cruise booking information from confirmation emails.
 * Compatible with OpenAI's structured output format.
 */

import { z } from "zod";

/**
 * Individual port of call
 */
export const portOfCallSchema = z.object({
  portName: z.string().describe("Name of the port (e.g., 'Cozumel', 'Grand Cayman')"),
  portLocation: z.string().describe("Location/country (e.g., 'Mexico', 'Cayman Islands')"),
  arrivalDate: z.string().describe("Arrival date at port (ISO format: YYYY-MM-DD)"),
  arrivalTime: z.string().describe("Arrival time (e.g., '8:00 AM'), or empty string"),
  departureDate: z.string().describe("Departure date from port (ISO format: YYYY-MM-DD)"),
  departureTime: z.string().describe("Departure time (e.g., '5:00 PM'), or empty string"),
});

/**
 * Individual guest/passenger
 */
export const cruiseGuestSchema = z.object({
  name: z.string().describe("Guest name"),
  cabinNumber: z.string().describe("Cabin/stateroom number assigned to this guest, or empty string if shared"),
});

/**
 * Complete cruise booking extraction
 */
export const cruiseExtractionSchema = z.object({
  confirmationNumber: z.string().describe("Booking confirmation or reservation number"),
  guests: z.array(cruiseGuestSchema).min(1).describe("Array of guest information"),
  
  cruiseLine: z.string().describe("Cruise line name (e.g., 'Royal Caribbean', 'Carnival', 'Norwegian', 'Princess')"),
  shipName: z.string().describe("Name of the ship (e.g., 'Symphony of the Seas', 'Carnival Vista')"),
  
  cabinNumber: z.string().describe("Primary cabin/stateroom number"),
  cabinType: z.string().describe("Cabin type or category (e.g., 'Balcony', 'Inside', 'Suite', 'Oceanview')"),
  deck: z.string().describe("Deck number or name, or empty string if not provided"),
  
  embarkationPort: z.string().describe("Port where cruise begins (e.g., 'Port Canaveral', 'Miami')"),
  embarkationLocation: z.string().describe("City/country of embarkation port (e.g., 'Orlando, FL, US', 'Miami, FL, US')"),
  embarkationDate: z.string().min(1).describe("REQUIRED: Embarkation date in ISO format YYYY-MM-DD. Convert from formats like 'Saturday, February 15, 2026' to '2026-02-15'. NEVER empty."),
  embarkationTime: z.string().describe("Embarkation/boarding time (e.g., '1:00 PM', '13:00'), or empty string"),
  
  disembarkationPort: z.string().describe("Port where cruise ends (often same as embarkation)"),
  disembarkationLocation: z.string().describe("City/country of disembarkation port"),
  disembarkationDate: z.string().min(1).describe("REQUIRED: Disembarkation date in ISO format YYYY-MM-DD. Convert from formats like 'Saturday, February 22, 2026' to '2026-02-22'. NEVER empty."),
  disembarkationTime: z.string().describe("Disembarkation time (e.g., '8:00 AM'), or empty string"),
  
  portsOfCall: z.array(portOfCallSchema).describe("Array of ports visited during the cruise, or empty array if not provided"),
  
  totalCost: z.number().default(0).describe("Total cost as a number (default: 0 if not found)"),
  currency: z.string().describe("Currency code (e.g., 'USD', 'EUR', 'GBP') or empty string"),
  
  bookingDate: z.string().describe("Date when booking was made (ISO format: YYYY-MM-DD), or empty string if not found"),
  
  diningTime: z.string().describe("Assigned dining time (e.g., 'Early Seating - 6:00 PM', 'Anytime Dining'), or empty string"),
  specialRequests: z.string().describe("Special requests, dietary restrictions, or accessibility needs, or empty string"),
});

export type CruiseExtraction = z.infer<typeof cruiseExtractionSchema>;
export type PortOfCall = z.infer<typeof portOfCallSchema>;
export type CruiseGuest = z.infer<typeof cruiseGuestSchema>;

/**
 * Validate cruise extraction data
 */
export function validateCruiseExtraction(data: unknown): {
  success: boolean;
  data?: CruiseExtraction;
  error?: string;
} {
  try {
    const validated = cruiseExtractionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Cruise extraction validation failed",
    };
  }
}
