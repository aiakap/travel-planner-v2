/**
 * Clear Profile Graph API Route
 */

import { NextResponse } from "next/server";
import { clearProfileGraph } from "@/lib/actions/profile-graph-actions";

export async function POST() {
  try {
    await clearProfileGraph();
    
    return NextResponse.json({
      success: true,
      message: "Profile graph cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing profile graph:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to clear profile graph",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
