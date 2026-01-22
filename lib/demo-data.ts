/**
 * Hardcoded demo data showcasing all travel planner capabilities
 * This data represents a fictional European trip with diverse examples
 */

export const demoTrip = {
  id: "demo-trip-1",
  title: "European Adventure",
  description: "A comprehensive showcase of all travel planner capabilities including flights, trains, hotels, restaurants, tours, and activities across three iconic European cities.",
  imageUrl: "/placeholder.svg",
  imageIsCustom: false,
  startDate: new Date("2026-06-15T00:00:00Z"),
  endDate: new Date("2026-06-25T23:59:59Z"),
  userId: "demo-user",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-20T00:00:00Z"),
};

export const demoSegmentTypes = {
  flight: { id: "st-1", name: "Flight", createdAt: new Date() },
  train: { id: "st-2", name: "Train", createdAt: new Date() },
  drive: { id: "st-3", name: "Drive", createdAt: new Date() },
  ferry: { id: "st-4", name: "Ferry", createdAt: new Date() },
  walk: { id: "st-5", name: "Walk", createdAt: new Date() },
  other: { id: "st-6", name: "Other", createdAt: new Date() },
};

export const demoReservationCategories = {
  travel: { id: "rc-1", name: "Travel", createdAt: new Date() },
  stay: { id: "rc-2", name: "Stay", createdAt: new Date() },
  activity: { id: "rc-3", name: "Activity", createdAt: new Date() },
  dining: { id: "rc-4", name: "Dining", createdAt: new Date() },
};

export const demoReservationTypes = {
  flight: { id: "rt-1", name: "Flight", categoryId: "rc-1", createdAt: new Date() },
  train: { id: "rt-2", name: "Train", categoryId: "rc-1", createdAt: new Date() },
  carRental: { id: "rt-3", name: "Car Rental", categoryId: "rc-1", createdAt: new Date() },
  bus: { id: "rt-4", name: "Bus", categoryId: "rc-1", createdAt: new Date() },
  ferry: { id: "rt-5", name: "Ferry", categoryId: "rc-1", createdAt: new Date() },
  hotel: { id: "rt-6", name: "Hotel", categoryId: "rc-2", createdAt: new Date() },
  airbnb: { id: "rt-7", name: "Airbnb", categoryId: "rc-2", createdAt: new Date() },
  hostel: { id: "rt-8", name: "Hostel", categoryId: "rc-2", createdAt: new Date() },
  resort: { id: "rt-9", name: "Resort", categoryId: "rc-2", createdAt: new Date() },
  vacationRental: { id: "rt-10", name: "Vacation Rental", categoryId: "rc-2", createdAt: new Date() },
  tour: { id: "rt-11", name: "Tour", categoryId: "rc-3", createdAt: new Date() },
  eventTickets: { id: "rt-12", name: "Event Tickets", categoryId: "rc-3", createdAt: new Date() },
  museum: { id: "rt-13", name: "Museum", categoryId: "rc-3", createdAt: new Date() },
  hike: { id: "rt-14", name: "Hike", categoryId: "rc-3", createdAt: new Date() },
  excursion: { id: "rt-15", name: "Excursion", categoryId: "rc-3", createdAt: new Date() },
  adventure: { id: "rt-16", name: "Adventure", categoryId: "rc-3", createdAt: new Date() },
  restaurant: { id: "rt-17", name: "Restaurant", categoryId: "rc-4", createdAt: new Date() },
  cafe: { id: "rt-18", name: "Cafe", categoryId: "rc-4", createdAt: new Date() },
  bar: { id: "rt-19", name: "Bar", categoryId: "rc-4", createdAt: new Date() },
  foodTour: { id: "rt-20", name: "Food Tour", categoryId: "rc-4", createdAt: new Date() },
};

export const demoReservationStatuses = {
  confirmed: { id: "rs-1", name: "Confirmed", createdAt: new Date() },
  pending: { id: "rs-2", name: "Pending", createdAt: new Date() },
  cancelled: { id: "rs-3", name: "Cancelled", createdAt: new Date() },
  completed: { id: "rs-4", name: "Completed", createdAt: new Date() },
  waitlisted: { id: "rs-5", name: "Waitlisted", createdAt: new Date() },
};

