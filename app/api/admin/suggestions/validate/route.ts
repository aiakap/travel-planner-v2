import { NextResponse } from "next/server";
import { z } from "zod";

// Import suggestion schemas from exp-response-schema
const placeSuggestionSchema = z.object({
  suggestedName: z.string(),
  category: z.enum(["Stay", "Eat", "Do", "Transport"]),
  type: z.string(),
  searchQuery: z.string(),
  context: z.object({
    dayNumber: z.number(),
    timeOfDay: z.string(),
    specificTime: z.string(),
    notes: z.string(),
  }),
  segmentId: z.string(),
});

const transportSuggestionSchema = z.object({
  suggestedName: z.string(),
  type: z.enum(["Flight", "Transfer", "Train", "Bus"]),
  origin: z.string(),
  destination: z.string(),
  departureDate: z.string(),
  departureTime: z.string(),
  returnDate: z.string(),
  adults: z.number(),
  travelClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]),
  transferType: z.enum(["PRIVATE", "SHARED", "TAXI", "AIRPORT_EXPRESS"]),
});

const hotelSuggestionSchema = z.object({
  suggestedName: z.string(),
  location: z.string(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  guests: z.number(),
  rooms: z.number(),
  searchQuery: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body;
    
    if (!type || !["place", "transport", "hotel"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid type. Must be 'place', 'transport', or 'hotel'",
        },
        { status: 400 }
      );
    }
    
    // Select appropriate schema
    const schemaMap = {
      place: placeSuggestionSchema,
      transport: transportSuggestionSchema,
      hotel: hotelSuggestionSchema,
    };
    
    const schema = schemaMap[type as keyof typeof schemaMap];
    
    // Support both single item and array
    const isArray = Array.isArray(data);
    const itemsToValidate = isArray ? data : [data];
    
    const results = itemsToValidate.map((item, index) => {
      const result = schema.safeParse(item);
      
      if (result.success) {
        return {
          index,
          valid: true,
          data: result.data,
        };
      } else {
        return {
          index,
          valid: false,
          errors: result.error.issues.map((e) => ({
            path: e.path.join("."),
            message: e.message,
          })),
        };
      }
    });
    
    const allValid = results.every((r) => r.valid);
    const validCount = results.filter((r) => r.valid).length;
    
    return NextResponse.json({
      success: true,
      type,
      results: isArray ? results : results[0],
      summary: {
        total: results.length,
        valid: validCount,
        invalid: results.length - validCount,
        allValid,
      },
    });
  } catch (error) {
    console.error("[Admin API] Suggestion validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to validate suggestions",
      },
      { status: 400 }
    );
  }
}
