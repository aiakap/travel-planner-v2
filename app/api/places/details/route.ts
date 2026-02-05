import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeId"); // Changed from "placeid" to "placeId"
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }
  
  if (!placeId) {
    return NextResponse.json(
      { error: "Place ID is required" },
      { status: 400 }
    );
  }

  try {
    // Expanded fields for comprehensive testing including contact, hours, reviews, and accessibility
    const fields = [
      'name', 'formatted_address', 'geometry', 'types', 'rating', 'photos',
      'formatted_phone_number', 'international_phone_number', 'website',
      'opening_hours', 'business_status', 'price_level', 'user_ratings_total',
      'url', 'plus_code', 'wheelchair_accessible_entrance', 'reviews',
      'editorial_summary', 'place_id', 'vicinity', 'address_component'
    ].join(',');
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=${fields}&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Google Places Details API error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch place details" },
        { status: response.status }
      );
    }
    
    const data = await response.json();

    if (data.status === "OK" && data.result) {
      const result = data.result;
      return NextResponse.json({
        // Simplified for display
        name: result.name || result.formatted_address,
        formattedAddress: result.formatted_address,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        placeId,
        types: result.types,
        addressComponents: result.address_components || [],
        // Full result for inspection
        result: data.result,
        status: "success"
      });
    }
    
    if (data.status !== "OK") {
      console.error("Google Places Details API status:", data.status, data.error_message);
    }
    
    return NextResponse.json(
      { error: "Place not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error fetching place details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