// Segment 1: Flight from New York to Paris
export const segment1 = {
  id: "seg-1",
  name: "Transatlantic Flight to Paris",
  imageUrl: "/airplane-flight-travel.jpg",
  imageIsCustom: false,
  startTitle: "John F. Kennedy International Airport (JFK)",
  startLat: 40.6413,
  startLng: -73.7781,
  startTimeZoneId: "America/New_York",
  startTimeZoneName: "Eastern Daylight Time",
  endTitle: "Charles de Gaulle Airport (CDG)",
  endLat: 49.0097,
  endLng: 2.5479,
  endTimeZoneId: "Europe/Paris",
  endTimeZoneName: "Central European Summer Time",
  notes: "Direct overnight flight. Check in 3 hours early for international departure.",
  startTime: new Date("2026-06-15T20:00:00-04:00"), // 8 PM EDT
  endTime: new Date("2026-06-16T10:30:00+02:00"), // 10:30 AM CEST (next day)
  segmentTypeId: "st-1",
  tripId: "demo-trip-1",
  order: 0,
  createdAt: new Date("2026-01-15T00:00:00Z"),
  segmentType: demoSegmentTypes.flight,
};

// Segment 2: Train from Paris to Rome
export const segment2 = {
  id: "seg-2",
  name: "High-Speed Train to Rome",
  imageUrl: "/train-bus-transportation.jpg",
  imageIsCustom: false,
  startTitle: "Paris Gare de Lyon",
  startLat: 48.8443,
  startLng: 2.3744,
  startTimeZoneId: "Europe/Paris",
  startTimeZoneName: "Central European Summer Time",
  endTitle: "Roma Termini",
  endLat: 41.9009,
  endLng: 12.5028,
  endTimeZoneId: "Europe/Rome",
  endTimeZoneName: "Central European Summer Time",
  notes: "TGV/Trenitalia high-speed service. Reserved seats in 1st class. Scenic Alpine route.",
  startTime: new Date("2026-06-19T09:15:00+02:00"), // 9:15 AM CEST
  endTime: new Date("2026-06-19T20:45:00+02:00"), // 8:45 PM CEST
  segmentTypeId: "st-2",
  tripId: "demo-trip-1",
  order: 1,
  createdAt: new Date("2026-01-15T00:00:00Z"),
  segmentType: demoSegmentTypes.train,
};

// Segment 3: Drive from Rome to Barcelona
export const segment3 = {
  id: "seg-3",
  name: "Coastal Drive to Barcelona",
  imageUrl: "/placeholder.svg",
  imageIsCustom: false,
  startTitle: "Rome, Italy",
  startLat: 41.9028,
  startLng: 12.4964,
  startTimeZoneId: "Europe/Rome",
  startTimeZoneName: "Central European Summer Time",
  endTitle: "Barcelona, Spain",
  endLat: 41.3874,
  endLng: 2.1686,
  endTimeZoneId: "Europe/Madrid",
  endTimeZoneName: "Central European Summer Time",
  notes: "Scenic coastal route via French Riviera. Multiple stops planned along the way.",
  startTime: new Date("2026-06-22T08:00:00+02:00"), // 8 AM CEST
  endTime: new Date("2026-06-22T22:00:00+02:00"), // 10 PM CEST
  segmentTypeId: "st-3",
  tripId: "demo-trip-1",
  order: 2,
  createdAt: new Date("2026-01-15T00:00:00Z"),
  segmentType: demoSegmentTypes.drive,
};

// Reservations for Segment 1 (Flight to Paris)
export const reservation1 = {
  id: "res-1",
  name: "Air France AF008",
  vendor: "Air France",
  confirmationNumber: "AF8K9M2L",
  notes: "Premium Economy. Seat 15A (window). Meal preference: vegetarian.",
  reservationTypeId: "rt-1",
  reservationStatusId: "rs-1",
  segmentId: "seg-1",
  startTime: new Date("2026-06-15T20:00:00-04:00"),
  endTime: new Date("2026-06-16T10:30:00+02:00"),
  cost: 1250.00,
  currency: "USD",
  location: "JFK Terminal 1",
  latitude: 40.6413,
  longitude: -73.7781,
  timeZoneId: "America/New_York",
  timeZoneName: "Eastern Daylight Time",
  url: "https://www.airfrance.com",
  imageUrl: "/airplane-flight-travel.jpg",
  imageIsCustom: false,
  departureLocation: "John F. Kennedy International Airport (JFK)",
  departureTimezone: "America/New_York",
  arrivalLocation: "Charles de Gaulle Airport (CDG)",
  arrivalTimezone: "Europe/Paris",
  contactPhone: "+1-800-237-2747",
  contactEmail: "support@airfrance.com",
  cancellationPolicy: "Cancellable up to 24 hours before departure with 50% refund.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.flight,
  reservationStatus: demoReservationStatuses.confirmed,
};

