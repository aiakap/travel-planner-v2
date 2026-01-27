import { NextRequest, NextResponse } from "next/server";
import { parsePromptsFromText } from "../../lib/prompt-parser";
import { addToQueue } from "../../lib/queue-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    // Parse prompts using AI
    const result = await parsePromptsFromText(text);

    if (result.prompts.length === 0) {
      return NextResponse.json(
        { error: "No prompts found in the text" },
        { status: 400 }
      );
    }

    // Add to queue
    await addToQueue(result.prompts);

    return NextResponse.json({
      success: true,
      prompts: result.prompts,
      rawXml: result.rawXml,
      count: result.prompts.length,
    });
  } catch (error: any) {
    console.error("Error parsing prompts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse prompts" },
      { status: 500 }
    );
  }
}
