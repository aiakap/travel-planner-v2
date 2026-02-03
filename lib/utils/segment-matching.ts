/**
 * Segment Matching Utility
 * 
 * Intelligently matches flight clusters and hotel reservations to existing trip segments
 * based on date overlap, location matching, and segment type.
 */

import { FlightCluster } from './flight-clustering';
import { HotelCluster } from './hotel-clustering';
import { CarRentalCluster } from './car-rental-clustering';

export interface Segment {
  id: string;
  name: string;
  startTitle: string;
  endTitle: string;
  startTime: string | null;
  endTime: string | null;
  order: number;
  segmentType?: {
    name: string;
  };
}

export interface SegmentMatch {
  segmentId: string;
  segmentName: string;
  score: number; // 0-100
  reason: string;
  breakdown: {
    dateOverlap: number;
    locationMatch: number;
    segmentType: number;
  };
}

export interface TravelMatchInput {
  startTime: Date;
  endTime: Date;
  startLocation: string;
  endLocation: string;
}

/**
 * Normalize location string for matching
 * Handles variations like "San Francisco, CA, US" vs "San Francisco"
 */
function normalizeLocation(location: string): string {
  // Remove country codes and extra whitespace
  return location
    .toLowerCase()
    .replace(/,\s*(usa?|united states|jp|japan|uk|united kingdom)/gi, '')
    .replace(/\s*\([^)]*\)/g, '') // Remove parentheses and contents
    .trim();
}

/**
 * Check if two locations match (fuzzy matching)
 */
function locationsMatch(loc1: string, loc2: string): boolean {
  const norm1 = normalizeLocation(loc1);
  const norm2 = normalizeLocation(loc2);
  
  // Exact match
  if (norm1 === norm2) return true;
  
  // Check if one contains the other (handles "San Francisco" vs "San Francisco, CA")
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
  
  // Check first major word (city name)
  const city1 = norm1.split(',')[0].trim();
  const city2 = norm2.split(',')[0].trim();
  
  return city1 === city2;
}

/**
 * Calculate date overlap score (0-40 points)
 * Checks if cluster times fall within segment date range
 */
function calculateDateOverlapScore(
  cluster: FlightCluster,
  segment: Segment
): number {
  if (!segment.startTime || !segment.endTime) {
    return 0; // No dates on segment
  }

  const segmentStart = new Date(segment.startTime);
  const segmentEnd = new Date(segment.endTime);
  const clusterStart = cluster.startTime;
  const clusterEnd = cluster.endTime;

  // Check if cluster is completely within segment
  if (clusterStart >= segmentStart && clusterEnd <= segmentEnd) {
    return 40; // Perfect date overlap
  }

  // Check if there's any overlap
  const hasOverlap = (
    (clusterStart >= segmentStart && clusterStart <= segmentEnd) ||
    (clusterEnd >= segmentStart && clusterEnd <= segmentEnd) ||
    (clusterStart <= segmentStart && clusterEnd >= segmentEnd)
  );

  if (hasOverlap) {
    return 30; // Partial overlap
  }

  // Check if cluster is within 24 hours of segment
  const dayInMs = 24 * 60 * 60 * 1000;
  const beforeSegment = segmentStart.getTime() - clusterEnd.getTime();
  const afterSegment = clusterStart.getTime() - segmentEnd.getTime();

  if (beforeSegment > 0 && beforeSegment <= dayInMs) {
    return 20; // Within 24h before segment
  }

  if (afterSegment > 0 && afterSegment <= dayInMs) {
    return 20; // Within 24h after segment
  }

  return 0; // No meaningful date relationship
}

/**
 * Calculate location match score (0-40 points)
 * - 20 points for start location match
 * - 20 points for end location match
 */
