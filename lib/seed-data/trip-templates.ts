/**
 * Trip Templates for Seed Data Generation
 * 
 * Defines the structure for 4 different trip sizes:
 * - Large (21 days): Complete European tour with all features
 * - Medium (10 days): Paris & Tuscany focused trip
 * - Small (5 days): Amsterdam long weekend
 * - Micro (2 days): Quick Paris visit
 */

import {
  CITIES,
  AIRPORTS,
  TRAIN_STATIONS,
  AMSTERDAM_HOTELS,
  AMSTERDAM_RESTAURANTS,
  AMSTERDAM_ACTIVITIES,
  PARIS_HOTELS,
  PARIS_RESTAURANTS,
  PARIS_ACTIVITIES,
  TUSCANY_HOTELS,
  TUSCANY_RESTAURANTS,
  TUSCANY_ACTIVITIES,
  type VenueLocation,
} from './venue-data';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ReservationStatus = 'Confirmed' | 'Pending' | 'Cancelled' | 'Waitlisted' | 'Completed';
export type SegmentType = 'Travel' | 'Stay' | 'Tour' | 'Retreat' | 'Road Trip';

export interface FlightReservation {
  type: 'Flight';
  airline: string;
  flightNumber: string;
  confirmationNumber: string;
  departureAirport: typeof AIRPORTS[keyof typeof AIRPORTS];
  arrivalAirport: typeof AIRPORTS[keyof typeof AIRPORTS];
  departureTime: string; // ISO time string
  arrivalTime: string; // ISO time string
  cost: number;
  currency: string;
  status: ReservationStatus;
  notes?: string;
}

export interface TrainReservation {
  type: 'Train';
  trainOperator: string;
  trainNumber?: string;
  confirmationNumber: string;
  departureStation: typeof TRAIN_STATIONS[keyof typeof TRAIN_STATIONS];
  arrivalStation: typeof TRAIN_STATIONS[keyof typeof TRAIN_STATIONS];
  departureTime: string;
  arrivalTime: string;
  cost: number;
  currency: string;
  status: ReservationStatus;
  notes?: string;
}

export interface HotelReservation {
  type: 'Hotel' | 'Resort' | 'Vacation Rental';
  venue: VenueLocation;
  confirmationNumber: string;
  checkInTime: string;
  checkOutTime: string;
  cost: number;
  currency: string;
  status: ReservationStatus;
  notes?: string;
  imageUrl?: string; // Direct image URL (overrides venue.imageUrl if set)
}

export interface RestaurantReservation {
  type: 'Restaurant' | 'Cafe' | 'Bar';
  venue: VenueLocation;
  confirmationNumber?: string;
  reservationTime: string;
  partySize: number;
  cost?: number;
  currency: string;
  status: ReservationStatus;
  notes?: string;
  imageUrl?: string; // Direct image URL (from Yelp, Google Places, etc.)
}

export interface ActivityReservation {
  type: 'Tour' | 'Museum' | 'Event Tickets' | 'Excursion' | 'Spa & Wellness' | 'Equipment Rental' | 'Hike';
  venue: VenueLocation;
  confirmationNumber?: string;
  startTime: string;
  endTime?: string;
  cost?: number;
  currency: string;
  status: ReservationStatus;
  notes?: string;
  imageUrl?: string; // Direct image URL (from Amadeus, Google Places, etc.)
}

export interface TransportReservation {
  type: 'Car Rental' | 'Private Driver' | 'Taxi' | 'Ride Share';
  vendor?: string;
  confirmationNumber?: string;
  pickupLocation: { name: string; lat: number; lng: number; timezone: string };
  dropoffLocation: { name: string; lat: number; lng: number; timezone: string };
  pickupTime: string;
  dropoffTime?: string;
  cost?: number;
  currency: string;
  status: ReservationStatus;
  notes?: string;
}

export type AnyReservation =
  | FlightReservation
  | TrainReservation
  | HotelReservation
  | RestaurantReservation
  | ActivityReservation
  | TransportReservation;

export interface SegmentTemplate {
  type: SegmentType;
  name: string;
  startLocation: typeof CITIES[keyof typeof CITIES];
  endLocation: typeof CITIES[keyof typeof CITIES];
  startTime: string;
  endTime: string;
  notes?: string;
  reservations: AnyReservation[];
}

