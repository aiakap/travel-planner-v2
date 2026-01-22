/**
 * Generate a static map URL for a trip suggestion
 * Uses Google Maps Static API
 * 
 * This is a pure utility function (no "use server" directive)
 * Can be used in both client and server components
 */
export function generateSuggestionMapUrl(
  suggestion: {
    destinationLat: number;
    destinationLng: number;
    keyLocations: Array<{ lat: number; lng: number; name: string }>;
    tripType: string;
  },
  width: number = 300,
  height: number = 150
): string {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return "/placeholder.svg";
  }

  const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
  const params = new URLSearchParams();
  
  params.append("size", `${width}x${height}`);
  params.append("maptype", "roadmap");
  params.append("key", apiKey);
  
  // Style for clean look
  params.append("style", "feature:poi|visibility:off");
  params.append("style", "feature:transit|visibility:simplified");
  
  if (suggestion.keyLocations && suggestion.keyLocations.length > 1) {
    // Multi-destination: show route with markers
    suggestion.keyLocations.forEach((loc, idx) => {
      const label = (idx + 1).toString();
      params.append("markers", `color:blue|label:${label}|${loc.lat},${loc.lng}`);
    });
    
    // Add path connecting locations
    const pathPoints = suggestion.keyLocations
      .map(loc => `${loc.lat},${loc.lng}`)
      .join("|");
    params.append("path", `color:0x4F46E580|weight:3|${pathPoints}`);
  } else {
    // Single destination: centered marker
    params.append("center", `${suggestion.destinationLat},${suggestion.destinationLng}`);
    params.append("zoom", "10");
    params.append("markers", `color:red|${suggestion.destinationLat},${suggestion.destinationLng}`);
  }

  return `${baseUrl}?${params.toString()}`;
}
