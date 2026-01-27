import { NextRequest, NextResponse } from "next/server";
import { getVertexAIClient } from "../../lib/vertex-ai-client";
import { updateQueueItem, logApiCall, readQueue } from "../../lib/queue-manager";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promptId } = body;

    if (!promptId) {
      return NextResponse.json(
        { error: "promptId is required" },
        { status: 400 }
      );
    }

    // Get the queue item
    const queue = await readQueue();
    const item = queue.prompts.find((p) => p.id === promptId);

    if (!item) {
      return NextResponse.json(
        { error: "Prompt not found in queue" },
        { status: 404 }
      );
    }

    // Update status to processing
    await updateQueueItem(promptId, {
      status: "processing",
      startedAt: new Date().toISOString(),
    });

    // Generate image
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
      promptId: promptId,
      model: process.env.IMAGEN_MODEL || "imagen-4.0-generate-001",
      status: result.success ? "success" : "error",
      duration: result.duration,
      response: result.success ? { imagePath: result.imagePath } : undefined,
      error: result.error,
    });

    // Update queue item
    if (result.success) {
      await updateQueueItem(promptId, {
        status: "completed",
        completedAt: new Date().toISOString(),
        apiCallId: result.apiCallId,
        outputPath: result.imagePath || null,
      });

      return NextResponse.json({
        success: true,
        promptId,
        imagePath: result.imagePath,
        apiCallId: result.apiCallId,
        duration: result.duration,
      });
    } else {
      await updateQueueItem(promptId, {
        status: "error",
        completedAt: new Date().toISOString(),
        apiCallId: result.apiCallId,
        errorMessage: result.error?.message || "Unknown error",
      });

      return NextResponse.json({
        success: false,
        promptId,
        error: result.error,
        apiCallId: result.apiCallId,
        duration: result.duration,
      });
    }
  } catch (error: any) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
