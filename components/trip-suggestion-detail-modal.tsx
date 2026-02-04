"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, MapPin, Calendar, DollarSign, Sparkles, Car, Plane, Train, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";
import type { ProfileGraphItem } from "@/lib/types/profile-graph";
import { generateSuggestionMapUrl } from "@/lib/map-url-generator";

interface GenerationProgress {
  step: string;
  completed: string[];
  failed: string[];
  percentComplete: number;
  message: string;
}

interface GenerationState {
  tripId: string | null;
  status: "idle" | "generating" | "ready" | "failed";
  progress: GenerationProgress | null;
  error?: string;
}

interface TripSuggestionDetailModalProps {
  suggestion: AITripSuggestion | null;
  imageUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (suggestion: AITripSuggestion) => void;
  profileItems?: ProfileGraphItem[];
  userProfile?: {
    name: string;
    city: string | null;
    country: string | null;
    dateOfBirth: Date | null;
  };
}

export function TripSuggestionDetailModal({
  suggestion,
  imageUrl,
  isOpen,
  onClose,
  onCreateTrip,
  profileItems = [],
  userProfile,
}: TripSuggestionDetailModalProps) {
  const router = useRouter();
  const [generationState, setGenerationState] = useState<GenerationState>({
    tripId: null,
    status: "idle",
    progress: null,
  });

  // Reset generation state when modal closes or suggestion changes
  useEffect(() => {
    if (!isOpen) {
      setGenerationState({ tripId: null, status: "idle", progress: null });
    }
  }, [isOpen, suggestion]);

  // Poll for generation status
  useEffect(() => {
    if (generationState.status !== "generating" || !generationState.tripId) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/trips/${generationState.tripId}/generation-status`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        
        const data = await response.json();
        
        if (data.status === "ready") {
          setGenerationState(prev => ({
            ...prev,
            status: "ready",
            progress: data.progress,
          }));
          // Navigate to the trip view after a brief delay
          setTimeout(() => {
            router.push(`/view1/${generationState.tripId}`);
          }, 1000);
        } else if (data.status === "failed") {
          setGenerationState(prev => ({
            ...prev,
            status: "failed",
            error: data.error,
            progress: data.progress,
          }));
        } else {
          setGenerationState(prev => ({
            ...prev,
            progress: data.progress,
          }));
        }
      } catch (error) {
        console.error("Error polling status:", error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [generationState.status, generationState.tripId, router]);

  const handleCreateSampleTrip = useCallback(async () => {
    if (!suggestion || !userProfile) return;

    setGenerationState({
      tripId: null,
      status: "generating",
      progress: { step: "starting", completed: [], failed: [], percentComplete: 0, message: "Starting generation..." },
    });

    try {
      const response = await fetch("/api/suggestions/create-sample-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suggestion,
          profileItems,
          userProfile,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start trip generation");
      }

      const data = await response.json();
      
      setGenerationState(prev => ({
        ...prev,
        tripId: data.tripId,
        progress: { 
          step: "itinerary", 
          completed: [], 
          failed: [], 
          percentComplete: 5, 
          message: "Generating itinerary..." 
        },
      }));
    } catch (error: any) {
      setGenerationState(prev => ({
        ...prev,
        status: "failed",
        error: error.message || "Failed to create trip",
      }));
    }
  }, [suggestion, profileItems, userProfile]);

  if (!suggestion) return null;

  const isGenerating = generationState.status === "generating";
  const isReady = generationState.status === "ready";
  const isFailed = generationState.status === "failed";

  // Generate large map URL for modal
  const largeMapUrl = suggestion.destinationLat && suggestion.destinationLng
    ? generateSuggestionMapUrl(
        {
          destinationLat: suggestion.destinationLat,
          destinationLng: suggestion.destinationLng,
          keyLocations: suggestion.keyLocations,
          tripType: suggestion.tripType,
        },
        800, // larger width for modal
        400  // larger height for modal
      )
    : null;

  const getTransportIcon = () => {
    const mode = suggestion.transportMode?.toLowerCase() || "";
    if (mode.includes("plane")) return <Plane className="h-4 w-4" />;
    if (mode.includes("car")) return <Car className="h-4 w-4" />;
    if (mode.includes("train")) return <Train className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  const getTripTypeBadge = () => {
    const typeLabels = {
      local_experience: { label: "Local Experience", color: "bg-green-100 text-green-700" },
      road_trip: { label: "Road Trip", color: "bg-blue-100 text-blue-700" },
      single_destination: { label: "Single Destination", color: "bg-purple-100 text-purple-700" },
      multi_destination: { label: "Multi-Destination", color: "bg-orange-100 text-orange-700" },
    };
    const typeInfo = typeLabels[suggestion.tripType as keyof typeof typeLabels] || typeLabels.single_destination;
    return <Badge className={`${typeInfo.color}`} variant="secondary">{typeInfo.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* DialogTitle for accessibility - visually hidden since title is in hero image */}
        <DialogTitle className="sr-only">
          {suggestion.title}
        </DialogTitle>
        
        {/* Hero Image */}
        {imageUrl && (
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={imageUrl}
              alt={suggestion.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Title overlay */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{suggestion.title}</h2>
                {getTripTypeBadge()}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {suggestion.destination}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {suggestion.duration}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {getTransportIcon()}
                  {suggestion.transportMode}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-base text-slate-700 leading-relaxed">{suggestion.description}</p>
          </div>

          {/* Why This Trip */}
          <div className="bg-purple-50 p-5 rounded-lg border border-purple-100">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base mb-2 text-purple-900">Why this trip is perfect for you</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{suggestion.why}</p>
              </div>
            </div>
          </div>

          {/* Map Section */}
          {largeMapUrl && (
            <div>
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {suggestion.keyLocations && suggestion.keyLocations.length > 1 ? "Trip Route" : "Location"}
              </h3>
              <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src={largeMapUrl}
                  alt={`Route map for ${suggestion.title}`}
                  className="w-full h-[400px] object-cover"
                  loading="lazy"
                />
              </div>
              {suggestion.keyLocations && suggestion.keyLocations.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  {suggestion.keyLocations.map((loc, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                        {idx + 1}
                      </span>
                      {loc.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Highlights */}
          <div>
            <h3 className="font-semibold text-base mb-3">Trip Highlights</h3>
            <ul className="space-y-2">
              {suggestion.highlights.map((highlight, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-3">
                  <span className="text-purple-600 text-lg leading-none mt-0.5">•</span>
                  <span className="flex-1">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-3 gap-6 pt-4 border-t">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <DollarSign className="h-4 w-4" />
                <span>Budget</span>
              </div>
              <div className="text-base font-semibold">{suggestion.estimatedBudget}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Calendar className="h-4 w-4" />
                <span>Best Time</span>
              </div>
              <div className="text-base font-semibold">{suggestion.bestTimeToVisit}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {getTransportIcon()}
                <span>Transport</span>
              </div>
              <div className="text-base font-semibold">{suggestion.transportMode}</div>
            </div>
          </div>

          {/* Combined Interests */}
          <div>
            <h3 className="font-semibold text-sm mb-2">This trip combines</h3>
            <div className="flex flex-wrap gap-2">
              {suggestion.combinedInterests.map((interest, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Create Trip Button / Progress UI */}
          <div className="pt-4 border-t">
            {isGenerating && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-primary">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">{generationState.progress?.message || "Generating..."}</span>
                </div>
                <Progress value={generationState.progress?.percentComplete || 0} className="h-2" />
                <div className="space-y-2 text-sm">
                  {["itinerary", "flights", "hotels", "restaurants", "activities"].map((step) => {
                    const isCompleted = generationState.progress?.completed.includes(step);
                    const isCurrent = generationState.progress?.step === step;
                    const isFailed = generationState.progress?.failed.includes(step);
                    
                    return (
                      <div key={step} className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : isFailed ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-muted" />
                        )}
                        <span className={isCompleted ? "text-muted-foreground" : isCurrent ? "font-medium" : "text-muted-foreground"}>
                          {step === "itinerary" && "Generate itinerary"}
                          {step === "flights" && "Find flights"}
                          {step === "hotels" && "Search hotels"}
                          {step === "restaurants" && "Discover restaurants"}
                          {step === "activities" && "Select activities"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {isReady && (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <div>
                  <p className="font-semibold text-lg">Trip Generated!</p>
                  <p className="text-sm text-muted-foreground">Redirecting to your trip...</p>
                </div>
              </div>
            )}
            
            {isFailed && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span>{generationState.error || "Generation failed"}</span>
                </div>
                <Button 
                  onClick={handleCreateSampleTrip}
                  className="w-full"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            )}
            
            {!isGenerating && !isReady && !isFailed && (
              <Button 
                onClick={userProfile ? handleCreateSampleTrip : () => {
                  onCreateTrip(suggestion);
                  onClose();
                }}
                className="w-full py-6 text-base font-semibold"
                size="lg"
              >
                Create This Trip
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
