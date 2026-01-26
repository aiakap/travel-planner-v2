import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const { prompt, schema } = await request.json();

    if (!prompt || !schema) {
      return NextResponse.json(
        { error: "Prompt and schema are required" },
        { status: 400 }
      );
    }

    // Convert JSON schema to Zod schema
    const zodSchema = jsonSchemaToZod(schema);

    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: zodSchema,
      prompt,
    });

    return NextResponse.json({
      success: true,
      data: result.object,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error("Structured generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate structured data" },
      { status: 500 }
    );
  }
}

// Helper function to convert JSON schema to Zod
function jsonSchemaToZod(jsonSchema: any): z.ZodTypeAny {
  if (jsonSchema.type === "object") {
    const shape: Record<string, z.ZodTypeAny> = {};
    const required = jsonSchema.required || [];
    
    for (const [key, value] of Object.entries(jsonSchema.properties || {})) {
      const prop = value as any;
      let zodType: z.ZodTypeAny;
      
      if (prop.type === "string") {
        zodType = z.string();
      } else if (prop.type === "number") {
        zodType = z.number();
      } else if (prop.type === "boolean") {
        zodType = z.boolean();
      } else if (prop.type === "array") {
        zodType = z.array(z.any());
      } else {
        zodType = z.any();
      }
      
      // Make nullable with default if not in required array (OpenAI compatibility)
      if (!required.includes(key)) {
        zodType = zodType.nullable().default(null);
      }
      
      shape[key] = zodType;
    }
    return z.object(shape);
  }
  return z.any();
}
