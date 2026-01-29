/**
 * Hotel Extraction Plugin
 * 
 * Extracts hotel booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { hotelExtractionSchema } from '@/lib/schemas/hotel-extraction-schema';

export const HOTEL_EXTRACTION_PROMPT = `## Hotel Booking Extraction

Extract hotel booking information from the confirmation email with high accuracy.

### Required Information

**Booking Details:**
- **Confirmation Number**: Booking confirmation or itinerary number (e.g., "ABC123456789", "HT-2026-001")
- **Guest Name**: Full name from reservation (e.g., "SMITH/JOHN", "Jane Doe")
- **Hotel Name**: Full name of the hotel or property (e.g., "Grand Hyatt Tokyo", "Marriott Downtown")
- **Address**: Full address of the hotel or empty string if not provided
- **Booking Date**: Date when booking was made in ISO format YYYY-MM-DD (e.g., "2026-01-15") or empty string
- **Total Cost**: Total cost as a number (e.g., 450.00) or 0 if not found
- **Currency**: Currency code (e.g., "USD", "EUR", "JPY") or empty string

**Stay Details:**
- **Check-in Date**: Date of check-in in ISO format YYYY-MM-DD (e.g., "2026-01-30") - REQUIRED
- **Check-in Time**: Time of check-in in 12-hour format with AM/PM (e.g., "3:00 PM", "15:00") or empty string
- **Check-out Date**: Date of check-out in ISO format YYYY-MM-DD (e.g., "2026-02-02") - REQUIRED
- **Check-out Time**: Time of check-out in 12-hour format with AM/PM (e.g., "11:00 AM", "12:00 PM") or empty string
- **Room Type**: Type of room booked (e.g., "Deluxe King Room", "Standard Queen", "Executive Suite") or empty string
- **Number of Rooms**: Number of rooms booked (e.g., 1, 2) or 1 if not specified
- **Number of Guests**: Total number of guests (e.g., 2, 4) or 0 if not provided

### Date Format Conversion Guide

Hotels use various date formats. You MUST convert them to ISO format YYYY-MM-DD:

**Common Formats:**
- "Friday, January 30, 2026" → "2026-01-30" (day of week, full month name, day, year)
- "Jan 30, 2026" → "2026-01-30" (abbreviated month)
- "January 30, 2026" → "2026-01-30" (full month name)
- "30-Jan-2026" → "2026-01-30" (day-month-year)
- "01/30/2026" → "2026-01-30" (MM/DD/YYYY)
- "2026-01-30" → "2026-01-30" (already correct)

**Month Name to Number:**
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

### Real Example - Marriott Confirmation

INPUT TEXT:
Reservation Confirmation: MR-2026-789456
Guest Name: ANDERSON/THOMAS
Hotel: Marriott Downtown San Francisco
Address: 55 Fourth Street, San Francisco, CA 94103

Check-in: Friday, January 30, 2026 at 3:00 PM
Check-out: Monday, February 2, 2026 at 12:00 PM

Room Details:
- Room Type: Deluxe King Room with City View
- Number of Rooms: 1
- Number of Guests: 2 Adults

Total Cost: $675.00 USD (including taxes and fees)
Booking Date: January 15, 2026

EXPECTED OUTPUT:
{
  "confirmationNumber": "MR-2026-789456",
  "guestName": "ANDERSON/THOMAS",
  "hotelName": "Marriott Downtown San Francisco",
  "address": "55 Fourth Street, San Francisco, CA 94103",
  "checkInDate": "2026-01-30",
  "checkInTime": "3:00 PM",
  "checkOutDate": "2026-02-02",
  "checkOutTime": "12:00 PM",
  "roomType": "Deluxe King Room with City View",
  "numberOfRooms": 1,
  "numberOfGuests": 2,
  "totalCost": 675.00,
  "currency": "USD",
  "bookingDate": "2026-01-15"
}

### Critical Rules

1. **NEVER leave check-in or check-out dates empty** - These are REQUIRED fields
2. **Convert all dates to YYYY-MM-DD format** - Use the conversion guide above
3. **Keep times in 12-hour format with AM/PM when available** - Or use 24-hour format (e.g., "15:00")
4. **Use empty strings for missing optional fields** - Not null or undefined
5. **Use 0 for missing numeric fields** - totalCost defaults to 0, numberOfGuests defaults to 0
6. **Use 1 for numberOfRooms if not specified** - Most bookings are for 1 room
7. **Guest names may use LAST/FIRST format** - Keep as-is from the confirmation
8. **Total cost includes all fees** - Taxes, resort fees, cleaning fees, etc.

### Common Email Patterns

- **Booking Platforms:** Hotels.com, Booking.com, Expedia, Airbnb, Vrbo
- **Hotel Chains:** Marriott, Hilton, Hyatt, IHG, Accor, Best Western
- **Look for phrases:** "Reservation Confirmed", "Itinerary Number", "Confirmation Code", "Check-in/Check-out"
- **Room details** are often in a separate "Room Details" or "Accommodation" section
- **Cost breakdown** may show nightly rate, taxes, fees separately
- **Check-in/check-out times** are often standard (3:00 PM / 11:00 AM) but verify from email
- **Number of nights** can be calculated from check-in and check-out dates
- **Special requests** (early check-in, late check-out, bed type) may be mentioned`;

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
