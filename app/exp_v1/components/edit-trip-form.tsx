"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/upload-thing";
import Image from "next/image";
import { updateTrip } from "@/lib/actions/update-trip";
import { Trip } from "@/app/generated/prisma";
import { useAutoSaveCallback } from "@/hooks/use-auto-save";
import { SaveIndicator } from "@/app/exp/ui/save-indicator";
import { ClickToEditField } from "@/app/exp/ui/click-to-edit-field";

export default function EditTripForm({ trip }: { trip: Trip }) {
  const [title, setTitle] = useState(trip.title);
  const [description, setDescription] = useState(trip.description);
  const [startDate, setStartDate] = useState(trip.startDate.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(trip.endDate.toISOString().slice(0, 10));
  const [imageUrl, setImageUrl] = useState<string | null>(trip.imageUrl ?? null);
  
  // Editing states for click-to-edit fields
  const [editingStartDate, setEditingStartDate] = useState(false);
  const [editingEndDate, setEditingEndDate] = useState(false);
  const [editingImage, setEditingImage] = useState(false);

  // Auto-save hook
  const { save, saveState } = useAutoSaveCallback(async (updates: any) => {
    const formData = new FormData();
    if (updates.title !== undefined) formData.set("title", updates.title);
    if (updates.description !== undefined) formData.set("description", updates.description);
    if (updates.startDate !== undefined) formData.set("startDate", updates.startDate);
    if (updates.endDate !== undefined) formData.set("endDate", updates.endDate);
    if (updates.imageUrl !== undefined) formData.set("imageUrl", updates.imageUrl);
    
    await updateTrip(trip.id, formData);
  }, { delay: 500 });

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    save({ title: newTitle });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    save({ description: newDescription });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    save({ startDate: newStartDate });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    save({ endDate: newEndDate });
  };

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    save({ imageUrl: url });
    setEditingImage(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  return (
    <div className="space-y-1">
      {/* Title - Click to Edit */}
      <ClickToEditField
        label="Title"
        value={title}
        onChange={handleTitleChange}
        placeholder="Add a title..."
      />

      {/* Description - Click to Edit */}
      <ClickToEditField
        label="Description"
        value={description}
        onChange={handleDescriptionChange}
        type="textarea"
        placeholder="Add a description..."
      />

      {/* Start Date - Click to Edit */}
      {editingStartDate ? (
        <div className="px-3 py-2">
          <span className="text-sm text-slate-500 block mb-1">Start Date</span>
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            onBlur={() => setEditingStartDate(false)}
            className="w-full border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 pb-1 bg-transparent text-base"
            autoFocus
          />
        </div>
      ) : (
        <div
          onClick={() => setEditingStartDate(true)}
          className="cursor-pointer hover:bg-slate-50 rounded px-3 py-2 transition-colors group"
        >
          <span className="text-sm text-slate-500 block mb-1">Start Date</span>
          <div className="flex items-center justify-between">
            <span className="text-base text-slate-900">
              {formatDate(startDate)}
            </span>
            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              click to edit
            </span>
          </div>
        </div>
      )}

      {/* End Date - Click to Edit */}
      {editingEndDate ? (
        <div className="px-3 py-2">
          <span className="text-sm text-slate-500 block mb-1">End Date</span>
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            onBlur={() => setEditingEndDate(false)}
            className="w-full border-b-2 border-blue-400 focus:outline-none focus:border-blue-600 pb-1 bg-transparent text-base"
            autoFocus
          />
        </div>
      ) : (
        <div
          onClick={() => setEditingEndDate(true)}
          className="cursor-pointer hover:bg-slate-50 rounded px-3 py-2 transition-colors group"
        >
          <span className="text-sm text-slate-500 block mb-1">End Date</span>
          <div className="flex items-center justify-between">
            <span className="text-base text-slate-900">
              {formatDate(endDate)}
            </span>
            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              click to edit
            </span>
          </div>
        </div>
      )}

      {/* Trip Image - Click to Edit */}
      {editingImage ? (
        <div className="px-3 py-2">
          <span className="text-sm text-slate-500 block mb-2">Trip Image</span>
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
                handleImageUpload(res[0].ufsUrl);
              }
            }}
            onUploadError={(error: Error) => {
              console.error("Upload error: ", error);
            }}
          />
          <button
            onClick={() => setEditingImage(false)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700"
          >
            Done
          </button>
        </div>
      ) : (
        <div
          onClick={() => setEditingImage(true)}
          className="cursor-pointer hover:bg-slate-50 rounded px-3 py-2 transition-colors group"
        >
          <span className="text-sm text-slate-500 block mb-1">Trip Image</span>
          <div className="flex items-center justify-between">
            {imageUrl ? (
              <div className="flex items-center gap-2">
                <Image
                  src={imageUrl}
                  alt="Trip"
                  className="w-16 h-16 rounded object-cover"
                  width={64}
                  height={64}
                />
                <span className="text-sm text-slate-600">Change image</span>
              </div>
            ) : (
              <span className="text-base text-slate-400 italic">Add an image...</span>
            )}
            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
              click to edit
            </span>
          </div>
        </div>
      )}

      {/* Floating Save Indicator - Bottom Right */}
      <SaveIndicator state={saveState} position="floating-bottom" />
    </div>
  );
}
