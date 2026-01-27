import { NextRequest, NextResponse } from "next/server";
import { getVertexAIClient, ImageGenerationParams } from "@/archived/image-generator/lib/vertex-ai-client";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio = "1:1", count = 2, model = "imagen-4.0-generate-001" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (count < 1 || count > 4) {
      return NextResponse.json(
        { error: "Count must be between 1 and 4" },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const results = [];
    
    // Get Vertex AI client
    const client = getVertexAIClient();

    // Generate multiple images
    for (let i = 0; i < count; i++) {
      const params: ImageGenerationParams = {
        prompt,
        aspectRatio,
      };

      const filename = `admin-batch-${uuidv4()}-${i}.png`;
      const result = await client.generateImage(params, filename);

      if (result.success && result.imagePath) {
        const actualFilename = result.imagePath.split("/").pop() || filename;
        const imageUrl = `/api/imagen/output/${actualFilename}`;
        
        results.push({
          success: true,
          imageUrl,
          imagePath: result.imagePath,
          filename: actualFilename,
          index: i,
        });
      } else {
        results.push({
          success: false,
          error: result.error?.message || "Generation failed",
          index: i,
        });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      results,
      totalCount: count,
      successCount,
      failureCount: count - successCount,
      prompt,
      aspectRatio,
      model: model || process.env.IMAGEN_MODEL || "imagen-4.0-generate-001",
      duration,
    });
  } catch (error: any) {
    console.error("Batch image generation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate images",
        details: error.details,
      },
      { status: 500 }
    );
  }
}
