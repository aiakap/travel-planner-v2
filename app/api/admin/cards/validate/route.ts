import { NextResponse } from "next/server";
import { cardSchema } from "@/lib/schemas/exp-response-schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Support both single card and array of cards
    const isArray = Array.isArray(body);
    const cardsToValidate = isArray ? body : [body];
    
    const results = cardsToValidate.map((card, index) => {
      const result = cardSchema.safeParse(card);
      
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
      results: isArray ? results : results[0],
      summary: {
        total: results.length,
        valid: validCount,
        invalid: results.length - validCount,
        allValid,
      },
    });
  } catch (error) {
    console.error("[Admin API] Card validation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to validate cards",
      },
      { status: 400 }
    );
  }
}
