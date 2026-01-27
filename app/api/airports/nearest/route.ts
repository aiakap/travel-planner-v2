import { NextRequest, NextResponse } from "next/server";

/**
 * Find nearest airports to given coordinates
 * Uses Google Places Nearby Search to find airports within a radius
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const limit = parseInt(searchParams.get("limit") || "2");

    console.log("Finding nearest airports for coordinates:", lat, lng);

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Maps API key not configured" },
        { status: 500 }
      );
    }

    // Use Google Places Nearby Search to find airports
    // Start with 50km radius, can expand if needed
    const radius = 100000; // 100km in meters
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=airport&key=${apiKey}`;

    console.log("Calling Google Places Nearby Search...");
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Google Places API error:", response.status);
      return NextResponse.json(
        { error: "Failed to search nearby airports" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.warn("Google Places API status:", data.status);
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    console.log(`Google Places returned ${data.results?.length || 0} nearby airports`);

    // Import IATA mapping functions
    const { extractIATAFromName } = await import("@/lib/data/airport-iata-mappings");

    // Filter and format results
    const airports = (data.results || [])
      .filter((place: any) => {
        // Filter for commercial/international airports
        const name = place.name.toLowerCase();
        const isCommercial = 
          name.includes('international') || 
          name.includes('intl') ||
          place.user_ratings_total > 100;
        
        const isSmall = ['executive', 'municipal', 'county', 'regional'].some(
          pattern => name.includes(pattern)
        );
        
        return isCommercial && !isSmall;
      })
      .slice(0, limit)
      .map((place: any) => {
        const iataCode = extractIATAFromName(place.name) || 'UNK';
        
        // Calculate distance from origin
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          place.geometry.location.lat,
          place.geometry.location.lng
        );
        
        // Extract city from vicinity or formatted address
        const vicinity = place.vicinity || place.formatted_address || '';
        const addressParts = vicinity.split(',');
        const city = addressParts.length > 1 
          ? addressParts[addressParts.length - 2]?.trim() 
          : addressParts[0]?.trim() || '';
        const country = addressParts[addressParts.length - 1]?.trim() || '';

        return {
          iataCode: iataCode,
          name: place.name,
          city: city,
          country: country,
          displayName: `${place.name} (${iataCode})`,
          distance: Math.round(distance),
          distanceUnit: 'km',
          location: place.geometry.location,
          placeId: place.place_id,
          hasIATA: iataCode !== 'UNK',
        };
      })
      .sort((a: any, b: any) => a.distance - b.distance); // Sort by distance

    console.log("Returning nearest airports:", airports.map((a: any) => `${a.iataCode} (${a.distance}km)`));

    return NextResponse.json({ 
      airports,
      count: airports.length,
      status: "success",
      coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) }
    });
  } catch (error: any) {
    console.error("Nearest airports search error:", error);
    return NextResponse.json(
      { 
        error: "Failed to find nearest airports",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
