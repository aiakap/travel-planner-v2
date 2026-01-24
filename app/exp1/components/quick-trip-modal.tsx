"use client";

import { useState } from "react";
import { Button } from "@/app/exp1/ui/button";
import { Input } from "@/app/exp1/ui/input";
import { Label } from "@/app/exp1/ui/label";
import { X, Loader2, Calendar } from "lucide-react";
import { createQuickTrip } from "@/lib/actions/create-quick-trip";

interface QuickTripModalProps {
  placeName: string;
  placeLocation?: string; // e.g., "Paris, France"
  onClose: () => void;
  onTripCreated: (tripId: string) => void;
}

export function QuickTripModal({
  placeName,
  placeLocation,
  onClose,
  onTripCreated,
}: QuickTripModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Smart defaults
  const defaultTitle = placeLocation
    ? `Trip to ${placeLocation.split(",")[0]}`
    : "New Trip";
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const [title, setTitle] = useState(defaultTitle);
  const [startDate, setStartDate] = useState(
    today.toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    nextWeek.toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(
    `Trip to visit ${placeName}`
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      // Validate dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        setError("End date must be after start date");
        setIsCreating(false);
        return;
      }

      // Call server action
      const tripId = await createQuickTrip({
        title,
        startDate: start,
        endDate: end,
        description,
      });

      // Notify parent component
      onTripCreated(tripId);
    } catch (err) {
      console.error("Failed to create trip:", err);
      setError(err instanceof Error ? err.message : "Failed to create trip");
      setIsCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg max-w-md w-full p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Create Quick Trip</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4">
          Create a trip to add <strong>{placeName}</strong> to your itinerary.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trip Name */}
          <div>
            <Label htmlFor="title">Trip Name</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer in Paris"
              required
              disabled={isCreating}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  disabled={isCreating}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  disabled={isCreating}
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Description (Optional) */}
          <div>
            <Label htmlFor="description">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your trip"
              disabled={isCreating}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Add"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
