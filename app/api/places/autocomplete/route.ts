import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const input = searchParams.get("input");
  const sessionToken = searchParams.get("sessiontoken");
  
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }
  
  if (!input || input.length < 3) {
    return NextResponse.json({ predictions: [] });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${apiKey}${sessionToken ? `&sessiontoken=${sessionToken}` : ""}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error("Google Places API error:", response.status);
      return NextResponse.json(
        { error: "Failed to fetch suggestions" },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    if (data.status === "OK" && data.predictions) {
      return NextResponse.json({
        predictions: data.predictions.slice(0, 8).map((pred: any) => ({
          placeId: pred.place_id,
          description: pred.description,
          mainText: pred.structured_formatting?.main_text || pred.description,
          secondaryText: pred.structured_formatting?.secondary_text || "",
          types: pred.types || [],
        })),
      });
    }
    
    if (data.status !== "OK") {
      console.error("Google Places API status:", data.status, data.error_message);
    }
    
    return NextResponse.json({ predictions: [] });
  } catch (error) {
    console.error("Error fetching place suggestions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
