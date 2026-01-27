import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { expResponseSchema, validateExpResponse } from "@/lib/schemas/exp-response-schema";
import { buildExpPrompt } from "@/app/exp/lib/prompts/build-exp-prompt";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userMessage, context, model = "gpt-4o", outputType = "full" } = body;
    
    if (!userMessage) {
      return NextResponse.json(
        { success: false, error: "userMessage is required" },
        { status: 400 }
      );
    }
    
    // Build prompt using exp system
    const promptContext = {
      userMessage,
      messageCount: context?.messageCount || 1,
      hasExistingTrip: context?.hasExistingTrip || false,
      chatType: context?.chatType,
      metadata: context?.metadata || {},
    };
    
    const { prompt, activePlugins } = buildExpPrompt(promptContext);
    
    // Start timing
    const startTime = Date.now();
    
    // Generate structured output
    const result = await generateObject({
      model: openai(model),
      schema: expResponseSchema,
      prompt,
    });
    
    const duration = Date.now() - startTime;
    
    // Validate response
    const validation = validateExpResponse(result.object);
    
    // Filter output based on type
    let filteredData = result.object;
    if (outputType === "cards") {
      filteredData = {
        ...result.object,
        text: "",
        places: [],
        transport: [],
        hotels: [],
      };
    } else if (outputType === "suggestions") {
      filteredData = {
        ...result.object,
        text: "",
        cards: [],
      };
    }
    
    return NextResponse.json({
      success: true,
      data: filteredData,
      validation: {
        valid: validation.success,
        errors: validation.error ? [validation.error] : undefined,
      },
      usage: {
        promptTokens: result.usage?.promptTokens || 0,
        completionTokens: result.usage?.completionTokens || 0,
        totalTokens: result.usage?.totalTokens || 0,
      },
      duration,
      meta: {
        model,
        outputType,
        activePlugins,
        promptLength: prompt.length,
      },
    });
  } catch (error) {
    console.error("[Admin API] Exp response test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate exp response",
      },
      { status: 500 }
    );
  }
}
