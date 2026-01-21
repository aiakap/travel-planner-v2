import { NextRequest, NextResponse } from "next/server";
import { searchPlace, getLocationContextForTrip } from "@/lib/actions/google-places";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { placeName, locationContext, tripId } = body;

    if (!placeName) {
      return NextResponse.json(
        { error: "Place name is required" },
        { status: 400 }
      );
    }

    // If tripId is provided, try to get location context from the trip
    let context = locationContext;
    if (tripId && !context) {
      context = await getLocationContextForTrip(tripId);
    }

    const placeData = await searchPlace(placeName, context);

    if (!placeData) {
      return NextResponse.json(
        { error: "Place not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ placeData });
  } catch (error) {
    console.error("Error in /api/places:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
