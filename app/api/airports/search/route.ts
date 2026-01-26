import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchAirports } from "@/lib/amadeus/locations";

export async function GET(request: NextRequest) {
  try {
    // Authentication removed for admin testing
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json(
    //     { error: "Not authenticated" },
    //     { status: 401 }
    //   );
    // }

    // Get search query - accept both 'q' and 'keyword'
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || searchParams.get("keyword");

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Search airports using Amadeus
    const results = await searchAirports(query, 10);

    // Format results for the autocomplete - include full airport object
    const formattedResults = results.map((airport: any) => ({
      iataCode: airport.iataCode,
      name: airport.name,
      address: airport.address,
      city: airport.address?.cityName || "",
      country: airport.address?.countryName || "",
      displayName: `${airport.name} (${airport.iataCode}) - ${airport.address?.cityName || ""}, ${airport.address?.countryName || ""}`,
    }));

    return NextResponse.json({ 
      airports: formattedResults,
      count: formattedResults.length,
      status: "success"
    });
  } catch (error) {
    console.error("Airport search error:", error);
    return NextResponse.json(
      { error: "Failed to search airports" },
      { status: 500 }
    );
  }
}
