import { NextRequest, NextResponse } from "next/server";
import { getVertexAIClient, ImageGenerationParams } from "@/image-generator/lib/vertex-ai-client";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { prompt, aspectRatio = "1:1" } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const params: ImageGenerationParams = {
      prompt,
      aspectRatio,
    };

    const startTime = Date.now();
    
    // Get Vertex AI client and generate image
    const client = getVertexAIClient();
    const filename = `admin-test-${uuidv4()}.png`;
    const result = await client.generateImage(params, filename);
    
    const duration = Date.now() - startTime;

    // Check if generation was successful
    if (!result.success || !result.imagePath) {
      return NextResponse.json(
        {
          error: result.error?.message || "Image generation failed",
          details: result.error?.details,
        },
        { status: 500 }
      );
    }

    // Get the actual filename from the image path
    // The vertex client adds a timestamp suffix to the filename (e.g., filename_1234567890.png)
    const actualFilename = result.imagePath.split("/").pop() || filename;
    
    // Return URL that points to our image serving API route
    const imageUrl = `/api/imagen/output/${actualFilename}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      imagePath: result.imagePath,
      filename: actualFilename,
      prompt,
      aspectRatio,
      duration,
      model: process.env.IMAGEN_MODEL || "imagen-4.0-generate-001",
      apiCallId: result.apiCallId,
    });
  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate image",
        details: error.details,
      },
      { status: 500 }
    );
  }
}
