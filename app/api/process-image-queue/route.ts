import { NextResponse } from "next/server";
import { processImageQueue } from "@/lib/image-queue";

/**
 * API endpoint to process the image generation queue
 * Can be called by a cron job or manually
 * 
 * Example: GET /api/process-image-queue?limit=10
 */
export async function GET(request: Request) {
  try {
    // Get limit from query params (default 5)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    // Process queue
    const results = await processImageQueue(limit);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Error processing image queue:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to trigger queue processing
 */
export async function POST() {
  try {
    const results = await processImageQueue(10);

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error("Error processing image queue:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
