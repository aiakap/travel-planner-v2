"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { addSegment } from "@/lib/actions/add-location";
import { UploadButton } from "@/lib/upload-thing";
import { formatForDateTimeLocal } from "@/lib/utils";
import { SegmentType } from "@/app/generated/prisma";

export default function NewLocationClient({
  tripId,
  lastEndTime,
  lastEndAddress,
  segmentTypes,
}: {
  tripId: string;
  lastEndTime: string | null;
  lastEndAddress: string | null;
  segmentTypes: SegmentType[];
}) {
  const [isPending, startTransation] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startAddress, setStartAddress] = useState("");
  const [segmentTypeId, setSegmentTypeId] = useState("");

  useEffect(() => {
    if (!lastEndTime) {
      return;
    }

    const start = new Date(lastEndTime);
    if (Number.isNaN(start.getTime())) {
      return;
    }

    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    setStartTime(formatForDateTimeLocal(start));
    setEndTime(formatForDateTimeLocal(end));
  }, [lastEndTime]);

  useEffect(() => {
    if (!lastEndAddress) {
      return;
    }
    setStartAddress(lastEndAddress);
  }, [lastEndAddress]);

  useEffect(() => {
    if (segmentTypes.length > 0) {
      setSegmentTypeId(segmentTypes[0].id);
    }
  }, [segmentTypes]);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white p-8 shadow-lg rounded-lg">
          <h1 className="text-3xl font-bold text-center mb-6">
            Add New Segment
          </h1>

          <form
            className="space-y-6"
            action={(formData: FormData) => {
              startTransation(() => {
                addSegment(formData, tripId);
              });
            }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segment Type
              </label>
              <select
                name="segmentTypeId"
                required
                value={segmentTypeId}
                onChange={(event) => setSegmentTypeId(event.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {segmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segment Name
              </label>
              <input
                name="name"
                type="text"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Address
              </label>
              <input
                name="startAddress"
                type="text"
                required
                value={startAddress}
                onChange={(event) => setStartAddress(event.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Address
              </label>
              <input
                name="endAddress"
                type="text"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time (optional)
                </label>
              <input
                name="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time (optional)
                </label>
              <input
                name="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                name="notes"
                rows={3}
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Segment Image (optional)
              </label>
              {imageUrl && (
                <p className="text-sm text-gray-500 mb-2 truncate">{imageUrl}</p>
              )}
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
              <input type="hidden" name="imageUrl" value={imageUrl || ""} />
            </div>
            <Button type="submit" className="w-full">
              {isPending ? "Adding..." : "Add Segment"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
