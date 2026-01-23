"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlaceSuggestionCard } from "@/components/place-suggestion-card";
import { QuickTripModal } from "@/components/quick-trip-modal";
import { SuggestionDetailModal } from "@/components/suggestion-detail-modal";
import { PendingSuggestion, clearPendingSuggestion } from "@/lib/pending-suggestions";
import { PlaceSuggestion as LegacyPlaceSuggestion, GooglePlaceData as LegacyGooglePlaceData } from "@/lib/types/place-suggestion";

interface AuthLandingClientProps {
  suggestion: PendingSuggestion;
  suggestionId?: string;
}

export function AuthLandingClient({ suggestion, suggestionId }: AuthLandingClientProps) {
  const router = useRouter();
  const [showQuickTripModal, setShowQuickTripModal] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [newTripId, setNewTripId] = useState<string | null>(null);

  // Convert pipeline types to legacy types
  const convertToLegacySuggestion = (): LegacyPlaceSuggestion => {
    const categoryMap: Record<string, "Travel" | "Stay" | "Activity" | "Dining"> = {
      "Stay": "Stay",
      "Eat": "Dining",
      "Do": "Activity",
      "Transport": "Travel",
    };
    
    return {
      placeName: suggestion.suggestion.suggestedName,
      category: categoryMap[suggestion.suggestion.category] || "Activity",
      type: suggestion.suggestion.type,
      context: suggestion.suggestion.context ? {
        ...suggestion.suggestion.context,
        timeOfDay: suggestion.suggestion.context.timeOfDay as "morning" | "afternoon" | "evening" | "night" | undefined,
      } : undefined,
    };
  };

  const convertToLegacyPlaceData = (): LegacyGooglePlaceData | null => {
    if (!suggestion.placeData || suggestion.placeData.notFound) return null;
    
    const placeData = suggestion.placeData;
    return {
      placeId: placeData.placeId,
      name: placeData.name,
      formattedAddress: placeData.formattedAddress,
      phoneNumber: placeData.formattedPhoneNumber || placeData.internationalPhoneNumber,
      website: placeData.website,
      rating: placeData.rating,
      userRatingsTotal: placeData.userRatingsTotal,
      priceLevel: placeData.priceLevel,
      photos: placeData.photos?.map(p => ({
        photoReference: p.reference,
        width: p.width,
        height: p.height,
      })),
      openingHours: placeData.openingHours,
      geometry: placeData.location ? {
        location: placeData.location,
      } : undefined,
    };
  };

  const handleAdd = () => {
    setShowQuickTripModal(true);
  };

  const handleSkip = async () => {
    // Clear the pending suggestion
    if (suggestionId) {
      await clearPendingSuggestion();
    }
    router.push("/manage");
  };

  const handleTripCreated = (tripId: string) => {
    setNewTripId(tripId);
    setShowQuickTripModal(false);
    setShowSuggestionModal(true);
  };

  const handleAddComplete = async () => {
    // Clear the pending suggestion
    if (suggestionId) {
      await clearPendingSuggestion();
    }
    setShowSuggestionModal(false);
    // Redirect to the trip
    if (newTripId) {
      router.push(`/trips/${newTripId}`);
    } else {
      router.push("/manage");
    }
  };

  // Extract location from address for trip modal
  const placeLocation = suggestion.placeData?.formattedAddress?.split(",").slice(-2).join(",").trim();

  return (
    <>
      <PlaceSuggestionCard
        suggestion={suggestion}
        onAdd={handleAdd}
        onSkip={handleSkip}
      />

      {/* Quick Trip Creation Modal */}
      {showQuickTripModal && (
        <QuickTripModal
          placeName={suggestion.placeName}
          placeLocation={placeLocation}
          onClose={() => setShowQuickTripModal(false)}
          onTripCreated={handleTripCreated}
        />
      )}

      {/* Suggestion Detail Modal */}
      {showSuggestionModal && newTripId && (
        <SuggestionDetailModal
          suggestion={convertToLegacySuggestion()}
          tripId={newTripId}
          onClose={() => setShowSuggestionModal(false)}
          onAddToItinerary={async (data) => {
            const { createReservationFromSuggestion } = await import(
              "@/lib/actions/create-reservation"
            );
            
            await createReservationFromSuggestion({
              tripId: newTripId,
              placeName: data.placeName,
              placeData: convertToLegacyPlaceData(),
              day: data.day,
              startTime: data.startTime,
              endTime: data.endTime,
              cost: data.cost,
              category: data.category,
              type: data.type,
              status: data.status,
            });
            
            await handleAddComplete();
          }}
        />
      )}
    </>
  );
}
