import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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

export function createTripPlanningTools(userId: string) {
  return {
    create_trip: tool({
      description:
        "Create a new trip with title, description, and date range. Returns the trip ID for adding segments.",
      inputSchema: z.object({
        title: z.string().describe("Trip title (e.g., 'Summer in Italy')"),
        description: z
          .string()
          .describe("Brief description of the trip and what to expect"),
        startDate: z
          .string()
          .describe("Start date in YYYY-MM-DD format"),
        endDate: z.string().describe("End date in YYYY-MM-DD format"),
      }),
      execute: async ({
        title,
        description,
        startDate,
        endDate,
      }) => {
        const trip = await prisma.trip.create({
          data: {
            title,
            description,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            userId,
          },
        });

        return {
          success: true,
          tripId: trip.id,
          message: `Created trip "${title}" from ${startDate} to ${endDate}`,
        };
      },
    }),

    add_segment: tool({
      description:
        "Add a segment to a trip. A segment represents a part of the journey (flight, hotel stay, activity period, etc.)",
      inputSchema: z.object({
        tripId: z.string().describe("ID of the trip to add this segment to"),
        name: z
          .string()
          .describe(
            "Segment name (e.g., 'Flight to Rome', 'Stay in Florence')"
          ),
        segmentType: z
          .enum(["Flight", "Drive", "Train", "Ferry", "Walk", "Other"])
          .describe("Type of segment/transportation"),
        startLocation: z
          .string()
          .describe("Starting location (city, country format)"),
        endLocation: z
          .string()
          .describe("Ending location (city, country format)"),
        startTime: z
          .string()
          .optional()
          .describe("Start date/time in ISO format"),
        endTime: z
          .string()
          .optional()
          .describe("End date/time in ISO format"),
        notes: z.string().optional().describe("Additional notes or details"),
      }),
      execute: async ({
        tripId,
        name,
        segmentType,
        startLocation,
        endLocation,
        startTime,
        endTime,
        notes,
      }) => {
        // Geocode locations
        const startGeo = await geocodeLocation(startLocation);
        const endGeo = await geocodeLocation(endLocation);

        if (!startGeo || !endGeo) {
          return {
            success: false,
            message: `Could not geocode locations. Please provide specific city/country names.`,
          };
        }

        // Get segment type ID
        const segmentTypeRecord = await prisma.segmentType.findFirst({
          where: { name: segmentType },
        });

        if (!segmentTypeRecord) {
          return {
            success: false,
            message: `Segment type "${segmentType}" not found`,
          };
        }

        // Get the next order number
        const existingSegments = await prisma.segment.findMany({
          where: { tripId },
          orderBy: { order: "desc" },
          take: 1,
        });
        const nextOrder =
          existingSegments.length > 0 ? existingSegments[0].order + 1 : 0;

        const segment = await prisma.segment.create({
          data: {
            name,
            tripId,
            segmentTypeId: segmentTypeRecord.id,
            startTitle: startGeo.formatted,
            startLat: startGeo.lat,
            startLng: startGeo.lng,
            endTitle: endGeo.formatted,
            endLat: endGeo.lat,
            endLng: endGeo.lng,
            startTime: startTime ? new Date(startTime) : null,
            endTime: endTime ? new Date(endTime) : null,
            notes: notes || null,
            order: nextOrder,
          },
        });

        return {
          success: true,
          segmentId: segment.id,
          message: `Added segment "${name}" to trip`,
        };
      },
    }),

    suggest_reservation: tool({
      description:
        "Suggest a reservation for a segment (hotel, flight, restaurant, activity). This creates a suggestion in the trip planner.",
      inputSchema: z.object({
        segmentId: z
          .string()
          .describe("ID of the segment this reservation belongs to"),
        name: z
          .string()
          .describe("Name of the place/service (e.g., 'Grand Hotel Rome')"),
        category: z
          .enum(["Travel", "Stay", "Activity", "Dining"])
          .describe("Category of reservation"),
        type: z
          .string()
          .describe(
            "Specific type (e.g., Flight, Hotel, Restaurant, Tour, etc.)"
          ),
        confirmationNumber: z
          .string()
          .optional()
          .describe("Confirmation/reference number if known"),
        notes: z
          .string()
          .optional()
          .describe("Additional details, recommendations, or instructions"),
        cost: z
          .number()
          .optional()
          .describe("Estimated cost in USD"),
        location: z
          .string()
          .optional()
          .describe("Physical address or location"),
        url: z
          .string()
          .optional()
          .describe("Website or booking URL"),
        startTime: z
          .string()
          .optional()
          .describe("Start time in ISO format"),
        endTime: z
          .string()
          .optional()
          .describe("End time in ISO format"),
      }),
      execute: async ({
        segmentId,
        name,
        category,
        type,
        confirmationNumber,
        notes,
        cost,
        location,
        url,
        startTime,
        endTime,
      }) => {
        // Get reservation type
        const reservationType = await prisma.reservationType.findFirst({
          where: {
            name: type,
            category: {
              name: category,
            },
          },
          include: { category: true },
        });

        if (!reservationType) {
          return {
            success: false,
            message: `Reservation type "${type}" in category "${category}" not found`,
          };
        }

        // Get "Pending" status
        const status = await prisma.reservationStatus.findFirst({
          where: { name: "Pending" },
        });

        if (!status) {
          return {
            success: false,
            message: "Could not find Pending status",
          };
        }

        const reservation = await prisma.reservation.create({
          data: {
            name,
            segmentId,
            reservationTypeId: reservationType.id,
            reservationStatusId: status.id,
            confirmationNumber: confirmationNumber || null,
            notes: notes || null,
            cost: cost || null,
            currency: cost ? "USD" : null,
            location: location || null,
            url: url || null,
            startTime: startTime ? new Date(startTime) : null,
            endTime: endTime ? new Date(endTime) : null,
          },
        });

        return {
          success: true,
          reservationId: reservation.id,
          message: `Added ${category.toLowerCase()} suggestion: ${name}`,
        };
      },
    }),

    get_user_trips: tool({
      description: "Get a list of the user's existing trips",
      inputSchema: z.object({}),
      execute: async () => {
        const trips = await prisma.trip.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            segments: {
              orderBy: { order: "asc" },
              take: 3,
            },
          },
        });

        return {
          success: true,
          trips: trips.map((trip) => ({
            id: trip.id,
            title: trip.title,
            description: trip.description,
            startDate: trip.startDate.toISOString(),
            endDate: trip.endDate.toISOString(),
            segmentCount: trip.segments.length,
          })),
        };
      },
    }),
  };
}

