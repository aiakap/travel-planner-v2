import { NextResponse } from "next/server";
import { processQueue, logApiCall } from "../../lib/queue-manager";
import { getVertexAIClient } from "../../lib/vertex-ai-client";

export async function POST() {
  try {
    const maxConcurrent = parseInt(process.env.IMAGEN_MAX_CONCURRENT || "2");

    await processQueue(async (item) => {
      const client = getVertexAIClient();
      const result = await client.generateImageWithRetry(
        {
          prompt: item.prompt,
        },
        item.filename
      );

      // Log the API call
      await logApiCall({
        id: result.apiCallId,
        timestamp: new Date().toISOString(),
        promptId: item.id,
        model: process.env.IMAGEN_MODEL || "imagen-4.0-generate-001",
        status: result.success ? "success" : "error",
        duration: result.duration,
        response: result.success ? { imagePath: result.imagePath } : undefined,
        error: result.error,
      });

      return {
        success: result.success,
        apiCallId: result.apiCallId,
        outputPath: result.imagePath,
        errorMessage: result.error?.message,
      };
    }, maxConcurrent);

    return NextResponse.json({
      success: true,
      message: "Queue processed",
    });
  } catch (error: any) {
    console.error("Error processing queue:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process queue" },
      { status: 500 }
    );
  }
}
