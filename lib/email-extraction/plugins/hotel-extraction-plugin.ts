/**
 * Hotel Extraction Plugin
 * 
 * Extracts hotel booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { hotelExtractionSchema } from '@/lib/schemas/hotel-extraction-schema';

export const HOTEL_EXTRACTION_PROMPT = `## Hotel Booking Extraction

Extract hotel booking information from the confirmation email.

### Required Information

- **Confirmation Number**: Booking confirmation or itinerary number
- **Guest Name**: Name of the guest on the reservation
- **Hotel Name**: Name of the hotel or property
- **Address**: Full address of the hotel (if provided)
- **Check-in Date**: Date of check-in (ISO format: YYYY-MM-DD)
- **Check-in Time**: Time of check-in (e.g., "3:00 PM") or empty string
- **Check-out Date**: Date of check-out (ISO format: YYYY-MM-DD)
- **Check-out Time**: Time of check-out (e.g., "11:00 AM") or empty string
- **Room Type**: Type of room booked (e.g., "Deluxe King", "Standard Queen")
- **Number of Rooms**: Number of rooms booked (default: 1)
- **Number of Guests**: Total number of guests (default: 0 if not specified)
- **Total Cost**: Total cost as a number (default: 0 if not found)
- **Currency**: Currency code (e.g., "USD", "EUR") or empty string
- **Booking Date**: Date when the booking was made (ISO format) or empty string

### Common Email Patterns

- Hotels.com, Booking.com, Expedia, Airbnb confirmation emails
- Look for phrases like "Your reservation is confirmed", "Itinerary number", "Check-in/Check-out"
- Room details are often in a separate section
- Total cost may include taxes and fees

### Extraction Tips

- Parse dates carefully - they may be in various formats (Jan 30, 2026 / January 30, 2026 / Fri, Jan 30)
- Check-in/check-out times are often standard (3:00 PM / 11:00 AM) but verify from email
- Number of nights can be calculated from check-in and check-out dates
- Guest name may be formatted as "LASTNAME/FIRSTNAME" or "First Last"`;

export const hotelExtractionPlugin: ExtractionPlugin = {
  id: 'hotel-extraction',
  name: 'Hotel Booking Extraction',
  content: HOTEL_EXTRACTION_PROMPT,
  schema: hotelExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const hotelKeywords = [
      'hotel', 'reservation', 'check-in', 'check-out', 'room', 'guest', 
      'nights', 'accommodation', 'booking', 'stay', 'resort', 'inn', 'lodge',
      'hotels.com', 'booking.com', 'expedia', 'airbnb'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const hotelScore = hotelKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Activate if at least 3 hotel keywords are present
    return hotelScore >= 3;
  }
};
