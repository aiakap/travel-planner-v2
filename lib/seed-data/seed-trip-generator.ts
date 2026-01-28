/**
 * Seed Trip Generator
 * 
 * Transforms trip templates into Prisma-compatible database records.
 * Handles all the complexity of looking up IDs, creating proper relationships,
 * and ensuring data integrity.
 */

import { PrismaClient } from '@/app/generated/prisma';
import type {
  TripTemplate,
  SegmentTemplate,
  AnyReservation,
  FlightReservation,
  TrainReservation,
  HotelReservation,
  RestaurantReservation,
  ActivityReservation,
  TransportReservation,
} from './trip-templates';
import { LARGE_TRIP, MEDIUM_TRIP, SMALL_TRIP, MICRO_TRIP } from './trip-templates';

const prisma = new PrismaClient();

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TripSize = 'large' | 'medium' | 'small' | 'micro';

interface GeneratedTrip {
  tripId: string;
  segmentIds: string[];
  reservationIds: string[];
  summary: {
    title: string;
    duration: number;
    segmentCount: number;
    reservationCount: number;
    reservationsByType: Record<string, number>;
    reservationsByStatus: Record<string, number>;
  };
}

// Cache for database lookups
interface DatabaseCache {
  segmentTypes: Map<string, string>; // name -> id
  reservationTypes: Map<string, string>; // category:name -> id
  reservationStatuses: Map<string, string>; // name -> id
}

// ============================================================================
// MAIN GENERATION FUNCTION
// ============================================================================