export interface TripTemplate {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  segments: SegmentTemplate[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateConfirmationNumber(prefix: string = ''): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = prefix;
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function setTime(dateStr: string, hours: number, minutes: number = 0): string {
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

// ============================================================================
// LARGE TRIP (21 days): Grand European Tour
// ============================================================================

export const LARGE_TRIP: TripTemplate = {
  title: "Grand European Tour",
  description: "A luxurious 21-day journey through Amsterdam, Paris, and Tuscany, experiencing the finest hotels, Michelin-starred dining, world-class museums, and breathtaking countryside.",
  startDate: "2026-05-01T00:00:00.000Z",
  endDate: "2026-05-21T23:59:59.999Z",
  segments: [
    // Segment 1: SF to Amsterdam (Travel)
    {
      type: 'Travel',
      name: "Flight to Amsterdam",
      startLocation: CITIES.SAN_FRANCISCO,
      endLocation: CITIES.AMSTERDAM,
      startTime: "2026-05-01T17:30:00.000Z", // 5:30 PM departure
      endTime: "2026-05-02T13:00:00.000Z", // 1:00 PM arrival next day
      notes: "Direct overnight flight to Amsterdam",
      reservations: [
        {
          type: 'Flight',
          airline: 'United Airlines',
          flightNumber: 'UA 875',
          confirmationNumber: generateConfirmationNumber('UA'),
          departureAirport: AIRPORTS.SFO,
          arrivalAirport: AIRPORTS.AMS,
          departureTime: "2026-05-01T17:30:00.000Z",
          arrivalTime: "2026-05-02T13:00:00.000Z",
          cost: 3500,
          currency: 'USD',
          status: 'Confirmed',
          notes: 'Business class, seat 2A',
        },
        {
          type: 'Taxi',
          vendor: 'Uber',
          pickupLocation: {
            name: AIRPORTS.AMS.name,
            lat: AIRPORTS.AMS.lat,
            lng: AIRPORTS.AMS.lng,
            timezone: AIRPORTS.AMS.timezone,
          },
          dropoffLocation: {
            name: AMSTERDAM_HOTELS[0].name,
            lat: AMSTERDAM_HOTELS[0].lat,
            lng: AMSTERDAM_HOTELS[0].lng,
            timezone: AMSTERDAM_HOTELS[0].timezone,
          },
          pickupTime: "2026-05-02T13:30:00.000Z",
          cost: 45,
          currency: 'EUR',
          status: 'Confirmed',
        },
      ],
    },
    
    // Segment 2: Amsterdam Stay (6 days)
    {
      type: 'Stay',
      name: "Amsterdam Exploration",
      startLocation: CITIES.AMSTERDAM,
      endLocation: CITIES.AMSTERDAM,
      startTime: "2026-05-02T15:00:00.000Z",
      endTime: "2026-05-08T11:00:00.000Z",
      notes: "Exploring canals, museums, and Dutch culture",
      reservations: [
        // Hotel
        {
          type: 'Hotel',
          venue: AMSTERDAM_HOTELS[0], // Waldorf Astoria
          confirmationNumber: generateConfirmationNumber('WA'),
          checkInTime: "2026-05-02T15:00:00.000Z",
          checkOutTime: "2026-05-08T11:00:00.000Z",
          cost: 4200,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Canal view suite, 6 nights',
        },
        
        // Day 1 Evening - Arrival dinner
        {
          type: 'Restaurant',
          venue: AMSTERDAM_RESTAURANTS[4], // Café de Jaren
          reservationTime: "2026-05-02T19:00:00.000Z",
          partySize: 2,
          cost: 80,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Casual dinner after arrival',
        },
        
        // Day 2 - Museums and fine dining
        {
          type: 'Museum',
          venue: AMSTERDAM_ACTIVITIES[0], // Rijksmuseum
          startTime: "2026-05-03T10:00:00.000Z",
          endTime: "2026-05-03T13:00:00.000Z",
          cost: 22,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Pre-booked timed entry',
        },
        {
          type: 'Restaurant',
          venue: AMSTERDAM_RESTAURANTS[0], // Restaurant De Kas
          confirmationNumber: generateConfirmationNumber('DK'),
          reservationTime: "2026-05-03T19:30:00.000Z",
          partySize: 2,
          cost: 280,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Michelin-starred farm-to-table dining',
        },
        
        // Day 3 - Canal tour and dinner
        {
          type: 'Tour',
          venue: AMSTERDAM_ACTIVITIES[3], // Canal Cruise
          confirmationNumber: generateConfirmationNumber('CC'),
          startTime: "2026-05-04T14:00:00.000Z",
          endTime: "2026-05-04T15:30:00.000Z",
          cost: 35,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Private canal cruise',
        },
        {
          type: 'Restaurant',
          venue: AMSTERDAM_RESTAURANTS[1], // Ciel Bleu
          confirmationNumber: generateConfirmationNumber('CB'),
          reservationTime: "2026-05-04T20:00:00.000Z",
          partySize: 2,
          cost: 350,
          currency: 'EUR',
          status: 'Confirmed',
          notes: '2 Michelin stars, 23rd floor views',
        },
        
        // Day 4 - Anne Frank House and casual dining
        {
          type: 'Museum',
          venue: AMSTERDAM_ACTIVITIES[2], // Anne Frank House
          confirmationNumber: generateConfirmationNumber('AF'),
          startTime: "2026-05-05T10:30:00.000Z",
          endTime: "2026-05-05T12:00:00.000Z",
          cost: 14,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Timed entry required',
        },
        {
          type: 'Cafe',
          venue: AMSTERDAM_RESTAURANTS[5], // Pllek
          reservationTime: "2026-05-05T13:00:00.000Z",
          partySize: 2,
          cost: 45,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Waterfront lunch',
        },
        {
          type: 'Restaurant',
          venue: AMSTERDAM_RESTAURANTS[2], // The Duchess
          confirmationNumber: generateConfirmationNumber('TD'),
          reservationTime: "2026-05-05T19:00:00.000Z",
          partySize: 2,
          cost: 180,
          currency: 'EUR',
          status: 'Confirmed',
        },
        
        // Day 5 - Van Gogh Museum and fine dining
        {
          type: 'Museum',
          venue: AMSTERDAM_ACTIVITIES[1], // Van Gogh Museum
          confirmationNumber: generateConfirmationNumber('VG'),
          startTime: "2026-05-06T11:00:00.000Z",
          endTime: "2026-05-06T13:30:00.000Z",
          cost: 20,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: AMSTERDAM_RESTAURANTS[3], // Bord'Eau
          confirmationNumber: generateConfirmationNumber('BE'),
          reservationTime: "2026-05-06T20:00:00.000Z",
          partySize: 2,
          cost: 320,
          currency: 'EUR',
          status: 'Confirmed',
          notes: '2 Michelin stars at Waldorf Astoria',
        },
        
        // Day 6 - Vondelpark picnic and casual dinner
        {
          type: 'Hike',
          venue: AMSTERDAM_ACTIVITIES[4], // Vondelpark
          startTime: "2026-05-07T10:00:00.000Z",
          endTime: "2026-05-07T12:00:00.000Z",
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Morning walk and picnic in the park',
        },
        {
          type: 'Cafe',
          venue: AMSTERDAM_RESTAURANTS[4], // Café de Jaren
          reservationTime: "2026-05-07T18:30:00.000Z",
          partySize: 2,
          cost: 75,
          currency: 'EUR',
          status: 'Confirmed',
        },
      ],
    },
    
    // Segment 3: Amsterdam to Paris (Travel - Train)
    {
      type: 'Travel',
      name: "Thalys to Paris",
      startLocation: CITIES.AMSTERDAM,
      endLocation: CITIES.PARIS,
      startTime: "2026-05-08T12:25:00.000Z",
      endTime: "2026-05-08T15:45:00.000Z",
      notes: "High-speed train through Belgium",
      reservations: [
        {
          type: 'Taxi',
          vendor: 'Uber',
          pickupLocation: {
            name: AMSTERDAM_HOTELS[0].name,
            lat: AMSTERDAM_HOTELS[0].lat,
            lng: AMSTERDAM_HOTELS[0].lng,
            timezone: AMSTERDAM_HOTELS[0].timezone,
          },
          dropoffLocation: {
            name: TRAIN_STATIONS.AMSTERDAM_CENTRAAL.name,
            lat: TRAIN_STATIONS.AMSTERDAM_CENTRAAL.lat,
            lng: TRAIN_STATIONS.AMSTERDAM_CENTRAAL.lng,
            timezone: TRAIN_STATIONS.AMSTERDAM_CENTRAAL.timezone,
          },
          pickupTime: "2026-05-08T11:30:00.000Z",
          cost: 25,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Train',
          trainOperator: 'Thalys',
          trainNumber: 'THA 9342',
          confirmationNumber: generateConfirmationNumber('TH'),
          departureStation: TRAIN_STATIONS.AMSTERDAM_CENTRAAL,
          arrivalStation: TRAIN_STATIONS.PARIS_GARE_DU_NORD,
          departureTime: "2026-05-08T12:25:00.000Z",
          arrivalTime: "2026-05-08T15:45:00.000Z",
          cost: 180,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'First class, seats 11 & 12',
        },
        {
          type: 'Private Driver',
          vendor: 'Blacklane',
          confirmationNumber: generateConfirmationNumber('BL'),
          pickupLocation: {
            name: TRAIN_STATIONS.PARIS_GARE_DU_NORD.name,
            lat: TRAIN_STATIONS.PARIS_GARE_DU_NORD.lat,
            lng: TRAIN_STATIONS.PARIS_GARE_DU_NORD.lng,
            timezone: TRAIN_STATIONS.PARIS_GARE_DU_NORD.timezone,
          },
          dropoffLocation: {
            name: PARIS_HOTELS[0].name,
            lat: PARIS_HOTELS[0].lat,
            lng: PARIS_HOTELS[0].lng,
            timezone: PARIS_HOTELS[0].timezone,
          },
          pickupTime: "2026-05-08T16:00:00.000Z",
          cost: 85,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Mercedes S-Class',
        },
      ],
    },
    
    // Segment 4: Paris Tour (7 days)
    {
      type: 'Tour',
      name: "Paris Cultural Immersion",
      startLocation: CITIES.PARIS,
      endLocation: CITIES.PARIS,
      startTime: "2026-05-08T17:00:00.000Z",
      endTime: "2026-05-15T11:00:00.000Z",
      notes: "Art, architecture, and gastronomy in the City of Light",
      reservations: [
        // Hotel
        {
          type: 'Hotel',
          venue: PARIS_HOTELS[0], // Le Bristol Paris
          confirmationNumber: generateConfirmationNumber('LB'),
          checkInTime: "2026-05-08T17:00:00.000Z",
          checkOutTime: "2026-05-15T11:00:00.000Z",
          cost: 6300,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Deluxe suite, 7 nights',
        },
        
        // Day 1 Evening - Arrival dinner
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[5], // Café de Flore
          reservationTime: "2026-05-08T20:00:00.000Z",
          partySize: 2,
          cost: 90,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Historic café, light dinner',
        },
        
        // Day 2 - Louvre and fine dining
        {
          type: 'Cafe',
          venue: PARIS_RESTAURANTS[5], // Café de Flore
          reservationTime: "2026-05-09T09:00:00.000Z",
          partySize: 2,
          cost: 35,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Breakfast',
        },
        {
          type: 'Museum',
          venue: PARIS_ACTIVITIES[0], // Louvre
          confirmationNumber: generateConfirmationNumber('LV'),
          startTime: "2026-05-09T10:30:00.000Z",
          endTime: "2026-05-09T14:00:00.000Z",
          cost: 17,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Timed entry, guided tour',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[3], // Le Cinq
          confirmationNumber: generateConfirmationNumber('LC'),
          reservationTime: "2026-05-09T20:00:00.000Z",
          partySize: 2,
          cost: 450,
          currency: 'EUR',
          status: 'Confirmed',
          notes: '3 Michelin stars at Four Seasons',
        },
        
        // Day 3 - Musée d'Orsay and Eiffel Tower dinner
        {
          type: 'Museum',
          venue: PARIS_ACTIVITIES[1], // Musée d'Orsay
          confirmationNumber: generateConfirmationNumber('MO'),
          startTime: "2026-05-10T11:00:00.000Z",
          endTime: "2026-05-10T14:00:00.000Z",
          cost: 16,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[0], // Le Jules Verne
          confirmationNumber: generateConfirmationNumber('JV'),
          reservationTime: "2026-05-10T20:30:00.000Z",
          partySize: 2,
          cost: 420,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Michelin star, Eiffel Tower 2nd floor',
        },
        
        // Day 4 - Versailles day trip
        {
          type: 'Private Driver',
          vendor: 'Blacklane',
          confirmationNumber: generateConfirmationNumber('BL'),
          pickupLocation: {
            name: PARIS_HOTELS[0].name,
            lat: PARIS_HOTELS[0].lat,
            lng: PARIS_HOTELS[0].lng,
            timezone: PARIS_HOTELS[0].timezone,
          },
          dropoffLocation: {
            name: PARIS_ACTIVITIES[3].name,
            lat: PARIS_ACTIVITIES[3].lat,
            lng: PARIS_ACTIVITIES[3].lng,
            timezone: PARIS_ACTIVITIES[3].timezone,
          },
          pickupTime: "2026-05-11T09:00:00.000Z",
          dropoffTime: "2026-05-11T17:00:00.000Z",
          cost: 250,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Full day with driver, round trip',
        },
        {
          type: 'Tour',
          venue: PARIS_ACTIVITIES[3], // Versailles
          confirmationNumber: generateConfirmationNumber('VS'),
          startTime: "2026-05-11T10:00:00.000Z",
          endTime: "2026-05-11T16:00:00.000Z",
          cost: 75,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Palace and gardens tour',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[6], // Bouillon Chartier
          reservationTime: "2026-05-11T19:30:00.000Z",
          partySize: 2,
          cost: 65,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Historic brasserie',
        },
        
        // Day 5 - Sainte-Chapelle and L'Astrance
        {
          type: 'Museum',
          venue: PARIS_ACTIVITIES[4], // Sainte-Chapelle
          confirmationNumber: generateConfirmationNumber('SC'),
          startTime: "2026-05-12T11:00:00.000Z",
          endTime: "2026-05-12T12:00:00.000Z",
          cost: 11,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[1], // L'Astrance
          confirmationNumber: generateConfirmationNumber('LA'),
          reservationTime: "2026-05-12T20:00:00.000Z",
          partySize: 2,
          cost: 380,
          currency: 'EUR',
          status: 'Waitlisted',
          notes: '3 Michelin stars - on waitlist',
        },
        
        // Day 6 - Luxembourg Gardens and Septime
        {
          type: 'Hike',
          venue: PARIS_ACTIVITIES[5], // Jardin du Luxembourg
          startTime: "2026-05-13T10:00:00.000Z",
          endTime: "2026-05-13T12:00:00.000Z",
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Morning stroll in gardens',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[2], // Septime
          confirmationNumber: generateConfirmationNumber('SP'),
          reservationTime: "2026-05-13T19:30:00.000Z",
          partySize: 2,
          cost: 180,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Contemporary French cuisine',
        },
        
        // Day 7 - Eiffel Tower visit and Arpège
        {
          type: 'Tour',
          venue: PARIS_ACTIVITIES[2], // Eiffel Tower
          confirmationNumber: generateConfirmationNumber('ET'),
          startTime: "2026-05-14T15:00:00.000Z",
          endTime: "2026-05-14T17:00:00.000Z",
          cost: 28,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Summit access',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[4], // Arpège
          confirmationNumber: generateConfirmationNumber('AR'),
          reservationTime: "2026-05-14T20:00:00.000Z",
          partySize: 2,
          cost: 420,
          currency: 'EUR',
          status: 'Confirmed',
          notes: '3 Michelin stars, vegetable-focused',
        },
      ],
    },
    
    // Segment 5: Tuscany Retreat (6 days)
    {
      type: 'Retreat',
      name: "Tuscan Countryside",
      startLocation: CITIES.PARIS,
      endLocation: CITIES.TUSCANY,
      startTime: "2026-05-15T11:00:00.000Z",
      endTime: "2026-05-21T10:00:00.000Z",
      notes: "Wine country, hilltop towns, and Renaissance art",
      reservations: [
        // Car rental for Tuscany
        {
          type: 'Car Rental',
          vendor: 'Hertz',
          confirmationNumber: generateConfirmationNumber('HZ'),
          pickupLocation: {
            name: AIRPORTS.CDG.name,
            lat: AIRPORTS.CDG.lat,
            lng: AIRPORTS.CDG.lng,
            timezone: AIRPORTS.CDG.timezone,
          },
          dropoffLocation: {
            name: AIRPORTS.FLR.name,
            lat: AIRPORTS.FLR.lat,
            lng: AIRPORTS.FLR.lng,
            timezone: AIRPORTS.FLR.timezone,
          },
          pickupTime: "2026-05-15T14:00:00.000Z",
          dropoffTime: "2026-05-21T09:00:00.000Z",
          cost: 450,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Mercedes E-Class, 6 days',
        },
        
        // Flight Paris to Florence
        {
          type: 'Private Driver',
          vendor: 'Blacklane',
          pickupLocation: {
            name: PARIS_HOTELS[0].name,
            lat: PARIS_HOTELS[0].lat,
            lng: PARIS_HOTELS[0].lng,
            timezone: PARIS_HOTELS[0].timezone,
          },
          dropoffLocation: {
            name: AIRPORTS.CDG.name,
            lat: AIRPORTS.CDG.lat,
            lng: AIRPORTS.CDG.lng,
            timezone: AIRPORTS.CDG.timezone,
          },
          pickupTime: "2026-05-15T11:00:00.000Z",
          cost: 95,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Flight',
          airline: 'Air France',
          flightNumber: 'AF 1466',
          confirmationNumber: generateConfirmationNumber('AF'),
          departureAirport: AIRPORTS.CDG,
          arrivalAirport: AIRPORTS.FLR,
          departureTime: "2026-05-15T13:30:00.000Z",
          arrivalTime: "2026-05-15T15:15:00.000Z",
          cost: 280,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Business class',
        },
        
        // Hotels - Split stay
        {
          type: 'Hotel',
          venue: TUSCANY_HOTELS[3], // Four Seasons Florence
          confirmationNumber: generateConfirmationNumber('FS'),
          checkInTime: "2026-05-15T17:00:00.000Z",
          checkOutTime: "2026-05-17T11:00:00.000Z",
          cost: 1800,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Garden suite, 2 nights',
        },
        {
          type: 'Resort',
          venue: TUSCANY_HOTELS[0], // Castello di Casole
          confirmationNumber: generateConfirmationNumber('CC'),
          checkInTime: "2026-05-17T15:00:00.000Z",
          checkOutTime: "2026-05-21T10:00:00.000Z",
          cost: 3600,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Villa suite, 4 nights',
        },
        
        // Day 1 - Arrival Florence
        {
          type: 'Restaurant',
          venue: TUSCANY_RESTAURANTS[3], // Trattoria Mario
          reservationTime: "2026-05-15T19:00:00.000Z",
          partySize: 2,
          cost: 60,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Traditional Tuscan dinner',
        },
        
        // Day 2 - Uffizi and fine dining
        {
          type: 'Museum',
          venue: TUSCANY_ACTIVITIES[0], // Uffizi
          confirmationNumber: generateConfirmationNumber('UF'),
          startTime: "2026-05-16T10:00:00.000Z",
          endTime: "2026-05-16T13:00:00.000Z",
          cost: 20,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: TUSCANY_RESTAURANTS[1], // Enoteca Pinchiorri
          confirmationNumber: generateConfirmationNumber('EP'),
          reservationTime: "2026-05-16T20:00:00.000Z",
          partySize: 2,
          cost: 480,
          currency: 'EUR',
          status: 'Confirmed',
          notes: '3 Michelin stars',
        },
        
        // Day 3 - Drive to Castello, Accademia
        {
          type: 'Museum',
          venue: TUSCANY_ACTIVITIES[3], // Accademia
          startTime: "2026-05-17T09:00:00.000Z",
          endTime: "2026-05-17T10:30:00.000Z",
          cost: 12,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'David sculpture',
        },
        {
          type: 'Restaurant',
          venue: TUSCANY_RESTAURANTS[2], // La Bottega del Buon Caffè
          confirmationNumber: generateConfirmationNumber('BB'),
          reservationTime: "2026-05-17T13:00:00.000Z",
          partySize: 2,
          cost: 180,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Lunch before drive to countryside',
        },
        
        // Day 4 - Chianti wine tour
        {
          type: 'Tour',
          venue: TUSCANY_ACTIVITIES[1], // Chianti
          confirmationNumber: generateConfirmationNumber('CT'),
          startTime: "2026-05-18T10:00:00.000Z",
          endTime: "2026-05-18T17:00:00.000Z",
          cost: 250,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Private wine tour, 3 wineries',
        },
        
        // Day 5 - Siena day trip
        {
          type: 'Tour',
          venue: TUSCANY_ACTIVITIES[2], // Siena Cathedral
          startTime: "2026-05-19T10:00:00.000Z",
          endTime: "2026-05-19T16:00:00.000Z",
          cost: 15,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Day trip to Siena',
        },
        {
          type: 'Restaurant',
          venue: TUSCANY_RESTAURANTS[4], // Il Canto
          confirmationNumber: generateConfirmationNumber('IC'),
          reservationTime: "2026-05-19T13:00:00.000Z",
          partySize: 2,
          cost: 120,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Lunch in Siena',
        },
        
        // Day 6 - Spa and cooking class
        {
          type: 'Spa & Wellness',
          venue: TUSCANY_HOTELS[0], // Castello di Casole spa
          confirmationNumber: generateConfirmationNumber('SP'),
          startTime: "2026-05-20T10:00:00.000Z",
          endTime: "2026-05-20T12:00:00.000Z",
          cost: 280,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Couples massage',
        },
        {
          type: 'Tour',
          venue: TUSCANY_HOTELS[0], // Cooking class at hotel
          confirmationNumber: generateConfirmationNumber('CK'),
          startTime: "2026-05-20T16:00:00.000Z",
          endTime: "2026-05-20T19:00:00.000Z",
          cost: 180,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Tuscan cooking class',
        },
        
        // Day 7 - Val d'Orcia scenic drive
        {
          type: 'Excursion',
          venue: TUSCANY_ACTIVITIES[5], // Val d'Orcia
          startTime: "2026-05-21T08:00:00.000Z",
          endTime: "2026-05-21T09:30:00.000Z",
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Morning scenic drive before departure',
        },
      ],
    },
    
    // Segment 6: Return to SF
    {
      type: 'Travel',
      name: "Return to San Francisco",
      startLocation: CITIES.FLORENCE,
      endLocation: CITIES.SAN_FRANCISCO,
      startTime: "2026-05-21T10:00:00.000Z",
      endTime: "2026-05-21T17:30:00.000Z",
      notes: "Flight home via connection",
      reservations: [
        {
          type: 'Flight',
          airline: 'United Airlines',
          flightNumber: 'UA 507',
          confirmationNumber: generateConfirmationNumber('UA'),
          departureAirport: AIRPORTS.FLR,
          arrivalAirport: AIRPORTS.SFO,
          departureTime: "2026-05-21T10:00:00.000Z",
          arrivalTime: "2026-05-21T17:30:00.000Z",
          cost: 2800,
          currency: 'USD',
          status: 'Confirmed',
          notes: 'Business class, via Munich connection',
        },
      ],
    },
  ],
};

// ============================================================================
// MEDIUM TRIP (10 days): Paris & Tuscany Escape
// ============================================================================

export const MEDIUM_TRIP: TripTemplate = {
  title: "Paris & Tuscany Escape",
  description: "A 10-day journey combining Parisian elegance with Tuscan countryside charm, featuring luxury hotels, fine dining, and cultural highlights.",
  startDate: "2026-05-05T00:00:00.000Z",
  endDate: "2026-05-14T23:59:59.999Z",
  segments: [
    // Segment 1: SF to Paris
    {
      type: 'Travel',
      name: "Flight to Paris",
      startLocation: CITIES.SAN_FRANCISCO,
      endLocation: CITIES.PARIS,
      startTime: "2026-05-05T18:00:00.000Z",
      endTime: "2026-05-06T13:30:00.000Z",
      reservations: [
        {
          type: 'Flight',
          airline: 'Air France',
          flightNumber: 'AF 83',
          confirmationNumber: generateConfirmationNumber('AF'),
          departureAirport: AIRPORTS.SFO,
          arrivalAirport: AIRPORTS.CDG,
          departureTime: "2026-05-05T18:00:00.000Z",
          arrivalTime: "2026-05-06T13:30:00.000Z",
          cost: 3200,
          currency: 'USD',
          status: 'Confirmed',
          notes: 'Business class',
        },
        {
          type: 'Taxi',
          vendor: 'G7 Taxi',
          pickupLocation: {
            name: AIRPORTS.CDG.name,
            lat: AIRPORTS.CDG.lat,
            lng: AIRPORTS.CDG.lng,
            timezone: AIRPORTS.CDG.timezone,
          },
          dropoffLocation: {
            name: PARIS_HOTELS[1].name,
            lat: PARIS_HOTELS[1].lat,
            lng: PARIS_HOTELS[1].lng,
            timezone: PARIS_HOTELS[1].timezone,
          },
          pickupTime: "2026-05-06T14:30:00.000Z",
          cost: 65,
          currency: 'EUR',
          status: 'Confirmed',
        },
      ],
    },
    
    // Segment 2: Paris Stay
    {
      type: 'Stay',
      name: "Paris Experience",
      startLocation: CITIES.PARIS,
      endLocation: CITIES.PARIS,
      startTime: "2026-05-06T16:00:00.000Z",
      endTime: "2026-05-11T11:00:00.000Z",
      reservations: [
        {
          type: 'Hotel',
          venue: PARIS_HOTELS[1], // Plaza Athénée
          confirmationNumber: generateConfirmationNumber('PA'),
          checkInTime: "2026-05-06T16:00:00.000Z",
          checkOutTime: "2026-05-11T11:00:00.000Z",
          cost: 4500,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Deluxe room, 5 nights',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[5], // Café de Flore
          reservationTime: "2026-05-06T20:00:00.000Z",
          partySize: 2,
          cost: 85,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Museum',
          venue: PARIS_ACTIVITIES[0], // Louvre
          confirmationNumber: generateConfirmationNumber('LV'),
          startTime: "2026-05-07T10:00:00.000Z",
          endTime: "2026-05-07T13:00:00.000Z",
          cost: 17,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[0], // Le Jules Verne
          confirmationNumber: generateConfirmationNumber('JV'),
          reservationTime: "2026-05-07T20:00:00.000Z",
          partySize: 2,
          cost: 420,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Museum',
          venue: PARIS_ACTIVITIES[1], // Musée d'Orsay
          startTime: "2026-05-08T11:00:00.000Z",
          endTime: "2026-05-08T14:00:00.000Z",
          cost: 16,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[2], // Septime
          confirmationNumber: generateConfirmationNumber('SP'),
          reservationTime: "2026-05-08T19:30:00.000Z",
          partySize: 2,
          cost: 180,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Tour',
          venue: PARIS_ACTIVITIES[3], // Versailles
          confirmationNumber: generateConfirmationNumber('VS'),
          startTime: "2026-05-09T10:00:00.000Z",
          endTime: "2026-05-09T16:00:00.000Z",
          cost: 75,
          currency: 'EUR',
          status: 'Pending',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[4], // Arpège
          confirmationNumber: generateConfirmationNumber('AR'),
          reservationTime: "2026-05-10T20:00:00.000Z",
          partySize: 2,
          cost: 420,
          currency: 'EUR',
          status: 'Confirmed',
        },
      ],
    },
    
    // Segment 3: Road Trip to Tuscany
    {
      type: 'Road Trip',
      name: "Drive to Tuscany",
      startLocation: CITIES.PARIS,
      endLocation: CITIES.TUSCANY,
      startTime: "2026-05-11T11:00:00.000Z",
      endTime: "2026-05-11T15:00:00.000Z",
      reservations: [
        {
          type: 'Private Driver',
          vendor: 'Blacklane',
          pickupLocation: {
            name: PARIS_HOTELS[1].name,
            lat: PARIS_HOTELS[1].lat,
            lng: PARIS_HOTELS[1].lng,
            timezone: PARIS_HOTELS[1].timezone,
          },
          dropoffLocation: {
            name: AIRPORTS.CDG.name,
            lat: AIRPORTS.CDG.lat,
            lng: AIRPORTS.CDG.lng,
            timezone: AIRPORTS.CDG.timezone,
          },
          pickupTime: "2026-05-11T11:00:00.000Z",
          cost: 95,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Flight',
          airline: 'Air France',
          flightNumber: 'AF 1466',
          confirmationNumber: generateConfirmationNumber('AF'),
          departureAirport: AIRPORTS.CDG,
          arrivalAirport: AIRPORTS.FLR,
          departureTime: "2026-05-11T13:30:00.000Z",
          arrivalTime: "2026-05-11T15:15:00.000Z",
          cost: 280,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Car Rental',
          vendor: 'Hertz',
          confirmationNumber: generateConfirmationNumber('HZ'),
          pickupLocation: {
            name: AIRPORTS.FLR.name,
            lat: AIRPORTS.FLR.lat,
            lng: AIRPORTS.FLR.lng,
            timezone: AIRPORTS.FLR.timezone,
          },
          dropoffLocation: {
            name: AIRPORTS.FLR.name,
            lat: AIRPORTS.FLR.lat,
            lng: AIRPORTS.FLR.lng,
            timezone: AIRPORTS.FLR.timezone,
          },
          pickupTime: "2026-05-11T15:30:00.000Z",
          dropoffTime: "2026-05-14T09:00:00.000Z",
          cost: 280,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'BMW 5 Series',
        },
      ],
    },
    
    // Segment 4: Tuscany Retreat
    {
      type: 'Retreat',
      name: "Tuscan Countryside",
      startLocation: CITIES.TUSCANY,
      endLocation: CITIES.TUSCANY,
      startTime: "2026-05-11T17:00:00.000Z",
      endTime: "2026-05-14T10:00:00.000Z",
      reservations: [
        {
          type: 'Resort',
          venue: TUSCANY_HOTELS[1], // Rosewood Castiglion del Bosco
          confirmationNumber: generateConfirmationNumber('RW'),
          checkInTime: "2026-05-11T17:00:00.000Z",
          checkOutTime: "2026-05-14T10:00:00.000Z",
          cost: 2700,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Suite, 3 nights',
        },
        {
          type: 'Museum',
          venue: TUSCANY_ACTIVITIES[0], // Uffizi
          confirmationNumber: generateConfirmationNumber('UF'),
          startTime: "2026-05-12T10:00:00.000Z",
          endTime: "2026-05-12T13:00:00.000Z",
          cost: 20,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: TUSCANY_RESTAURANTS[2], // La Bottega
          confirmationNumber: generateConfirmationNumber('BB'),
          reservationTime: "2026-05-12T19:30:00.000Z",
          partySize: 2,
          cost: 180,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Tour',
          venue: TUSCANY_ACTIVITIES[1], // Chianti wine tour
          confirmationNumber: generateConfirmationNumber('CT'),
          startTime: "2026-05-13T10:00:00.000Z",
          endTime: "2026-05-13T17:00:00.000Z",
          cost: 250,
          currency: 'EUR',
          status: 'Confirmed',
        },
      ],
    },
    
    // Segment 5: Return home
    {
      type: 'Travel',
      name: "Return to San Francisco",
      startLocation: CITIES.FLORENCE,
      endLocation: CITIES.SAN_FRANCISCO,
      startTime: "2026-05-14T10:00:00.000Z",
      endTime: "2026-05-14T17:30:00.000Z",
      reservations: [
        {
          type: 'Flight',
          airline: 'United Airlines',
          flightNumber: 'UA 507',
          confirmationNumber: generateConfirmationNumber('UA'),
          departureAirport: AIRPORTS.FLR,
          arrivalAirport: AIRPORTS.SFO,
          departureTime: "2026-05-14T10:00:00.000Z",
          arrivalTime: "2026-05-14T17:30:00.000Z",
          cost: 2800,
          currency: 'USD',
          status: 'Confirmed',
        },
      ],
    },
  ],
};

// ============================================================================
// SMALL TRIP (5 days): Amsterdam Long Weekend
// ============================================================================

export const SMALL_TRIP: TripTemplate = {
  title: "Amsterdam Long Weekend",
  description: "A 5-day escape to Amsterdam exploring canals, museums, and Dutch culture.",
  startDate: "2026-05-10T00:00:00.000Z",
  endDate: "2026-05-14T23:59:59.999Z",
  segments: [
    {
      type: 'Travel',
      name: "Flight to Amsterdam",
      startLocation: CITIES.SAN_FRANCISCO,
      endLocation: CITIES.AMSTERDAM,
      startTime: "2026-05-10T17:30:00.000Z",
      endTime: "2026-05-11T13:00:00.000Z",
      reservations: [
        {
          type: 'Flight',
          airline: 'KLM',
          flightNumber: 'KL 606',
          confirmationNumber: generateConfirmationNumber('KL'),
          departureAirport: AIRPORTS.SFO,
          arrivalAirport: AIRPORTS.AMS,
          departureTime: "2026-05-10T17:30:00.000Z",
          arrivalTime: "2026-05-11T13:00:00.000Z",
          cost: 2800,
          currency: 'USD',
          status: 'Confirmed',
        },
        {
          type: 'Taxi',
          vendor: 'Uber',
          pickupLocation: {
            name: AIRPORTS.AMS.name,
            lat: AIRPORTS.AMS.lat,
            lng: AIRPORTS.AMS.lng,
            timezone: AIRPORTS.AMS.timezone,
          },
          dropoffLocation: {
            name: AMSTERDAM_HOTELS[2].name,
            lat: AMSTERDAM_HOTELS[2].lat,
            lng: AMSTERDAM_HOTELS[2].lng,
            timezone: AMSTERDAM_HOTELS[2].timezone,
          },
          pickupTime: "2026-05-11T13:30:00.000Z",
          cost: 45,
          currency: 'EUR',
          status: 'Confirmed',
        },
      ],
    },
    {
      type: 'Stay',
      name: "Amsterdam Stay",
      startLocation: CITIES.AMSTERDAM,
      endLocation: CITIES.AMSTERDAM,
      startTime: "2026-05-11T15:00:00.000Z",
      endTime: "2026-05-14T11:00:00.000Z",
      reservations: [
        {
          type: 'Hotel',
          venue: AMSTERDAM_HOTELS[2], // The Hoxton
          confirmationNumber: generateConfirmationNumber('HX'),
          checkInTime: "2026-05-11T15:00:00.000Z",
          checkOutTime: "2026-05-14T11:00:00.000Z",
          cost: 1050,
          currency: 'EUR',
          status: 'Confirmed',
          notes: '3 nights',
        },
        {
          type: 'Restaurant',
          venue: AMSTERDAM_RESTAURANTS[4], // Café de Jaren
          reservationTime: "2026-05-11T19:00:00.000Z",
          partySize: 2,
          cost: 75,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Museum',
          venue: AMSTERDAM_ACTIVITIES[0], // Rijksmuseum
          startTime: "2026-05-12T10:00:00.000Z",
          endTime: "2026-05-12T13:00:00.000Z",
          cost: 22,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: AMSTERDAM_RESTAURANTS[0], // De Kas
          confirmationNumber: generateConfirmationNumber('DK'),
          reservationTime: "2026-05-12T19:30:00.000Z",
          partySize: 2,
          cost: 280,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Tour',
          venue: AMSTERDAM_ACTIVITIES[3], // Canal cruise
          startTime: "2026-05-13T14:00:00.000Z",
          endTime: "2026-05-13T15:30:00.000Z",
          cost: 35,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Equipment Rental',
          venue: AMSTERDAM_ACTIVITIES[4], // Vondelpark (bike rental)
          startTime: "2026-05-13T10:00:00.000Z",
          endTime: "2026-05-13T13:00:00.000Z",
          cost: 15,
          currency: 'EUR',
          status: 'Pending',
          notes: 'Bike rental for park exploration',
        },
        {
          type: 'Restaurant',
          venue: AMSTERDAM_RESTAURANTS[2], // The Duchess
          confirmationNumber: generateConfirmationNumber('TD'),
          reservationTime: "2026-05-13T19:00:00.000Z",
          partySize: 2,
          cost: 180,
          currency: 'EUR',
          status: 'Confirmed',
        },
      ],
    },
    {
      type: 'Travel',
      name: "Return to San Francisco",
      startLocation: CITIES.AMSTERDAM,
      endLocation: CITIES.SAN_FRANCISCO,
      startTime: "2026-05-14T10:30:00.000Z",
      endTime: "2026-05-14T13:00:00.000Z",
      reservations: [
        {
          type: 'Taxi',
          vendor: 'Uber',
          pickupLocation: {
            name: AMSTERDAM_HOTELS[2].name,
            lat: AMSTERDAM_HOTELS[2].lat,
            lng: AMSTERDAM_HOTELS[2].lng,
            timezone: AMSTERDAM_HOTELS[2].timezone,
          },
          dropoffLocation: {
            name: AIRPORTS.AMS.name,
            lat: AIRPORTS.AMS.lat,
            lng: AIRPORTS.AMS.lng,
            timezone: AIRPORTS.AMS.timezone,
          },
          pickupTime: "2026-05-14T08:00:00.000Z",
          cost: 45,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Flight',
          airline: 'KLM',
          flightNumber: 'KL 605',
          confirmationNumber: generateConfirmationNumber('KL'),
          departureAirport: AIRPORTS.AMS,
          arrivalAirport: AIRPORTS.SFO,
          departureTime: "2026-05-14T10:30:00.000Z",
          arrivalTime: "2026-05-14T13:00:00.000Z",
          cost: 2800,
          currency: 'USD',
          status: 'Confirmed',
        },
      ],
    },
  ],
};

// ============================================================================
// MICRO TRIP (2 days): Paris Quick Visit
// ============================================================================

export const MICRO_TRIP: TripTemplate = {
  title: "Paris Quick Visit",
  description: "A whirlwind 2-day trip to Paris hitting the essential highlights.",
  startDate: "2026-05-15T00:00:00.000Z",
  endDate: "2026-05-16T23:59:59.999Z",
  segments: [
    {
      type: 'Travel',
      name: "Flight to Paris",
      startLocation: CITIES.SAN_FRANCISCO,
      endLocation: CITIES.PARIS,
      startTime: "2026-05-15T18:00:00.000Z",
      endTime: "2026-05-16T13:30:00.000Z",
      reservations: [
        {
          type: 'Flight',
          airline: 'Air France',
          flightNumber: 'AF 83',
          confirmationNumber: generateConfirmationNumber('AF'),
          departureAirport: AIRPORTS.SFO,
          arrivalAirport: AIRPORTS.CDG,
          departureTime: "2026-05-15T18:00:00.000Z",
          arrivalTime: "2026-05-16T13:30:00.000Z",
          cost: 2400,
          currency: 'USD',
          status: 'Confirmed',
        },
        {
          type: 'Taxi',
          vendor: 'G7',
          pickupLocation: {
            name: AIRPORTS.CDG.name,
            lat: AIRPORTS.CDG.lat,
            lng: AIRPORTS.CDG.lng,
            timezone: AIRPORTS.CDG.timezone,
          },
          dropoffLocation: {
            name: PARIS_HOTELS[3].name,
            lat: PARIS_HOTELS[3].lat,
            lng: PARIS_HOTELS[3].lng,
            timezone: PARIS_HOTELS[3].timezone,
          },
          pickupTime: "2026-05-16T14:30:00.000Z",
          cost: 65,
          currency: 'EUR',
          status: 'Confirmed',
        },
      ],
    },
    {
      type: 'Stay',
      name: "Paris Highlights",
      startLocation: CITIES.PARIS,
      endLocation: CITIES.PARIS,
      startTime: "2026-05-16T16:00:00.000Z",
      endTime: "2026-05-17T11:00:00.000Z",
      reservations: [
        {
          type: 'Hotel',
          venue: PARIS_HOTELS[3], // Hôtel de Crillon
          confirmationNumber: generateConfirmationNumber('HC'),
          checkInTime: "2026-05-16T16:00:00.000Z",
          checkOutTime: "2026-05-17T11:00:00.000Z",
          cost: 950,
          currency: 'EUR',
          status: 'Confirmed',
          notes: '1 night',
        },
        {
          type: 'Tour',
          venue: PARIS_ACTIVITIES[2], // Eiffel Tower
          startTime: "2026-05-16T17:30:00.000Z",
          endTime: "2026-05-16T19:00:00.000Z",
          cost: 28,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Restaurant',
          venue: PARIS_RESTAURANTS[5], // Café de Flore
          reservationTime: "2026-05-16T20:00:00.000Z",
          partySize: 2,
          cost: 90,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Museum',
          venue: PARIS_ACTIVITIES[0], // Louvre
          startTime: "2026-05-17T09:00:00.000Z",
          endTime: "2026-05-17T11:00:00.000Z",
          cost: 17,
          currency: 'EUR',
          status: 'Confirmed',
          notes: 'Quick morning visit before checkout',
        },
      ],
    },
    {
      type: 'Travel',
      name: "Return to San Francisco",
      startLocation: CITIES.PARIS,
      endLocation: CITIES.SAN_FRANCISCO,
      startTime: "2026-05-17T13:00:00.000Z",
      endTime: "2026-05-17T16:00:00.000Z",
      reservations: [
        {
          type: 'Taxi',
          vendor: 'G7',
          pickupLocation: {
            name: PARIS_HOTELS[3].name,
            lat: PARIS_HOTELS[3].lat,
            lng: PARIS_HOTELS[3].lng,
            timezone: PARIS_HOTELS[3].timezone,
          },
          dropoffLocation: {
            name: AIRPORTS.CDG.name,
            lat: AIRPORTS.CDG.lat,
            lng: AIRPORTS.CDG.lng,
            timezone: AIRPORTS.CDG.timezone,
          },
          pickupTime: "2026-05-17T11:30:00.000Z",
          cost: 65,
          currency: 'EUR',
          status: 'Confirmed',
        },
        {
          type: 'Flight',
          airline: 'Air France',
          flightNumber: 'AF 84',
          confirmationNumber: generateConfirmationNumber('AF'),
          departureAirport: AIRPORTS.CDG,
          arrivalAirport: AIRPORTS.SFO,
          departureTime: "2026-05-17T13:00:00.000Z",
          arrivalTime: "2026-05-17T16:00:00.000Z",
          cost: 2400,
          currency: 'USD',
          status: 'Confirmed',
        },
      ],
    },
  ],
};