// Reservations for Paris stay (Segment 1)
export const reservation2 = {
  id: "res-2",
  name: "Hôtel Plaza Athénée",
  vendor: "Dorchester Collection",
  confirmationNumber: "HPA-2026-45892",
  notes: "Deluxe room with Eiffel Tower view. Late checkout requested (2 PM).",
  reservationTypeId: "rt-6",
  reservationStatusId: "rs-1",
  segmentId: "seg-1",
  startTime: new Date("2026-06-16T15:00:00+02:00"), // 3 PM check-in
  endTime: new Date("2026-06-19T12:00:00+02:00"), // 12 PM checkout
  cost: 2850.00,
  currency: "EUR",
  location: "25 Avenue Montaigne, 75008 Paris, France",
  latitude: 48.8661,
  longitude: 2.3048,
  timeZoneId: "Europe/Paris",
  timeZoneName: "Central European Summer Time",
  url: "https://www.dorchestercollection.com/paris/hotel-plaza-athenee",
  imageUrl: "/luxury-hotel-room.png",
  imageIsCustom: false,
  contactPhone: "+33 1 53 67 66 65",
  contactEmail: "reservations.hpa@dorchestercollection.com",
  cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.hotel,
  reservationStatus: demoReservationStatuses.confirmed,
};

export const reservation3 = {
  id: "res-3",
  name: "Le Jules Verne",
  vendor: "Alain Ducasse",
  confirmationNumber: "JV-061726-D",
  notes: "Michelin 2-star restaurant on Eiffel Tower's 2nd floor. Tasting menu with wine pairing.",
  reservationTypeId: "rt-17",
  reservationStatusId: "rs-1",
  segmentId: "seg-1",
  startTime: new Date("2026-06-17T20:00:00+02:00"), // 8 PM dinner
  endTime: new Date("2026-06-17T23:00:00+02:00"), // 11 PM
  cost: 420.00,
  currency: "EUR",
  location: "Eiffel Tower, Avenue Gustave Eiffel, 75007 Paris, France",
  latitude: 48.8584,
  longitude: 2.2945,
  timeZoneId: "Europe/Paris",
  timeZoneName: "Central European Summer Time",
  url: "https://www.lejulesverne-paris.com",
  imageUrl: "/restaurant-dining-food.jpg",
  imageIsCustom: false,
  contactPhone: "+33 1 45 55 61 44",
  contactEmail: "reservation@lejulesverne-paris.com",
  cancellationPolicy: "Cancellation required 48 hours in advance.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.restaurant,
  reservationStatus: demoReservationStatuses.confirmed,
};

export const reservation4 = {
  id: "res-4",
  name: "Louvre Museum Guided Tour",
  vendor: "Paris Museum Tours",
  confirmationNumber: "PMT-LV-18456",
  notes: "Skip-the-line access. 3-hour guided tour focusing on Renaissance masterpieces.",
  reservationTypeId: "rt-11",
  reservationStatusId: "rs-1",
  segmentId: "seg-1",
  startTime: new Date("2026-06-18T10:00:00+02:00"), // 10 AM
  endTime: new Date("2026-06-18T13:00:00+02:00"), // 1 PM
  cost: 89.00,
  currency: "EUR",
  location: "Louvre Museum, Rue de Rivoli, 75001 Paris, France",
  latitude: 48.8606,
  longitude: 2.3376,
  timeZoneId: "Europe/Paris",
  timeZoneName: "Central European Summer Time",
  url: "https://www.louvre.fr",
  imageUrl: "/travel-activity-adventure.jpg",
  imageIsCustom: false,
  contactPhone: "+33 1 40 20 53 17",
  contactEmail: "info@parismuseumtours.com",
  cancellationPolicy: "Full refund if cancelled 24 hours before tour.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.tour,
  reservationStatus: demoReservationStatuses.confirmed,
};

