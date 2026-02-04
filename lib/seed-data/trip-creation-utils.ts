/**
 * Shared Trip Creation Utilities
 * 
 * Extracted from seed-trip-generator.ts for reuse by:
 * - Seed trip generator (admin)
 * - AI sample trip generator (suggestions)
 * 
 * Handles database lookups, reservation creation, and type-specific field mapping.
 */

import { prisma } from '@/lib/prisma';
import type {
  AnyReservation,
  FlightReservation,
  TrainReservation,
  HotelReservation,
  RestaurantReservation,
  ActivityReservation,
  TransportReservation,
} from './trip-templates';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Cache for database lookups to avoid repeated queries
 */
export interface DatabaseCache {
  segmentTypes: Map<string, string>; // name -> id
  reservationTypes: Map<string, string>; // category:name -> id
  reservationStatuses: Map<string, string>; // name -> id
}

/**
 * Extended reservation data with sample trip fields
 */
export interface SampleReservationData {
  isSample?: boolean;
  suggestionReason?: string;
  profileReferences?: string[];
}

/**
 * Options for creating a reservation
 */
export interface CreateReservationOptions {
  segmentId: string;
  template: AnyReservation;
  cache: DatabaseCache;
  sampleData?: SampleReservationData;
  debug?: boolean;
}

/**
 * Location data structure
 */
export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  timezone: string;
  address?: string;
  url?: string;
  phone?: string;
}

/**
 * Segment creation data with sample trip support
 */
export interface SegmentCreationData {
  name: string;
  startLocation: LocationData;
  endLocation: LocationData;
  startTime: string;
  endTime: string;
  type: string;
  notes?: string;
  suggestionReason?: string;
  profileReferences?: string[];
}

/**
 * Trip creation data with sample trip support
 */
export interface TripCreationData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  userId: string;
  status?: 'GENERATING' | 'DRAFT' | 'PLANNING' | 'LIVE' | 'ARCHIVED';
  isSample?: boolean;
  suggestionSummary?: string;
  suggestionParameters?: Record<string, any>;
  profileReferences?: string[];
}

// ============================================================================
// DATABASE CACHE
// ============================================================================

/**
 * Load database cache with segment types, reservation types, and statuses
 */
export async function loadDatabaseCache(): Promise<DatabaseCache> {
  // Load all segment types
  const segmentTypes = await prisma.segmentType.findMany();
  const segmentTypeMap = new Map(
    segmentTypes.map((st) => [st.name, st.id])
  );

  // Load all reservation types with their categories
  const reservationTypes = await prisma.reservationType.findMany({
    include: { category: true },
  });
  const reservationTypeMap = new Map(
    reservationTypes.map((rt) => [`${rt.category.name}:${rt.name}`, rt.id])
  );

  // Load all reservation statuses
  const reservationStatuses = await prisma.reservationStatus.findMany();
  const reservationStatusMap = new Map(
    reservationStatuses.map((rs) => [rs.name, rs.id])
  );

  return {
    segmentTypes: segmentTypeMap,
    reservationTypes: reservationTypeMap,
    reservationStatuses: reservationStatusMap,
  };
}

// ============================================================================
// RESERVATION CREATION
// ============================================================================

/**
 * Create a reservation from a template
 * Supports both seed trips and AI-generated sample trips
 */
