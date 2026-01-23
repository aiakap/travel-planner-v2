/**
 * Suggest New Topic API Route
 * 
 * Generates a new mad-lib prompt when user clicks "suggest a new topic"
 * or rejects suggestions
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { generateNewTopicSuggestion } from "@/lib/ai/profile-graph-chat";

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
    const { conversationHistory } = body;

    console.log("🔄 [New Topic API] Generating new topic suggestion");

    // Get current profile graph
    const profileGraph = await getUserProfileGraph(session.user.id);

    // Generate new topic suggestion
    const response = await generateNewTopicSuggestion(
      profileGraph.graphData,
      conversationHistory
    );

    console.log("✅ [New Topic API] New topic generated");

    return NextResponse.json({
      message: response.message,
      inlineSuggestions: response.inlineSuggestions || [],
      graphData: profileGraph.graphData
    });

  } catch (error) {
    console.error("❌ [New Topic API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to generate new topic",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