// Reservations for Rome stay (Segment 2)
export const reservation5 = {
  id: "res-5",
  name: "Hotel Hassler Roma",
  vendor: "Hotel Hassler",
  confirmationNumber: "HH-ROM-78234",
  notes: "Deluxe room overlooking Spanish Steps. Breakfast included.",
  reservationTypeId: "rt-6",
  reservationStatusId: "rs-1",
  segmentId: "seg-2",
  startTime: new Date("2026-06-19T15:00:00+02:00"), // 3 PM check-in
  endTime: new Date("2026-06-22T11:00:00+02:00"), // 11 AM checkout
  cost: 1950.00,
  currency: "EUR",
  location: "Piazza Trinità dei Monti 6, 00187 Rome, Italy",
  latitude: 41.9062,
  longitude: 12.4828,
  timeZoneId: "Europe/Rome",
  timeZoneName: "Central European Summer Time",
  url: "https://www.hotelhasslerroma.com",
  imageUrl: "/luxury-hotel-room.png",
  imageIsCustom: false,
  contactPhone: "+39 06 699340",
  contactEmail: "info@hotelhasslerroma.com",
  cancellationPolicy: "Free cancellation up to 72 hours before arrival.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.hotel,
  reservationStatus: demoReservationStatuses.confirmed,
};

export const reservation6 = {
  id: "res-6",
  name: "Vatican Museums & Sistine Chapel",
  vendor: "Vatican Tours",
  confirmationNumber: "VAT-SIS-92847",
  notes: "Early morning access before crowds. Expert art historian guide. Includes St. Peter's Basilica.",
  reservationTypeId: "rt-13",
  reservationStatusId: "rs-1",
  segmentId: "seg-2",
  startTime: new Date("2026-06-20T08:00:00+02:00"), // 8 AM
  endTime: new Date("2026-06-20T12:00:00+02:00"), // 12 PM
  cost: 125.00,
  currency: "EUR",
  location: "Vatican Museums, Viale Vaticano, 00165 Rome, Italy",
  latitude: 41.9064,
  longitude: 12.4536,
  timeZoneId: "Europe/Rome",
  timeZoneName: "Central European Summer Time",
  url: "https://www.museivaticani.va",
  imageUrl: "/travel-activity-adventure.jpg",
  imageIsCustom: false,
  contactPhone: "+39 06 69884676",
  contactEmail: "info@vaticantours.com",
  cancellationPolicy: "Non-refundable. Date changes permitted up to 48 hours before.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.museum,
  reservationStatus: demoReservationStatuses.confirmed,
};

export const reservation7 = {
  id: "res-7",
  name: "Colosseum Underground Tour",
  vendor: "Rome Walks",
  confirmationNumber: "RW-COL-45612",
  notes: "Special access to underground chambers and arena floor. Small group (max 12 people).",
  reservationTypeId: "rt-11",
  reservationStatusId: "rs-1",
  segmentId: "seg-2",
  startTime: new Date("2026-06-21T14:00:00+02:00"), // 2 PM
  endTime: new Date("2026-06-21T17:00:00+02:00"), // 5 PM
  cost: 95.00,
  currency: "EUR",
  location: "Colosseum, Piazza del Colosseo, 00184 Rome, Italy",
  latitude: 41.8902,
  longitude: 12.4922,
  timeZoneId: "Europe/Rome",
  timeZoneName: "Central European Summer Time",
  url: "https://www.coopculture.it",
  imageUrl: "/travel-activity-adventure.jpg",
  imageIsCustom: false,
  contactPhone: "+39 06 39967700",
  contactEmail: "info@romewalks.com",
  cancellationPolicy: "Full refund if cancelled 24 hours in advance.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.tour,
  reservationStatus: demoReservationStatuses.confirmed,
};

// Reservations for Barcelona stay (Segment 3)
export const reservation8 = {
  id: "res-8",
  name: "Avis Car Rental - BMW 4 Series Convertible",
  vendor: "Avis",
  confirmationNumber: "AVIS-EU-892456",
  notes: "Premium convertible for coastal drive. Full insurance included. GPS navigation.",
  reservationTypeId: "rt-3",
  reservationStatusId: "rs-1",
  segmentId: "seg-3",
  startTime: new Date("2026-06-22T08:00:00+02:00"), // 8 AM pickup
  endTime: new Date("2026-06-25T18:00:00+02:00"), // 6 PM return
  cost: 890.00,
  currency: "EUR",
  location: "Avis Rome Termini Station, Via Giolitti 34, 00185 Rome, Italy",
  latitude: 41.9009,
  longitude: 12.5028,
  timeZoneId: "Europe/Rome",
  timeZoneName: "Central European Summer Time",
  url: "https://www.avis.com",
  imageUrl: "/placeholder.svg",
  imageIsCustom: false,
  contactPhone: "+39 06 481 4373",
  contactEmail: "reservations@avis.it",
  cancellationPolicy: "Free cancellation up to 48 hours before pickup.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.carRental,
  reservationStatus: demoReservationStatuses.confirmed,
};

