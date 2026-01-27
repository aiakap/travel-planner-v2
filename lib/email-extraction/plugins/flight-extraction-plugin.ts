/**
 * Flight Extraction Plugin
 * 
 * Extracts flight booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { flightExtractionSchema } from '@/lib/schemas/flight-extraction-schema';

export const FLIGHT_EXTRACTION_PROMPT = `## Flight Booking Extraction

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
- Some flights are operated by partner airlines (codeshare)`;

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
