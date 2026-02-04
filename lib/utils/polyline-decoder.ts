/**
 * Polyline Decoder Utility
 * Decodes Google encoded polyline strings into arrays of lat/lng coordinates
 * 
 * @see https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Decode a Google encoded polyline string into an array of lat/lng coordinates
 * Based on the Google Polyline Algorithm
 * 
 * @param encoded - The encoded polyline string from Google Routes API
 * @returns Array of lat/lng coordinates
 */
export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;
    
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    // Decode longitude
    shift = 0;
    result = 0;
    
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

/**
 * Encode an array of lat/lng coordinates into a Google encoded polyline string
 * This is the reverse operation of decodePolyline
 * 
 * @param points - Array of lat/lng coordinates
 * @returns Encoded polyline string
 */
export function encodePolyline(points: LatLng[]): string {
  let encoded = '';
  let prevLat = 0;
  let prevLng = 0;

  for (const point of points) {
    const lat = Math.round(point.lat * 1e5);
    const lng = Math.round(point.lng * 1e5);

    encoded += encodeNumber(lat - prevLat);
    encoded += encodeNumber(lng - prevLng);

    prevLat = lat;
    prevLng = lng;
  }

  return encoded;
}

/**
 * Encode a single number for the polyline algorithm
 */
function encodeNumber(num: number): string {
  let encoded = '';
  let value = num < 0 ? ~(num << 1) : num << 1;

  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }

  encoded += String.fromCharCode(value + 63);
  return encoded;
}

/**
 * Get the midpoint of a polyline path
 * Useful for placing icons/markers along the route
 * 
 * @param path - Array of lat/lng coordinates
 * @returns The midpoint coordinate, or null if path is empty
 */
export function getPolylineMidpoint(path: LatLng[]): LatLng | null {
  if (path.length === 0) return null;
  if (path.length === 1) return path[0];
  
  // Find the point closest to the middle of the path
  const midIndex = Math.floor(path.length / 2);
  return path[midIndex];
}

/**
 * Calculate the total distance of a polyline path in meters
 * Uses the Haversine formula
 * 
 * @param path - Array of lat/lng coordinates
 * @returns Distance in meters
 */
export function calculatePolylineDistance(path: LatLng[]): number {
  if (path.length < 2) return 0;
  
  let totalDistance = 0;
  
  for (let i = 1; i < path.length; i++) {
    totalDistance += haversineDistance(path[i - 1], path[i]);
  }
  
  return totalDistance;
}

/**
 * Calculate the distance between two points using the Haversine formula
 * 
 * @param p1 - First point
 * @param p2 - Second point
 * @returns Distance in meters
 */
function haversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(p2.lat - p1.lat);
  const dLng = toRad(p2.lng - p1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
