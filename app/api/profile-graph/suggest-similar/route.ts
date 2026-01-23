/**
 * Profile Graph Suggest Similar API Route
 * 
 * Generates a new similar suggestion based on accepted/rejected tags
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateSimilarTags } from "@/lib/ai/generate-similar-tags";
import { GraphCategory } from "@/lib/types/profile-graph";
import { getProfileGraphItems } from "@/lib/actions/profile-graph-actions";

export const maxDuration = 30;

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
    const { referenceTag, category, subcategory, wasAccepted = true } = body;

    if (!referenceTag || !category || !subcategory) {
      return NextResponse.json(
        { error: "Missing required fields: referenceTag, category, subcategory" },
        { status: 400 }
      );
    }

    console.log(`📨 [Suggest Similar API] Generating suggestion based on ${wasAccepted ? 'accepted' : 'rejected'} tag:`, referenceTag);

    // Get existing tags from user's profile
    const existingItems = await getProfileGraphItems();
    const existingTags = existingItems.map(item => item.value);

    // Generate 1 new similar suggestion
    const suggestions = await generateSimilarTags(
      referenceTag,
      category as GraphCategory,
      subcategory,
      existingTags,
      1,
      wasAccepted
    );

    if (suggestions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate suggestion" },
        { status: 500 }
      );
    }

    console.log("✅ [Suggest Similar API] Generated suggestion:", suggestions[0].value);

    return NextResponse.json({
      success: true,
      suggestion: suggestions[0]
    });

  } catch (error) {
    console.error("❌ [Suggest Similar API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate suggestion",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
