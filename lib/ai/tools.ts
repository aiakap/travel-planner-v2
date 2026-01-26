import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getReservationType, getReservationStatus } from "@/lib/db/reservation-lookups";

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

export function createTripPlanningTools(userId: string, conversationId?: string) {
  return {
    update_in_memory_trip: tool({
      description: "Update the Journey metadata in memory (not database). Use this to populate Journey details from conversation. This updates the UI immediately without creating database records.",
      inputSchema: z.object({
        title: z.string().nullable().default(null).describe("Journey title (use aspirational names) or null if not provided"),
        description: z.string().nullable().default(null).describe("Journey description or null if not provided"),
        startDate: z.string().nullable().default(null).describe("Start date in YYYY-MM-DD format or null if not provided"),
        endDate: z.string().nullable().default(null).describe("End date in YYYY-MM-DD format or null if not provided"),
      }),
      execute: async ({ title, description, startDate, endDate }) => {
        return {
          success: true,
          updateType: "trip_metadata",
          updates: { title, description, startDate, endDate },
          message: "Journey metadata updated in memory",
        };
      },
    }),

    add_in_memory_segment: tool({
      description: "Add a Chapter to the in-memory Journey (not database). You can create Chapters immediately, even before Journey metadata is complete. Each Chapter represents a distinct phase like a destination stay or travel leg.",
      inputSchema: z.object({
        name: z.string().describe("Chapter name - use aspirational, evocative names (e.g., 'Hokkaido Alpine Adventure', 'Journey to the East: SFO → Tokyo')"),
        segmentType: z.enum(["Travel", "Stay", "Tour", "Retreat", "Road Trip"]).describe("Type of Chapter"),
        startLocation: z.string().describe("Starting location (city, country)"),
        endLocation: z.string().describe("Ending location (city, country)"),
        startTime: z.string().nullable().default(null).describe("Start date/time in ISO format or null if not specified"),
        endTime: z.string().nullable().default(null).describe("End date/time in ISO format or null if not specified"),
        notes: z.string().nullable().default(null).describe("Additional notes about this Chapter or null if none"),
      }),
      execute: async ({ name, segmentType, startLocation, endLocation, startTime, endTime, notes }) => {
        return {
          success: true,
          updateType: "add_segment",
          segment: {
            tempId: `temp-${Date.now()}-${Math.random()}`,
            name,
            segmentType,
            startLocation,
            endLocation,
            startTime: startTime || null,
            endTime: endTime || null,
            notes: notes || null,
          },
          message: `Added Chapter: ${name}`,
        };
      },
    }),

    suggest_place: tool({
      description:
        "🚨 MANDATORY: You MUST call this tool for EVERY SINGLE place name you mention. If you mention 'Hotel Pulitzer Amsterdam' or 'The Dylan Amsterdam', you MUST call this tool for EACH ONE. Suggest a place (restaurant, hotel, activity, etc.) to the user. This creates an interactive suggestion that the user can click to see details and add to their itinerary. Use this instead of suggest_reservation when making recommendations. DO NOT SKIP THIS TOOL.",
      inputSchema: z.object({
        placeName: z
          .string()
          .describe("Name of the place (e.g., 'Osteria Francescana', 'Grand Hotel Rome')"),
        category: z
          .enum(["Travel", "Stay", "Activity", "Dining"])
          .describe("Category of the place"),
        type: z
          .string()
          .describe("Specific type (e.g., Restaurant, Hotel, Tour, Museum)"),
        tripId: z
          .string()
          .nullable()
          .default(null)
          .describe("ID of the trip this suggestion is for or null if not specified"),
        segmentId: z
          .string()
          .nullable()
          .default(null)
          .describe("ID of the segment this suggestion is for or null if not specified"),
        dayNumber: z
          .number()
          .nullable()
          .default(null)
          .describe("Which day of the trip (1 for first day, 2 for second, etc.) or null if not specified"),
        timeOfDay: z
          .enum(["morning", "afternoon", "evening", "night"])
          .nullable()
          .default(null)
          .describe("General time of day for this suggestion or null if not specified"),
        specificTime: z
          .string()
          .nullable()
          .default(null)
          .describe("Specific time if mentioned (e.g., '7:00 PM', '12:30 PM') or null if not specified"),
        notes: z
          .string()
          .nullable()
          .default(null)
          .describe("Additional context or recommendations about this place or null if none"),
      }),
      execute: async ({
        placeName,
        category,
        type,
        tripId,
        segmentId,
        dayNumber,
        timeOfDay,
        specificTime,
        notes,
      }) => {
        // This tool doesn't create a reservation immediately
        // It returns structured data that will be rendered as a clickable link in the chat
        return {
          success: true,
          placeName,
          category,
          type,
          context: {
            dayNumber,
            timeOfDay,
            specificTime,
            notes,
          },
          tripId,
          segmentId,
          message: `Suggested ${category.toLowerCase()}: ${placeName}`,
        };
      },
    }),

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

        // Link conversation to trip if conversationId provided
        if (conversationId) {
          await prisma.chatConversation.update({
            where: { id: conversationId },
            data: { 
              tripId: trip.id,
              title: `Planning ${title}`
            }
          });
        }

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
          .nullable()
          .default(null)
          .describe("Start date/time in ISO format or null if not specified"),
        endTime: z
          .string()
          .nullable()
          .default(null)
          .describe("End date/time in ISO format or null if not specified"),
        notes: z.string().nullable().default(null).describe("Additional notes or details or null if none"),
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
          .nullable()
          .default(null)
          .describe("Confirmation/reference number if known or null if not available"),
        notes: z
          .string()
          .nullable()
          .default(null)
          .describe("Additional details, recommendations, or instructions or null if none"),
        cost: z
          .number()
          .nullable()
          .default(null)
          .describe("Estimated cost in USD or null if not known"),
        location: z
          .string()
          .nullable()
          .default(null)
          .describe("Physical address or location or null if not applicable"),
        url: z
          .string()
          .nullable()
          .default(null)
          .describe("Website or booking URL or null if not available"),
        startTime: z
          .string()
          .nullable()
          .default(null)
          .describe("Start time in ISO format or null if not specified"),
        endTime: z
          .string()
          .nullable()
          .default(null)
          .describe("End time in ISO format or null if not specified"),
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
        // Get cached reservation type and status
        let reservationType;
        let status;
        
        try {
          reservationType = await getReservationType(category, type);
          status = await getReservationStatus("Pending");
        } catch (error: any) {
          return {
            success: false,
            message: error.message || "Failed to get reservation type or status",
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
          reservationId: String(reservation.id),
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

    get_current_trip_details: tool({
      description: "Get complete details about the current trip being discussed, including all segments and reservations. Use this when you need fresh/updated trip information.",
      inputSchema: z.object({
        tripId: z.string().describe("ID of the trip to get details for"),
      }),
      execute: async ({ tripId }) => {
        const trip = await prisma.trip.findFirst({
          where: {
            id: tripId,
            userId,
          },
          include: {
            segments: {
              include: {
                segmentType: true,
                reservations: {
                  include: {
                    reservationType: {
                      include: {
                        category: true,
                      },
                    },
                    reservationStatus: true,
                  },
                  orderBy: {
                    startTime: "asc",
                  },
                },
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        });

        if (!trip) {
          return {
            success: false,
            message: "Trip not found",
          };
        }

        return {
          success: true,
          trip: {
            id: trip.id,
            title: trip.title,
            description: trip.description,
            startDate: trip.startDate.toISOString(),
            endDate: trip.endDate.toISOString(),
            segments: trip.segments.map((segment) => ({
              id: segment.id,
              name: segment.name,
              type: segment.segmentType.name,
              startLocation: segment.startTitle,
              endLocation: segment.endTitle,
              startTime: segment.startTime?.toISOString(),
              endTime: segment.endTime?.toISOString(),
              notes: segment.notes,
              reservations: segment.reservations.map((res) => ({
                id: res.id,
                name: res.name,
                category: res.reservationType.category.name,
                type: res.reservationType.name,
                status: res.reservationStatus.name,
                startTime: res.startTime?.toISOString(),
                endTime: res.endTime?.toISOString(),
                location: res.location,
                cost: res.cost,
                currency: res.currency,
                confirmationNumber: res.confirmationNumber,
                notes: res.notes,
              })),
            })),
          },
        };
      },
    }),
  };
}

