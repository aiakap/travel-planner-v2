import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Geocoding helper
async function geocodeLocation(location: string): Promise<{
  lat: number;
  lng: number;
  formatted: string;
} | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API key not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results[0]) {
      const result = data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted: result.formatted_address,
      };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, description, startDate, endDate, imageUrl, segments } = body;

    // Create the trip
    const trip = await prisma.trip.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        imageUrl: imageUrl || null,
        userId: session.user.id,
      },
    });

    // Create all segments
    const createdSegments = [];
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      // Geocode locations
      const startGeo = await geocodeLocation(segment.startLocation);
      const endGeo = await geocodeLocation(segment.endLocation);

      if (!startGeo || !endGeo) {
        console.warn(`Could not geocode locations for segment: ${segment.name}`);
        continue;
      }

      // Get segment type ID
      const segmentTypeRecord = await prisma.segmentType.findFirst({
        where: { name: segment.segmentType },
      });

      if (!segmentTypeRecord) {
        console.warn(`Segment type not found: ${segment.segmentType}`);
        continue;
      }

      // Create segment
      const createdSegment = await prisma.segment.create({
        data: {
          name: segment.name,
          tripId: trip.id,
          segmentTypeId: segmentTypeRecord.id,
          startTitle: startGeo.formatted,
          startLat: startGeo.lat,
          startLng: startGeo.lng,
          endTitle: endGeo.formatted,
          endLat: endGeo.lat,
          endLng: endGeo.lng,
          startTime: segment.startTime ? new Date(segment.startTime) : null,
          endTime: segment.endTime ? new Date(segment.endTime) : null,
          notes: segment.notes || null,
          order: segment.order,
        },
      });

      createdSegments.push(createdSegment);
    }

    return Response.json({
      success: true,
      trip: {
        id: trip.id,
        title: trip.title,
        segmentCount: createdSegments.length,
      },
    });
  } catch (error: any) {
    console.error("Error committing trip:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
