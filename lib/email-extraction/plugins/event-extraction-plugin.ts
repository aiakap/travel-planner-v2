/**
 * Event/Attraction Tickets Extraction Plugin
 * 
 * Extracts event, attraction, and activity ticket information from confirmation emails
 */

import { ExtractionPlugin } from '../types';
import { eventExtractionSchema } from '@/lib/schemas/event-extraction-schema';

export const EVENT_EXTRACTION_PROMPT = `## Event/Attraction Tickets Extraction

Extract event, attraction, or activity ticket information from the confirmation email.

### Required Information

- **Confirmation Number**: Confirmation number, order number, or ticket reference
- **Guest Name**: Name of the person who purchased the tickets
- **Event Name**: Name of the event, attraction, show, or activity
- **Venue Name**: Name of the venue, theater, museum, or location
- **Address**: Full address of the venue (if provided)
- **Event Date**: Date of the event (ISO format: YYYY-MM-DD)
- **Event Time**: Start time of the event (e.g., "7:30 PM", "19:30"), or empty string if not specified
- **Doors Open Time**: Doors open or entry time if different from event start time, or empty string
- **Tickets**: Array of ticket types with:
  - **Ticket Type**: Type of ticket (e.g., "General Admission", "VIP", "Adult", "Child", "Student", "Senior")
  - **Quantity**: Number of tickets of this type
  - **Price**: Price per ticket as a number
  - **Seat Info**: Seat information (e.g., "Section 102, Row A, Seats 5-6", "Floor GA", "Orchestra"), or empty string
- **Total Cost**: Total cost for all tickets as a number (default: 0 if not found)
- **Currency**: Currency code (e.g., "USD", "EUR", "GBP") or empty string
- **Booking Date**: Date when tickets were purchased (ISO format), or empty string if not found
- **Platform**: Ticketing platform used (e.g., "Ticketmaster", "Eventbrite", "StubHub", "AXS", "SeeTickets", "Direct"), or empty string
- **Event Type**: Type of event (e.g., "Concert", "Museum", "Theater", "Sports", "Tour", "Theme Park", "Attraction", "Comedy Show", "Opera", "Ballet"), or empty string
- **Special Instructions**: Special instructions, entry requirements, or notes (e.g., "Bring ID", "Print tickets required", "Mobile entry only", "No bags allowed"), or empty string

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
