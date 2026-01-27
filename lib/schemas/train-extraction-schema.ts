/**
 * Train/Rail Booking Extraction Schema
 * 
 * Zod schema for extracting train reservation information from confirmation emails.
 * Compatible with OpenAI's structured output format.
 */

import { z } from "zod";

/**
 * Individual passenger information
 */
export const trainPassengerSchema = z.object({
  name: z.string().describe("Passenger name (e.g., 'John Smith', 'SMITH/JOHN')"),
  ticketNumber: z.string().describe("Ticket or e-ticket number, or empty string if not provided"),
});

/**
 * Individual train segment/leg
 */
export const trainSegmentSchema = z.object({
  trainNumber: z.string().describe("Train number or service code (e.g., 'Acela 2150', 'Eurostar 9012', 'ICE 123')"),
  operator: z.string().describe("Train operator/carrier name (e.g., 'Amtrak', 'Eurostar', 'Deutsche Bahn')"),
  operatorCode: z.string().describe("Operator code if available (e.g., 'AMTK', 'ES', 'DB'), or empty string"),
  
  departureStation: z.string().describe("Departure station name (e.g., 'New York Penn Station', 'London St Pancras')"),
  departureStationCode: z.string().describe("Station code if available (e.g., 'NYP', 'STP'), or empty string"),
  departureCity: z.string().describe("Departure city (e.g., 'New York, NY', 'London, UK')"),
  departureDate: z.string().describe("Departure date in ISO format (YYYY-MM-DD)"),
  departureTime: z.string().describe("Departure time (e.g., '10:15 AM', '14:30')"),
  departurePlatform: z.string().describe("Platform/track number, or empty string if not provided"),
  
  arrivalStation: z.string().describe("Arrival station name (e.g., 'Washington Union Station', 'Paris Gare du Nord')"),
  arrivalStationCode: z.string().describe("Station code if available (e.g., 'WAS', 'PGN'), or empty string"),
  arrivalCity: z.string().describe("Arrival city (e.g., 'Washington, DC', 'Paris, France')"),
  arrivalDate: z.string().describe("Arrival date in ISO format (YYYY-MM-DD)"),
  arrivalTime: z.string().describe("Arrival time (e.g., '1:45 PM', '17:30')"),
  arrivalPlatform: z.string().describe("Platform/track number, or empty string if not provided"),
  
  class: z.string().describe("Travel class (e.g., 'First Class', 'Second Class', 'Business', 'Standard')"),
  coach: z.string().describe("Coach/carriage number, or empty string if not provided"),
  seat: z.string().describe("Seat number or reservation (e.g., '12A', '45', 'Window'), or empty string"),
  duration: z.string().describe("Journey duration if provided (e.g., '3h 30m', '2 hours 15 minutes'), or empty string"),
});

/**
 * Complete train booking extraction
 */
export const trainExtractionSchema = z.object({
  confirmationNumber: z.string().describe("Booking confirmation or reference number"),
  passengers: z.array(trainPassengerSchema).describe("Array of passenger information"),
  purchaseDate: z.string().describe("Date when booking was made (ISO format: YYYY-MM-DD), or empty string if not found"),
  totalCost: z.number().default(0).describe("Total cost as a number (default: 0 if not found)"),
  currency: z.string().describe("Currency code (e.g., 'USD', 'EUR', 'GBP') or empty string"),
  trains: z.array(trainSegmentSchema).min(1).describe("Array of train segments/legs in the journey"),
});

export type TrainExtraction = z.infer<typeof trainExtractionSchema>;
export type TrainSegment = z.infer<typeof trainSegmentSchema>;
export type TrainPassenger = z.infer<typeof trainPassengerSchema>;

/**
 * Validate train extraction data
 */
export function validateTrainExtraction(data: unknown): {
  success: boolean;
  data?: TrainExtraction;
  error?: string;
} {
  try {
    const validated = trainExtractionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Train extraction validation failed",
    };
  }
}
