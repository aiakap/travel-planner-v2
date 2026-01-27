/**
 * Cruise Booking Extraction Plugin
 * 
 * Extracts cruise booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { cruiseExtractionSchema } from '@/lib/schemas/cruise-extraction-schema';

export const CRUISE_EXTRACTION_PROMPT = `## Cruise Booking Extraction

Extract cruise booking information from the confirmation email.

### Required Information

**Booking Details:**
- **Confirmation Number**: Booking confirmation or reservation number
- **Guests**: Array of guest information (name, cabin number)
- **Cruise Line**: Name of the cruise line (e.g., "Royal Caribbean", "Carnival", "Norwegian Cruise Line", "Princess Cruises", "MSC Cruises", "Celebrity Cruises", "Disney Cruise Line")
- **Ship Name**: Name of the cruise ship (e.g., "Symphony of the Seas", "Carnival Vista", "Norwegian Encore")
- **Cabin Number**: Primary cabin or stateroom number
- **Cabin Type**: Cabin category (e.g., "Balcony", "Inside", "Suite", "Oceanview", "Mini-Suite")
- **Deck**: Deck number or name, or empty string if not provided
- **Booking Date**: Date when booking was made (ISO format: YYYY-MM-DD), or empty string

**Embarkation (Boarding):**
- **Embarkation Port**: Port name where cruise begins (e.g., "Port Canaveral", "Miami", "Barcelona")
- **Embarkation Location**: City/country (e.g., "Orlando, FL, US", "Miami, FL, US", "Barcelona, Spain")
- **Embarkation Date**: Date of embarkation (ISO format: YYYY-MM-DD)
- **Embarkation Time**: Boarding time (e.g., "1:00 PM", "13:00"), or empty string

**Disembarkation (Departure):**
- **Disembarkation Port**: Port where cruise ends (often same as embarkation port)
- **Disembarkation Location**: City/country
- **Disembarkation Date**: Date of disembarkation (ISO format: YYYY-MM-DD)
- **Disembarkation Time**: Departure time (e.g., "8:00 AM"), or empty string

**Itinerary:**
- **Ports of Call**: Array of ports visited during the cruise (if provided), each with:
  - **Port Name**: Name of the port
  - **Port Location**: Location/country
  - **Arrival Date**: Arrival date (ISO format: YYYY-MM-DD)
  - **Arrival Time**: Arrival time, or empty string
  - **Departure Date**: Departure date (ISO format: YYYY-MM-DD)
  - **Departure Time**: Departure time, or empty string

**Additional Details:**
- **Total Cost**: Total cost as a number (default: 0 if not found)
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string
- **Dining Time**: Assigned dining time or seating (e.g., "Early Seating - 6:00 PM", "Anytime Dining", "My Time Dining"), or empty string
- **Special Requests**: Special requests, dietary restrictions, accessibility needs, or empty string

### Common Email Patterns

- Major cruise lines send detailed confirmation emails with booking numbers
- Look for phrases like "Booking confirmation", "Reservation number", "Cruise summary", "Sailing details"
- Cabin information includes deck, cabin number, and category
- Itinerary shows embarkation, ports of call, and disembarkation
- Times may be in local port time zones

### Common Cruise Lines

**Major Lines:**
- Royal Caribbean International
- Carnival Cruise Line
- Norwegian Cruise Line (NCL)
- Princess Cruises
- MSC Cruises
- Celebrity Cruises
- Holland America Line
- Disney Cruise Line
- Costa Cruises
- P&O Cruises

**Luxury Lines:**
- Viking Ocean Cruises
- Oceania Cruises
- Regent Seven Seas
- Seabourn
- Crystal Cruises

### Cabin Types

- **Inside**: No window, most economical
- **Oceanview**: Window or porthole
- **Balcony**: Private balcony
- **Suite**: Larger accommodations with additional amenities
- **Mini-Suite**: Between balcony and full suite

### Extraction Tips

- Parse dates carefully - embarkation and disembarkation dates define the cruise duration
- Cabin numbers often include deck number (e.g., "8234" = Deck 8, Cabin 234)
- Ports of call may be listed with arrival/departure times or just dates
- Guest names may be in "LAST/FIRST" format
- Some cruises are round-trip (same embarkation and disembarkation port), others are one-way
- Dining times: Traditional dining has early/late seating, modern ships offer "anytime" or "my time" dining
- Special requests can include dietary needs, accessibility requirements, celebration occasions
- Total cost may include taxes, port fees, and gratuities - extract the final total`;

export const cruiseExtractionPlugin: ExtractionPlugin = {
  id: 'cruise-extraction',
  name: 'Cruise Booking Extraction',
  content: CRUISE_EXTRACTION_PROMPT,
  schema: cruiseExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const cruiseKeywords = [
      'cruise', 'ship', 'sailing', 'embarkation', 'disembarkation',
      'cabin', 'stateroom', 'deck', 'port of call', 'itinerary',
      'royal caribbean', 'carnival', 'norwegian', 'princess cruises',
      'msc cruises', 'celebrity cruises', 'disney cruise', 'holland america',
      'cruise line', 'onboard', 'shore excursion'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const cruiseScore = cruiseKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Activate if at least 3 cruise keywords are present
    return cruiseScore >= 3;
  }
};
