"use client";

import { QueueItem } from "../lib/queue-manager";
import Image from "next/image";

interface ImageGalleryProps {
  queue: QueueItem[];
}

export function ImageGallery({ queue }: ImageGalleryProps) {
  const completedItems = queue.filter((item) => item.status === "completed" && item.outputPath);

  if (completedItems.length === 0) {
    return null;
  }

  const getImageUrl = (outputPath: string) => {
    // Convert absolute path to relative URL
    const filename = outputPath.split("/").pop();
    return `/image-generator/output/${filename}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Generated Images</h2>
      <p className="text-gray-600 mb-6">
        {completedItems.length} image{completedItems.length !== 1 ? "s" : ""} generated
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {completedItems.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative aspect-square bg-gray-100">
              <Image
                src={getImageUrl(item.outputPath!)}
                alt={item.prompt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-2">{item.filename}</h3>
              <p className="text-xs text-gray-600 line-clamp-2">{item.prompt}</p>
              <div className="mt-3 flex gap-2">
                <a
                  href={getImageUrl(item.outputPath!)}
                  download
                  className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
                >
                  Download
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.prompt);
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  title="Copy prompt"
                >
                  📋
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