function calculateLocationScore(
  cluster: FlightCluster,
  segment: Segment
): number {
  let score = 0;

  // Check start location (20 points)
  if (locationsMatch(cluster.startLocation, segment.startTitle)) {
    score += 20;
  }

  // Check end location (20 points)
  if (locationsMatch(cluster.endLocation, segment.endTitle)) {
    score += 20;
  }

  return score;
}

/**
 * Calculate segment type score (0-20 points)
 * Prefers travel-related segment types
 */
function calculateSegmentTypeScore(segment: Segment): number {
  const segmentTypeName = segment.segmentType?.name?.toLowerCase() || '';
  
  const travelTypes = ['flight', 'drive', 'train', 'ferry', 'travel'];
  
  if (travelTypes.some(type => segmentTypeName.includes(type))) {
    return 20;
  }

  return 10; // Generic segment
}

function isTravelSegment(segment: Segment): boolean {
  const segmentTypeName = segment.segmentType?.name?.toLowerCase() || '';
  const travelTypes = ['flight', 'drive', 'train', 'ferry', 'travel'];
  return travelTypes.some(type => segmentTypeName.includes(type));
}

/**
 * Calculate time proximity score for travel segment matching (0-60 points)
 */
function calculateTimeProximityScore(
  input: TravelMatchInput,
  segment: Segment
): number {
  if (!segment.startTime || !segment.endTime) {
    return 0;
  }

  const segmentStart = new Date(segment.startTime);
  const segmentEnd = new Date(segment.endTime);

  const overlaps = input.startTime <= segmentEnd && input.endTime >= segmentStart;
  if (overlaps) {
    return 60;
  }

  const gapMs = Math.min(
    Math.abs(input.startTime.getTime() - segmentEnd.getTime()),
    Math.abs(segmentStart.getTime() - input.endTime.getTime())
  );
  const gapHours = gapMs / (1000 * 60 * 60);

  if (gapHours <= 6) return 55;
  if (gapHours <= 24) return 45;
  if (gapHours <= 48) return 35;
  if (gapHours <= 72) return 25;
  if (gapHours <= 120) return 15;
  return 5;
}

/**
 * Calculate location match score for travel segment matching (0-40 points)
 */
function calculateTravelLocationScore(
  input: TravelMatchInput,
  segment: Segment
): number {
  let score = 0;

  if (input.startLocation && locationsMatch(input.startLocation, segment.startTitle)) {
    score += 20;
  }

  if (input.endLocation && locationsMatch(input.endLocation, segment.endTitle)) {
    score += 20;
  }

  return score;
}

/**
 * Find the closest Travel segment based on time proximity + location match.
 * Returns null when there are no Travel segments.
 */
export function findClosestTravelSegment(
  input: TravelMatchInput,
  segments: Segment[]
): SegmentMatch | null {
  const travelSegments = segments.filter(isTravelSegment);
  if (travelSegments.length === 0) {
    return null;
  }

  let bestMatch: SegmentMatch | null = null;

  for (const segment of travelSegments) {
    const timeScore = calculateTimeProximityScore(input, segment);
    const locationScore = calculateTravelLocationScore(input, segment);
    const totalScore = timeScore + locationScore;

    const reasons: string[] = [];
    if (timeScore >= 45) reasons.push('close in time');
    if (locationScore >= 30) reasons.push('locations match well');
    if (locationScore >= 20 && locationScore < 30) reasons.push('partial location match');

    const match: SegmentMatch = {
      segmentId: segment.id,
      segmentName: segment.name,
      score: totalScore,
      reason: reasons.length > 0 ? reasons.join(', ') : 'closest travel segment',
      breakdown: {
        dateOverlap: timeScore,
        locationMatch: locationScore,
        segmentType: 20,
      },
    };

    if (!bestMatch || totalScore > bestMatch.score) {
      bestMatch = match;
    }
  }

  return bestMatch;
}

