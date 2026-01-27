/**
 * Base Extraction Schema
 * 
 * Shared fields that are common across all reservation types.
 * Individual type schemas extend this with their specific fields.
 * 
 * ⚠️ CRITICAL: ALL fields must be truly required (no .optional(), .nullable(), or .default())
 * for the Vercel AI SDK to include them in the JSON Schema's "required" array.
 * The AI prompt must instruct the model to provide empty strings for missing values.
 */

import { z } from "zod";

/**
 * Base fields shared by all extraction schemas
 * 
 * All fields are required - AI must provide values (empty strings or 0 for missing data)
 */
export const baseExtractionFields = {
  // Core booking information
  confirmationNumber: z.string().describe("Confirmation number, booking reference, or reservation code, or empty string if not found"),
  guestName: z.string().describe("Name of the person who made the booking, or empty string if not found"),
  
  // Financial information
  cost: z.number().describe("Total cost as a number or 0 if not found"),
  currency: z.string().describe("Currency code (e.g., 'USD', 'EUR', 'JPY') or empty string"),
  
  // Contact information
  contactEmail: z.string().describe("Contact email for the vendor/service, or empty string"),
  contactPhone: z.string().describe("Contact phone number for the vendor/service, or empty string"),
  
  // Additional information
  notes: z.string().describe("Any additional details, special instructions, or important information, or empty string"),
  bookingDate: z.string().describe("Date when booking was made (ISO format: YYYY-MM-DD), or empty string if not found"),
};

/**
 * Type for base extraction fields
 */
export type BaseExtractionFields = z.infer<z.ZodObject<typeof baseExtractionFields>>;

/**
 * Zod object schema for base fields (for extending)
 */
export const baseExtractionSchema = z.object(baseExtractionFields);
