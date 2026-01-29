/**
 * Event/Attraction Tickets Extraction Schema
 * 
 * Zod schema for extracting event, attraction, or activity ticket information from confirmation emails.
 * Compatible with OpenAI's structured output format.
 */

import { z } from "zod";

/**
 * Individual ticket information
 */
export const eventTicketSchema = z.object({
  ticketType: z.string().describe("Type of ticket (e.g., 'General Admission', 'VIP', 'Adult', 'Child', 'Student')"),
  quantity: z.number().default(1).describe("Number of tickets of this type (default: 1)"),
  price: z.number().default(0).describe("Price per ticket as a number (default: 0 if not found)"),
  seatInfo: z.string().describe("Seat information (e.g., 'Section 102, Row A, Seats 5-6', 'Floor GA'), or empty string"),
});

/**
 * Complete event/attraction ticket extraction
 */
export const eventExtractionSchema = z.object({
  confirmationNumber: z.string().describe("Confirmation number, order number, or ticket reference"),
  guestName: z.string().describe("Name of the person who purchased the tickets"),
  
  eventName: z.string().describe("Name of the event, attraction, or activity"),
  venueName: z.string().describe("Name of the venue or location"),
  address: z.string().describe("Full address of the venue, or empty string if not provided"),
  
  eventDate: z.string().min(1).describe("REQUIRED: Date of the event in ISO format YYYY-MM-DD. Convert from formats like 'Saturday, January 30, 2026' to '2026-01-30'. NEVER empty."),
  eventTime: z.string().describe("Start time of the event (e.g., '7:30 PM', '19:30'), or empty string if not specified"),
  doorsOpenTime: z.string().describe("Doors open or entry time if different from event time, or empty string"),
  
  tickets: z.array(eventTicketSchema).min(1).describe("Array of ticket types and quantities"),
  
  totalCost: z.number().default(0).describe("Total cost for all tickets as a number (default: 0 if not found)"),
  currency: z.string().describe("Currency code (e.g., 'USD', 'EUR', 'GBP') or empty string"),
  
  bookingDate: z.string().describe("Date when tickets were purchased (ISO format: YYYY-MM-DD), or empty string if not found"),
  
  platform: z.string().describe("Ticketing platform used (e.g., 'Ticketmaster', 'Eventbrite', 'StubHub', 'Direct'), or empty string"),
  
  eventType: z.string().describe("Type of event (e.g., 'Concert', 'Museum', 'Theater', 'Sports', 'Tour', 'Theme Park', 'Attraction'), or empty string"),
  
  specialInstructions: z.string().describe("Special instructions, entry requirements, or notes (e.g., 'Bring ID', 'Print tickets', 'Mobile entry only'), or empty string"),
});

export type EventExtraction = z.infer<typeof eventExtractionSchema>;
export type EventTicket = z.infer<typeof eventTicketSchema>;

/**
 * Validate event extraction data
 */
export function validateEventExtraction(data: unknown): {
  success: boolean;
  data?: EventExtraction;
  error?: string;
} {
  try {
    const validated = eventExtractionSchema.parse(data);
    return { success: true, data: validated };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Event extraction validation failed",
    };
  }
}
