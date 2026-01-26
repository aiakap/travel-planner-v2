/**
 * Flight Clustering Utility
 * 
 * Groups flight segments into clusters based on time proximity.
 * Flights within maxGapHours of each other are grouped together.
 */

export interface FlightSegment {
  flightNumber: string;
  carrier: string;
  carrierCode: string;
  departureAirport: string;
  departureCity: string;
  departureDate: string;
  departureTime: string;
  arrivalAirport: string;
  arrivalCity: string;
  arrivalDate: string;
  arrivalTime: string;
  cabin: string;
  seatNumber: string;
  operatedBy: string;
}

export interface FlightCluster {
  flights: FlightSegment[];
  startTime: Date;
  endTime: Date;
  startLocation: string;
  endLocation: string;
  startAirport: string;
  endAirport: string;
}

/**
 * Convert time string like "10:15 AM" to 24-hour format "10:15:00"
 */
function convertTo24Hour(time: string): string {
  const match = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return "12:00:00";
  
  let [_, hours, minutes, period] = match;
  let h = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (period.toUpperCase() === 'AM' && h === 12) h = 0;
  
  return `${h.toString().padStart(2, '0')}:${minutes}:00`;
}

/**
 * Parse flight date and time into a Date object
 */
function parseFlightDateTime(date: string, time: string): Date {
  return new Date(`${date}T${convertTo24Hour(time)}`);
}

/**
 * Calculate time gap in hours between two dates
 */
function calculateGapHours(date1: Date, date2: Date): number {
  return Math.abs(date2.getTime() - date1.getTime()) / (1000 * 60 * 60);
}

/**
 * Cluster flights by time proximity
 * 
 * Algorithm:
 * 1. Sort flights by departure time
 * 2. Start first cluster with first flight
 * 3. For each subsequent flight, check gap from previous flight's arrival
 * 4. If gap <= maxGapHours, add to current cluster
 * 5. If gap > maxGapHours, start new cluster
 * 
 * @param flights Array of flight segments to cluster
 * @param maxGapHours Maximum time gap in hours to keep flights in same cluster (default: 48)
 * @returns Array of flight clusters
 */
export function clusterFlightsByTime(
  flights: FlightSegment[],
  maxGapHours: number = 48
): FlightCluster[] {
  if (flights.length === 0) {
    return [];
  }

  // Parse and sort flights by departure time
  const sortedFlights = flights
    .map(flight => ({
      flight,
      departureTime: parseFlightDateTime(flight.departureDate, flight.departureTime),
      arrivalTime: parseFlightDateTime(flight.arrivalDate, flight.arrivalTime),
    }))
    .sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());

  const clusters: FlightCluster[] = [];
  let currentCluster: typeof sortedFlights = [sortedFlights[0]];

  // Iterate through sorted flights and cluster by time gap
  for (let i = 1; i < sortedFlights.length; i++) {
    const previousFlight = currentCluster[currentCluster.length - 1];
    const currentFlight = sortedFlights[i];

    // Calculate gap between previous flight's arrival and current flight's departure
    const gapHours = calculateGapHours(
      previousFlight.arrivalTime,
      currentFlight.departureTime
    );

    if (gapHours <= maxGapHours) {
      // Add to current cluster
      currentCluster.push(currentFlight);
    } else {
      // Start new cluster
      // First, save the current cluster
      clusters.push(createClusterFromFlights(currentCluster));
      // Start new cluster with current flight
      currentCluster = [currentFlight];
    }
  }

  // Add the last cluster
  if (currentCluster.length > 0) {
    clusters.push(createClusterFromFlights(currentCluster));
  }

  return clusters;
}

/**
 * Create a FlightCluster from an array of flights
 */
function createClusterFromFlights(
  flightsWithTimes: Array<{
    flight: FlightSegment;
    departureTime: Date;
    arrivalTime: Date;
  }>
): FlightCluster {
  const firstFlight = flightsWithTimes[0];
  const lastFlight = flightsWithTimes[flightsWithTimes.length - 1];

  return {
    flights: flightsWithTimes.map(f => f.flight),
    startTime: firstFlight.departureTime,
    endTime: lastFlight.arrivalTime,
    startLocation: firstFlight.flight.departureCity,
    endLocation: lastFlight.flight.arrivalCity,
    startAirport: firstFlight.flight.departureAirport,
    endAirport: lastFlight.flight.arrivalAirport,
  };
}

/**
 * Get a human-readable summary of a cluster
 */
export function getClusterSummary(cluster: FlightCluster): string {
  const flightCount = cluster.flights.length;
  const duration = calculateGapHours(cluster.startTime, cluster.endTime);
  
  return `${flightCount} flight${flightCount > 1 ? 's' : ''} from ${cluster.startLocation} to ${cluster.endLocation} (${duration.toFixed(1)}h)`;
}