export async function createReservation(
  tx: any,
  options: CreateReservationOptions
): Promise<any> {
  const { segmentId, template, cache, sampleData, debug = false } = options;
  
  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`    [createReservation] ${message}`, data || '');
    }
  };
  
  try {
    log(`Looking up status: ${template.status}`);
    const statusId = cache.reservationStatuses.get(template.status);
    if (!statusId) {
      throw new Error(`Reservation status not found: ${template.status}`);
    }
    log(`Status ID found: ${statusId}`);

    // Determine category and type
    log(`Determining category and type for: ${template.type}`);
    const { category, typeName } = getReservationCategoryAndType(template);
    log(`Category: ${category}, Type: ${typeName}`);
    
    const typeId = cache.reservationTypes.get(`${category}:${typeName}`);
    
    if (!typeId) {
      log(`ERROR: Type not found in cache. Available types:`, Array.from(cache.reservationTypes.keys()));
      throw new Error(`Reservation type not found: ${category}:${typeName}`);
    }
    log(`Type ID found: ${typeId}`);

    // Build base reservation data
    const baseData: any = {
      segmentId,
      reservationTypeId: typeId,
      reservationStatusId: statusId,
      cost: template.cost,
      currency: template.currency,
      notes: template.notes,
    };
    
    // Add sample trip fields if provided
    if (sampleData) {
      if (sampleData.isSample !== undefined) {
        baseData.isSample = sampleData.isSample;
      }
      if (sampleData.suggestionReason) {
        baseData.suggestionReason = sampleData.suggestionReason;
      }
      if (sampleData.profileReferences && sampleData.profileReferences.length > 0) {
        baseData.profileReferences = sampleData.profileReferences;
      }
    }
    
    log('Base data built', baseData);

    // Add type-specific data
    log('Building type-specific data...');
    const specificData = buildReservationSpecificData(template);
    log('Specific data built', specificData);

    // Create the reservation
    log('Creating reservation in database...');
    const reservation = await tx.reservation.create({
      data: {
        ...baseData,
        ...specificData,
      },
    });
    log(`Reservation created successfully: ${reservation.id}`);
    
    return reservation;
  } catch (error: any) {
    log('ERROR in createReservation', {
      error: error.message,
      resType: template.type,
      resStatus: template.status
    });
    throw error;
  }
}

/**
 * Legacy wrapper for backward compatibility
 */
export async function createReservationLegacy(
  tx: any,
  segmentId: string,
  resTemplate: AnyReservation,
  cache: DatabaseCache,
  debug: boolean = false
): Promise<any> {
  return createReservation(tx, {
    segmentId,
    template: resTemplate,
    cache,
    debug,
  });
}

// ============================================================================
// TYPE MAPPING
// ============================================================================

/**
 * Map reservation type to category and type name
 */
export function getReservationCategoryAndType(res: AnyReservation): {
  category: string;
  typeName: string;
} {
  switch (res.type) {
    case 'Flight':
    case 'Train':
    case 'Car Rental':
    case 'Private Driver':
    case 'Taxi':
    case 'Ride Share':
      return { category: 'Travel', typeName: res.type };
    
    case 'Hotel':
    case 'Resort':
    case 'Vacation Rental':
      return { category: 'Stay', typeName: res.type };
    
    case 'Tour':
    case 'Museum':
    case 'Event Tickets':
    case 'Excursion':
    case 'Spa & Wellness':
    case 'Equipment Rental':
    case 'Hike':
      return { category: 'Activity', typeName: res.type };
    
    case 'Restaurant':
    case 'Cafe':
    case 'Bar':
      return { category: 'Dining', typeName: res.type };
    
    default:
      throw new Error(`Unknown reservation type: ${(res as any).type}`);
  }
}

/**
 * Build type-specific data for a reservation
 */
