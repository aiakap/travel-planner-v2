"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UploadButton } from "@/lib/upload-thing";
import { useState } from "react";
import Image from "next/image";

interface NewTripFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    imageUrl: string | null;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function NewTripForm({ onSubmit, isSubmitting = false }: NewTripFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      title,
      description,
      startDate,
      endDate,
      imageUrl,
    });
    
    // Reset form after submission
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setImageUrl(null);
  };

  return (
    <Card>
      <CardHeader className="text-lg font-semibold">Create New Trip</CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Japan trip..."
              className={cn(
                "w-full border border-gray-300 px-3 py-2",
                "rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              required
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Trip description..."
              rows={3}
              className={cn(
                "w-full border border-gray-300 px-3 py-2",
                "rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={cn(
                  "w-full border border-gray-300 px-3 py-2",
                  "rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={cn(
                  "w-full border border-gray-300 px-3 py-2",
                  "rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trip Image (Optional)
            </label>

            {imageUrl && (
              <div className="relative mb-4">
                <Image
                  src={imageUrl}
                  alt="Trip Preview"
                  className="w-full rounded-md max-h-48 object-cover"
                  width={300}
                  height={100}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  onClick={() => setImageUrl(null)}
                  disabled={isSubmitting}
                >
                  Remove
                </Button>
              </div>
            )}
            
            {!imageUrl && (
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  if (res && res[0].ufsUrl) {
                    setImageUrl(res[0].ufsUrl);
                  }
                }}
                onUploadError={(error: Error) => {
                  console.error("Upload error: ", error);
                }}
              />
            )}
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating..." : "Create Trip"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
