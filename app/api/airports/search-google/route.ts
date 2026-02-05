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

    // Strategy: Try multiple search patterns to find airports
    // 1. If query already has "airport", use as-is
    // 2. Otherwise try "{query} airport" first (finds specific airport)
    // 3. Then try "airports near {query}" (finds nearby airports)
    
    const searchQueries: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('airport')) {
      searchQueries.push(query);
    } else {
      // Try specific airport search first (e.g., "lihue airport")
      searchQueries.push(`${query} airport`);
      // Then try nearby airports search
      searchQueries.push(`airports near ${query}`);
    }
    
    let allResults: any[] = [];
    
    for (const searchQuery of searchQueries) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        searchQuery
      )}&type=airport&key=${apiKey}`;

      console.log("Calling Google Places API with query:", searchQuery);
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === "OK" && data.results?.length > 0) {
          allResults = [...allResults, ...data.results];
        }
      }
    }
    
    // Deduplicate by place_id
    const seenPlaceIds = new Set<string>();
    const data = {
      status: allResults.length > 0 ? "OK" : "ZERO_RESULTS",
      results: allResults.filter((place: any) => {
        if (seenPlaceIds.has(place.place_id)) return false;
        seenPlaceIds.add(place.place_id);
        return true;
      })
    };
    
    if (data.status !== "OK") {
      console.warn("Google Places API status:", data.status);
      return NextResponse.json({ 
        airports: [],
        count: 0,
        status: "success",
        source: "google"
      });
    }

    console.log(`Google Places returned ${data.results?.length || 0} results`);

    // Format results to match airport structure
    // Filter out non-commercial airports (heliports, airparks, etc.)
    const formattedResults = (data.results || [])
      .filter((place: any) => {
        if (!place.types?.includes('airport')) return false;
        
        // Filter out small general aviation airports by checking name patterns
        const name = place.name.toLowerCase();
        
        // Exclude non-commercial airports
        const excludePatterns = [
          'executive', 'municipal', 'county',
          'airpark', 'airfield', 'heliport', 'helipad',
          'general aviation', 'private'
        ];
        const isExcluded = excludePatterns.some(pattern => name.includes(pattern));
        
        return !isExcluded;
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
