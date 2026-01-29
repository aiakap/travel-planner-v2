/**
 * Restaurant Reservation Extraction Plugin
 * 
 * Extracts restaurant reservation information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { restaurantExtractionSchema } from '@/lib/schemas/restaurant-extraction-schema';

export const RESTAURANT_EXTRACTION_PROMPT = `## Restaurant Reservation Extraction

Extract restaurant reservation information from the confirmation email with high accuracy.

### Required Information

**Booking Details:**
- **Confirmation Number**: Reservation confirmation number or reference code (e.g., "OT-123456789", "RESY-2026-ABC")
- **Guest Name**: Name of the person who made the reservation (e.g., "SMITH/JOHN", "Jane Doe")
- **Restaurant Name**: Name of the restaurant or dining establishment (e.g., "Le Bernardin", "The French Laundry")
- **Address**: Full address of the restaurant or empty string if not provided
- **Phone**: Restaurant phone number (e.g., "+1-555-123-4567") or empty string if not provided
- **Booking Date**: Date when reservation was made in ISO format YYYY-MM-DD or empty string
- **Platform**: Booking platform used (e.g., "OpenTable", "Resy", "TheFork", "Tock", "Direct") or empty string
- **Cancellation Policy**: Cancellation policy details or empty string

**Reservation Details:**
- **Reservation Date**: Date of the reservation in ISO format YYYY-MM-DD (e.g., "2026-01-30") - REQUIRED
- **Reservation Time**: Time of the reservation (e.g., "7:00 PM", "19:00") - REQUIRED
- **Party Size**: Number of guests/people in the party (e.g., 2, 4, 6)
- **Special Requests**: Special requests, dietary restrictions, or occasion notes (e.g., "Window seat", "Vegetarian menu", "Birthday") or empty string
- **Cost**: Prepaid amount or deposit as a number (e.g., 50.00) or 0 if not prepaid
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string

### Date Format Conversion Guide

Restaurants and booking platforms use various date formats. You MUST convert them to ISO format YYYY-MM-DD:

**Common Formats:**
- "Friday, January 30, 2026" → "2026-01-30" (day of week, full month name, day, year)
- "Jan 30, 2026" → "2026-01-30" (abbreviated month)
- "January 30, 2026" → "2026-01-30" (full month name)
- "30-Jan-2026" → "2026-01-30" (day-month-year)
- "01/30/2026" → "2026-01-30" (MM/DD/YYYY)
- "30/01/2026" → "2026-01-30" (DD/MM/YYYY - European format)
- "2026-01-30" → "2026-01-30" (already correct)

**Month Name to Number:**
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

### Real Example - OpenTable Confirmation

INPUT TEXT:
OpenTable Reservation Confirmed

Confirmation #: OT-123456789
Name: ANDERSON/THOMAS
Restaurant: Le Bernardin
Address: 155 West 51st Street, New York, NY 10019
Phone: +1-212-554-1515

Reservation Details:
Date: Friday, January 30, 2026
Time: 7:00 PM
Party Size: 2 guests

Special Requests: Window seat, Pescatarian menu
Deposit: $50.00 per person
Cancellation: Cancel by 24 hours before for full refund

Booked via: OpenTable
Booking Date: January 15, 2026

EXPECTED OUTPUT:
{
  "confirmationNumber": "OT-123456789",
  "guestName": "ANDERSON/THOMAS",
  "restaurantName": "Le Bernardin",
  "address": "155 West 51st Street, New York, NY 10019",
  "phone": "+1-212-554-1515",
  "reservationDate": "2026-01-30",
  "reservationTime": "7:00 PM",
  "partySize": 2,
  "specialRequests": "Window seat, Pescatarian menu",
  "cost": 100.00,
  "currency": "USD",
  "bookingDate": "2026-01-15",
  "platform": "OpenTable",
  "cancellationPolicy": "Cancel by 24 hours before for full refund"
}

### Critical Rules

1. **NEVER leave reservation date or time empty** - These are REQUIRED fields
2. **Convert all dates to YYYY-MM-DD format** - Use the conversion guide above
3. **Keep times in original format** - Can be 12-hour (7:00 PM) or 24-hour (19:00)
4. **Party size is a number** - Extract from "Party of 4", "4 guests", "2 people"
5. **Use empty strings for missing optional fields** - Not null or undefined
6. **Use 0 for cost if not prepaid** - Only include deposits/prepayments
7. **Guest names may use LAST/FIRST format** - Keep as-is from confirmation
8. **Special requests are comma-separated** - Combine multiple requests
9. **Phone numbers include country code** - +1, +44, etc. when provided
10. **Time increments are typically 15 or 30 minutes** - 6:00 PM, 6:30 PM, 7:00 PM

### Common Email Patterns

**Booking Platforms:**
- **OpenTable**: Most common in US, UK, Canada, Australia
- **Resy**: Popular for upscale restaurants in major cities
- **TheFork** (La Fourchette): Common in Europe
- **Yelp Reservations**: Integrated with Yelp reviews
- **Tock**: Used by fine dining establishments
- **Direct**: Reservation made directly through restaurant

**Look for phrases:**
- "Your reservation is confirmed", "Reservation confirmed", "Confirmation number"
- "Table for", "Party of", "Guests", "Covers"
- "Date", "Time", "Dining time"
- "Special requests", "Dietary restrictions", "Occasion"
- "Deposit", "Prepayment", "Cancellation policy"

**Special Requests Types:**
- **Seating**: Window seat, patio, bar, booth, private room
- **Dietary**: Vegetarian, vegan, gluten-free, pescatarian, allergies
- **Occasions**: Birthday, anniversary, celebration, business dinner
- **Accessibility**: Wheelchair accessible, high chair needed
- **Other**: Quiet table, specific server, wine pairing

**Common Patterns:**
- Times in 15/30-minute increments
- High-end restaurants may require deposits
- Cancellation policies vary (24-48 hours notice)
- Some platforms charge no-show fees`;

export const restaurantExtractionPlugin: ExtractionPlugin = {
  id: 'restaurant-extraction',
  name: 'Restaurant Reservation Extraction',
  content: RESTAURANT_EXTRACTION_PROMPT,
  schema: restaurantExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const restaurantKeywords = [
      'restaurant', 'reservation', 'table', 'dining', 'party of', 
      'guests', 'covers', 'opentable', 'resy', 'thefork', 'tock',
      'yelp reservations', 'dinner', 'lunch', 'brunch', 'seating',
      'confirmed reservation', 'booking confirmation', 'dine', 'cuisine'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const restaurantScore = restaurantKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Activate if at least 3 restaurant keywords are present
    return restaurantScore >= 3;
  }
};