export function buildReservationSpecificData(res: AnyReservation): any {
  const data: any = {};

  // Handle flights
  if (res.type === 'Flight') {
    const flight = res as FlightReservation;
    data.name = `${flight.airline} ${flight.flightNumber}`;
    data.confirmationNumber = flight.confirmationNumber;
    data.departureLocation = flight.departureAirport.name;
    data.departureTimezone = flight.departureAirport.timezone;
    data.arrivalLocation = flight.arrivalAirport.name;
    data.arrivalTimezone = flight.arrivalAirport.timezone;
    data.startTime = new Date(flight.departureTime);
    data.endTime = new Date(flight.arrivalTime);
    data.latitude = flight.departureAirport.lat;
    data.longitude = flight.departureAirport.lng;
    data.timeZoneId = flight.departureAirport.timezone;
    data.timeZoneName = flight.departureAirport.timezone;
    data.vendor = flight.airline;
  }
  
  // Handle trains
  else if (res.type === 'Train') {
    const train = res as TrainReservation;
    data.name = `${train.trainOperator}${train.trainNumber ? ' ' + train.trainNumber : ''}`;
    data.confirmationNumber = train.confirmationNumber;
    data.departureLocation = train.departureStation.name;
    data.departureTimezone = train.departureStation.timezone;
    data.arrivalLocation = train.arrivalStation.name;
    data.arrivalTimezone = train.arrivalStation.timezone;
    data.startTime = new Date(train.departureTime);
    data.endTime = new Date(train.arrivalTime);
    data.latitude = train.departureStation.lat;
    data.longitude = train.departureStation.lng;
    data.timeZoneId = train.departureStation.timezone;
    data.timeZoneName = train.departureStation.timezone;
    data.vendor = train.trainOperator;
  }
  
  // Handle hotels
  else if (res.type === 'Hotel' || res.type === 'Resort' || res.type === 'Vacation Rental') {
    const hotel = res as HotelReservation;
    data.name = hotel.venue.name;
    data.confirmationNumber = hotel.confirmationNumber;
    data.location = hotel.venue.address;
    data.startTime = new Date(hotel.checkInTime);
    data.endTime = new Date(hotel.checkOutTime);
    data.latitude = hotel.venue.lat;
    data.longitude = hotel.venue.lng;
    data.timeZoneId = hotel.venue.timezone;
    data.timeZoneName = hotel.venue.timezone;
    data.url = hotel.venue.url;
    data.contactPhone = hotel.venue.phone;
    // Image URL - prefer direct imageUrl, fallback to venue.imageUrl
    if (hotel.imageUrl) {
      data.imageUrl = hotel.imageUrl;
    } else if (hotel.venue.imageUrl) {
      data.imageUrl = hotel.venue.imageUrl;
    }
  }
  
  // Handle restaurants
  else if (res.type === 'Restaurant' || res.type === 'Cafe' || res.type === 'Bar') {
    const restaurant = res as RestaurantReservation;
    data.name = restaurant.venue.name;
    data.confirmationNumber = restaurant.confirmationNumber;
    data.location = restaurant.venue.address;
    data.startTime = new Date(restaurant.reservationTime);
    data.latitude = restaurant.venue.lat;
    data.longitude = restaurant.venue.lng;
    data.timeZoneId = restaurant.venue.timezone;
    data.timeZoneName = restaurant.venue.timezone;
    data.url = restaurant.venue.url;
    data.contactPhone = restaurant.venue.phone;
    // Image URL - prefer direct imageUrl (from Yelp), fallback to venue.imageUrl
    if (restaurant.imageUrl) {
      data.imageUrl = restaurant.imageUrl;
    } else if (restaurant.venue.imageUrl) {
      data.imageUrl = restaurant.venue.imageUrl;
    }
  }
  
  // Handle activities
  else if (
    res.type === 'Tour' ||
    res.type === 'Museum' ||
    res.type === 'Event Tickets' ||
    res.type === 'Excursion' ||
    res.type === 'Spa & Wellness' ||
    res.type === 'Equipment Rental' ||
    res.type === 'Hike'
  ) {
    const activity = res as ActivityReservation;
    data.name = activity.venue.name;
    data.confirmationNumber = activity.confirmationNumber;
    data.location = activity.venue.address;
    data.startTime = new Date(activity.startTime);
    if (activity.endTime) {
      data.endTime = new Date(activity.endTime);
    }
    data.latitude = activity.venue.lat;
    data.longitude = activity.venue.lng;
    data.timeZoneId = activity.venue.timezone;
    data.timeZoneName = activity.venue.timezone;
    data.url = activity.venue.url;
    // Image URL - prefer direct imageUrl, fallback to venue.imageUrl
    if (activity.imageUrl) {
      data.imageUrl = activity.imageUrl;
    } else if (activity.venue.imageUrl) {
      data.imageUrl = activity.venue.imageUrl;
    }
  }
  
  // Handle transport
  else if (
    res.type === 'Car Rental' ||
    res.type === 'Private Driver' ||
    res.type === 'Taxi' ||
    res.type === 'Ride Share'
  ) {
    const transport = res as TransportReservation;
    data.name = `${res.type}${transport.vendor ? ' - ' + transport.vendor : ''}`;
    data.confirmationNumber = transport.confirmationNumber;
    data.departureLocation = transport.pickupLocation.name;
    data.departureTimezone = transport.pickupLocation.timezone;
    data.arrivalLocation = transport.dropoffLocation.name;
    data.arrivalTimezone = transport.dropoffLocation.timezone;
    data.startTime = new Date(transport.pickupTime);
    if (transport.dropoffTime) {
      data.endTime = new Date(transport.dropoffTime);
    }
    data.latitude = transport.pickupLocation.lat;
    data.longitude = transport.pickupLocation.lng;
    data.timeZoneId = transport.pickupLocation.timezone;
    data.timeZoneName = transport.pickupLocation.timezone;
    data.vendor = transport.vendor;
  }

  // Extract and store wall (local) date and time from the full datetime
  // This ensures the view displays the correct local time without timezone conversion issues
  if (data.startTime instanceof Date) {
    // For wall times, we store the date and time as they appear in the source data
    // (which is already in local time for the destination)
    data.wall_start_date = data.startTime;
    data.wall_start_time = data.startTime;
  }
  if (data.endTime instanceof Date) {
    data.wall_end_date = data.endTime;
    data.wall_end_time = data.endTime;
  }

  return data;
}

