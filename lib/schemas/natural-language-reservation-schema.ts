import { z } from "zod";

/**
 * Schema for parsing natural language reservation input
 * Used by the natural language reservation creation API
 */
export const naturalLanguageReservationSchema = z.object({
  // Place name extracted from input (required)
  placeName: z.string().describe("The name of the place, restaurant, hotel, or activity"),
  
  // Reservation type hint based on context clues
  reservationType: z.enum([
    "restaurant",
    "hotel",
    "activity",
    "flight",
    "train",
    "car_rental",
    "event",
    "other"
  ]).optional().describe("Type of reservation inferred from the input"),
  
  // Date/time information
  dateInfo: z.object({
    type: z.enum(["absolute", "relative", "ambiguous"]).describe(
      "absolute: specific date like 'Jan 31' or 'January 31, 2026', " +
      "relative: relative reference like 'Friday', 'tomorrow', 'next week', " +
      "ambiguous: unclear or missing date information"
    ),
    value: z.string().describe("The date string as mentioned in the input"),
    time: z.string().optional().describe("Time mentioned (e.g., '5 PM', '17:00', 'morning')"),
    endDate: z.string().optional().describe("End date if mentioned (for multi-day stays)"),
    endTime: z.string().optional().describe("End time if mentioned"),
  }),
  
  // Additional information
  additionalInfo: z.object({
    partySize: z.number().optional().describe("Number of people/guests"),
    duration: z.string().optional().describe("Duration mentioned (e.g., '2 hours', '3 nights')"),
    notes: z.string().optional().describe("Any additional notes or special requests"),
    specificLocation: z.string().optional().describe("Specific location mentioned (e.g., 'in Paris', 'near Eiffel Tower')"),
  }).optional(),
  
  // Confidence level in the extraction
  confidence: z.enum(["high", "medium", "low"]).describe(
    "high: all key information clearly stated, " +
    "medium: some information clear but some ambiguous, " +
    "low: significant ambiguity or missing information"
  ),
  
  // List of clarifications needed
  clarificationNeeded: z.array(z.string()).optional().describe(
    "List of specific questions or clarifications needed from the user"
  ),
});

export type NaturalLanguageReservation = z.infer<typeof naturalLanguageReservationSchema>;
