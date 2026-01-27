/**
 * Train/Rail Extraction Plugin
 * 
 * Extracts train/rail booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { trainExtractionSchema } from '@/lib/schemas/train-extraction-schema';

export const TRAIN_EXTRACTION_PROMPT = `## Train/Rail Booking Extraction

Extract train or rail booking information from the confirmation email.

### Required Information

**Booking Details:**
- **Confirmation Number**: Booking confirmation, reference number, or PNR
- **Passengers**: Array of passenger information (name, ticket number)
- **Purchase Date**: Date when the booking was made (ISO format: YYYY-MM-DD)
- **Total Cost**: Total cost as a number (default: 0 if not found)
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string

**Train Segments:**
For each train in the itinerary, extract:
- **Train Number**: Full train number or service code (e.g., "Acela 2150", "Eurostar 9012", "ICE 123")
- **Operator**: Train operator/carrier name (e.g., "Amtrak", "Eurostar", "Deutsche Bahn", "SNCF", "Renfe")
- **Operator Code**: Operator code if available (e.g., "AMTK", "ES", "DB") or empty string
- **Departure Station**: Full station name (e.g., "New York Penn Station", "London St Pancras International")
- **Departure Station Code**: Station code if available (e.g., "NYP", "STP", "PAR") or empty string
- **Departure City**: City name with country (e.g., "New York, NY, US", "London, UK")
- **Departure Date**: Date of departure (ISO format: YYYY-MM-DD)
- **Departure Time**: Time of departure (e.g., "10:15 AM", "14:30")
- **Departure Platform**: Platform or track number, or empty string if not provided
- **Arrival Station**: Full station name (e.g., "Washington Union Station", "Paris Gare du Nord")
- **Arrival Station Code**: Station code if available (e.g., "WAS", "PGN") or empty string
- **Arrival City**: City name with country (e.g., "Washington, DC, US", "Paris, France")
- **Arrival Date**: Date of arrival (ISO format: YYYY-MM-DD)
- **Arrival Time**: Time of arrival (e.g., "1:45 PM", "17:30")
- **Arrival Platform**: Platform or track number, or empty string if not provided
- **Class**: Travel class (e.g., "First Class", "Second Class", "Business", "Standard", "Economy")
- **Coach**: Coach or carriage number, or empty string if not provided
- **Seat**: Seat number or reservation (e.g., "12A", "45", "Window"), or empty string
- **Duration**: Journey duration if provided (e.g., "3h 30m", "2 hours 15 minutes"), or empty string

### Common Email Patterns

- Train operators send confirmation emails with reference numbers or PNRs
- Look for phrases like "Booking reference", "Confirmation code", "Ticket number", "E-ticket"
- Multi-leg journeys have multiple train segments
- Times may be in 12-hour (AM/PM) or 24-hour format
- European trains often use 24-hour time format
- Station codes are typically 3 letters (e.g., NYP, PAR, ROM)

### Common Train Operators

**North America:**
- Amtrak (US), VIA Rail (Canada)

**Europe:**
- Eurostar (UK-France-Belgium), Deutsche Bahn (Germany), SNCF (France)
- Renfe (Spain), Trenitalia (Italy), ÖBB (Austria), SBB (Switzerland)
- NS (Netherlands), SNCB (Belgium), Thalys, TGV

**Asia:**
- JR (Japan Rail), Shinkansen (Japan), KTX (South Korea)
- China Railway, Indian Railways

### Extraction Tips

- Parse each train segment separately for multi-leg journeys
- Departure/arrival times should preserve the format from the email
- Station codes are typically 3 letters but not always present
- Passenger names may be in "LAST/FIRST" or "First Last" format
- Some trains show "Reserved" instead of specific seat numbers
- Platform/track numbers are often announced closer to departure time
- Duration may be calculated from departure and arrival times if not explicitly stated`;

export const trainExtractionPlugin: ExtractionPlugin = {
  id: 'train-extraction',
  name: 'Train/Rail Booking Extraction',
  content: TRAIN_EXTRACTION_PROMPT,
  schema: trainExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const trainKeywords = [
      'train', 'rail', 'railway', 'railroad', 'amtrak', 'eurostar', 
      'renfe', 'trenitalia', 'deutsche bahn', 'sncf', 'thalys', 'tgv',
      'seat reservation', 'carriage', 'coach', 'platform', 'track',
      'station', 'departure', 'arrival', 'passenger', 'ticket',
      'shinkansen', 'via rail', 'intercity', 'regional'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const trainScore = trainKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Activate if at least 3 train keywords are present
    return trainScore >= 3;
  }
};