/**
 * Find the best matching segment for a flight cluster
 * 
 * Scoring:
 * - Date overlap: 0-40 points
 * - Location match: 0-40 points (20 per location)
 * - Segment type: 0-20 points
 * 
 * Threshold: Score >= 60 to match
 * 
 * @param cluster Flight cluster to match
 * @param segments Available segments
 * @param minScore Minimum score threshold (default: 60)
 * @returns Best matching segment or null if no good match
 */
export function findBestSegmentForCluster(
  cluster: FlightCluster,
  segments: Segment[],
  minScore: number = 60
): SegmentMatch | null {
  if (segments.length === 0) {
    return null;
  }

  let bestMatch: SegmentMatch | null = null;

  for (const segment of segments) {
    const dateScore = calculateDateOverlapScore(cluster, segment);
    const locationScore = calculateLocationScore(cluster, segment);
    const typeScore = calculateSegmentTypeScore(segment);

    const totalScore = dateScore + locationScore + typeScore;

    // Build reason string
    const reasons: string[] = [];
    if (dateScore >= 30) reasons.push('dates overlap');
    if (locationScore >= 30) reasons.push('locations match well');
    if (locationScore >= 20 && locationScore < 30) reasons.push('partial location match');
    if (typeScore === 20) reasons.push('travel segment type');

    const match: SegmentMatch = {
      segmentId: segment.id,
      segmentName: segment.name,
      score: totalScore,
      reason: reasons.length > 0 ? reasons.join(', ') : 'basic match',
      breakdown: {
        dateOverlap: dateScore,
        locationMatch: locationScore,
        segmentType: typeScore,
      },
    };

    // Keep track of best match
    if (!bestMatch || totalScore > bestMatch.score) {
      bestMatch = match;
    }
  }

  // Only return if score meets threshold
  if (bestMatch && bestMatch.score >= minScore) {
    return bestMatch;
  }

  return null;
}

/**
 * Match all clusters to segments
 * Returns matches for each cluster (or null if no good match)
 */
export function matchClustersToSegments(
  clusters: FlightCluster[],
  segments: Segment[],
  minScore: number = 60
): Array<SegmentMatch | null> {
  return clusters.map(cluster => 
    findBestSegmentForCluster(cluster, segments, minScore)
  );
}

/**
 * Calculate date overlap score for hotels (0-50 points)
 * Hotels get higher weight on dates since they're stationary
 */
function calculateHotelDateOverlapScore(
  hotel: HotelCluster,
  segment: Segment
): number {
  if (!segment.startTime || !segment.endTime) {
    return 0; // No dates on segment
  }

  const segmentStart = new Date(segment.startTime);
  const segmentEnd = new Date(segment.endTime);
  const hotelStart = hotel.startTime;
  const hotelEnd = hotel.endTime;

  // Check if hotel stay is completely within segment
  if (hotelStart >= segmentStart && hotelEnd <= segmentEnd) {
    return 50; // Perfect date overlap
  }

  // Check if there's any overlap
  const hasOverlap = (
    (hotelStart >= segmentStart && hotelStart <= segmentEnd) ||
    (hotelEnd >= segmentStart && hotelEnd <= segmentEnd) ||
    (hotelStart <= segmentStart && hotelEnd >= segmentEnd)
  );

  if (hasOverlap) {
    return 35; // Partial overlap
  }

  // Check if hotel is within 24 hours of segment
  const dayInMs = 24 * 60 * 60 * 1000;
  const beforeSegment = segmentStart.getTime() - hotelEnd.getTime();
  const afterSegment = hotelStart.getTime() - segmentEnd.getTime();

  if (beforeSegment > 0 && beforeSegment <= dayInMs) {
    return 20; // Within 24h before segment
  }

  if (afterSegment > 0 && afterSegment <= dayInMs) {
    return 20; // Within 24h after segment
  }

  return 0; // No meaningful date relationship
}

/**
 * Calculate location match score for hotels (0-30 points)
 * Hotels are stationary, so we check if hotel location matches segment location
 */
