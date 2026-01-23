/**
 * Profile Graph Chat API Route
 * 
 * Handles chat messages for the profile graph builder
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processProfileGraphChat, extractExplicitItems } from "@/lib/ai/profile-graph-chat";
import { addGraphItem, getUserProfileGraph } from "@/lib/actions/profile-graph-actions";
import { extractItemsFromXml } from "@/lib/profile-graph-xml";

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

    // Get current profile graph
    const profileGraph = await getUserProfileGraph(session.user.id);
    const profileItems = extractItemsFromXml(profileGraph.xmlData);

    // PHASE 1: Extract and auto-add explicit items
    console.log("🔍 [Profile Graph API] Phase 1: Extracting explicit items...");
    console.log("📝 [Profile Graph API] User message:", message);
    console.log("📊 [Profile Graph API] Current profile has", profileItems.length, "items");
    
    const extractedItems = await extractExplicitItems(message, profileItems);
    console.log("🔍 [Profile Graph API] Extracted items:", JSON.stringify(extractedItems, null, 2));
    
    // Add extracted items to database immediately
    const addedItems: Array<{
      category: string;
      subcategory: string;
      value: string;
      metadata?: Record<string, string>;
    }> = [];
    
    for (const item of extractedItems) {
      try {
        console.log("➕ [Profile Graph API] Attempting to add:", item.value, "to category:", item.category);
        const result = await addGraphItem(
          item.category,
          item.subcategory,
          item.value,
          item.metadata
        );
        console.log("✅ [Profile Graph API] Successfully added:", item.value, "Result:", result);
        addedItems.push({
          category: item.category,
          subcategory: item.subcategory,
          value: item.value,
          metadata: item.metadata
        });
      } catch (error) {
        console.error("❌ [Profile Graph API] Error adding item:", item.value, "Error:", error);
      }
    }
    
    console.log("✨ [Profile Graph API] Total items added:", addedItems.length);

    // Get updated profile after additions
    const updatedProfileGraph = await getUserProfileGraph(session.user.id);
    const updatedProfileItems = extractItemsFromXml(updatedProfileGraph.xmlData);

    // PHASE 2: Generate conversational response with updated profile
    console.log("💬 [Profile Graph API] Phase 2: Generating conversational response...");
    const aiResponse = await processProfileGraphChat(message, conversationHistory, updatedProfileItems);

    console.log("🤖 [Profile Graph API] AI response type:", aiResponse.suggestions ? "Conversational" : "Legacy");
    console.log("✨ [Profile Graph API] Auto-added", addedItems.length, "items:", addedItems.map(i => i.value).join(", "));
    console.log("💡 [Profile Graph API] Conversational suggestions:", aiResponse.suggestions?.length || 0);

    // Return response with added items and suggestions
    return NextResponse.json({
      success: true,
      message: aiResponse.message,
      addedItems: addedItems,
      suggestions: aiResponse.suggestions || [],
      inlineSuggestions: aiResponse.inlineSuggestions || [],
      graphData: updatedProfileGraph.graphData,
      xmlData: updatedProfileGraph.xmlData
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
