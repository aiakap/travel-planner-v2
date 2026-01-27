import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchAirports } from "@/lib/amadeus/locations";

// Fallback airport data for when Amadeus API is unavailable
const FALLBACK_AIRPORTS = [
  { iataCode: "JFK", name: "John F Kennedy International Airport", city: "New York", country: "United States" },
  { iataCode: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States" },
  { iataCode: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "United States" },
  { iataCode: "ORD", name: "Chicago O'Hare International Airport", city: "Chicago", country: "United States" },
  { iataCode: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom" },
  { iataCode: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France" },
  { iataCode: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
  { iataCode: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan" },
  { iataCode: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia" },
  { iataCode: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong" },
];

export async function GET(request: NextRequest) {
  try {
    // Get search query - accept both 'q' and 'keyword'
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || searchParams.get("keyword");

    console.log("Airport search API called with query:", query);

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    let formattedResults: any[] = [];

    try {
      // Try Amadeus first
      console.log("Calling Amadeus searchAirports...");
      const results = await searchAirports(query, 10);
      console.log("Amadeus returned results:", results.length);

      // Format results for the autocomplete - include full airport object
      formattedResults = results.map((airport: any) => ({
        iataCode: airport.iataCode,
        name: airport.name,
        address: airport.address,
        city: airport.address?.cityName || "",
        country: airport.address?.countryName || "",
        displayName: `${airport.name} (${airport.iataCode}) - ${airport.address?.cityName || ""}, ${airport.address?.countryName || ""}`,
      }));
    } catch (amadeusError: any) {
      console.warn("Amadeus API failed, using fallback data:", amadeusError.message);
      
      // Use fallback data - filter by query
      const lowerQuery = query.toLowerCase();
      formattedResults = FALLBACK_AIRPORTS
        .filter(airport => 
          airport.iataCode.toLowerCase().includes(lowerQuery) ||
          airport.name.toLowerCase().includes(lowerQuery) ||
          airport.city.toLowerCase().includes(lowerQuery) ||
          airport.country.toLowerCase().includes(lowerQuery)
        )
        .map(airport => ({
          iataCode: airport.iataCode,
          name: airport.name,
          address: null,
          city: airport.city,
          country: airport.country,
          displayName: `${airport.name} (${airport.iataCode}) - ${airport.city}, ${airport.country}`,
        }));
    }

    console.log("Returning formatted results:", formattedResults.length);

    return NextResponse.json({ 
      airports: formattedResults,
      count: formattedResults.length,
      status: "success"
    });
  } catch (error: any) {
    console.error("Airport search error:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      description: error.description,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: "Failed to search airports",
        details: error.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
