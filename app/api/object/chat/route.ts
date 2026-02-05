/**
 * Generic object chat API route
 * Handles ALL object types through configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/app/object/_configs/loader";
import "@/app/object/_configs/registry"; // Register configs
import { callAI, injectVariables } from "@/lib/object/ai-client";
import { parseAIResponse } from "@/lib/object/response-parser";
import { getUserProfileGraph } from "@/lib/actions/profile-graph-actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { objectType, message, userId, params, messageHistory } = body;

    // Validate input
    if (!objectType || !message || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Load config
    const config = loadConfig(objectType);
    if (!config) {
      return NextResponse.json(
        { error: `Object type "${objectType}" not found` },
        { status: 404 }
      );
    }

    // For profile_attribute, get current profile context to pass to AI
    let profileContext = "";
    if (objectType === "profile_attribute") {
      try {
        const profileGraph = await getUserProfileGraph(userId);
        // Format profile items for AI context
        const items = profileGraph.graphData.nodes
          .filter(n => n.type === 'item')
          .map(n => `- ${n.category}: ${n.value}`)
          .join('\n');
        profileContext = items || "No profile items yet";
        console.log("📋 [Object Chat API] Fetched current profile context for AI analysis");
      } catch (error) {
        console.error("Error fetching profile context:", error);
      }
    }

    // Build system prompt with variables and profile context
    let systemPrompt = config.promptVariables
      ? injectVariables(config.systemPrompt, config.promptVariables)
      : config.systemPrompt;
    
    // Append current profile context for profile_attribute
    if (objectType === "profile_attribute" && profileContext) {
      systemPrompt += `\n\nCURRENT USER PROFILE ITEMS:\n${profileContext}`;
    }

    // Call AI
    const aiResponse = await callAI({
      systemPrompt,
      userMessage: message,
      messageHistory: messageHistory?.slice(-10) || [], // Last 10 messages
    });

    // Parse response
    const { text, cards } = parseAIResponse(aiResponse);

    // Return response
    return NextResponse.json({
      text,
      cards,
      updatedData: null, // Can be populated by card actions
    });
  } catch (error) {
    console.error("Object chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
