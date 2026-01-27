import { NextRequest, NextResponse } from "next/server";
import { searchNearbyPlaces } from "@/lib/actions/google-places-nearby";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, radius, type, keyword } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = radius ? parseInt(radius) : 1000;

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "Invalid latitude or longitude" },
        { status: 400 }
      );
    }

    const places = await searchNearbyPlaces(
      latitude,
      longitude,
      searchRadius,
      type,
      keyword
    );

    return NextResponse.json({
      success: true,
      places,
      count: places.length,
    });
  } catch (error: any) {
    console.error("[Nearby Places API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search nearby places" },
      { status: 500 }
    );
  }
}
