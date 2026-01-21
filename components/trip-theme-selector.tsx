"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { regenerateTripImageWithTheme } from "@/lib/actions/regenerate-trip-image";

interface TripThemeSelectorProps {
  tripId: string;
  currentPromptId?: string | null;
  currentPromptName?: string | null;
  availablePrompts: Array<{ id: string; name: string; style: string }>;
}

export function TripThemeSelector({
  tripId,
  currentPromptId,
  currentPromptName,
  availablePrompts,
}: TripThemeSelectorProps) {
  const [selectedPromptId, setSelectedPromptId] = useState(
    currentPromptId || ""
  );
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateTripImageWithTheme(
        tripId,
        selectedPromptId || undefined // undefined = AI picks
      );
      // Refresh page to show new image
      window.location.reload();
    } catch (error) {
      console.error("Regeneration failed:", error);
      alert("Failed to regenerate image. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        Image Style Theme
        {currentPromptName && (
          <span className="text-muted-foreground ml-2">
            (Current: {currentPromptName})
          </span>
        )}
      </label>

      <div className="flex gap-2">
        <Select value={selectedPromptId} onValueChange={setSelectedPromptId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="AI Auto-Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">AI Auto-Select (Recommended)</SelectItem>
            {availablePrompts.map((prompt) => (
              <SelectItem key={prompt.id} value={prompt.id}>
                {prompt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleRegenerate} disabled={isRegenerating}>
          {isRegenerating ? "Generating..." : "Regenerate Image"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Change the artistic style and regenerate the trip image. Cost: $0.04
        per generation.
      </p>
    </div>
  );
}
