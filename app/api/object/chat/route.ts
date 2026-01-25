/**
 * Generic object chat API route
 * Handles ALL object types through configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/app/object/_configs/loader";
import "@/app/object/_configs/registry"; // Register configs
import { callAI, injectVariables } from "@/lib/object/ai-client";
import { parseAIResponse } from "@/lib/object/response-parser";

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

    // Build system prompt with variables
    const systemPrompt = config.promptVariables
      ? injectVariables(config.systemPrompt, config.promptVariables)
      : config.systemPrompt;

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
