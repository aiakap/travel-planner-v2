import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted: string;
  timezone?: string;
  timezoneName?: string;
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${apiKey}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const firstResult = data.results?.[0];
    if (!firstResult?.geometry?.location) {
      return null;
    }

    const { lat, lng } = firstResult.geometry.location;
    return {
      lat,
      lng,
      formatted: firstResult.formatted_address ?? address,
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

async function getTimezoneFromCoordinates(
  lat: number,
  lng: number
): Promise<{ timezone?: string; timezoneName?: string }> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return {};
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`
    );

    if (!response.ok) {
      return {};
    }

    const data = await response.json();
    if (data.status !== "OK") {
      return {};
    }

    return {
      timezone: data.timeZoneId,
      timezoneName: data.timeZoneName,
    };
  } catch (error) {
    console.error("Timezone lookup error:", error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { location } = body;

    if (!location || typeof location !== "string") {
      return NextResponse.json(
        { error: "Location is required" },
        { status: 400 }
      );
    }

    // First, geocode the address to get coordinates
    const geocodeResult = await geocodeAddress(location);
    if (!geocodeResult) {
      return NextResponse.json(
        { error: "Could not geocode location" },
        { status: 404 }
      );
    }

    // Then, get the timezone for those coordinates
    const timezoneResult = await getTimezoneFromCoordinates(
      geocodeResult.lat,
      geocodeResult.lng
    );

    return NextResponse.json({
      lat: geocodeResult.lat,
      lng: geocodeResult.lng,
      formatted: geocodeResult.formatted,
      timezone: timezoneResult.timezone,
      timezoneName: timezoneResult.timezoneName,
    });
  } catch (error) {
    console.error("Geocode timezone error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