export async function generateSeedTrip(
  userId: string,
  tripSize: TripSize,
  debug: boolean = false
): Promise<GeneratedTrip> {
  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`[Seed Trip Generator] ${message}`, data || '');
    }
  };

  try {
    log(`Starting generation for ${tripSize} trip, user: ${userId}`);
    
    // Select the appropriate template
    const template = getTripTemplate(tripSize);
    log(`Template loaded: ${template.title}`, {
      segments: template.segments.length,
      totalReservations: template.segments.reduce((sum, seg) => sum + seg.reservations.length, 0)
    });
    
    // Load database cache
    log('Loading database cache...');
    const cache = await loadDatabaseCache();
    log('Cache loaded', {
      segmentTypes: cache.segmentTypes.size,
      reservationTypes: cache.reservationTypes.size,
      reservationStatuses: cache.reservationStatuses.size
    });
    
    // Generate the trip in a transaction
    log('Starting database transaction...');
    const result = await prisma.$transaction(async (tx) => {
    // Create the trip
    const trip = await tx.trip.create({
      data: {
        title: template.title,
        description: template.description,
        startDate: new Date(template.startDate),
        endDate: new Date(template.endDate),
        userId: userId,
        status: 'PLANNING',
        permissions: 'PRIVATE',
      },
    });

    const segmentIds: string[] = [];
    const reservationIds: string[] = [];
    const reservationsByType: Record<string, number> = {};
    const reservationsByStatus: Record<string, number> = {};

    // Create segments and their reservations
    for (let i = 0; i < template.segments.length; i++) {
      const segmentTemplate = template.segments[i];
      log(`Processing segment ${i + 1}/${template.segments.length}: ${segmentTemplate.name}`);
      
      const segmentTypeId = cache.segmentTypes.get(segmentTemplate.type);
      
      if (!segmentTypeId) {
        throw new Error(`Segment type not found: ${segmentTemplate.type}`);
      }

      // Create the segment
      log(`Creating segment with type: ${segmentTemplate.type}`);
      const segment = await tx.segment.create({
        data: {
          name: segmentTemplate.name,
          startTitle: segmentTemplate.startLocation.name,
          startLat: segmentTemplate.startLocation.lat,
          startLng: segmentTemplate.startLocation.lng,
          startTimeZoneId: segmentTemplate.startLocation.timezone,
          startTimeZoneName: segmentTemplate.startLocation.timezone,
          endTitle: segmentTemplate.endLocation.name,
          endLat: segmentTemplate.endLocation.lat,
          endLng: segmentTemplate.endLocation.lng,
          endTimeZoneId: segmentTemplate.endLocation.timezone,
          endTimeZoneName: segmentTemplate.endLocation.timezone,
          startTime: new Date(segmentTemplate.startTime),
          endTime: new Date(segmentTemplate.endTime),
          notes: segmentTemplate.notes,
          tripId: trip.id,
          segmentTypeId: segmentTypeId,
          order: i,
        },
      });

      segmentIds.push(segment.id);
      log(`Segment created: ${segment.id}`);

      // Create reservations for this segment
      log(`Creating ${segmentTemplate.reservations.length} reservations for segment...`);
      for (let j = 0; j < segmentTemplate.reservations.length; j++) {
        const resTemplate = segmentTemplate.reservations[j];
        try {
          log(`  Reservation ${j + 1}/${segmentTemplate.reservations.length}: ${resTemplate.type} - ${(resTemplate as any).name || (resTemplate as any).venue?.name || 'unnamed'}`);
          
          const reservation = await createReservation(
            tx,
            segment.id,
            resTemplate,
            cache,
            debug
          );
          
          reservationIds.push(reservation.id);
          
          // Track statistics
          const typeName = resTemplate.type;
          reservationsByType[typeName] = (reservationsByType[typeName] || 0) + 1;
          reservationsByStatus[resTemplate.status] = 
            (reservationsByStatus[resTemplate.status] || 0) + 1;
          
          log(`  ✓ Reservation created: ${reservation.id}`);
        } catch (error: any) {
          log(`  ✗ Failed to create reservation: ${error.message}`, {
            type: resTemplate.type,
            status: resTemplate.status,
            error: error.stack
          });
          throw error;
        }
      }
    }

    log('All segments and reservations created successfully');
    log('Transaction complete', {
      tripId: trip.id,
      segments: segmentIds.length,
      reservations: reservationIds.length
    });

    return {
      tripId: trip.id,
      segmentIds,
      reservationIds,
      summary: {
        title: template.title,
        duration: Math.ceil(
          (new Date(template.endDate).getTime() - 
           new Date(template.startDate).getTime()) / 
          (1000 * 60 * 60 * 24)
        ),
        segmentCount: segmentIds.length,
        reservationCount: reservationIds.length,
        reservationsByType,
        reservationsByStatus,
      },
    };
  });

  return result;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTripTemplate(size: TripSize): TripTemplate {
  switch (size) {
    case 'large':
      return LARGE_TRIP;
    case 'medium':
      return MEDIUM_TRIP;
    case 'small':
      return SMALL_TRIP;
    case 'micro':
      return MICRO_TRIP;
    default:
      throw new Error(`Invalid trip size: ${size}`);
  }
}

async function loadDatabaseCache(): Promise<DatabaseCache> {
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

async function createReservation(
  tx: any,
  segmentId: string,
  resTemplate: AnyReservation,
  cache: DatabaseCache,
  debug: boolean = false
): Promise<any> {
  const log = (message: string, data?: any) => {
    if (debug) {
      console.log(`    [createReservation] ${message}`, data || '');
    }
  };
  try {
    log(`Looking up status: ${resTemplate.status}`);
    const statusId = cache.reservationStatuses.get(resTemplate.status);
    if (!statusId) {
      throw new Error(`Reservation status not found: ${resTemplate.status}`);
    }
    log(`Status ID found: ${statusId}`);

    // Determine category and type
    log(`Determining category and type for: ${resTemplate.type}`);
    const { category, typeName } = getReservationCategoryAndType(resTemplate);
    log(`Category: ${category}, Type: ${typeName}`);
    
    const typeId = cache.reservationTypes.get(`${category}:${typeName}`);
    
    if (!typeId) {
      log(`ERROR: Type not found in cache. Available types:`, Array.from(cache.reservationTypes.keys()));
      throw new Error(`Reservation type not found: ${category}:${typeName}`);
    }
    log(`Type ID found: ${typeId}`);

    // Build base reservation data
    const baseData = {
      segmentId,
      reservationTypeId: typeId,
      reservationStatusId: statusId,
      cost: resTemplate.cost,
      currency: resTemplate.currency,
      notes: resTemplate.notes,
    };
    log('Base data built', baseData);

    // Add type-specific data
    log('Building type-specific data...');
    const specificData = buildReservationSpecificData(resTemplate);
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
      resType: resTemplate.type,
      resStatus: resTemplate.status
    });
    throw error;
  }
}

function getReservationCategoryAndType(res: AnyReservation): {
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

function buildReservationSpecificData(res: AnyReservation): any {
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

  return data;
}

// ============================================================================
// DELETION HELPER
// ============================================================================

/**
 * Delete a seed trip and all its related data
 */
export async function deleteSeedTrip(tripId: string): Promise<void> {
  await prisma.trip.delete({
    where: { id: tripId },
  });
}

/**
 * Delete all trips for a user (useful for cleanup)
 */
export async function deleteAllTripsForUser(userId: string): Promise<number> {
  const result = await prisma.trip.deleteMany({
    where: { userId },
  });
  return result.count;
}

// ============================================================================
// EXPORT FOR API USE
// ============================================================================

export { TripSize, GeneratedTrip };
