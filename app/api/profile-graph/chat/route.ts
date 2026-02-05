/**
 * Profile Graph Chat API Route
 * 
 * Handles chat messages for the profile graph builder
 * Now uses relational storage instead of XML
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { processProfileGraphChat, extractExplicitItems, processProfileGraphChatCards } from "@/lib/ai/profile-graph-chat";
import { addGraphItem, getUserProfileGraph, getProfileGraphItems } from "@/lib/actions/profile-graph-actions";

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
    const { message, conversationHistory, mode = "conversational" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    console.log("📨 [Profile Graph API] Processing message from user:", session.user.id);
    console.log("📨 [Profile Graph API] Mode:", mode);

    // Get current profile items (from relational tables)
    const profileItems = await getProfileGraphItems();

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
        console.log("✅ [Profile Graph API] Successfully added:", item.value);
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
    const updatedProfileItems = await getProfileGraphItems();

    // PHASE 2: Generate response based on mode
    if (mode === "object") {
      // Object/Card-based mode
      console.log("🎴 [Profile Graph API] Phase 2: Generating card-based response...");
      const cardResponse = await processProfileGraphChatCards(message, conversationHistory, updatedProfileItems);
      
      // Create a set of already-added values (case-insensitive) for duplicate prevention
      const addedValuesSet = new Set(addedItems.map(i => i.value.toLowerCase()));
      
      // Filter and annotate cards to prevent duplicate additions
      // - Remove AUTO_ADD cards for items already added in Phase 1
      // - Mark remaining AUTO_ADD cards with alreadyAdded flag for safety
      const processedCards = (cardResponse.cards || [])
        .filter(card => {
          // Filter out AUTO_ADD cards for values already added in Phase 1
          if (card.type === 'auto_add' && card.data?.value) {
            const isDuplicate = addedValuesSet.has(card.data.value.toLowerCase());
            if (isDuplicate) {
              console.log("🚫 [Profile Graph API] Filtering duplicate AUTO_ADD card:", card.data.value);
            }
            return !isDuplicate;
          }
          return true;
        })
        .map(card => {
          // For any remaining AUTO_ADD cards, add alreadyAdded flag as safety net
          if (card.type === 'auto_add' && card.data?.value) {
            const wasAdded = addedValuesSet.has(card.data.value.toLowerCase());
            return {
              ...card,
              data: { ...card.data, alreadyAdded: wasAdded }
            };
          }
          return card;
        });
      
      console.log("🎴 [Profile Graph API] Card response:");
      console.log("   Text:", cardResponse.text?.substring(0, 50) + "...");
      console.log("   Original cards:", cardResponse.cards?.length || 0);
      console.log("   Processed cards:", processedCards.length);
      console.log("✨ [Profile Graph API] Auto-added", addedItems.length, "items:", addedItems.map(i => i.value).join(", "));

      return NextResponse.json({
        success: true,
        text: cardResponse.text,
        message: cardResponse.text, // For backward compatibility
        cards: processedCards,
        addedItems: addedItems,
        graphData: updatedProfileGraph.graphData,
        xmlData: null
      });
    }

    // Conversational mode (default)
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
      xmlData: null // No longer using XML
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

    // Get profile graph (now from relational tables)
    const profileGraph = await getUserProfileGraph(session.user.id);

    return NextResponse.json({
      success: true,
      graphData: profileGraph.graphData,
      xmlData: null, // No longer using XML
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
