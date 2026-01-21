"use client";

import { Segment, SegmentType } from "@/app/generated/prisma";
import { updateSegment } from "@/lib/actions/update-segment";
import { UploadButton } from "@/lib/upload-thing";
import { formatForDateTimeLocal } from "@/lib/utils";
import Image from "next/image";
import { useState, useTransition } from "react";
import { Button } from "./ui/button";

export default function EditSegmentForm({
  segment,
  segmentTypes,
}: {
  segment: Segment;
  segmentTypes: SegmentType[];
}) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(
    segment.imageUrl ?? null
  );
  const [segmentTypeId, setSegmentTypeId] = useState<string>(
    segment.segmentTypeId ?? ""
  );

  const startTimeValue = segment.startTime
    ? formatForDateTimeLocal(new Date(segment.startTime))
    : "";
  const endTimeValue = segment.endTime
    ? formatForDateTimeLocal(new Date(segment.endTime))
    : "";

  return (
    <form
      className="space-y-6"
      action={(formData: FormData) => {
        startTransition(() => {
          if (imageUrl) {
            formData.set("imageUrl", imageUrl);
          }
          updateSegment(segment.id, formData);
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
          defaultValue={segment.name}
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
          defaultValue={segment.startTitle}
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
          defaultValue={segment.endTitle}
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
            defaultValue={startTimeValue}
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
            defaultValue={endTimeValue}
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
          defaultValue={segment.notes ?? ""}
          className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Segment Image (optional)
        </label>
        {imageUrl && (
          <div className="mb-3">
            <Image
              src={imageUrl}
              alt="Segment"
              className="w-full rounded-md max-h-48 object-cover"
              width={400}
              height={200}
            />
          </div>
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
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
