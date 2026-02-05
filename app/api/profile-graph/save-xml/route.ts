/**
 * Profile Graph Save XML API Route
 * 
 * @deprecated XML storage is no longer used. Use addGraphItem/removeGraphItem APIs instead.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.warn("⚠️ [Save XML API] DEPRECATED: XML storage is no longer supported");

    // Return deprecation error
    return NextResponse.json(
      { 
        error: "XML storage is deprecated",
        message: "Profile data is now stored in relational tables. Use /api/profile-graph/add-item or /api/profile-graph/delete-item instead."
      },
      { status: 410 } // 410 Gone
    );

  } catch (error) {
    console.error("❌ [Save XML API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
