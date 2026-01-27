import { prisma } from "@/lib/prisma";
import { ExtractionStatus } from "@/app/generated/prisma/client";
import { ExtractedTravelData } from "@/lib/schemas/travel-extraction-schema";

export interface QueueItem {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string | null;
  textContent: string | null;
  status: ExtractionStatus;
  progress: number;
  extractedData: ExtractedTravelData | null;
  errorMessage: string | null;
  tripId: string | null;
  createdAt: Date;
  processedAt: Date | null;
}

export interface UploadedFile {
  fileName: string;
  fileType: "eml" | "text" | "image" | "pdf";
  fileSize: number;
  fileUrl?: string;
  textContent?: string;
}

/**
 * Manages the travel extraction queue
 * Handles adding files, tracking status, and processing items
 */
export class ExtractionQueueManager {
  /**
   * Add files to the queue
   */
  async addToQueue(
    userId: string,
    files: UploadedFile[],
    tripId?: string
  ): Promise<QueueItem[]> {
    const items = await Promise.all(
      files.map((file) =>
        prisma.travelExtractionQueue.create({
          data: {
            userId,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            fileUrl: file.fileUrl || null,
            textContent: file.textContent || null,
            status: "PENDING",
            progress: 0,
            tripId: tripId || null,
          },
        })
      )
    );

    return items as QueueItem[];
  }

  /**
   * Get queue status for a user
   */
  async getQueueStatus(userId: string): Promise<QueueItem[]> {
    const items = await prisma.travelExtractionQueue.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return items as QueueItem[];
  }

  /**
   * Get a specific queue item
   */
  async getQueueItem(itemId: string): Promise<QueueItem | null> {
    const item = await prisma.travelExtractionQueue.findUnique({
      where: { id: itemId },
    });

    return item as QueueItem | null;
  }

  /**
   * Update item status
   */
  async updateStatus(
    itemId: string,
    status: ExtractionStatus,
    data?: {
      progress?: number;
      extractedData?: ExtractedTravelData;
      errorMessage?: string;
    }
  ): Promise<void> {
    await prisma.travelExtractionQueue.update({
      where: { id: itemId },
      data: {
        status,
        progress: data?.progress,
        extractedData: data?.extractedData as any,
        errorMessage: data?.errorMessage,
        processedAt: status === "COMPLETED" || status === "FAILED" ? new Date() : undefined,
      },
    });
  }

  /**
   * Update progress for an item
   */
  async updateProgress(itemId: string, progress: number): Promise<void> {
    await prisma.travelExtractionQueue.update({
      where: { id: itemId },
      data: { progress },
    });
  }

  /**
   * Mark item as reviewed
   */
  async markAsReviewed(itemId: string): Promise<void> {
    await prisma.travelExtractionQueue.update({
      where: { id: itemId },
      data: { status: "REVIEWED" },
    });
  }

  /**
   * Retry a failed item
   */
  async retry(itemId: string): Promise<void> {
    await prisma.travelExtractionQueue.update({
      where: { id: itemId },
      data: {
        status: "PENDING",
        progress: 0,
        errorMessage: null,
        processedAt: null,
      },
    });
  }

  /**
   * Delete an item from the queue
   */
  async deleteItem(itemId: string): Promise<void> {
    await prisma.travelExtractionQueue.delete({
      where: { id: itemId },
    });
  }

  /**
   * Clear completed items for a user
   */
  async clearCompleted(userId: string): Promise<void> {
    await prisma.travelExtractionQueue.deleteMany({
      where: {
        userId,
        status: { in: ["COMPLETED", "REVIEWED"] },
      },
    });
  }

  /**
   * Get pending items for a user
   */
  async getPendingItems(userId: string): Promise<QueueItem[]> {
    const items = await prisma.travelExtractionQueue.findMany({
      where: {
        userId,
        status: "PENDING",
      },
      orderBy: { createdAt: "asc" },
    });

    return items as QueueItem[];
  }

  /**
   * Get count of items by status for a user
   */
  async getStatusCounts(userId: string): Promise<Record<ExtractionStatus, number>> {
    const counts = await prisma.travelExtractionQueue.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });

    const result: Record<string, number> = {
      PENDING: 0,
      PROCESSING: 0,
      COMPLETED: 0,
      FAILED: 0,
      REVIEWED: 0,
    };

    counts.forEach((count) => {
      result[count.status] = count._count;
    });

    return result as Record<ExtractionStatus, number>;
  }
}