export const reservation9 = {
  id: "res-9",
  name: "Hotel Arts Barcelona",
  vendor: "The Ritz-Carlton",
  confirmationNumber: "HA-BCN-56789",
  notes: "Ocean-view suite on 32nd floor. Club level access with lounge privileges.",
  reservationTypeId: "rt-6",
  reservationStatusId: "rs-1",
  segmentId: "seg-3",
  startTime: new Date("2026-06-22T16:00:00+02:00"), // 4 PM check-in
  endTime: new Date("2026-06-25T12:00:00+02:00"), // 12 PM checkout
  cost: 2100.00,
  currency: "EUR",
  location: "Carrer de la Marina 19-21, 08005 Barcelona, Spain",
  latitude: 41.3870,
  longitude: 2.1967,
  timeZoneId: "Europe/Madrid",
  timeZoneName: "Central European Summer Time",
  url: "https://www.hotelartsbarcelona.com",
  imageUrl: "/luxury-hotel-room.png",
  imageIsCustom: false,
  contactPhone: "+34 932 21 10 00",
  contactEmail: "reservations@hotelartsbarcelona.com",
  cancellationPolicy: "Free cancellation up to 48 hours before check-in.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.hotel,
  reservationStatus: demoReservationStatuses.confirmed,
};

export const reservation10 = {
  id: "res-10",
  name: "Sagrada Família Priority Access",
  vendor: "Sagrada Família",
  confirmationNumber: "SF-BCN-78945",
  notes: "Skip-the-line tickets with tower access. Audio guide included.",
  reservationTypeId: "rt-12",
  reservationStatusId: "rs-1",
  segmentId: "seg-3",
  startTime: new Date("2026-06-23T10:00:00+02:00"), // 10 AM
  endTime: new Date("2026-06-23T12:30:00+02:00"), // 12:30 PM
  cost: 45.00,
  currency: "EUR",
  location: "Carrer de Mallorca 401, 08013 Barcelona, Spain",
  latitude: 41.4036,
  longitude: 2.1744,
  timeZoneId: "Europe/Madrid",
  timeZoneName: "Central European Summer Time",
  url: "https://sagradafamilia.org",
  imageUrl: "/travel-activity-adventure.jpg",
  imageIsCustom: false,
  contactPhone: "+34 932 08 04 14",
  contactEmail: "info@sagradafamilia.org",
  cancellationPolicy: "Non-refundable. No changes permitted.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.eventTickets,
  reservationStatus: demoReservationStatuses.confirmed,
};

export const reservation11 = {
  id: "res-11",
  name: "Tickets Bar",
  vendor: "elBarri Group",
  confirmationNumber: "TKT-BCN-34567",
  notes: "Avant-garde tapas experience. Chef's tasting menu. Counter seating.",
  reservationTypeId: "rt-17",
  reservationStatusId: "rs-1",
  segmentId: "seg-3",
  startTime: new Date("2026-06-24T21:00:00+02:00"), // 9 PM dinner
  endTime: new Date("2026-06-24T23:30:00+02:00"), // 11:30 PM
  cost: 280.00,
  currency: "EUR",
  location: "Avinguda del Paral·lel 164, 08015 Barcelona, Spain",
  latitude: 41.3748,
  longitude: 2.1508,
  timeZoneId: "Europe/Madrid",
  timeZoneName: "Central European Summer Time",
  url: "https://www.ticketsbar.es",
  imageUrl: "/restaurant-dining-food.jpg",
  imageIsCustom: false,
  contactPhone: "+34 932 92 42 53",
  contactEmail: "reservas@ticketsbar.es",
  cancellationPolicy: "Cancellation required 24 hours in advance or full charge applies.",
  createdAt: new Date("2026-01-15T00:00:00Z"),
  updatedAt: new Date("2026-01-15T00:00:00Z"),
  reservationType: demoReservationTypes.restaurant,
  reservationStatus: demoReservationStatuses.confirmed,
};

