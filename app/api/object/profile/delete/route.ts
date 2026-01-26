/**
 * Profile Delete API Route
 * 
 * HTTP interface for deleting profile items
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { removeGraphItem } from "@/lib/actions/profile-graph-actions";

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
    const { category, subcategory, value } = body;

    // Validate required fields
    if (!category || !subcategory || !value) {
      return NextResponse.json(
        { error: "Missing required fields: category, subcategory, value" },
        { status: 400 }
      );
    }

    console.log("🗑️ [Profile Delete API] Request:", {
      category,
      subcategory,
      value,
      userId: session.user.id
    });

    // Call server action to remove item
    const result = await removeGraphItem(category, subcategory, value);

    console.log("✅ [Profile Delete API] Success:", {
      nodeCount: result.graphData.nodes.length
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error("❌ [Profile Delete API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
