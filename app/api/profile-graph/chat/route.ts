/**
 * Profile Graph Chat API Route
 * 
 * Handles chat messages for the profile graph builder
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processProfileGraphChat } from "@/lib/ai/profile-graph-chat";
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
    const { message, conversationHistory } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("📨 [Profile Graph API] Processing message from user:", session.user.id);

    // Process message with AI
    const aiResponse = await processProfileGraphChat(message, conversationHistory);

    console.log("🤖 [Profile Graph API] AI response type:", aiResponse.suggestions ? "Conversational" : "Legacy");
    console.log("🤖 [Profile Graph API] AI extracted", aiResponse.items?.length || 0, "items");
    console.log("💡 [Profile Graph API] Conversational suggestions:", aiResponse.suggestions?.length || 0);

    // Convert items to pending suggestions (don't auto-add to database)
    const pendingSuggestions = (aiResponse.items || []).map((item, index) => ({
      id: `pending-${Date.now()}-${index}`,
      category: item.category,
      subcategory: item.metadata?.subcategory || "general",
      value: item.value,
      metadata: item.metadata
    }));

    // Convert similar suggestions to pending format
    const similarSuggestions = (aiResponse.similarSuggestions || []).map((item, index) => ({
      id: `similar-${Date.now()}-${index}`,
      category: item.category,
      subcategory: item.metadata?.subcategory || "general",
      value: item.value,
      metadata: item.metadata
    }));

    // Get current graph data (without adding new items)
    const profileGraph = await getUserProfileGraph(session.user.id);

    console.log("💡 [Profile Graph API] Returning", pendingSuggestions.length, "pending suggestions and", similarSuggestions.length, "similar suggestions");
    console.log("📊 [Profile Graph API] Similar suggestions:", similarSuggestions.map(s => s.value).join(", "));

    // Return response with conversational suggestions (new format) or inline suggestions (backward compatibility)
    return NextResponse.json({
      success: true,
      message: aiResponse.message,
      pendingSuggestions: pendingSuggestions,
      similarSuggestions: similarSuggestions,
      suggestions: aiResponse.suggestions || [],
      inlineSuggestions: aiResponse.inlineSuggestions || [],
      graphData: profileGraph.graphData,
      xmlData: profileGraph.xmlData
    });

  } catch (error) {
    console.error("❌ [Profile Graph API] Error:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to process message",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current graph data
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get profile graph
    const profileGraph = await getUserProfileGraph(session.user.id);

    return NextResponse.json({
      success: true,
      graphData: profileGraph.graphData,
      xmlData: profileGraph.xmlData,
      user: profileGraph.user
    });

  } catch (error) {
    console.error("❌ [Profile Graph API] Error fetching graph:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to fetch graph data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
