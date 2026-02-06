import { NextRequest, NextResponse } from "next/server";
import { findNearestAirports } from "@/lib/amadeus/locations";

/**
 * Find nearest airports to given coordinates
 * Uses Amadeus API to find airports within a radius
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

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude values" },
        { status: 400 }
      );
    }

    // Use Amadeus to find nearby airports (100km radius)
    const radius = 100; // km
    const amadeusResults = await findNearestAirports(latitude, longitude, radius);

    console.log(`Amadeus returned ${amadeusResults.length} nearby airports`);

    // Format results and limit to requested count
    const airports = amadeusResults
      .slice(0, limit)
      .map((airport: any) => {
        // Calculate distance from origin
        const distance = airport.distance?.value || calculateDistance(
          latitude,
          longitude,
          airport.geoCode?.latitude,
          airport.geoCode?.longitude
        );

        return {
          iataCode: airport.iataCode,
          name: airport.name,
          city: airport.address?.cityName || "",
          country: airport.address?.countryName || "",
          displayName: `${airport.name} (${airport.iataCode})`,
          distance: Math.round(distance),
          distanceUnit: "km",
          location: airport.geoCode ? {
            lat: airport.geoCode.latitude,
            lng: airport.geoCode.longitude
          } : null,
          hasIATA: true, // Amadeus always returns IATA codes
        };
      });

    console.log("Returning nearest airports:", airports.map((a: any) => `${a.iataCode} (${a.distance}km)`));

    return NextResponse.json({ 
      airports,
      count: airports.length,
      status: "success",
      coordinates: { lat: latitude, lng: longitude }
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
