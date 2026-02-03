/**
 * Flight Extraction Plugin
 * 
 * Extracts flight booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { flightExtractionSchema } from '@/lib/schemas/flight-extraction-schema';

export const FLIGHT_EXTRACTION_PROMPT = `## Flight Booking Extraction

### ⚠️ CRITICAL: DO NOT MODIFY TIMES OR DATES ⚠️

**VERBATIM EXTRACTION ONLY** - Copy times AND dates EXACTLY as they appear in the email.

**TIMES:**
- If email shows "10:15 AM" → extract "10:15 AM" (NOT "6:15 PM" or "18:15")
- If email shows "02:50 PM" → extract "02:50 PM" (NOT "5:50 AM" or "05:50")
- Do NOT convert between timezones
- Do NOT interpret times as UTC
- Airlines ALWAYS show local airport times - just copy them verbatim

**DATES:**
- If email shows arrival on "Feb 7" → extract "2026-02-07" (NOT Feb 8)
- Do NOT calculate arrival dates based on departure date + flight duration
- Do NOT assume arrival is the "next day" just because arrival time < departure time
- International flights crossing the date line often arrive on the SAME day or EARLIER
- Example: Tokyo (HND) to San Francisco (SFO) departing Feb 7 at 4:25 PM arrives Feb 7 at 9:10 AM
- ALWAYS use the date shown in the email, not a calculated date

Extract flight booking information from the confirmation email.

### Required Information

**Booking Details:**
- **Confirmation Number**: Booking confirmation or record locator
- **Passengers**: Array of passenger information (name, e-ticket number)
- **Purchase Date**: Date when the booking was made (ISO format: YYYY-MM-DD)
- **Total Cost**: Total cost as a number (default: 0 if not found)
- **Currency**: Currency code (e.g., "USD", "EUR") or empty string

**Flight Segments:**
For each flight in the itinerary, extract:
- **Flight Number**: Full flight number (e.g., "UA123", "AA456")
- **Carrier**: Airline name (e.g., "United Airlines")
- **Carrier Code**: 2-letter airline code (e.g., "UA", "AA")
- **Departure Airport**: 3-letter airport code (e.g., "SFO")
- **Departure City**: City name (e.g., "San Francisco, CA, US")
- **Departure Date**: Date of departure (ISO format: YYYY-MM-DD)
- **Departure Time**: Time of departure (e.g., "10:15 AM")
- **Arrival Airport**: 3-letter airport code (e.g., "JFK")
- **Arrival City**: City name (e.g., "New York, NY, US")
- **Arrival Date**: Date of arrival (ISO format: YYYY-MM-DD)
- **Arrival Time**: Time of arrival (e.g., "6:45 PM")
- **Cabin**: Cabin class (e.g., "Economy", "Business", "First")
- **Seat**: Seat number (e.g., "12A") or empty string
- **Operated By**: Operating carrier if different from marketing carrier

### Common Email Patterns

- Airlines send confirmation emails with record locators
- Look for phrases like "Confirmation code", "E-ticket", "Flight itinerary"
- Multi-leg trips have multiple flight segments
- Times may include timezone information

### Extraction Tips

- Parse each flight segment separately
- Departure/arrival times should include AM/PM
- Airport codes are always 3 letters (IATA codes)
- Passenger names may be in "LAST/FIRST" format
- Some flights are operated by partner airlines (codeshare)

### Critical Time & Date Rules

- **IMPORTANT**: Departure and arrival times/dates are ALWAYS in LOCAL TIME at that airport
- A "10:15 AM" departure from SFO means 10:15 AM Pacific Time, NOT UTC
- A "02:50 PM" arrival in HND means 2:50 PM Japan Time, NOT UTC
- Extract times EXACTLY as written in the email - do not convert to/from UTC
- If the email shows "10:15 AM" - extract "10:15 AM" (not "6:15 PM" or any other time)
- Times shown in airline confirmations are the wall clock times passengers see at the airport

**DATE LINE CROSSINGS:**
- For transpacific flights (e.g., Asia to US), arrival date may be the SAME as departure date
- Do NOT add a day just because arrival time is earlier than departure time
- Example: HND→SFO departs Feb 7 at 4:25 PM, arrives Feb 7 at 9:10 AM ← CORRECT (same day)
- The email shows the actual calendar date at each location - copy it exactly

### Common Format Examples

| Email Shows | Extract As |
|-------------|------------|
| "10:15 AM" | "10:15 AM" |
| "02:50 PM" | "02:50 PM" |
| "2:50 PM" | "2:50 PM" |
| "14:50" | "2:50 PM" |
| "10:15" | "10:15 AM" (assume AM for times before noon without AM/PM) |`;

export const flightExtractionPlugin: ExtractionPlugin = {
  id: 'flight-extraction',
  name: 'Flight Booking Extraction',
  content: FLIGHT_EXTRACTION_PROMPT,
  schema: flightExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const flightKeywords = [
      'flight', 'airline', 'boarding', 'departure', 'arrival', 
      'terminal', 'gate', 'seat', 'passenger', 'aircraft', 
      'aviation', 'e-ticket', 'confirmation code', 'record locator'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const flightScore = flightKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Activate if at least 3 flight keywords are present
    return flightScore >= 3;
  }
};
