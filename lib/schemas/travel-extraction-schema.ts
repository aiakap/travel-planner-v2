import { z } from "zod";

/**
 * Unified schema for extracting travel data from emails and images
 * Supports flights, hotels, rental cars, and activities
 */

export const flightSchema = z.object({
  airline: z.string(),
  flightNumber: z.string(),
  origin: z.object({
    code: z.string(),
    name: z.string(),
    city: z.string()
  }),
  destination: z.object({
    code: z.string(),
    name: z.string(),
    city: z.string()
  }),
  departure: z.string(), // ISO datetime
  arrival: z.string(),   // ISO datetime
  confirmationNumber: z.string().optional(),
  bookingReference: z.string().optional()
});

export const hotelSchema = z.object({
  name: z.string(),
  address: z.string().optional(),
  city: z.string(),
  checkIn: z.string(),  // ISO date
  checkOut: z.string(), // ISO date
  confirmationNumber: z.string().optional(),
  nights: z.number().optional()
});

export const rentalCarSchema = z.object({
  company: z.string(),
  pickupLocation: z.string(),
  pickupDate: z.string(),
  returnLocation: z.string(),
  returnDate: z.string(),
  confirmationNumber: z.string().optional()
});

export const activitySchema = z.object({
  name: z.string(),
  location: z.string(),
  date: z.string(),
  time: z.string().optional(),
  confirmationNumber: z.string().optional()
});

export const travelDataSchema = z.object({
  flights: z.array(flightSchema),
  hotels: z.array(hotelSchema),
  rentalCars: z.array(rentalCarSchema),
  activities: z.array(activitySchema)
});

export type Flight = z.infer<typeof flightSchema>;
export type Hotel = z.infer<typeof hotelSchema>;
export type RentalCar = z.infer<typeof rentalCarSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type ExtractedTravelData = z.infer<typeof travelDataSchema>;
