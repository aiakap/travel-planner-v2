import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { originalPrompt, selectedCount, generationNumber } = await request.json();

    if (!originalPrompt) {
      return NextResponse.json(
        { error: "Original prompt is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a logo design expert. Based on the user's original prompt and their selection of ${selectedCount} logo(s) from 4 options, generate a refined prompt that will create similar logos with improvements.

Guidelines:
- Keep the core concept from the original prompt
- Infer style preferences from the selection (modern, minimalist, colorful, etc.)
- Add specific design directives for logo creation
- Emphasize clarity, scalability, and brand identity
- Include technical specs: vector-style, clean lines, simple shapes
- Suggest maintaining 1:1 aspect ratio for logos
- Keep prompt under 200 words
- Make the prompt more specific and detailed than the original
- Add professional logo design terminology

Return ONLY the refined prompt text, nothing else. Do not include explanations or meta-commentary.`;

    const userMessage = `Original prompt: "${originalPrompt}"

User selected ${selectedCount} logo(s) out of 4, indicating these designs resonated with them.
This is generation ${generationNumber}.

Create a refined prompt that builds on what worked while improving the design. Focus on making the logos more professional, memorable, and scalable.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    const refinedPrompt = completion.choices[0]?.message?.content?.trim();

    if (!refinedPrompt) {
      throw new Error("No refined prompt generated");
    }

    return NextResponse.json({
      success: true,
      refinedPrompt,
      reasoning: `Refined based on ${selectedCount} selected logo(s) from generation ${generationNumber}`,
    });
  } catch (error: any) {
    console.error("Prompt refinement error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to refine prompt",
        details: error.details,
      },
      { status: 500 }
    );
  }
}
