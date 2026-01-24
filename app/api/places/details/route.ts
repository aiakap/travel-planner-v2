import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const placeId = searchParams.get("placeid");
  
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
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=name,formatted_address,geometry&key=${apiKey}`;
    
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
        name: result.name || result.formatted_address,
        formattedAddress: result.formatted_address,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        placeId,
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
