/**
 * Restaurant Reservation Extraction Schema
 * 
 * Zod schema for extracting restaurant reservation information from confirmation emails.
 * Compatible with OpenAI's structured output format.
 */

import { z } from "zod";

/**
 * Complete restaurant reservation extraction
 */
export const restaurantExtractionSchema = z.object({
  confirmationNumber: z.string().describe("Reservation confirmation number or reference code"),
  guestName: z.string().describe("Name of the guest who made the reservation"),
  restaurantName: z.string().describe("Name of the restaurant"),
  address: z.string().describe("Full address of the restaurant, or empty string if not provided"),
  phone: z.string().describe("Restaurant phone number, or empty string if not provided"),
  
  reservationDate: z.string().min(1).describe("REQUIRED: Date of reservation in ISO format YYYY-MM-DD. Convert from formats like 'Friday, January 30, 2026' to '2026-01-30'. NEVER empty."),
  reservationTime: z.string().min(1).describe("REQUIRED: Time of reservation (e.g., '7:00 PM', '19:00'). NEVER empty."),
  
  partySize: z.number().default(2).describe("Number of guests/people in the party (default: 2)"),
  
  specialRequests: z.string().describe("Special requests or dietary restrictions (e.g., 'Window seat', 'Vegetarian', 'Birthday celebration'), or empty string"),
  
  cost: z.number().default(0).describe("Prepaid amount or deposit as a number (default: 0 if not prepaid)"),
  currency: z.string().describe("Currency code (e.g., 'USD', 'EUR', 'GBP') or empty string"),
  
  bookingDate: z.string().describe("Date when the reservation was made (ISO format: YYYY-MM-DD), or empty string if not found"),
  
  platform: z.string().describe("Booking platform used (e.g., 'OpenTable', 'Resy', 'TheFork', 'Direct'), or empty string"),
  
  cancellationPolicy: z.string().describe("Cancellation policy details, or empty string if not provided"),
});

export type RestaurantExtraction = z.infer<typeof restaurantExtractionSchema>;

/**
 * Validate restaurant extraction data
 */
export function validateRestaurantExtraction(data: unknown): {
  success: boolean;
  data?: RestaurantExtraction;
  error?: string;
} {
  try {
    const validated = restaurantExtractionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Restaurant extraction validation failed",
    };
  }
}
