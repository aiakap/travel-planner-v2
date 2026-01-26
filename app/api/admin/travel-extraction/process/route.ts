import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ExtractionQueueManager } from "@/lib/services/extraction-queue-manager";
import { TravelTextExtractor } from "@/lib/services/travel-text-extractor";
import { TravelImageExtractor } from "@/lib/services/travel-image-extractor";
import { join } from "path";

export const maxDuration = 300; // 5 minutes for batch processing

/**
 * POST /api/admin/travel-extraction/process
 * Process queue items (single or batch)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId, processAll } = body;

    const queueManager = new ExtractionQueueManager();

    if (processAll) {
      // Process all pending items (with concurrency limit)
      const pendingItems = await queueManager.getPendingItems(session.user.id);
      
      if (pendingItems.length === 0) {
        return NextResponse.json({
          success: true,
          message: "No pending items to process",
          processed: 0,
        });
      }

      // Process up to 3 items concurrently
      const maxConcurrent = 3;
      const results = [];

      for (let i = 0; i < pendingItems.length; i += maxConcurrent) {
        const batch = pendingItems.slice(i, i + maxConcurrent);
        const batchResults = await Promise.all(
          batch.map((item) => processItem(queueManager, item.id))
        );
        results.push(...batchResults);
      }

      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return NextResponse.json({
        success: true,
        message: `Processed ${results.length} items`,
        successful,
        failed,
        results,
      });
    } else if (itemId) {
      // Process single item
      // Verify item belongs to user
      const item = await queueManager.getQueueItem(itemId);
      if (!item || item.userId !== session.user.id) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      const result = await processItem(queueManager, itemId);

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.data,
        error: result.error,
      });
    } else {
      return NextResponse.json(
        { error: "itemId or processAll required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error processing queue:", error);
    return NextResponse.json(
      {
        error: "Failed to process queue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Process a single queue item
 */
async function processItem(
  queueManager: ExtractionQueueManager,
  itemId: string
): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
  try {
    const item = await queueManager.getQueueItem(itemId);
    if (!item) {
      return {
        success: false,
        message: "Item not found",
        error: "Item not found",
      };
    }

    // Update status to processing
    await queueManager.updateStatus(itemId, "PROCESSING", { progress: 0 });

    const textExtractor = new TravelTextExtractor();
    const imageExtractor = new TravelImageExtractor();

    let extractedData;

    try {
      if (item.fileType === "eml" || item.fileType === "text") {
        // Extract from text content
        if (!item.textContent) {
          throw new Error("No text content available");
        }

        await queueManager.updateProgress(itemId, 30);
        extractedData = await textExtractor.extract(item.textContent);
        await queueManager.updateProgress(itemId, 90);
      } else if (item.fileType === "image") {
        // Extract from image
        if (!item.fileUrl) {
          throw new Error("No image URL available");
        }

        const imagePath = join(process.cwd(), "public", item.fileUrl);
        await queueManager.updateProgress(itemId, 30);
        extractedData = await imageExtractor.extractFromImage(imagePath);
        await queueManager.updateProgress(itemId, 90);
      } else if (item.fileType === "pdf") {
        // Extract from PDF
        if (!item.fileUrl) {
          throw new Error("No PDF URL available");
        }

        const pdfPath = join(process.cwd(), "public", item.fileUrl);
        await queueManager.updateProgress(itemId, 30);
        extractedData = await imageExtractor.extractFromPDF(pdfPath);
        await queueManager.updateProgress(itemId, 90);
      } else {
        throw new Error(`Unsupported file type: ${item.fileType}`);
      }

      // Update status to completed
      await queueManager.updateStatus(itemId, "COMPLETED", {
        progress: 100,
        extractedData,
      });

      // Count extracted items
      const totalItems =
        extractedData.flights.length +
        extractedData.hotels.length +
        extractedData.rentalCars.length +
        extractedData.activities.length;

      return {
        success: true,
        message: `Extracted ${totalItems} item(s)`,
        data: extractedData,
      };
    } catch (extractionError) {
      console.error("Extraction error:", extractionError);
      
      const errorMessage =
        extractionError instanceof Error
          ? extractionError.message
          : "Extraction failed";

      await queueManager.updateStatus(itemId, "FAILED", {
        progress: 0,
        errorMessage,
      });

      return {
        success: false,
        message: "Extraction failed",
        error: errorMessage,
      };
    }
  } catch (error) {
    console.error("Error in processItem:", error);
    return {
      success: false,
      message: "Processing failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * PATCH /api/admin/travel-extraction/process
 * Retry a failed item
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { itemId } = body;

    if (!itemId) {
      return NextResponse.json(
        { error: "itemId required" },
        { status: 400 }
      );
    }

    const queueManager = new ExtractionQueueManager();
    
    // Verify item belongs to user
    const item = await queueManager.getQueueItem(itemId);
    if (!item || item.userId !== session.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Retry the item
    await queueManager.retry(itemId);

    return NextResponse.json({
      success: true,
      message: "Item reset to pending, ready to retry",
    });
  } catch (error) {
    console.error("Error retrying item:", error);
    return NextResponse.json(
      {
        error: "Failed to retry item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
