import { NextResponse } from "next/server";
import { buildExpPrompt } from "@/app/exp/lib/prompts/build-exp-prompt";
import type { PromptBuildContext } from "@/app/exp/lib/prompts/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { context } = body;

    if (!context || !context.userMessage) {
      return NextResponse.json(
        { error: "Missing required field: context.userMessage" },
        { status: 400 }
      );
    }

    // Build the prompt with the provided context
    const result = buildExpPrompt(context as PromptBuildContext);

    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = Math.ceil(result.stats.totalLength / 4);

    return NextResponse.json({
      prompt: result.prompt,
      activePlugins: result.activePlugins,
      stats: {
        ...result.stats,
        estimatedTokens,
      },
      context: context, // Echo back the context for reference
    });
  } catch (error) {
    console.error("[Admin API] Error testing prompt:", error);
    return NextResponse.json(
      { 
        error: "Failed to build prompt",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
