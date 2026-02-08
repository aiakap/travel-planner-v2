"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Calendar,
  DollarSign,
  Plane,
  Car,
  Train,
  Sparkles,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { AssistedTripResult } from "@/lib/types/assisted-wizard";
import type { ProfileGraphItem } from "@/lib/types/profile-graph";

// Generation progress types
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

interface AssistedTripResultCardProps {
  result: AssistedTripResult;
  onReset: () => void;
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
  profileItems: ProfileGraphItem[];
}

// Type labels constant
const TRIP_TYPE_LABELS = {
  local_experience: { label: "Local Experience", color: "bg-green-100 text-green-700" },
  road_trip: { label: "Road Trip", color: "bg-blue-100 text-blue-700" },
  single_destination: { label: "Single Destination", color: "bg-purple-100 text-purple-700" },
  multi_destination: { label: "Multi-City Adventure", color: "bg-orange-100 text-orange-700" },
} as const;

export function AssistedTripResultCard({
  result,
  onReset,
  userProfile,
  profileItems,
}: AssistedTripResultCardProps) {
  const router = useRouter();
  const { mainSuggestion } = result;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [generationState, setGenerationState] = useState<GenerationState>({
    tripId: null,
    status: "idle",
    progress: null,
  });

  // Fetch image for the suggestion
  useEffect(() => {
    const query = mainSuggestion.imageQuery || mainSuggestion.destination;
    
    fetch("/api/places/batch-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        queries: [
          {
            query,
            index: 0,
            fallbackKeywords: mainSuggestion.destinationKeywords,
          },
        ],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.results?.[0]?.url) {
          setImageUrl(data.results[0].url);
        }
      })
      .catch(console.error);
  }, [mainSuggestion]);

  // Reset generation state when mainSuggestion changes (e.g., when selecting an alternative)
  useEffect(() => {
    setGenerationState({ tripId: null, status: "idle", progress: null });
  }, [mainSuggestion]);

  // Poll for generation status
  useEffect(() => {
    if (generationState.status !== "generating" || !generationState.tripId) return;

    // Capture tripId to avoid stale closure
    const currentTripId = generationState.tripId;
    console.log("Starting status polling for trip:", currentTripId);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/trips/${currentTripId}/generation-status`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }
        
        const data = await response.json();
        console.log("Poll status response:", data.status, data.progress?.step);
        
        if (data.status === "ready") {
          setGenerationState(prev => ({
            ...prev,
            status: "ready",
            progress: data.progress,
          }));
          // Navigate to the trip view after a brief delay
          console.log("Trip ready, navigating to:", `/view1/${currentTripId}`);
          setTimeout(() => {
            router.push(`/view1/${currentTripId}`);
          }, 1000);
        } else if (data.status === "failed") {
          console.error("Trip generation failed:", data.error);
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

  // Get transport icon
  const getTransportIcon = useCallback((mode: string) => {
    const lowerMode = mode.toLowerCase();
    if (lowerMode.includes("plane")) return <Plane className="h-4 w-4" />;
    if (lowerMode.includes("car")) return <Car className="h-4 w-4" />;
    if (lowerMode.includes("train")) return <Train className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  }, []);

  const tripTypeInfo =
    TRIP_TYPE_LABELS[mainSuggestion.tripType as keyof typeof TRIP_TYPE_LABELS] ||
    TRIP_TYPE_LABELS.single_destination;

  // Handle creating a trip from the suggestion
  const handleCreateTrip = useCallback(async () => {
    if (!userProfile) {
      console.error("Cannot create trip: missing userProfile");
      return;
    }

    console.log("Starting trip creation with suggestion:", mainSuggestion.title);

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
          suggestion: mainSuggestion,
          profileItems,
          userProfile,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Trip creation API error:", data);
        throw new Error(data.error || "Failed to start trip generation");
      }

      console.log("Trip creation started successfully, tripId:", data.tripId);
      
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
      console.error("Trip creation failed:", error);
      setGenerationState({
        tripId: null,
        status: "failed",
        progress: null,
        error: error.message || "Failed to create trip",
      });
    }
  }, [mainSuggestion, profileItems, userProfile]);

  return (
    <Card className="border-2 border-purple-100 overflow-hidden">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Your Personalized Trip</span>
          </div>
          <button
            onClick={onReset}
            className="text-sm text-purple-200 hover:text-white flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Plan Another
          </button>
        </div>
      </div>

      {/* Main Suggestion */}
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Image */}
          <div className="relative h-48 rounded-xl overflow-hidden mb-6 bg-slate-200">
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-slate-300 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-slate-400" />
              </div>
            )}
            {imageUrl && (
              <img
                src={imageUrl}
                alt={mainSuggestion.title}
                className={`w-full h-full object-cover transition-opacity duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageLoaded(true)}
              />
            )}
            <Badge
              className={`absolute top-3 right-3 ${tripTypeInfo.color}`}
              variant="secondary"
            >
              {tripTypeInfo.label}
            </Badge>
          </div>

          {/* Title & Description */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {mainSuggestion.title}
          </h2>
          <p className="text-slate-600 mb-4">{mainSuggestion.description}</p>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">{mainSuggestion.destination}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">{mainSuggestion.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <span className="text-slate-700">{mainSuggestion.estimatedBudget}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {getTransportIcon(mainSuggestion.transportMode)}
              <span className="text-slate-700">{mainSuggestion.transportMode}</span>
            </div>
          </div>

          {/* Why This Trip */}
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Why This Trip is Perfect for You
            </h3>
            <p className="text-sm text-purple-700">{mainSuggestion.why}</p>
          </div>

          {/* Highlights */}
          <div className="mb-6">
            <h3 className="font-semibold text-slate-700 mb-3">Trip Highlights</h3>
            <div className="space-y-2">
              {mainSuggestion.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interest Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {mainSuggestion.combinedInterests.map((interest, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {interest}
              </Badge>
            ))}
          </div>

          {/* Best Time to Visit */}
          <div className="text-sm text-slate-500 mb-6">
            <span className="font-medium">Best time to visit:</span>{" "}
            {mainSuggestion.bestTimeToVisit}
          </div>

          {/* Create Trip Button / Progress UI */}
          <div className="pt-4 border-t">
            {generationState.status === "generating" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-purple-600">
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
                          <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
                        )}
                        <span className={isCompleted ? "text-slate-400" : isCurrent ? "font-medium text-slate-700" : "text-slate-400"}>
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
            
            {generationState.status === "ready" && (
              <div className="flex flex-col items-center gap-3 text-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
                <div>
                  <p className="font-semibold text-lg">Trip Generated!</p>
                  <p className="text-sm text-slate-500">Redirecting to your trip...</p>
                </div>
              </div>
            )}
            
            {generationState.status === "failed" && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span>{generationState.error || "Generation failed"}</span>
                </div>
                <Button 
                  onClick={handleCreateTrip}
                  className="w-full"
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            )}
            
            {generationState.status === "idle" && (
              <Button
                onClick={handleCreateTrip}
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Create This Trip
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </motion.div>
      </div>

    </Card>
  );
}
