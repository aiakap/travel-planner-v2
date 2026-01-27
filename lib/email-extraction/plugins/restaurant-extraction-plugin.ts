/**
 * Restaurant Reservation Extraction Plugin
 * 
 * Extracts restaurant reservation information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { restaurantExtractionSchema } from '@/lib/schemas/restaurant-extraction-schema';

export const RESTAURANT_EXTRACTION_PROMPT = `## Restaurant Reservation Extraction

Extract restaurant reservation information from the confirmation email.

### Required Information

- **Confirmation Number**: Reservation confirmation number or reference code
- **Guest Name**: Name of the person who made the reservation
- **Restaurant Name**: Name of the restaurant or dining establishment
- **Address**: Full address of the restaurant (if provided)
- **Phone**: Restaurant phone number (if provided)
- **Reservation Date**: Date of the reservation (ISO format: YYYY-MM-DD)
- **Reservation Time**: Time of the reservation (e.g., "7:00 PM", "19:00")
- **Party Size**: Number of guests/people in the party (default: 2)
- **Special Requests**: Any special requests, dietary restrictions, or occasion notes (e.g., "Window seat", "Vegetarian menu", "Birthday celebration"), or empty string
- **Cost**: Prepaid amount or deposit as a number (default: 0 if not prepaid)
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string
- **Booking Date**: Date when the reservation was made (ISO format), or empty string if not found
- **Platform**: Booking platform used (e.g., "OpenTable", "Resy", "TheFork", "Yelp Reservations", "Direct"), or empty string
- **Cancellation Policy**: Cancellation policy details, or empty string if not provided

### Common Email Patterns

- OpenTable, Resy, TheFork, Yelp Reservations, and direct restaurant confirmations
- Look for phrases like "Your reservation is confirmed", "Confirmation number", "Table for", "Party of"
- Reservation details often include date, time, and party size prominently
- Special requests or dietary restrictions may be in a separate section
- Some high-end restaurants require deposits or prepayment

### Common Booking Platforms

- **OpenTable**: Most common in US, UK, and other countries
- **Resy**: Popular for upscale restaurants in major cities
- **TheFork** (La Fourchette): Common in Europe
- **Yelp Reservations**: Integrated with Yelp reviews
- **Tock**: Used by fine dining establishments
- **Direct**: Reservation made directly through restaurant website or phone

### Extraction Tips

- Parse dates carefully - they may be in various formats (Jan 30, 2026 / January 30, 2026 / Fri, Jan 30)
- Reservation times are typically in 15 or 30-minute increments (e.g., 6:00 PM, 6:30 PM, 7:00 PM)
- Party size is usually a number (2, 4, 6, etc.) but may be written as "Party of 4" or "4 guests"
- Special requests can include: seating preferences (window, patio, bar), dietary restrictions (vegetarian, gluten-free, allergies), occasions (birthday, anniversary), accessibility needs
- Guest name may be formatted as "LASTNAME, FIRSTNAME" or "First Last"
- Some restaurants charge cancellation fees or require deposits for large parties or special events
- Phone numbers may include country code and extensions`;

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
