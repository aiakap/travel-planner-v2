import { NextRequest, NextResponse } from "next/server";
import { getDisplayRoute, type TransportMode } from "@/lib/actions/route-optimization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/route/display
 * 
 * Get a display route between two points with the full polyline path for map rendering.
 * 
 * Query parameters:
 * - originLat: Origin latitude
 * - originLng: Origin longitude
 * - destLat: Destination latitude
 * - destLng: Destination longitude
 * - mode: Transport mode (DRIVE, WALK, TRANSIT, BICYCLE) - defaults to DRIVE
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const originLat = searchParams.get("originLat");
    const originLng = searchParams.get("originLng");
    const destLat = searchParams.get("destLat");
    const destLng = searchParams.get("destLng");
    const mode = (searchParams.get("mode") || "DRIVE") as TransportMode;
    
    // Validate required parameters
    if (!originLat || !originLng || !destLat || !destLng) {
      return NextResponse.json(
        { error: "Missing required parameters: originLat, originLng, destLat, destLng" },
        { status: 400 }
      );
    }
    
    const originLatNum = parseFloat(originLat);
    const originLngNum = parseFloat(originLng);
    const destLatNum = parseFloat(destLat);
    const destLngNum = parseFloat(destLng);
    
    // Validate coordinates are valid numbers
    if (
      isNaN(originLatNum) || isNaN(originLngNum) ||
      isNaN(destLatNum) || isNaN(destLngNum)
    ) {
      return NextResponse.json(
        { error: "Invalid coordinate values" },
        { status: 400 }
      );
    }
    
    // Validate coordinate ranges
    if (
      originLatNum < -90 || originLatNum > 90 ||
      destLatNum < -90 || destLatNum > 90 ||
      originLngNum < -180 || originLngNum > 180 ||
      destLngNum < -180 || destLngNum > 180
    ) {
      return NextResponse.json(
        { error: "Coordinates out of valid range" },
        { status: 400 }
      );
    }
    
    // Validate transport mode
    const validModes: TransportMode[] = ["DRIVE", "WALK", "TRANSIT", "BICYCLE"];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Must be one of: ${validModes.join(", ")}` },
        { status: 400 }
      );
    }
    
    // Get the display route
    const route = await getDisplayRoute(
      originLatNum,
      originLngNum,
      destLatNum,
      destLngNum,
      mode
    );
    
    if (!route) {
      return NextResponse.json(
        { error: "Could not calculate route. The locations may not be reachable by the specified transport mode." },
        { status: 404 }
      );
    }
    
    // Return the route with cache headers
    return NextResponse.json(route, {
      headers: {
        // Cache for 1 hour as routes don't change frequently
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Error in /api/route/display:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
