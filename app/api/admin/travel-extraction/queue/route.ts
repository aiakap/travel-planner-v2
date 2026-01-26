import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ExtractionQueueManager } from "@/lib/services/extraction-queue-manager";
import { parseEMLFile } from "@/lib/utils/eml-parser";
import { writeFile } from "fs/promises";
import { join } from "path";

export const maxDuration = 60;

/**
 * POST /api/admin/travel-extraction/queue
 * Add files to the extraction queue
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const tripId = formData.get("tripId") as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const queueManager = new ExtractionQueueManager();
    const uploadedFiles = [];

    for (const file of files) {
      const fileName = file.name;
      const fileSize = file.size;
      const fileExtension = fileName.split(".").pop()?.toLowerCase();

      // Determine file type
      let fileType: "eml" | "text" | "image" | "pdf";
      if (fileExtension === "eml" || file.type === "message/rfc822") {
        fileType = "eml";
      } else if (fileExtension === "txt" || file.type === "text/plain") {
        fileType = "text";
      } else if (
        fileExtension === "pdf" ||
        file.type === "application/pdf"
      ) {
        fileType = "pdf";
      } else if (
        ["png", "jpg", "jpeg", "gif", "webp"].includes(fileExtension || "") ||
        file.type.startsWith("image/")
      ) {
        fileType = "image";
      } else {
        // Skip unsupported files
        continue;
      }

      // Handle text-based files (.eml, .txt)
      if (fileType === "eml" || fileType === "text") {
        const buffer = Buffer.from(await file.arrayBuffer());
        let textContent: string;

        if (fileType === "eml") {
          try {
            textContent = await parseEMLFile(file);
          } catch (error) {
            console.error("Error parsing EML file:", error);
            textContent = buffer.toString("utf-8");
          }
        } else {
          textContent = buffer.toString("utf-8");
        }

        uploadedFiles.push({
          fileName,
          fileType,
          fileSize,
          textContent,
        });
      }
      // Handle binary files (images, PDFs)
      else {
        // Save file to temporary storage
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = join(process.cwd(), "public", "uploads", "travel-extraction");
        const timestamp = Date.now();
        const safeFileName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const filePath = join(uploadDir, safeFileName);

        // Ensure upload directory exists
        const fs = require("fs");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        await writeFile(filePath, buffer);

        const fileUrl = `/uploads/travel-extraction/${safeFileName}`;

        uploadedFiles.push({
          fileName,
          fileType,
          fileSize,
          fileUrl,
        });
      }
    }

    // Add to queue
    const items = await queueManager.addToQueue(
      session.user.id,
      uploadedFiles,
      tripId || undefined
    );

    return NextResponse.json({
      success: true,
      items,
      count: items.length,
    });
  } catch (error) {
    console.error("Error adding files to queue:", error);
    return NextResponse.json(
      {
        error: "Failed to add files to queue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/travel-extraction/queue
 * Get queue status for current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queueManager = new ExtractionQueueManager();
    const items = await queueManager.getQueueStatus(session.user.id);
    const statusCounts = await queueManager.getStatusCounts(session.user.id);

    return NextResponse.json({
      success: true,
      items,
      counts: statusCounts,
    });
  } catch (error) {
    console.error("Error getting queue status:", error);
    return NextResponse.json(
      {
        error: "Failed to get queue status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/travel-extraction/queue
 * Delete a queue item or clear completed items
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const clearCompleted = searchParams.get("clearCompleted") === "true";

    const queueManager = new ExtractionQueueManager();

    if (clearCompleted) {
      await queueManager.clearCompleted(session.user.id);
      return NextResponse.json({
        success: true,
        message: "Cleared completed items",
      });
    } else if (itemId) {
      // Verify item belongs to user before deleting
      const item = await queueManager.getQueueItem(itemId);
      if (!item || item.userId !== session.user.id) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
      }

      await queueManager.deleteItem(itemId);
      return NextResponse.json({
        success: true,
        message: "Item deleted",
      });
    } else {
      return NextResponse.json(
        { error: "itemId or clearCompleted parameter required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting queue item:", error);
    return NextResponse.json(
      {
        error: "Failed to delete item",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
