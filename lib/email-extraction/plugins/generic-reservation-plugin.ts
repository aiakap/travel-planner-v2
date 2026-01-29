/**
 * Generic Reservation Extraction Plugin
 * 
 * Fallback plugin that extracts any type of reservation/booking information
 * when no specific plugin matches. Uses AI to determine the type and category.
 */

import { ExtractionPlugin } from '../types';
import { genericReservationSchema } from '@/lib/schemas/generic-reservation-schema';

export const GENERIC_RESERVATION_PROMPT = `## Generic Reservation/Booking Extraction

Extract reservation or booking information from the confirmation email. This is a flexible extraction that can handle any type of booking with high accuracy.

### Your Task

1. **Classify the Reservation**: Determine what type of reservation this is and which category it belongs to
2. **Extract All Available Information**: Pull out all structured data you can find
3. **Be Permissive**: If information is missing, use empty strings or default values
4. **Follow Date Formats**: Convert all dates to ISO format YYYY-MM-DD

### Classification Guidelines

**Reservation Type** (be specific):
- Examples: "Spa Treatment", "Airport Shuttle", "Parking", "Lounge Access", "Ferry", "Bus", "Workshop", "Cooking Class", "Guided Tour", "Ski Lift Pass", "Golf Tee Time", "Bike Rental", "Storage Locker", etc.
- Use the most specific type you can determine from the email

**Category** (choose one):
- **Travel**: Transportation services (shuttles, ferries, buses, parking, transfers)
- **Stay**: Accommodation-related (hostels, vacation rentals - not hotels)
- **Activity**: Experiences, classes, tours, attractions, sports, entertainment
- **Dining**: Food and beverage related (cafes, bars - not restaurants)
- **Other**: Anything that doesn't fit the above categories

### Required Information

**Classification:**
- **Reservation Type**: AI-determined specific type (e.g., "Spa Massage", "Airport Shuttle")
- **Category**: One of: "Travel", "Stay", "Activity", "Dining", "Other"

**Booking Details:**
- **Name**: Name or title of what is being booked (e.g., "60-Minute Swedish Massage", "Airport Shuttle Service")
- **Confirmation Number**: Booking reference, confirmation code, or order ID
- **Guest Name**: Name of the person who made the booking
- **Vendor**: Company or provider name (e.g., "Serenity Spa", "SuperShuttle")
- **Booking Date**: Date when booking was made in ISO format YYYY-MM-DD or empty string
- **Cost**: Total cost as a number or 0 if not found
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string
- **Contact Phone**: Contact phone number or empty string
- **Contact Email**: Contact email or empty string
- **Cancellation Policy**: Cancellation policy details or empty string

**Service Details:**
- **Location**: Primary location name or description
- **Address**: Full address if provided, or empty string
- **Start Date**: Start date in ISO format YYYY-MM-DD (e.g., "2026-01-30") - REQUIRED
- **Start Time**: Start time (e.g., "10:00 AM", "14:30") or empty string
- **End Date**: End date in ISO format YYYY-MM-DD, or same as start date if single-day
- **End Time**: End time or empty string
- **Participants**: Number of people (e.g., 1, 2, 4)
- **Notes**: Any additional details, special instructions, or important information

### Date Format Conversion Guide

Various providers use different date formats. You MUST convert them to ISO format YYYY-MM-DD:

**Common Formats:**
- "Wednesday, January 30, 2026" → "2026-01-30" (day of week, full month name, day, year)
- "Jan 30, 2026" → "2026-01-30" (abbreviated month)
- "January 30, 2026" → "2026-01-30" (full month name)
- "30-Jan-2026" → "2026-01-30" (day-month-year)
- "01/30/2026" → "2026-01-30" (MM/DD/YYYY)
- "30/01/2026" → "2026-01-30" (DD/MM/YYYY - European format)
- "2026-01-30" → "2026-01-30" (already correct)

**Month Name to Number:**
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

### Real Examples

**Example 1 - Spa Appointment:**

INPUT TEXT:
Spa Reservation Confirmed
Confirmation: SPA-2026-456
Guest: Jane Smith
Treatment: 60-Minute Swedish Massage
Date: January 30, 2026
Time: 10:00 AM
Therapist: Maria
Location: Serenity Spa, 123 Wellness Ave, Miami, FL
Price: $120.00
Booked: January 15, 2026

EXPECTED OUTPUT:
{
  "reservationType": "Spa Treatment",
  "category": "Activity",
  "name": "60-Minute Swedish Massage",
  "confirmationNumber": "SPA-2026-456",
  "guestName": "Jane Smith",
  "vendor": "Serenity Spa",
  "location": "Serenity Spa",
  "address": "123 Wellness Ave, Miami, FL",
  "startDate": "2026-01-30",
  "startTime": "10:00 AM",
  "endDate": "2026-01-30",
  "endTime": "",
  "cost": 120.00,
  "currency": "USD",
  "participants": 1,
  "notes": "Therapist: Maria",
  "bookingDate": "2026-01-15",
  "contactPhone": "",
  "contactEmail": "",
  "cancellationPolicy": ""
}

**Example 2 - Airport Parking:**

INPUT TEXT:
Airport Parking Reserved
Reservation #: PARK-LAX-789
Name: John Anderson
Airport: Los Angeles International (LAX)
Location: Terminal 1 Parking Structure
Entry Date: Friday, January 30, 2026 at 6:00 AM
Exit Date: Sunday, February 8, 2026 at 8:00 PM
Total: $180.00 (9 days @ $20/day)
Confirmation sent to: john@email.com

EXPECTED OUTPUT:
{
  "reservationType": "Parking",
  "category": "Travel",
  "name": "Airport Parking - Terminal 1",
  "confirmationNumber": "PARK-LAX-789",
  "guestName": "John Anderson",
  "vendor": "LAX Parking",
  "location": "Los Angeles International Airport (LAX)",
  "address": "Terminal 1 Parking Structure",
  "startDate": "2026-01-30",
  "startTime": "6:00 AM",
  "endDate": "2026-02-08",
  "endTime": "8:00 PM",
  "cost": 180.00,
  "currency": "USD",
  "participants": 1,
  "notes": "9 days @ $20/day",
  "bookingDate": "",
  "contactPhone": "",
  "contactEmail": "john@email.com",
  "cancellationPolicy": ""
}

### Critical Rules

1. **NEVER leave start date empty** - This is a REQUIRED field
2. **Convert all dates to YYYY-MM-DD format** - Use the conversion guide above
3. **Keep times in original format** - Can be 12-hour or 24-hour
4. **Be specific with reservation type** - "Spa Treatment" not just "Spa"
5. **Choose appropriate category** - Use Travel, Stay, Activity, Dining, or Other
6. **Use empty strings for missing optional fields** - Not null or undefined
7. **Use 0 for missing numeric fields** - cost defaults to 0
8. **Use 1 for participants if not specified** - Most bookings for 1 person
9. **Capture important details in notes** - Therapist names, special instructions, etc.
10. **End date same as start date** - For single-day events if no end date specified

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
