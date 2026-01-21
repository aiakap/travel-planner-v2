export interface GlobeReservation {
  id: string;
  name: string;
  location: string | null;
  departureLocation: string | null;
  arrivalLocation: string | null;
  startTime: string | null;
  endTime: string | null;
  confirmationNumber: string | null;
  notes: string | null;
  cost: number | null;
  currency: string | null;
  imageUrl: string | null;
  reservationType: {
    name: string;
    category: {
      name: string;
    };
  };
}

export interface GlobeSegment {
  id: string;
  name: string;
  startTitle: string;
  startLat: number;
  startLng: number;
  endTitle: string;
  endLat: number;
  endLng: number;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  imageUrl: string | null;
  segmentType: {
    name: string;
  };
  reservations: GlobeReservation[];
}

export interface GlobeTripData {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  startDate: string;
  endDate: string;
  segments: GlobeSegment[];
  // Calculated fields
  totalDistance: number;
  countries: string[];
  color: string;
}

export interface TravelStats {
  totalTrips: number;
  countriesVisited: Set<string>;
  totalDistanceKm: number;
  timesAroundWorld: number;
}

export interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  tripId: string;
  tripTitle: string;
  segmentName: string;
}
