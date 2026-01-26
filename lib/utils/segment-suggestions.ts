/**
 * Segment Suggestion Utility
 * 
 * Suggests new segments to create when flight clusters don't match
 * existing segments well.
 */

import { FlightCluster } from './flight-clustering';
import { Segment } from './segment-matching';

export interface SegmentSuggestion {
  name: string;
  startLocation: string;
  endLocation: string;
  startTime: Date;
  endTime: Date;
  segmentType: "Flight";
  reason: string;
  cluster: FlightCluster;
}

/**
 * Extract city name from full location string
 * "San Francisco, CA, US (SFO)" → "San Francisco"
 */
function extractCityName(location: string): string {
  // Remove airport codes in parentheses
  let city = location.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Take first part before comma (city name)
  const parts = city.split(',');
  return parts[0].trim();
}

/**
 * Detect if cluster represents a return journey
 * Checks if end location matches trip's origin
 */
function isReturnJourney(
  cluster: FlightCluster,
  existingSegments: Segment[]
): boolean {
  if (existingSegments.length === 0) return false;

  // Get the first segment's start location (likely origin)
  const firstSegment = existingSegments.sort((a, b) => a.order - b.order)[0];
  const originLocation = firstSegment.startTitle;

  // Check if cluster ends at origin
  const endCity = extractCityName(cluster.endLocation);
  const originCity = extractCityName(originLocation);

  return endCity.toLowerCase() === originCity.toLowerCase();
}

/**
 * Detect if cluster represents departure from origin
 */
function isDepartureFromOrigin(
  cluster: FlightCluster,
  existingSegments: Segment[]
): boolean {
  if (existingSegments.length === 0) return false;

  const firstSegment = existingSegments.sort((a, b) => a.order - b.order)[0];
  const originLocation = firstSegment.startTitle;

  const startCity = extractCityName(cluster.startLocation);
  const originCity = extractCityName(originLocation);

  return startCity.toLowerCase() === originCity.toLowerCase();
}

/**
 * Generate appropriate segment name based on cluster characteristics
 */
function generateSegmentName(
  cluster: FlightCluster,
  existingSegments: Segment[]
): string {
  const startCity = extractCityName(cluster.startLocation);
  const endCity = extractCityName(cluster.endLocation);

  // Check if this is a return journey
  if (isReturnJourney(cluster, existingSegments)) {
    return `Return from ${startCity}`;
  }

  // Check if this is departure from origin
  if (isDepartureFromOrigin(cluster, existingSegments)) {
    return `Travel to ${endCity}`;
  }

  // Generic: from A to B
  return `${startCity} to ${endCity}`;
}

/**
 * Generate reason for suggesting this segment
 */
function generateSuggestionReason(
  cluster: FlightCluster,
  existingSegments: Segment[]
): string {
  const reasons: string[] = [];

  if (isReturnJourney(cluster, existingSegments)) {
    reasons.push('return journey detected');
  } else if (isDepartureFromOrigin(cluster, existingSegments)) {
    reasons.push('outbound journey from origin');
  } else {
    reasons.push('distinct travel leg');
  }

  if (cluster.flights.length > 1) {
    reasons.push(`${cluster.flights.length} connecting flights`);
  }

  return reasons.join(', ');
}

/**
 * Suggest a new segment for a flight cluster
 * 
 * Creates an appropriate segment suggestion when no existing segment
 * matches well enough.
 * 
 * @param cluster Flight cluster needing a segment
 * @param existingSegments Existing trip segments for context
 * @returns Segment suggestion
 */
export function suggestSegmentForCluster(
  cluster: FlightCluster,
  existingSegments: Segment[]
): SegmentSuggestion {
  const name = generateSegmentName(cluster, existingSegments);
  const reason = generateSuggestionReason(cluster, existingSegments);

  return {
    name,
    startLocation: cluster.startLocation,
    endLocation: cluster.endLocation,
    startTime: cluster.startTime,
    endTime: cluster.endTime,
    segmentType: "Flight",
    reason,
    cluster,
  };
}

/**
 * Generate suggestions for all clusters without good matches
 */
export function generateSegmentSuggestions(
  clusters: FlightCluster[],
  existingSegments: Segment[],
  matches: Array<any | null>
): SegmentSuggestion[] {
  const suggestions: SegmentSuggestion[] = [];

  clusters.forEach((cluster, index) => {
    if (!matches[index]) {
      // No good match found, create suggestion
      suggestions.push(suggestSegmentForCluster(cluster, existingSegments));
    }
  });

  return suggestions;
}

/**
 * Get summary text for a suggestion
 */
export function getSuggestionSummary(suggestion: SegmentSuggestion): string {
  return `Create "${suggestion.name}" segment for ${suggestion.cluster.flights.length} flight(s)`;
}
