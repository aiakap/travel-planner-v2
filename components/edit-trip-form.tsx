"use client";

import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import { UploadButton } from "@/lib/upload-thing";
import Image from "next/image";
import { updateTrip } from "@/lib/actions/update-trip";
import { Trip } from "@/app/generated/prisma";

export default function EditTripForm({ trip }: { trip: Trip }) {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(trip.imageUrl ?? null);

  return (
    <form
      className="space-y-6"
      action={(formData: FormData) => {
        startTransition(() => {
          if (imageUrl) {
            formData.set("imageUrl", imageUrl);
          }
          updateTrip(trip.id, formData);
        });
      }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          name="title"
          defaultValue={trip.title}
          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          defaultValue={trip.description}
          rows={3}
          className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            defaultValue={trip.startDate.toISOString().slice(0, 10)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            defaultValue={trip.endDate.toISOString().slice(0, 10)}
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Trip Image (optional)
        </label>
        {imageUrl && (
          <div className="mb-3">
            <Image
              src={imageUrl}
              alt="Trip"
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