// Combine all data
export const demoSegments = [segment1, segment2, segment3];

export const demoReservations = [
  reservation1,
  reservation2,
  reservation3,
  reservation4,
  reservation5,
  reservation6,
  reservation7,
  reservation8,
  reservation9,
  reservation10,
  reservation11,
];

// Full trip with nested data
export const demoTripWithData = {
  ...demoTrip,
  segments: [
    {
      ...segment1,
      reservations: [reservation1, reservation2, reservation3, reservation4],
    },
    {
      ...segment2,
      reservations: [reservation5, reservation6, reservation7],
    },
    {
      ...segment3,
      reservations: [reservation8, reservation9, reservation10, reservation11],
    },
  ],
};

// Google API demo data
export const demoPlacesData = {
  parisRestaurants: [
    {
      name: "Le Jules Verne",
      rating: 4.5,
      userRatingsTotal: 2847,
      formattedAddress: "Eiffel Tower, Avenue Gustave Eiffel, 75007 Paris, France",
      location: { lat: 48.8584, lng: 2.2945 },
      types: ["restaurant", "food", "point_of_interest"],
      priceLevel: 4,
    },
    {
      name: "L'Astrance",
      rating: 4.6,
      userRatingsTotal: 1234,
      formattedAddress: "4 Rue Beethoven, 75016 Paris, France",
      location: { lat: 48.8606, lng: 2.2820 },
      types: ["restaurant", "food", "point_of_interest"],
      priceLevel: 4,
    },
    {
      name: "Septime",
      rating: 4.4,
      userRatingsTotal: 1876,
      formattedAddress: "80 Rue de Charonne, 75011 Paris, France",
      location: { lat: 48.8530, lng: 2.3810 },
      types: ["restaurant", "food", "point_of_interest"],
      priceLevel: 3,
    },
  ],
  autocompleteResults: [
    "Paris, France",
    "Paris Las Vegas, Las Vegas, NV, USA",
    "Paris, TX, USA",
    "Paris, TN, USA",
    "Paris, KY, USA",
  ],
};

export const demoGeocodingData = {
  forwardGeocoding: {
    address: "Eiffel Tower, Paris, France",
    result: {
      formattedAddress: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
      location: { lat: 48.8584, lng: 2.2945 },
      placeId: "ChIJLU7jZClu5kcR4PcOOO6p3I0",
    },
  },
  reverseGeocoding: {
    location: { lat: 41.9028, lng: 12.4964 },
    result: {
      formattedAddress: "Piazza Venezia, 00186 Roma RM, Italy",
      placeId: "ChIJrRMmK-1iLxMRBIUfQMH_AA0",
    },
  },
};

export const demoTimezoneData = [
  {
    city: "New York",
    location: { lat: 40.7128, lng: -74.0060 },
    timeZoneId: "America/New_York",
    timeZoneName: "Eastern Daylight Time",
    currentTime: "2026-06-15T14:00:00-04:00",
  },
  {
    city: "Paris",
    location: { lat: 48.8566, lng: 2.3522 },
    timeZoneId: "Europe/Paris",
    timeZoneName: "Central European Summer Time",
    currentTime: "2026-06-15T20:00:00+02:00",
  },
  {
    city: "Rome",
    location: { lat: 41.9028, lng: 12.4964 },
    timeZoneId: "Europe/Rome",
    timeZoneName: "Central European Summer Time",
    currentTime: "2026-06-15T20:00:00+02:00",
  },
  {
    city: "Barcelona",
    location: { lat: 41.3874, lng: 2.1686 },
    timeZoneId: "Europe/Madrid",
    timeZoneName: "Central European Summer Time",
    currentTime: "2026-06-15T20:00:00+02:00",
  },
];

export const demoRoutesData = {
  parisToRome: {
    distance: { meters: 1420000, text: "1,420 km" },
    duration: { seconds: 41400, text: "11 hours 30 minutes" },
    mode: "TRAIN",
  },
  romeToBarcelona: {
    distance: { meters: 1360000, text: "1,360 km" },
    duration: { seconds: 50400, text: "14 hours" },
    mode: "DRIVE",
  },
};
