/**
 * Train/Rail Extraction Plugin
 * 
 * Extracts train/rail booking information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { trainExtractionSchema } from '@/lib/schemas/train-extraction-schema';

export const TRAIN_EXTRACTION_PROMPT = `## Train/Rail Booking Extraction

Extract train or rail booking information from the confirmation email with high accuracy.

### Required Information

**Booking Details:**
- **Confirmation Number**: Booking confirmation, reference number, or PNR (e.g., "XYZABC123", "PNR-2026-001")
- **Passengers**: Array of passenger information with name and ticket number (e.g., [{"name": "SMITH/JOHN", "ticketNumber": "TKT123456"}])
- **Purchase Date**: Date when booking was made in ISO format YYYY-MM-DD (e.g., "2026-01-15") or empty string
- **Total Cost**: Total cost as a number (e.g., 250.00) or 0 if not found
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string

**Train Segments:**
For EACH train in the itinerary, extract ALL of the following:

- **Train Number**: Full train number or service code (e.g., "Acela 2150", "Eurostar 9012", "ICE 123", "Shinkansen Nozomi 21")
- **Operator**: Train operator/carrier name (e.g., "Amtrak", "Eurostar", "Deutsche Bahn", "SNCF", "JR East")
- **Operator Code**: Operator code if available (e.g., "AMTK", "ES", "DB", "JR") or empty string
- **Departure Station**: Full station name (e.g., "New York Penn Station", "London St Pancras International", "Tokyo Station")
- **Departure Station Code**: Station code if available (e.g., "NYP", "STP", "PAR") or empty string
- **Departure City**: City name with state/country (e.g., "New York, NY, US", "London, UK", "Tokyo, Japan")
- **Departure Date**: Date of departure in ISO format YYYY-MM-DD (e.g., "2026-01-30") - REQUIRED
- **Departure Time**: Time of departure (e.g., "10:15 AM", "14:30") - REQUIRED
- **Departure Platform**: Platform or track number (e.g., "7", "Track 2", "Platform 10"), or empty string
- **Arrival Station**: Full station name (e.g., "Washington Union Station", "Paris Gare du Nord", "Kyoto Station")
- **Arrival Station Code**: Station code if available (e.g., "WAS", "PGN", "KYO") or empty string
- **Arrival City**: City name with state/country (e.g., "Washington, DC, US", "Paris, France", "Kyoto, Japan")
- **Arrival Date**: Date of arrival in ISO format YYYY-MM-DD (e.g., "2026-01-30") - REQUIRED
- **Arrival Time**: Time of arrival (e.g., "1:45 PM", "17:30") - REQUIRED
- **Arrival Platform**: Platform or track number, or empty string if not provided
- **Class**: Travel class (e.g., "First Class", "Second Class", "Business", "Standard", "Economy", "Green Car")
- **Coach**: Coach or carriage number (e.g., "Car 5", "Coach B"), or empty string
- **Seat**: Seat number or reservation (e.g., "12A", "45", "Window", "Aisle"), or empty string
- **Duration**: Journey duration if provided (e.g., "3h 30m", "2 hours 15 minutes"), or empty string

### Date Format Conversion Guide

Train operators use various date formats. You MUST convert them to ISO format YYYY-MM-DD:

**Common Formats:**
- "Monday, January 30, 2026" → "2026-01-30" (day of week, full month name, day, year)
- "Jan 30, 2026" → "2026-01-30" (abbreviated month)
- "January 30, 2026" → "2026-01-30" (full month name)
- "30-Jan-2026" → "2026-01-30" (day-month-year)
- "01/30/2026" → "2026-01-30" (MM/DD/YYYY)
- "30/01/2026" → "2026-01-30" (DD/MM/YYYY - European format)
- "2026-01-30" → "2026-01-30" (already correct)

**Month Name to Number:**
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

### Real Example - Amtrak Confirmation

INPUT TEXT:
Amtrak Reservation Confirmation

Booking Reference: XYZABC123
Passenger: ANDERSON/THOMAS
Booking Date: January 15, 2026

Train 1: Acela 2150
Departure: Monday, January 30, 2026 at 10:15 AM
From: New York Penn Station (NYP), New York, NY
Platform: Track 7

Arrival: Monday, January 30, 2026 at 1:45 PM
To: Washington Union Station (WAS), Washington, DC
Platform: Track 3

Class: Business Class
Seat: 12A
Duration: 3 hours 30 minutes

Total Fare: $250.00 USD

EXPECTED OUTPUT:
{
  "confirmationNumber": "XYZABC123",
  "passengers": [
    {
      "name": "ANDERSON/THOMAS",
      "ticketNumber": ""
    }
  ],
  "purchaseDate": "2026-01-15",
  "totalCost": 250.00,
  "currency": "USD",
  "trains": [
    {
      "trainNumber": "Acela 2150",
      "operator": "Amtrak",
      "operatorCode": "",
      "departureStation": "New York Penn Station",
      "departureStationCode": "NYP",
      "departureCity": "New York, NY, US",
      "departureDate": "2026-01-30",
      "departureTime": "10:15 AM",
      "departurePlatform": "Track 7",
      "arrivalStation": "Washington Union Station",
      "arrivalStationCode": "WAS",
      "arrivalCity": "Washington, DC, US",
      "arrivalDate": "2026-01-30",
      "arrivalTime": "1:45 PM",
      "arrivalPlatform": "Track 3",
      "class": "Business Class",
      "coach": "",
      "seat": "12A",
      "duration": "3 hours 30 minutes"
    }
  ]
}

### Critical Rules

1. **NEVER leave departure/arrival dates or times empty** - Every train MUST have these 4 fields
2. **Convert all dates to YYYY-MM-DD format** - Use the conversion guide above
3. **Keep times in original format** - Can be 12-hour (10:15 AM) or 24-hour (14:30)
4. **Extract each train segment separately** - Multi-leg journeys have multiple entries
5. **Use empty strings for missing optional fields** - Not null or undefined
6. **Station codes are typically 3 letters** - e.g., NYP, PAR, ROM, but may be longer or missing
7. **Passenger names may use LAST/FIRST format** - Keep as-is from confirmation
8. **Platform/track numbers** - May be announced closer to departure, empty string if not provided
9. **Duration format is flexible** - "3h 30m", "3 hours 30 minutes", "3:30" are all valid
10. **Handle multi-passenger bookings** - Extract all passengers with their ticket numbers

### Common Email Patterns

**Train Operators:**
- **North America:** Amtrak (US), VIA Rail (Canada)
- **Europe:** Eurostar (UK-France-Belgium), Deutsche Bahn (Germany), SNCF (France), Renfe (Spain), Trenitalia (Italy), ÖBB (Austria), SBB (Switzerland), NS (Netherlands), SNCB (Belgium), Thalys, TGV
- **Asia:** JR (Japan Rail), Shinkansen (Japan), KTX (South Korea), China Railway, Indian Railways

**Look for phrases:**
- "Booking reference", "Confirmation code", "Ticket number", "E-ticket", "PNR", "Reservation number"
- "Departure", "Arrival", "From", "To", "Departs", "Arrives"
- "Platform", "Track", "Coach", "Car", "Seat"
- "Travel class", "Class", "Service class"

**Format variations:**
- Times may be 12-hour (10:15 AM) or 24-hour (14:30)
- European trains typically use 24-hour format
- Multi-leg journeys show "Train 1 of 3", "Leg 1", etc.
- Station codes may be 3 letters (NYP) or longer (PARIS-NORD)
- Some emails show "Reserved" or "TBA" for seats not yet assigned`;

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
