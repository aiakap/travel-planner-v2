/**
 * Generic Reservation Extraction Plugin
 * 
 * Fallback plugin that extracts any type of reservation/booking information
 * when no specific plugin matches. Uses AI to determine the type and category.
 */

import { ExtractionPlugin } from '../types';
import { genericReservationSchema } from '@/lib/schemas/generic-reservation-schema';

export const GENERIC_RESERVATION_PROMPT = `## Generic Reservation/Booking Extraction

Extract reservation or booking information from the confirmation email. This is a flexible extraction that can handle any type of booking.

### Your Task

1. **Classify the Reservation**: Determine what type of reservation this is and which category it belongs to
2. **Extract All Available Information**: Pull out all structured data you can find
3. **Be Permissive**: If information is missing, use empty strings or default values

### Classification Guidelines

**Reservation Type** (be specific):
- Examples: "Spa Treatment", "Airport Transfer", "Parking", "Lounge Access", "Ferry", "Bus", "Shuttle", "Workshop", "Class", "Guided Tour", "Ski Lift Pass", "Golf Tee Time", "Bike Rental", "Storage Locker", etc.
- Use the most specific type you can determine from the email

**Category** (choose one):
- **Travel**: Transportation services (transfers, shuttles, ferries, buses, parking)
- **Stay**: Accommodation-related (not hotels - those have their own plugin)
- **Activity**: Experiences, classes, tours, attractions, sports, entertainment
- **Dining**: Food and beverage related (not restaurants - those have their own plugin)
- **Other**: Anything that doesn't fit the above categories

### Required Information

- **Reservation Type**: AI-determined specific type (e.g., "Spa Massage", "Airport Shuttle")
- **Category**: One of: "Travel", "Stay", "Activity", "Dining", "Other"
- **Name**: Name or title of what is being booked
- **Confirmation Number**: Booking reference, confirmation code, or order ID
- **Guest Name**: Name of the person who made the booking
- **Vendor**: Company or provider name
- **Location**: Primary location name or description
- **Address**: Full address if provided, or empty string
- **Start Date**: Start date in ISO format (YYYY-MM-DD)
- **Start Time**: Start time (e.g., "10:00 AM", "14:30"), or empty string
- **End Date**: End date in ISO format, or same as start date if single-day
- **End Time**: End time, or empty string
- **Cost**: Total cost as a number (default: 0 if not found)
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string
- **Participants**: Number of people (default: 1)
- **Notes**: Any additional details, special instructions, or important information
- **Booking Date**: Date when booking was made (ISO format), or empty string
- **Contact Phone**: Contact phone number, or empty string
- **Contact Email**: Contact email, or empty string
- **Cancellation Policy**: Cancellation policy details, or empty string

### Extraction Tips

- **Be Flexible**: This plugin handles anything that doesn't fit specific plugins
- **Capture Context**: Put important details in the notes field
- **Date Formats**: Always convert dates to ISO format (YYYY-MM-DD)
- **Missing Data**: Use empty strings for text, 0 for numbers, 1 for participants
- **Multiple Services**: If the email contains multiple bookings, extract the primary one
- **Infer Intelligently**: Use context clues to determine type and category
- **Preserve Details**: Include pickup times, special instructions, requirements in notes

### Common Generic Reservation Types

**Transportation:**
- Airport transfers, shuttles, private car services
- Ferry tickets, bus tickets
- Parking reservations
- Bike/scooter rentals

**Activities:**
- Spa treatments, massage appointments
- Fitness classes, yoga sessions
- Workshops, cooking classes, art classes
- Guided tours (walking, bike, food tours)
- Sports activities (golf, skiing, diving)
- Equipment rentals (ski equipment, sports gear)

**Services:**
- Lounge access (airport lounges)
- Storage lockers, luggage storage
- Travel insurance
- Visa services
- Photography sessions

**Other:**
- Pet boarding
- Childcare services
- Medical appointments while traveling
- Any other travel-related booking

### Example Classifications

- "Airport Shuttle to Hotel" → Type: "Airport Shuttle", Category: "Travel"
- "60-Minute Swedish Massage" → Type: "Spa Treatment", Category: "Activity"
- "Cooking Class: Traditional Italian Cuisine" → Type: "Cooking Class", Category: "Activity"
- "Airport Lounge Access" → Type: "Lounge Access", Category: "Travel"
- "Parking Reservation at LAX" → Type: "Parking", Category: "Travel"
- "Bike Rental - Full Day" → Type: "Bike Rental", Category: "Activity"`;

export const genericReservationPlugin: ExtractionPlugin = {
  id: 'generic-reservation',
  name: 'Generic Reservation Extraction',
  content: GENERIC_RESERVATION_PROMPT,
  schema: genericReservationSchema,
  priority: 999, // Last resort - only use if no specific plugin matches
  shouldInclude: (context) => {
    // Generic keywords that suggest a booking/reservation
    const genericKeywords = [
      'confirmation', 'booking', 'reservation', 'confirmed',
      'itinerary', 'receipt', 'order', 'purchase', 'appointment',
      'scheduled', 'reserved', 'booked'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const genericScore = genericKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Only activate if at least 2 generic booking keywords are present
    // This ensures we don't try to extract from non-booking emails
    return genericScore >= 2;
  }
};