// ============================================================================
// TRIP AND SEGMENT CREATION
// ============================================================================

/**
 * Create a trip with sample trip support
 */
export async function createTrip(
  tx: any,
  data: TripCreationData
): Promise<any> {
  const tripData: any = {
    title: data.title,
    description: data.description,
    startDate: new Date(data.startDate),
    endDate: new Date(data.endDate),
    userId: data.userId,
    status: data.status || 'DRAFT',
    permissions: 'PRIVATE',
  };
  
  // Add sample trip fields
  if (data.isSample !== undefined) {
    tripData.isSample = data.isSample;
  }
  if (data.suggestionSummary) {
    tripData.suggestionSummary = data.suggestionSummary;
  }
  if (data.suggestionParameters) {
    tripData.suggestionParameters = data.suggestionParameters;
  }
  if (data.profileReferences && data.profileReferences.length > 0) {
    tripData.profileReferences = data.profileReferences;
  }
  
  return tx.trip.create({ data: tripData });
}

/**
 * Create a segment with sample trip support
 */
export async function createSegment(
  tx: any,
  tripId: string,
  data: SegmentCreationData,
  cache: DatabaseCache,
  order: number
): Promise<any> {
  const segmentTypeId = cache.segmentTypes.get(data.type);
  
  if (!segmentTypeId) {
    throw new Error(`Segment type not found: ${data.type}`);
  }
  
  const segmentData: any = {
    name: data.name,
    startTitle: data.startLocation.name,
    startLat: data.startLocation.lat,
    startLng: data.startLocation.lng,
    startTimeZoneId: data.startLocation.timezone,
    startTimeZoneName: data.startLocation.timezone,
    endTitle: data.endLocation.name,
    endLat: data.endLocation.lat,
    endLng: data.endLocation.lng,
    endTimeZoneId: data.endLocation.timezone,
    endTimeZoneName: data.endLocation.timezone,
    startTime: new Date(data.startTime),
    endTime: new Date(data.endTime),
    notes: data.notes,
    tripId: tripId,
    segmentTypeId: segmentTypeId,
    order: order,
  };
  
  // Add sample trip fields
  if (data.suggestionReason) {
    segmentData.suggestionReason = data.suggestionReason;
  }
  if (data.profileReferences && data.profileReferences.length > 0) {
    segmentData.profileReferences = data.profileReferences;
  }
  
  return tx.segment.create({ data: segmentData });
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

/**
 * Update trip generation progress
 */
export async function updateTripProgress(
  tripId: string,
  step: string,
  status: 'in_progress' | 'complete' | 'failed',
  error?: string
): Promise<void> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    select: { generationProgress: true },
  });
  
  const progress = (trip?.generationProgress as any) || {
    step: '',
    completed: [],
    failed: [],
  };
  
  progress.step = step;
  
  if (status === 'complete' && !progress.completed.includes(step)) {
    progress.completed.push(step);
  }
  if (status === 'failed' && !progress.failed.includes(step)) {
    progress.failed.push(step);
  }
  
  const updateData: any = { generationProgress: progress };
  if (error) {
    updateData.generationError = error;
  }
  
  await prisma.trip.update({
    where: { id: tripId },
    data: updateData,
  });
}

/**
 * Mark trip generation as complete
 */
export async function completeTripGeneration(tripId: string): Promise<void> {
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'DRAFT',
      generationProgress: { step: 'complete', completed: ['itinerary', 'flights', 'hotels', 'restaurants', 'activities'], failed: [] },
    },
  });
}

/**
 * Mark trip generation as failed
 */
export async function failTripGeneration(tripId: string, error: string): Promise<void> {
  await prisma.trip.update({
    where: { id: tripId },
    data: {
      status: 'DRAFT', // Still create the trip, but mark the error
      generationError: error,
    },
  });
}
