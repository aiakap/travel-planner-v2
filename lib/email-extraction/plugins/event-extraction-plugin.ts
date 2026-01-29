/**
 * Event/Attraction Tickets Extraction Plugin
 * 
 * Extracts event, attraction, and activity ticket information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { eventExtractionSchema } from '@/lib/schemas/event-extraction-schema';

export const EVENT_EXTRACTION_PROMPT = `## Event/Attraction Tickets Extraction

Extract event, attraction, or activity ticket information from the confirmation email with high accuracy.

### Required Information

**Booking Details:**
- **Confirmation Number**: Confirmation number, order number, or ticket reference (e.g., "TM-123456789", "EVT-2026-ABC")
- **Guest Name**: Name of the person who purchased the tickets (e.g., "SMITH/JOHN", "Jane Doe")
- **Event Name**: Name of the event, attraction, show, or activity (e.g., "Taylor Swift Concert", "Museum of Modern Art", "Hamilton")
- **Venue Name**: Name of the venue, theater, museum, or location (e.g., "Madison Square Garden", "MoMA", "Richard Rodgers Theatre")
- **Address**: Full address of the venue or empty string if not provided
- **Event Type**: Type of event (e.g., "Concert", "Museum", "Theater", "Sports", "Tour") or empty string
- **Platform**: Ticketing platform used (e.g., "Ticketmaster", "Eventbrite", "Viator") or empty string
- **Booking Date**: Date when tickets were purchased in ISO format YYYY-MM-DD or empty string
- **Special Instructions**: Entry requirements or notes (e.g., "Bring ID", "Mobile entry only") or empty string

**Event Details:**
- **Event Date**: Date of the event in ISO format YYYY-MM-DD (e.g., "2026-01-30") - REQUIRED
- **Event Time**: Start time of the event (e.g., "7:30 PM", "19:30") or empty string
- **Doors Open Time**: Doors open or entry time (e.g., "6:30 PM") or empty string

**Ticket Details:**
- **Tickets**: Array of ticket types, each with:
  - Ticket Type (e.g., "General Admission", "VIP", "Adult")
  - Quantity (number of tickets)
  - Price (price per ticket)
  - Seat Info (e.g., "Section 102, Row A, Seats 5-6") or empty string
- **Total Cost**: Total cost for all tickets as a number (e.g., 250.00) or 0 if not found
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string

### Date Format Conversion Guide

Event platforms use various date formats. You MUST convert them to ISO format YYYY-MM-DD:

**Common Formats:**
- "Saturday, January 30, 2026" → "2026-01-30" (day of week, full month name, day, year)
- "Jan 30, 2026" → "2026-01-30" (abbreviated month)
- "January 30, 2026" → "2026-01-30" (full month name)
- "30-Jan-2026" → "2026-01-30" (day-month-year)
- "01/30/2026" → "2026-01-30" (MM/DD/YYYY)
- "30/01/2026" → "2026-01-30" (DD/MM/YYYY - European format)
- "2026-01-30" → "2026-01-30" (already correct)

**Month Name to Number:**
Jan=01, Feb=02, Mar=03, Apr=04, May=05, Jun=06, Jul=07, Aug=08, Sep=09, Oct=10, Nov=11, Dec=12

### Real Example - Ticketmaster Concert

INPUT TEXT:
Ticketmaster Order Confirmation

Order #: TM-123456789
Name: ANDERSON/THOMAS
Event: Taylor Swift - The Eras Tour
Venue: Madison Square Garden
Address: 4 Pennsylvania Plaza, New York, NY 10001

Event Date: Saturday, January 30, 2026
Show Time: 7:30 PM
Doors Open: 6:00 PM

Tickets:
- 2 x Floor Seats @ $125.00 each
  Section: Floor 2, Row: 15, Seats: 12-13

Total: $250.00 USD (including fees)
Order Date: January 15, 2026

Entry: Mobile tickets only - No printed tickets accepted

EXPECTED OUTPUT:
{
  "confirmationNumber": "TM-123456789",
  "guestName": "ANDERSON/THOMAS",
  "eventName": "Taylor Swift - The Eras Tour",
  "venueName": "Madison Square Garden",
  "address": "4 Pennsylvania Plaza, New York, NY 10001",
  "eventDate": "2026-01-30",
  "eventTime": "7:30 PM",
  "doorsOpenTime": "6:00 PM",
  "tickets": [
    {
      "ticketType": "Floor Seats",
      "quantity": 2,
      "price": 125.00,
      "seatInfo": "Section: Floor 2, Row: 15, Seats: 12-13"
    }
  ],
  "totalCost": 250.00,
  "currency": "USD",
  "bookingDate": "2026-01-15",
  "platform": "Ticketmaster",
  "eventType": "Concert",
  "specialInstructions": "Mobile tickets only - No printed tickets accepted"
}

### Critical Rules

1. **NEVER leave event date empty** - This is a REQUIRED field
2. **Convert all dates to YYYY-MM-DD format** - Use the conversion guide above
3. **Keep times in original format** - Can be 12-hour (7:30 PM) or 24-hour (19:30)
4. **Extract each ticket type separately** - Different types/prices get separate entries
5. **Quantity is a number** - Extract from "2 x", "2 tickets", "Qty: 2"
6. **Price is per ticket** - Not total for quantity
7. **Seat info varies by venue** - Sections, rows, seats, or "General Admission"
8. **Use empty strings for missing optional fields** - Not null or undefined
9. **Total cost includes fees** - Service fees, processing fees, taxes
10. **Guest names may use LAST/FIRST format** - Keep as-is from confirmation

### Common Email Patterns

**Ticketing Platforms:**
- **Ticketmaster**: Concerts, sports, theater (major events)
- **Eventbrite**: Wide variety, community events
- **StubHub**: Resale marketplace
- **AXS**: Concerts and sports
- **SeeTickets**: UK-based ticketing
- **Viator/GetYourGuide**: Tours and attractions
- **Direct**: Museum, theater, attraction websites

**Event Types:**
- **Concerts**: Music performances, festivals
- **Theater**: Plays, musicals, Broadway
- **Sports**: Games, matches, races
- **Museums**: Art, science, history
- **Theme Parks**: Amusement, water parks
- **Tours**: Guided, walking, bus tours
- **Attractions**: Landmarks, observation decks
- **Comedy**: Stand-up, improv shows

**Look for phrases:**
- "Order confirmed", "Your tickets", "Confirmation", "Admit"
- "Event date", "Show time", "Doors open", "Gates open"
- "Section", "Row", "Seat", "General Admission", "GA"
- "Ticket type", "Pricing", "Total", "Fees"
- "Entry requirements", "What to bring", "Prohibited items"

**Ticket Types:**
- **General Admission** (GA): No assigned seats, first-come
- **Reserved Seating**: Specific seats assigned
- **VIP**: Premium access, perks included
- **Age Categories**: Adult, Child, Student, Senior
- **Standing**: Standing room only
- **Package**: Includes extras (meet & greet, merchandise)

**Common Patterns:**
- Times include "Doors open" and "Show starts"
- Mobile tickets increasingly common
- Some require ID matching name on order
- Large bags often prohibited
- Re-entry policies vary

### Common Email Patterns

- Ticketmaster, Eventbrite, StubHub, AXS, SeeTickets, and venue-direct confirmations
- Look for phrases like "Order confirmed", "Your tickets", "Confirmation number", "Admit", "Entry"
- Event details typically include date, time, venue name, and address
- Ticket types may include pricing tiers, age categories, or seating sections
- Museums and attractions often have timed entry tickets

### Common Ticketing Platforms

- **Ticketmaster**: Major concerts, sports, theater
- **Eventbrite**: Wide variety of events, often smaller venues
- **StubHub**: Resale marketplace for tickets
- **AXS**: Concerts and sports events
- **SeeTickets**: UK-based ticketing
- **Viator/GetYourGuide**: Tours and attractions
- **Direct**: Purchased directly from venue or attraction website

### Event Types

- **Concerts**: Music performances, festivals
- **Theater**: Plays, musicals, Broadway shows
- **Sports**: Games, matches, races
- **Museums**: Art museums, science centers, historical sites
- **Theme Parks**: Amusement parks, water parks
- **Tours**: Guided tours, walking tours, bus tours
- **Attractions**: Landmarks, observation decks, aquariums, zoos
- **Comedy Shows**: Stand-up comedy, improv
- **Opera/Ballet**: Classical performances
- **Conferences**: Professional events, conventions

### Extraction Tips

- Parse dates carefully - they may be in various formats
- Event times may include "Doors open" time and "Show starts" time - use show start time as event time
- Ticket types can vary widely: GA (General Admission), VIP, Premium, Standard, Adult, Child, Student, Senior, etc.
- Seat information format varies: "Section 102, Row A, Seat 5" or "Floor GA" or "Orchestra Left"
- Some tickets are timed entry (museums, attractions) while others have flexible entry windows
- Mobile tickets vs print-at-home vs will-call pickup - note in special instructions
- Age restrictions, ID requirements, bag policies - include in special instructions
- Total cost should include all fees and taxes when available`;

export const eventExtractionPlugin: ExtractionPlugin = {
  id: 'event-extraction',
  name: 'Event/Attraction Tickets Extraction',
  content: EVENT_EXTRACTION_PROMPT,
  schema: eventExtractionSchema,
  priority: 10,
  shouldInclude: (context) => {
    const eventKeywords = [
      'ticket', 'tickets', 'admission', 'event', 'concert', 'show', 
      'museum', 'theater', 'theatre', 'entry', 'attraction', 'venue',
      'ticketmaster', 'eventbrite', 'stubhub', 'axs', 'seetickets',
      'order confirmed', 'your tickets', 'seat', 'section', 'row',
      'doors open', 'showtime', 'performance', 'exhibit', 'tour'
    ];
    
    const lowerText = context.emailText.toLowerCase();
    const eventScore = eventKeywords.filter(kw => lowerText.includes(kw)).length;
    
    // Activate if at least 3 event keywords are present
    return eventScore >= 3;
  }
};