function calculateHotelLocationScore(
  hotel: HotelCluster,
  segment: Segment
): number {
  let score = 0;

  // Check if hotel location matches segment start or end location
  if (locationsMatch(hotel.location, segment.startTitle)) {
    score += 15;
  }

  if (locationsMatch(hotel.location, segment.endTitle)) {
    score += 15;
  }

  return score;
}

/**
 * Calculate segment type score for hotels (0-20 points)
 * Prefers "Stay" segment types
 */
function calculateHotelSegmentTypeScore(segment: Segment): number {
  const segmentTypeName = segment.segmentType?.name?.toLowerCase() || '';
  
  const stayTypes = ['stay', 'accommodation', 'lodging'];
  
  if (stayTypes.some(type => segmentTypeName.includes(type))) {
    return 20;
  }

  return 10; // Generic segment
}

/**
 * Find the best matching segment for a hotel reservation
 * 
 * Scoring:
 * - Date overlap: 0-50 points (higher weight than flights)
 * - Location match: 0-30 points
 * - Segment type: 0-20 points
 * 
 * Threshold: Score >= 70 to match (higher than flights due to higher date weight)
 * 
 * @param hotel Hotel cluster to match
 * @param segments Available segments
 * @param minScore Minimum score threshold (default: 70)
 * @returns Best matching segment or null if no good match
 */
export function findBestSegmentForHotel(
  hotel: HotelCluster,
  segments: Segment[],
  minScore: number = 70
): SegmentMatch | null {
  if (segments.length === 0) {
    return null;
  }

  let bestMatch: SegmentMatch | null = null;

  for (const segment of segments) {
    const dateScore = calculateHotelDateOverlapScore(hotel, segment);
    const locationScore = calculateHotelLocationScore(hotel, segment);
    const typeScore = calculateHotelSegmentTypeScore(segment);

    const totalScore = dateScore + locationScore + typeScore;

    // Build reason string
    const reasons: string[] = [];
    if (dateScore >= 35) reasons.push('dates overlap');
    if (locationScore >= 20) reasons.push('location matches');
    if (locationScore >= 10 && locationScore < 20) reasons.push('partial location match');
    if (typeScore === 20) reasons.push('stay segment type');

    const match: SegmentMatch = {
      segmentId: segment.id,
      segmentName: segment.name,
      score: totalScore,
      reason: reasons.length > 0 ? reasons.join(', ') : 'basic match',
      breakdown: {
        dateOverlap: dateScore,
        locationMatch: locationScore,
        segmentType: typeScore,
      },
    };

    // Keep track of best match
    if (!bestMatch || totalScore > bestMatch.score) {
      bestMatch = match;
    }
  }

  // Only return if score meets threshold
  if (bestMatch && bestMatch.score >= minScore) {
    return bestMatch;
  }

  return null;
}

/**
 * Calculate date overlap score for car rentals (0-50 points)
 * Car rentals get higher weight on dates since they span the entire rental period
 */
function calculateCarRentalDateOverlapScore(
  carRental: CarRentalCluster,
  segment: Segment
): number {
  if (!segment.startTime || !segment.endTime) {
    return 0; // No dates on segment
  }

  const segmentStart = new Date(segment.startTime);
  const segmentEnd = new Date(segment.endTime);
  const rentalStart = carRental.pickupDate;
  const rentalEnd = carRental.returnDate;

  // Check if rental period is completely within segment
  if (rentalStart >= segmentStart && rentalEnd <= segmentEnd) {
    return 50; // Perfect date overlap
  }

  // Check if there's any overlap
  const hasOverlap = (
    (rentalStart >= segmentStart && rentalStart <= segmentEnd) ||
    (rentalEnd >= segmentStart && rentalEnd <= segmentEnd) ||
    (rentalStart <= segmentStart && rentalEnd >= segmentEnd)
  );

  if (hasOverlap) {
    return 35; // Partial overlap
  }

  // Check if rental is within 24 hours of segment
  const dayInMs = 24 * 60 * 60 * 1000;
  const beforeSegment = segmentStart.getTime() - rentalEnd.getTime();
  const afterSegment = rentalStart.getTime() - segmentEnd.getTime();

  if (beforeSegment > 0 && beforeSegment <= dayInMs) {
    return 20; // Within 24h before segment
  }

  if (afterSegment > 0 && afterSegment <= dayInMs) {
    return 20; // Within 24h after segment
  }

  return 0; // No meaningful date relationship
}

