/**
 * Profile Graph Delete Item API Route
 * 
 * Handles deleting items from the profile graph
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { removeGraphItem, getUserProfileGraph } from "@/lib/actions/profile-graph-actions";

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

    // Parse request body
    const body = await req.json();
    const { nodeId, category, subcategory, value } = body;

    // Validate required fields
    if (!category || !subcategory || !value) {
      return NextResponse.json(
        { error: "Category, subcategory, and value are required" },
        { status: 400 }
      );
    }

    console.log("🗑️ [Delete Item API] Deleting item:", { category, subcategory, value });

    // Remove item from profile graph
    const result = await removeGraphItem(
      category,
      subcategory,
      value
    );

    console.log("✅ [Delete Item API] Item deleted successfully");

    // Return updated graph data
    return NextResponse.json({
      success: true,
      graphData: result.graphData,
      xmlData: result.xmlData
    });

  } catch (error) {
    console.error("❌ [Delete Item API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
