"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./components/upload-zone";
import { QueueTable } from "./components/queue-table";
import { ReviewModal } from "./components/review-modal";
import { QueueItem } from "@/lib/services/extraction-queue-manager";
import { ExtractedTravelData } from "@/lib/schemas/travel-extraction-schema";
import { PlayCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TravelExtractionPage() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [currentReviewData, setCurrentReviewData] = useState<ExtractedTravelData | null>(null);
  const [currentReviewItemId, setCurrentReviewItemId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch queue status
  const fetchQueue = async () => {
    try {
      const response = await fetch("/api/admin/travel-extraction/queue");
      if (!response.ok) throw new Error("Failed to fetch queue");
      const data = await response.json();
      setQueueItems(data.items);
    } catch (error) {
      console.error("Error fetching queue:", error);
      toast({
        title: "Error",
        description: "Failed to load queue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle file upload
  const handleFilesAdded = async (files: File[]) => {
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetch("/api/admin/travel-extraction/queue", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload files");

      const data = await response.json();
      toast({
        title: "Success",
        description: `Added ${data.count} file(s) to queue`,
      });

      fetchQueue();
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    }
  };

  // Process single item
  const handleProcessItem = async (itemId: string) => {
    try {
      const response = await fetch("/api/admin/travel-extraction/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) throw new Error("Failed to process item");

      toast({
        title: "Processing",
        description: "Item is being processed",
      });

      fetchQueue();
    } catch (error) {
      console.error("Error processing item:", error);
      toast({
        title: "Error",
        description: "Failed to process item",
        variant: "destructive",
      });
    }
  };

  // Process all pending items
  const handleProcessAll = async () => {
    setProcessing(true);
    try {
      const response = await fetch("/api/admin/travel-extraction/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processAll: true }),
      });

      if (!response.ok) throw new Error("Failed to process items");

      const data = await response.json();
      toast({
        title: "Processing Complete",
        description: `Processed ${data.successful} item(s) successfully, ${data.failed} failed`,
      });

      fetchQueue();
    } catch (error) {
      console.error("Error processing all:", error);
      toast({
        title: "Error",
        description: "Failed to process items",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  // Retry failed item
  const handleRetry = async (itemId: string) => {
    try {
      const response = await fetch("/api/admin/travel-extraction/process", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (!response.ok) throw new Error("Failed to retry item");

      toast({
        title: "Retry",
        description: "Item has been reset and will be processed again",
      });

      fetchQueue();
    } catch (error) {
      console.error("Error retrying item:", error);
      toast({
        title: "Error",
        description: "Failed to retry item",
        variant: "destructive",
      });
    }
  };

  // Delete item
  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(
        `/api/admin/travel-extraction/queue?itemId=${itemId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete item");

      toast({
        title: "Deleted",
        description: "Item removed from queue",
      });

      fetchQueue();
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  // Clear completed items
  const handleClearCompleted = async () => {
    try {
      const response = await fetch(
        "/api/admin/travel-extraction/queue?clearCompleted=true",
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to clear completed items");

      toast({
        title: "Cleared",
        description: "Completed items removed from queue",
      });

      fetchQueue();
    } catch (error) {
      console.error("Error clearing completed:", error);
      toast({
        title: "Error",
        description: "Failed to clear completed items",
        variant: "destructive",
      });
    }
  };

  // View results
  const handleViewResults = (item: QueueItem) => {
    if (item.extractedData) {
      setCurrentReviewData(item.extractedData as ExtractedTravelData);
      setCurrentReviewItemId(item.id);
      setReviewModalOpen(true);
    }
  };

  // Save selected items to trip
  const handleSaveToTrip = async (selectedItemIds: Set<string>) => {
    // TODO: Implement adding items to trip
    // For now, just mark the item as reviewed
    if (currentReviewItemId) {
      try {
        // Mark as reviewed in database
        // This would require a new API endpoint
        toast({
          title: "Success",
          description: `${selectedItemIds.size} item(s) will be added to your trip`,
        });
        
        setReviewModalOpen(false);
        setCurrentReviewData(null);
        setCurrentReviewItemId(null);
        fetchQueue();
      } catch (error) {
        console.error("Error saving to trip:", error);
        toast({
          title: "Error",
          description: "Failed to save items to trip",
          variant: "destructive",
        });
      }
    }
  };

  const pendingCount = queueItems.filter((i) => i.status === "PENDING").length;
  const completedCount = queueItems.filter(
    (i) => i.status === "COMPLETED" || i.status === "REVIEWED"
  ).length;

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Travel Data Extraction</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload confirmation emails, images, or PDFs to automatically extract flight and
          hotel information
        </p>
      </div>

      {/* Upload Zone */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Drag & drop or select files. Supports .eml, .txt, .png, .jpg, and .pdf
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadZone onFilesAdded={handleFilesAdded} />
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Processing Queue</CardTitle>
              <CardDescription>
                {queueItems.length} item{queueItems.length !== 1 ? "s" : ""} in queue
                {pendingCount > 0 && ` (${pendingCount} pending)`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {pendingCount > 0 && (
                <Button
                  onClick={handleProcessAll}
                  disabled={processing}
                  className="gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Process All ({pendingCount})
                </Button>
              )}
              {completedCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearCompleted}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Completed
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : (
            <QueueTable
              items={queueItems}
              onProcess={handleProcessItem}
              onRetry={handleRetry}
              onDelete={handleDelete}
              onViewResults={handleViewResults}
            />
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      {currentReviewData && (
        <ReviewModal
          open={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setCurrentReviewData(null);
            setCurrentReviewItemId(null);
          }}
          extractedData={currentReviewData}
          onSave={handleSaveToTrip}
        />
      )}
    </div>
  );
}
