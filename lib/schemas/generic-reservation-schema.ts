/**
 * Generic Reservation Extraction Schema
 * 
 * Flexible Zod schema for extracting any type of reservation/booking information
 * when no specific plugin matches. The AI determines the type and category.
 * Compatible with OpenAI's structured output format.
 */

import { z } from "zod";

/**
 * Complete generic reservation extraction
 */
export const genericReservationSchema = z.object({
  // AI-determined classification
  reservationType: z.string().describe("Type of reservation as determined by AI (e.g., 'Spa', 'Transfer', 'Shuttle', 'Parking', 'Lounge Access', 'Tour', 'Workshop', 'Class')"),
  category: z.string().describe("Category of reservation: 'Travel', 'Stay', 'Activity', 'Dining', or 'Other'"),
  
  // Core booking information
  name: z.string().describe("Name or title of what is being booked (e.g., 'Airport Shuttle Service', 'Spa Massage', 'Cooking Class')"),
  confirmationNumber: z.string().describe("Confirmation number, booking reference, or order ID"),
  guestName: z.string().describe("Name of the person who made the booking"),
  
  // Vendor/provider information
  vendor: z.string().describe("Company or provider name (e.g., 'SuperShuttle', 'Serenity Spa', 'Local Cooking School')"),
  
  // Location information
  location: z.string().describe("Primary location name or description"),
  address: z.string().describe("Full address if provided, or empty string"),
  
  // Date and time information
  startDate: z.string().min(1).describe("REQUIRED: Start date in ISO format YYYY-MM-DD. Convert from formats like 'Wednesday, January 30, 2026' to '2026-01-30'. NEVER empty."),
  startTime: z.string().describe("Start time (e.g., '10:00 AM', '14:30'), or empty string if not specified"),
  endDate: z.string().describe("End date in ISO format (YYYY-MM-DD), or same as start date if single-day"),
  endTime: z.string().describe("End time (e.g., '12:00 PM', '16:00'), or empty string if not specified"),
  
  // Financial information
  cost: z.number().default(0).describe("Total cost as a number (default: 0 if not found)"),
  currency: z.string().describe("Currency code (e.g., 'USD', 'EUR', 'GBP') or empty string"),
  
  // Additional details
  participants: z.number().default(1).describe("Number of people/participants (default: 1)"),
  notes: z.string().describe("Any additional details, special instructions, or important information extracted from the email"),
  
  // Optional metadata
  bookingDate: z.string().describe("Date when booking was made (ISO format: YYYY-MM-DD), or empty string if not found"),
  contactPhone: z.string().describe("Contact phone number for the vendor/service, or empty string"),
  contactEmail: z.string().describe("Contact email for the vendor/service, or empty string"),
  cancellationPolicy: z.string().describe("Cancellation policy details, or empty string"),
});

export type GenericReservation = z.infer<typeof genericReservationSchema>;

/**
 * Validate generic reservation extraction data
 */
export function validateGenericReservation(data: unknown): {
  success: boolean;
  data?: GenericReservation;
  error?: string;
} {
  try {
    const validated = genericReservationSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Generic reservation extraction validation failed",
    };
  }
}
