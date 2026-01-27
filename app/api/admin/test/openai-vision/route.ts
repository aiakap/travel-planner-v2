import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, prompt, model = "gpt-4o", extractStructured = false } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL is required" },
        { status: 400 }
      );
    }

    // Check if model supports vision
    if (model.startsWith("o1")) {
      return NextResponse.json(
        { error: "o1 models do not support vision. Please use gpt-4o or gpt-4o-mini." },
        { status: 400 }
      );
    }

    const defaultPrompt = extractStructured
      ? `Analyze this travel-related image and extract all relevant information in a structured format. Include:
- Type of document (ticket, boarding pass, hotel confirmation, etc.)
- Dates and times
- Locations
- Names
- Confirmation codes
- Any other relevant details

Provide the information in a clear, organized format.`
      : `Describe this travel-related image in detail. What type of document or scene is this? What information can you extract from it?`;

    const startTime = Date.now();

    const result = await generateText({
      model: openai(model),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt || defaultPrompt },
            { type: "image", image: imageUrl },
          ],
        },
      ],
      maxOutputTokens: 1000,
    });

    const duration_ms = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      analysis: result.text,
      model,
      usage: {
        promptTokens: result.usage?.inputTokens || 0,
        completionTokens: result.usage?.outputTokens || 0,
        totalTokens: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
      },
      duration: duration_ms,
      imageUrl,
    });
  } catch (error: any) {
    console.error("Vision analysis error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to analyze image",
        details: error.details,
      },
      { status: 500 }
    );
  }
}
