/**
 * Utility functions for generating Google Maps Static API URLs
 */

interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  color?: string;
}

interface PathPoint {
  lat: number;
  lng: number;
}

/**
 * Generate a static map URL for a trip route
 */
export function generateTripMapUrl(
  segments: Array<{ startLat: number; startLng: number; endLat: number; endLng: number }>,
  width: number = 400,
  height: number = 200,
  zoom?: number
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || segments.length === 0) {
    return "/placeholder.svg";
  }

  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams();
  
  params.append("size", `${width}x${height}`);
  params.append("maptype", "roadmap");
  params.append("key", apiKey);
  
  // Add markers for start and end points
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  
  params.append("markers", `color:green|label:S|${firstSegment.startLat},${firstSegment.startLng}`);
  params.append("markers", `color:red|label:E|${lastSegment.endLat},${lastSegment.endLng}`);
  
  // Add path through all segments
  const pathPoints = segments.flatMap(seg => [
    `${seg.startLat},${seg.startLng}`,
    `${seg.endLat},${seg.endLng}`,
  ]);
  
  params.append("path", `color:0x0000ff80|weight:3|${pathPoints.join("|")}`);
  
  // Add style for cleaner look
  params.append("style", "feature:poi|visibility:off");
  params.append("style", "feature:transit|visibility:off");
  
  if (zoom) {
    params.append("zoom", zoom.toString());
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a static map URL for a single location
 */
export function generateLocationMapUrl(
  lat: number,
  lng: number,
  width: number = 400,
  height: number = 200,
  zoom: number = 15,
  markerColor: string = "red"
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return "/placeholder.svg";
  }

  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams();
  
  params.append("center", `${lat},${lng}`);
  params.append("zoom", zoom.toString());
  params.append("size", `${width}x${height}`);
  params.append("maptype", "roadmap");
  params.append("markers", `color:${markerColor}|${lat},${lng}`);
  params.append("key", apiKey);
  
  // Clean style
  params.append("style", "feature:poi|visibility:simplified");

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a static map URL with multiple markers
 */
export function generateMultiMarkerMapUrl(
  markers: MapMarker[],
  width: number = 400,
  height: number = 200,
  zoom?: number
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || markers.length === 0) {
    return "/placeholder.svg";
  }

  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams();
  
  params.append("size", `${width}x${height}`);
  params.append("maptype", "roadmap");
  params.append("key", apiKey);
  
  // Add markers
  markers.forEach((marker, idx) => {
    const color = marker.color || "red";
    const label = marker.label || (idx + 1).toString();
    params.append("markers", `color:${color}|label:${label}|${marker.lat},${marker.lng}`);
  });
  
  if (zoom) {
    params.append("zoom", zoom.toString());
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a static map URL for a day's itinerary
 */
export function generateDayItineraryMapUrl(
  locations: Array<{ lat: number; lng: number; name: string }>,
  width: number = 600,
  height: number = 300
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || locations.length === 0) {
    return "/placeholder.svg";
  }

  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams();
  
  params.append("size", `${width}x${height}`);
  params.append("maptype", "roadmap");
  params.append("key", apiKey);
  
  // Add numbered markers for each location
  locations.forEach((loc, idx) => {
    const label = (idx + 1).toString();
    params.append("markers", `color:blue|label:${label}|${loc.lat},${loc.lng}`);
  });
  
  // Add path connecting the locations
  if (locations.length > 1) {
    const pathPoints = locations.map(loc => `${loc.lat},${loc.lng}`).join("|");
    params.append("path", `color:0x0000ff80|weight:2|${pathPoints}`);
  }
  
  // Clean style
  params.append("style", "feature:poi|visibility:simplified");

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Convert hex color to Google Maps Static API color format (0xRRGGBBAA)
 */
function hexToGoogleColor(hex: string, alpha: string = 'cc'): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  return `0x${cleanHex}${alpha}`;
}

interface SegmentWithColor {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  startTitle: string;
  endTitle: string;
  color: string;
}

/**
 * Generate a static map URL for a full trip with colored segments and numbered markers.
 * Each segment can have its own color, and all unique locations are numbered.
 */
export function generateFullTripMapUrl(
  segments: SegmentWithColor[],
  width: number = 600,
  height: number = 400
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey || segments.length === 0) {
    return "/placeholder.svg";
  }

  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams();
  
  params.append("size", `${width}x${height}`);
  params.append("maptype", "roadmap");
  params.append("key", apiKey);
  
  // Collect unique locations with their indices
  const uniqueLocations = new Map<string, { lat: number; lng: number; index: number }>();
  let locationIndex = 1;
  
  segments.forEach(seg => {
    const startKey = `${seg.startLat.toFixed(4)},${seg.startLng.toFixed(4)}`;
    const endKey = `${seg.endLat.toFixed(4)},${seg.endLng.toFixed(4)}`;
    
    if (!uniqueLocations.has(startKey)) {
      uniqueLocations.set(startKey, { lat: seg.startLat, lng: seg.startLng, index: locationIndex++ });
    }
    if (!uniqueLocations.has(endKey)) {
      uniqueLocations.set(endKey, { lat: seg.endLat, lng: seg.endLng, index: locationIndex++ });
    }
  });
  
  // Add numbered markers for each unique location
  uniqueLocations.forEach((loc, key) => {
    const label = loc.index <= 9 ? loc.index.toString() : String.fromCharCode(64 + loc.index - 9); // 1-9, then A-Z
    params.append("markers", `color:red|label:${label}|${loc.lat},${loc.lng}`);
  });
  
  // Add colored paths for each segment
  segments.forEach((seg, idx) => {
    const googleColor = hexToGoogleColor(seg.color);
    const pathPoints = `${seg.startLat},${seg.startLng}|${seg.endLat},${seg.endLng}`;
    params.append("path", `color:${googleColor}|weight:4|${pathPoints}`);
  });
  
  // Add style for cleaner look
  params.append("style", "feature:poi|visibility:off");
  params.append("style", "feature:transit|visibility:off");

  return `${baseUrl}?${params.toString()}`;
}
