import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const { destination, duration, interests, budget, model = "gpt-4o" } = await request.json();

    if (!destination) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }

    const prompt = `Create a detailed ${duration || 3}-day travel itinerary for ${destination}.

${interests ? `Traveler interests: ${interests}` : ""}
${budget ? `Budget level: ${budget}` : ""}

Please provide:
1. Day-by-day breakdown with specific activities and timing
2. Restaurant recommendations with cuisine types
3. Accommodation suggestions with neighborhoods
4. Transportation tips
5. Estimated costs for major activities
6. Local tips and cultural notes

Format the response in a clear, structured way with headers for each day.`;

    const startTime = Date.now();

    const result = await generateText({
      model: openai(model),
      prompt,
      temperature: 0.7,
      maxOutputTokens: 2000,
    });

    const duration_ms = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      itinerary: result.text,
      model,
      usage: {
        promptTokens: result.usage?.inputTokens || 0,
        completionTokens: result.usage?.outputTokens || 0,
        totalTokens: (result.usage?.inputTokens || 0) + (result.usage?.outputTokens || 0),
      },
      duration: duration_ms,
      parameters: {
        destination,
        duration,
        interests,
        budget,
      },
    });
  } catch (error: any) {
    console.error("Itinerary generation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate itinerary",
        details: error.details,
      },
      { status: 500 }
    );
  }
}
