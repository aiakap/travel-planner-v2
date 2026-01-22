"use client";

import { useState, useEffect } from "react";
import { PromptInput } from "../components/prompt-input";
import { QueueDisplay } from "../components/queue-display";
import { ImageGallery } from "../components/image-gallery";
import { ProgressIndicator } from "../components/progress-indicator";
import { QueueItem } from "../lib/queue-manager";

interface QueueStats {
  total: number;
  pending: number;
  waiting: number;
  processing: number;
  completed: number;
  error: number;
}

export default function ImageGeneratorPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    waiting: 0,
    processing: 0,
    completed: 0,
    error: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch queue status
  const fetchQueueStatus = async () => {
    try {
      const response = await fetch("/image-generator/api/queue-status");
      if (!response.ok) {
        throw new Error("Failed to fetch queue status");
      }
      const data = await response.json();
      setQueue(data.queue);
      setStats(data.stats);
    } catch (err: any) {
      console.error("Error fetching queue:", err);
    }
  };

  // Poll queue status every 2 seconds
  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-process queue when there are pending items
  useEffect(() => {
    if (stats.pending > 0 && !isProcessing) {
      processQueue();
    }
  }, [stats.pending]);

  // Handle prompt submission
  const handleSubmit = async (text: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Parse prompts
      const response = await fetch("/image-generator/api/parse-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to parse prompts");
      }

      const data = await response.json();
      console.log(`Added ${data.count} prompts to queue`);

      // Refresh queue
      await fetchQueueStatus();
    } catch (err: any) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process the queue
  const processQueue = async () => {
    try {
      const response = await fetch("/image-generator/api/process-queue", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to process queue");
      }

      // Refresh queue
      await fetchQueueStatus();
    } catch (err: any) {
      console.error("Error processing queue:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Image Generator
          </h1>
          <p className="text-gray-600">
            Powered by Google Vertex AI Imagen
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-semibold">Error:</span>
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Progress indicator */}
        {stats.total > 0 && (
          <div className="mb-6">
            <ProgressIndicator stats={stats} />
          </div>
        )}

        {/* Prompt input */}
        <div className="mb-6">
          <PromptInput onSubmit={handleSubmit} isProcessing={isProcessing} />
        </div>

        {/* Queue display */}
        {queue.length > 0 && (
          <div className="mb-6">
            <QueueDisplay queue={queue} stats={stats} />
          </div>
        )}

        {/* Image gallery */}
        <div className="mb-6">
          <ImageGallery queue={queue} />
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-12">
          <p>
            This tool uses Google Vertex AI Imagen for image generation and OpenAI GPT-4 for prompt parsing.
          </p>
          <p className="mt-2">
            Images are saved to the <code className="bg-gray-200 px-2 py-1 rounded">output/</code> folder.
          </p>
        </div>
      </div>
    </div>
  );
}
