/**
 * Segment Matching Utility
 * 
 * Intelligently matches flight clusters to existing trip segments
 * based on date overlap, location matching, and segment type.
 */

import { FlightCluster } from './flight-clustering';

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