/**
 * Calculate location match score for car rentals (0-30 points)
 * Check if pickup/return locations match segment start/end locations
 */
function calculateCarRentalLocationScore(
  carRental: CarRentalCluster,
  segment: Segment
): number {
  let score = 0;

  // Check pickup location matches segment start (15 points)
  if (locationsMatch(carRental.pickupLocation, segment.startTitle)) {
    score += 15;
  }

  // Check return location matches segment end (15 points)
  if (locationsMatch(carRental.returnLocation, segment.endTitle)) {
    score += 15;
  }

  return score;
}

/**
 * Calculate segment type score for car rentals (0-20 points)
 * Prefers "Drive" or "Travel" segment types
 */
function calculateCarRentalSegmentTypeScore(segment: Segment): number {
  const segmentTypeName = segment.segmentType?.name?.toLowerCase() || '';
  
  const driveTypes = ['drive', 'road trip', 'car'];
  const travelTypes = ['travel', 'transport', 'transit'];
  
  if (driveTypes.some(type => segmentTypeName.includes(type))) {
    return 20; // Perfect match for drive segments
  }
  
  if (travelTypes.some(type => segmentTypeName.includes(type))) {
    return 15; // Good match for travel segments
  }
  
  // Generic segment gets some points
  return 10;
}

/**
 * Find the best matching segment for a car rental
 * 
 * Scoring:
 * - Date overlap: 0-50 points (rental period vs segment dates)
 * - Location match: 0-30 points (pickup/return vs segment start/end)
 * - Segment type: 0-20 points (prefers "Drive" or "Travel" types)
 * 
 * Total: 0-100 points
 * Threshold: 70 points for high confidence match
 */
export function findBestSegmentForCarRental(
  carRental: CarRentalCluster,
  segments: Segment[],
  minScore: number = 70
): SegmentMatch | null {
  if (segments.length === 0) {
    return null;
  }

  let bestMatch: SegmentMatch | null = null;

  for (const segment of segments) {
    const dateScore = calculateCarRentalDateOverlapScore(carRental, segment);
    const locationScore = calculateCarRentalLocationScore(carRental, segment);
    const typeScore = calculateCarRentalSegmentTypeScore(segment);

    const totalScore = dateScore + locationScore + typeScore;

    // Build reason string
    const reasons: string[] = [];
    if (dateScore >= 35) reasons.push('dates overlap');
    if (locationScore >= 20) reasons.push('locations match');
    if (locationScore >= 10 && locationScore < 20) reasons.push('partial location match');
    if (typeScore === 20) reasons.push('drive segment type');

    const match: SegmentMatch = {
      segmentId: segment.id,
      segmentName: segment.name,
      score: totalScore,
      reason: reasons.length > 0 ? reasons.join(', ') : 'basic match',
      breakdown: {
        dateOverlap: dateScore,
        locationMatch: locationScore,
        segmentType: typeScore
      }
    };

    // Keep track of best match
    if (!bestMatch || totalScore > bestMatch.score) {
      bestMatch = match;
    }
  }

  // Only return if score meets threshold
  if (bestMatch && bestMatch.score >= minScore) {
    return bestMatch;
  }

  return null;
}

/**
 * Extended interface for car rental matches
 */
export interface CarRentalMatch extends SegmentMatch {
  isOneWay: boolean;
  pickupLocation: string;
  returnLocation: string;
}
