/**
 * Profile Graph Add Item API Route
 * 
 * Handles adding a single item to the profile graph when user accepts a suggestion
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { addGraphItem, getUserProfileGraph } from "@/lib/actions/profile-graph-actions";

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
    const { category, subcategory, value, metadata } = body;

    // Validate required fields
    if (!category || !subcategory || !value) {
      return NextResponse.json(
        { error: "Category, subcategory, and value are required" },
        { status: 400 }
      );
    }

    console.log("➕ [Add Item API] Adding item:", { category, subcategory, value });

    // Add item to profile graph
    const result = await addGraphItem(
      category,
      subcategory,
      value,
      metadata
    );

    console.log("✅ [Add Item API] Item added successfully");

    // Return updated graph data
    return NextResponse.json({
      success: true,
      graphData: result.graphData,
      xmlData: result.xmlData
    });

  } catch (error) {
    console.error("❌ [Add Item API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to add item",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
