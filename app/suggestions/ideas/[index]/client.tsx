"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Sparkles,
  Car,
  Plane,
  Train,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";
import type { ProfileGraphItem } from "@/lib/types/profile-graph";
import { generateSuggestionMapUrl } from "@/lib/map-url-generator";

interface IdeaDetailClientProps {
  suggestionIndex: number;
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
  profileItems: ProfileGraphItem[];
}

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

// Storage key for suggestions
const SUGGESTIONS_STORAGE_KEY = "trip-suggestions-data";

// Type labels
const TRIP_TYPE_LABELS = {
  local_experience: { label: "Local Experience", color: "bg-green-100 text-green-700" },
  road_trip: { label: "Road Trip", color: "bg-blue-100 text-blue-700" },
  single_destination: { label: "Single Destination", color: "bg-purple-100 text-purple-700" },
  multi_destination: { label: "Multi-Destination", color: "bg-orange-100 text-orange-700" },
} as const;

export default function IdeaDetailClient({
  suggestionIndex,
  userProfile,
  profileItems,
}: IdeaDetailClientProps) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState<AITripSuggestion | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [generationState, setGenerationState] = useState<GenerationState>({
    tripId: null,
    status: "idle",
    progress: null,
  });

  // Load suggestion from sessionStorage
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(SUGGESTIONS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.suggestions && data.suggestions[suggestionIndex]) {
          setSuggestion(data.suggestions[suggestionIndex]);
          if (data.images && data.images[suggestionIndex]) {
            setImageUrl(data.images[suggestionIndex]);
          }
        } else {
          // No suggestion found, redirect back
          router.push("/suggestions/ideas");
        }
      } else {
        // No data in storage, redirect back
        router.push("/suggestions/ideas");
      }
    } catch (e) {
      console.error("Failed to load suggestion:", e);
      router.push("/suggestions/ideas");
    } finally {
      setLoading(false);
    }
  }, [suggestionIndex, router]);

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
          }, 1500);
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

  const handleCreateTrip = useCallback(async () => {
    if (!suggestion) return;

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

  // Memoize map URL
  const largeMapUrl = useMemo(() => {
    if (!suggestion?.destinationLat || !suggestion?.destinationLng) return null;
    return generateSuggestionMapUrl(
      {
        destinationLat: suggestion.destinationLat,
        destinationLng: suggestion.destinationLng,
        keyLocations: suggestion.keyLocations,
        tripType: suggestion.tripType,
      },
      800,
      400
    );
  }, [suggestion]);

  // Get transport icon
  const getTransportIcon = () => {
    const mode = suggestion?.transportMode?.toLowerCase() || "";
    if (mode.includes("plane")) return <Plane className="h-4 w-4" />;
    if (mode.includes("car")) return <Car className="h-4 w-4" />;
    if (mode.includes("train")) return <Train className="h-4 w-4" />;
    return <MapPin className="h-4 w-4" />;
  };

  // Get trip type badge
  const getTripTypeInfo = () => {
    if (!suggestion) return TRIP_TYPE_LABELS.single_destination;
    return TRIP_TYPE_LABELS[suggestion.tripType as keyof typeof TRIP_TYPE_LABELS] || TRIP_TYPE_LABELS.single_destination;
  };

  const isGenerating = generationState.status === "generating";
  const isReady = generationState.status === "ready";
  const isFailed = generationState.status === "failed";

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // No suggestion found
  if (!suggestion) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-16">
        <div className="max-w-4xl mx-auto p-4 text-center py-16">
          <p className="text-slate-600 mb-4">Trip idea not found</p>
          <Link href="/suggestions/ideas">
            <Button>Back to Ideas</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tripTypeInfo = getTripTypeInfo();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-16">
      {/* Back Navigation */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Link href="/suggestions/ideas">
            <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to ideas
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Image */}
      {imageUrl && (
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={suggestion.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white">{suggestion.title}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-white/90 text-sm">
                <Badge className={`${tripTypeInfo.color}`} variant="secondary">
                  {tripTypeInfo.label}
                </Badge>
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
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Description */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-base text-slate-700 leading-relaxed">{suggestion.description}</p>
          </CardContent>
        </Card>

        {/* Why This Trip */}
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-base mb-2 text-purple-900">Why this trip is perfect for you</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{suggestion.why}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Map Section */}
        {largeMapUrl && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {suggestion.keyLocations && suggestion.keyLocations.length > 1 ? "Trip Route" : "Location"}
              </h3>
              <div className="rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <img
                  src={largeMapUrl}
                  alt={`Route map for ${suggestion.title}`}
                  className="w-full h-[300px] md:h-[400px] object-cover"
                  loading="lazy"
                />
              </div>
              {suggestion.keyLocations && suggestion.keyLocations.length > 1 && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  {suggestion.keyLocations.map((loc, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs">
                        {idx + 1}
                      </span>
                      {loc.name}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Highlights */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-base mb-3">Trip Highlights</h3>
            <ul className="space-y-2">
              {suggestion.highlights.map((highlight, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-3">
                  <span className="text-purple-600 text-lg leading-none mt-0.5">•</span>
                  <span className="flex-1">{highlight}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Details Grid */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-6">
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
          </CardContent>
        </Card>

        {/* Combined Interests */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-sm mb-3">This trip combines</h3>
            <div className="flex flex-wrap gap-2">
              {suggestion.combinedInterests.map((interest, idx) => (
                <Badge key={idx} variant="outline" className="text-sm">
                  {interest}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Create Trip Section */}
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="pt-6">
            {isGenerating && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 text-emerald-700">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="font-medium">{generationState.progress?.message || "Generating..."}</span>
                </div>
                <Progress value={generationState.progress?.percentComplete || 0} className="h-2" />
                <div className="space-y-2 text-sm">
                  {["itinerary", "flights", "hotels", "restaurants", "activities"].map((step) => {
                    const isCompleted = generationState.progress?.completed.includes(step);
                    const isCurrent = generationState.progress?.step === step;
                    const stepFailed = generationState.progress?.failed.includes(step);
                    
                    return (
                      <div key={step} className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : stepFailed ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : isCurrent ? (
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-slate-300" />
                        )}
                        <span className={isCompleted ? "text-slate-500" : isCurrent ? "font-medium" : "text-slate-500"}>
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
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3 text-center py-4"
              >
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div>
                  <p className="font-semibold text-lg">Trip Generated!</p>
                  <p className="text-sm text-slate-600">Redirecting to your trip...</p>
                </div>
              </motion.div>
            )}
            
            {isFailed && (
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
            
            {!isGenerating && !isReady && !isFailed && (
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Ready to turn this idea into a full trip plan?
                </p>
                <Button 
                  onClick={handleCreateTrip}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 px-8"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Create This Trip
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
