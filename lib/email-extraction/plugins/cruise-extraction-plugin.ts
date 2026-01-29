/**
 * Cruise Booking Extraction Plugin
 * 
 * Extracts cruise booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { cruiseExtractionSchema } from '@/lib/schemas/cruise-extraction-schema';

export const CRUISE_EXTRACTION_PROMPT = `## Cruise Booking Extraction

Extract cruise booking information from the confirmation email with high accuracy.

### Required Information

**Booking Details:**
- **Confirmation Number**: Booking confirmation or reservation number (e.g., "RC-2026-789456", "CRUISE123456")
- **Guests**: Array of guest information with name and cabin number (e.g., [{"name": "SMITH/JOHN", "cabinNumber": "8234"}])
- **Cruise Line**: Name of the cruise line (e.g., "Royal Caribbean International", "Carnival Cruise Line", "Norwegian Cruise Line")
- **Ship Name**: Name of the cruise ship (e.g., "Symphony of the Seas", "Carnival Vista", "Norwegian Encore")
- **Cabin Number**: Primary cabin or stateroom number (e.g., "8234", "B-456")
- **Cabin Type**: Cabin category (e.g., "Balcony", "Inside", "Suite", "Oceanview", "Mini-Suite")
- **Deck**: Deck number or name (e.g., "Deck 8", "Lido Deck"), or empty string if not provided
- **Booking Date**: Date when booking was made in ISO format YYYY-MM-DD (e.g., "2026-01-15") or empty string
- **Total Cost**: Total cost as a number (e.g., 2500.00) or 0 if not found
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string

**Embarkation (Boarding):**
- **Embarkation Port**: Port name where cruise begins (e.g., "Port Canaveral", "Miami", "Barcelona")
- **Embarkation Location**: City/state/country (e.g., "Orlando, FL, US", "Miami, FL, US", "Barcelona, Spain")
- **Embarkation Date**: Date of embarkation in ISO format YYYY-MM-DD (e.g., "2026-02-15") - REQUIRED
- **Embarkation Time**: Boarding time (e.g., "1:00 PM", "13:00"), or empty string

**Disembarkation (Departure):**
- **Disembarkation Port**: Port where cruise ends (e.g., "Port Canaveral", "Miami")
- **Disembarkation Location**: City/state/country
- **Disembarkation Date**: Date of disembarkation in ISO format YYYY-MM-DD (e.g., "2026-02-22") - REQUIRED
- **Disembarkation Time**: Departure time (e.g., "8:00 AM"), or empty string

**Itinerary (Optional):**
- **Ports of Call**: Array of ports visited (if provided), each with:
  - Port Name, Port Location, Arrival Date (YYYY-MM-DD), Arrival Time, Departure Date (YYYY-MM-DD), Departure Time

**Additional Details:**
- **Dining Time**: Assigned dining time (e.g., "Early Seating - 6:00 PM", "Anytime Dining"), or empty string
- **Special Requests**: Special requests, dietary restrictions, accessibility needs, or empty string

### Date Format Conversion Guide

Cruise lines use various date formats. You MUST convert them to ISO format YYYY-MM-DD:

**Common Formats:**
- "Saturday, February 15, 2026" → "2026-02-15" (day of week, full month name, day, year)
- "Feb 15, 2026" → "2026-02-15" (abbreviated month)
- "February 15, 2026" → "2026-02-15" (full month name)
- "15-Feb-2026" → "2026-02-15" (day-month-year)
- "02/15/2026" → "2026-02-15" (MM/DD/YYYY)
- "2026-02-15" → "2026-02-15" (already correct)

**Month Name to Number:**
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

### Real Example - Royal Caribbean Confirmation

INPUT TEXT:
Royal Caribbean International - Cruise Confirmation

Booking Number: RC-2026-789456
Guest: ANDERSON/THOMAS
Booking Date: January 15, 2026

Ship: Symphony of the Seas
Cabin: 8234 (Balcony Stateroom, Deck 8)

Embarkation:
Port: Port Canaveral, Orlando, FL, US
Date: Saturday, February 15, 2026
Boarding Time: 1:00 PM

Disembarkation:
Port: Port Canaveral, Orlando, FL, US
Date: Saturday, February 22, 2026
Departure Time: 8:00 AM

Itinerary:
Day 1: Port Canaveral, FL - Depart 4:00 PM
Day 2: At Sea
Day 3: Cozumel, Mexico - Arrive 8:00 AM, Depart 5:00 PM
Day 4: George Town, Grand Cayman - Arrive 7:00 AM, Depart 4:00 PM
Day 5-6: At Sea
Day 7: Port Canaveral, FL - Arrive 6:00 AM

Dining: My Time Dining (Flexible)
Total: $2,500.00 USD (including taxes and fees)

EXPECTED OUTPUT:
{
  "confirmationNumber": "RC-2026-789456",
  "guests": [{"name": "ANDERSON/THOMAS", "cabinNumber": "8234"}],
  "cruiseLine": "Royal Caribbean International",
  "shipName": "Symphony of the Seas",
  "cabinNumber": "8234",
  "cabinType": "Balcony",
  "deck": "Deck 8",
  "embarkationPort": "Port Canaveral",
  "embarkationLocation": "Orlando, FL, US",
  "embarkationDate": "2026-02-15",
  "embarkationTime": "1:00 PM",
  "disembarkationPort": "Port Canaveral",
  "disembarkationLocation": "Orlando, FL, US",
  "disembarkationDate": "2026-02-22",
  "disembarkationTime": "8:00 AM",
  "portsOfCall": [
    {
      "portName": "Cozumel",
      "portLocation": "Mexico",
      "arrivalDate": "2026-02-17",
      "arrivalTime": "8:00 AM",
      "departureDate": "2026-02-17",
      "departureTime": "5:00 PM"
    },
    {
      "portName": "George Town",
      "portLocation": "Grand Cayman",
      "arrivalDate": "2026-02-18",
      "arrivalTime": "7:00 AM",
      "departureDate": "2026-02-18",
      "departureTime": "4:00 PM"
    }
  ],
  "totalCost": 2500.00,
  "currency": "USD",
  "bookingDate": "2026-01-15",
  "diningTime": "My Time Dining (Flexible)",
  "specialRequests": ""
}

### Critical Rules

1. **NEVER leave embarkation or disembarkation dates empty** - These are REQUIRED fields
2. **Convert all dates to YYYY-MM-DD format** - Use the conversion guide above
3. **Keep times in original format** - Can be 12-hour (1:00 PM) or 24-hour (13:00)
4. **Cabin numbers may include deck** - e.g., "8234" means Deck 8, Cabin 234
5. **Round-trip cruises** - Same embarkation and disembarkation port
6. **One-way cruises** - Different embarkation and disembarkation ports
7. **Ports of call are optional** - Use empty array if not provided
8. **Guest names may use LAST/FIRST format** - Keep as-is from confirmation
9. **Total cost includes everything** - Taxes, port fees, gratuities
10. **Dining times vary** - Traditional (early/late seating) or flexible (anytime/my time)

### Common Email Patterns

**Cruise Lines:**
- **Major:** Royal Caribbean, Carnival, Norwegian (NCL), Princess, MSC, Celebrity, Holland America, Disney, Costa, P&O
- **Luxury:** Viking Ocean, Oceania, Regent Seven Seas, Seabourn, Crystal

**Look for phrases:**
- "Booking confirmation", "Reservation number", "Cruise summary", "Sailing details"
- "Cabin", "Stateroom", "Deck", "Category"
- "Embarkation", "Boarding", "Sail date", "Departure date"
- "Disembarkation", "Debarkation", "Return date"
- "Ports of call", "Itinerary", "Shore excursions"

**Cabin Types:**
- **Inside**: No window, most economical
- **Oceanview**: Window or porthole
- **Balcony**: Private balcony
- **Suite**: Larger with premium amenities
- **Mini-Suite**: Between balcony and full suite

**Common Patterns:**
- Times may be in local port time zones
- "At Sea" days have no port stops
- Dining options: Traditional (early/late), Flexible (anytime/my time)
- Special requests: dietary restrictions, celebrations, accessibility needs`;

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
