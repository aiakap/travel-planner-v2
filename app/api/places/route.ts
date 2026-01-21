import { NextRequest, NextResponse } from "next/server";
import { searchPlace, getLocationContextForTrip } from "@/lib/actions/google-places";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log("🔒 [/api/places] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { placeName, locationContext, tripId } = body;

    console.log("🌍 [/api/places] Request received:", {
      placeName,
      locationContext,
      tripId,
      userId: session.user.id,
    });

    if (!placeName) {
      console.warn("⚠️  [/api/places] Missing place name");
      return NextResponse.json(
        { error: "Place name is required" },
        { status: 400 }
      );
    }

    // If tripId is provided, try to get location context from the trip
    let context = locationContext;
    if (tripId && !context) {
      console.log("🔍 [/api/places] Fetching location context for trip:", tripId);
      context = await getLocationContextForTrip(tripId);
      console.log("🔍 [/api/places] Location context:", context);
    }

    console.log("🔎 [/api/places] Searching for place:", {
      placeName,
      context,
    });

    const placeData = await searchPlace(placeName, context);

    if (!placeData) {
      console.warn("❌ [/api/places] Place not found:", placeName);
      return NextResponse.json(
        { error: "Place not found" },
        { status: 404 }
      );
    }

    console.log("✅ [/api/places] Place data found:", {
      placeId: placeData.placeId,
      name: placeData.name,
      rating: placeData.rating,
      hasPhotos: !!placeData.photos?.length,
    });

    return NextResponse.json({ placeData });
  } catch (error) {
    console.error("❌ [/api/places] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
