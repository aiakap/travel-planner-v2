/**
 * Profile suggestion card component
 * Displays a suggestion to add to profile
 */

"use client";

import { useState } from "react";
import { CardProps } from "../_core/types";
import { CardWrapper } from "./_shared/card-wrapper";
import { Chip } from "./_shared/chip";

interface ProfileSuggestionData {
  type: "hobby" | "preference";
  category: string;
  value: string;
  hobbyId?: string | null;
  preferenceTypeId?: string | null;
  optionId?: string | null;
}

export function ProfileSuggestionCard({
  data,
  onAction,
  onDataUpdate,
}: CardProps<ProfileSuggestionData>) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const handleClick = async () => {
    console.log('🔵 ProfileSuggestion: Chip clicked:', data.value);
    
    if (isAccepted || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/profile-graph/add-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category: data.category,
          subcategory: data.type,
          value: data.value,
          metadata: { addedAt: new Date().toISOString() }
        })
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      const result = await response.json();
      console.log('🔵 ProfileSuggestion: API returned:', result);
      if (result.success) {
        setIsAccepted(true);
        if (onAction) {
          onAction("accept", data);
        }
        // Pass updated data directly for immediate UI update
        if (onDataUpdate && result.graphData) {
          console.log('🔵 ProfileSuggestion: Calling onDataUpdate');
          onDataUpdate(result.graphData);
        }
      }
    } catch (error) {
      console.error("Failed to add suggestion:", error);
      alert("Failed to add to profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardWrapper label="Suggestion:">
      <Chip
        selected={isAccepted}
        loading={isLoading}
        disabled={isAccepted || isLoading}
        onClick={handleClick}
        icon={isAccepted ? <span>✓</span> : undefined}
      >
        {isLoading ? "Saving..." : data.value}
      </Chip>
    </CardWrapper>
  );
}
