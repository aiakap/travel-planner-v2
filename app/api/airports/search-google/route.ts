import { NextRequest, NextResponse } from "next/server";
import { extractIATAFromName } from "@/lib/data/airport-iata-mappings";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || searchParams.get("keyword");

    console.log("Google Places airport search called with query:", query);

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
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

    // Strategy: Search for airports near the location
    // First, try to find airports with the query name
    const searchQuery = query.toLowerCase().includes('airport') 
      ? query 
      : `airports near ${query}`;
    
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      searchQuery
    )}&type=airport&key=${apiKey}`;

    console.log("Calling Google Places API with query:", searchQuery);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Google Places API error:", response.status);
      return NextResponse.json(
        { error: "Failed to search airports" },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (data.status !== "OK") {
      console.warn("Google Places API status:", data.status);
      if (data.status === "ZERO_RESULTS") {
        return NextResponse.json({ 
          airports: [],
          count: 0,
          status: "success",
          source: "google"
        });
      }
      return NextResponse.json(
        { error: `Google Places API error: ${data.status}` },
        { status: 500 }
      );
    }

    console.log(`Google Places returned ${data.results?.length || 0} results`);

    // Format results to match airport structure
    // Filter for commercial airports (exclude small general aviation)
    const formattedResults = (data.results || [])
      .filter((place: any) => {
        if (!place.types?.includes('airport')) return false;
        
        // Filter out small general aviation airports by checking name patterns
        const name = place.name.toLowerCase();
        
        // Exclude known small airports
        const smallAirportPatterns = [
          'executive', 'municipal', 'county', 'regional',
          'airpark', 'airfield', 'heliport'
        ];
        const isSmallAirport = smallAirportPatterns.some(pattern => name.includes(pattern));
        
        if (isSmallAirport) return false;
        
        // Include if it has "international" or "intl" in name
        const isLikelyCommercial = 
          name.includes('international') || 
          name.includes('intl');
        
        return isLikelyCommercial;
      })
      .slice(0, 10)
      .map((place: any) => {
        const iataCode = extractIATAFromName(place.name) || 'UNK';
        
        // Extract city and country from address
        const addressParts = place.formatted_address?.split(',') || [];
        const country = addressParts[addressParts.length - 1]?.trim() || '';
        const city = addressParts.length > 2 
          ? addressParts[addressParts.length - 2]?.trim()
          : addressParts[0]?.trim() || '';

        return {
          iataCode: iataCode,
          name: place.name,
          city: city,
          country: country,
          displayName: `${place.name} (${iataCode}) - ${city}, ${country}`,
          source: 'google',
          placeId: place.place_id,
          location: place.geometry?.location,
          rating: place.rating,
          hasIATA: iataCode !== 'UNK',
        };
      });

    console.log("Returning formatted results:", formattedResults.length);

    return NextResponse.json({ 
      airports: formattedResults,
      count: formattedResults.length,
      status: "success",
      source: "google"
    });
  } catch (error: any) {
    console.error("Google Places airport search error:", error);
    return NextResponse.json(
      { 
        error: "Failed to search airports",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
