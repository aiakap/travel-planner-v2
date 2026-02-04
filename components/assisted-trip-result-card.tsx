"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import type { AssistedTripResult, TripAlternative } from "@/lib/types/assisted-wizard";
import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";

interface AssistedTripResultCardProps {
  result: AssistedTripResult;
  onReset: () => void;
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
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
}: AssistedTripResultCardProps) {
  const { mainSuggestion, alternatives } = result;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

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
  const handleCreateTrip = useCallback(() => {
    // For now, log and show alert - can integrate with trip creation later
    console.log("Creating trip from suggestion:", mainSuggestion);
    alert(`Creating trip: ${mainSuggestion.title}\n\nThis will navigate to trip creation with pre-filled data.`);
  }, [mainSuggestion]);

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

          {/* Create Trip Button */}
          <Button
            onClick={handleCreateTrip}
            size="lg"
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            Create This Trip
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>

      {/* Alternatives Section */}
      {alternatives && alternatives.length > 0 && (
        <div className="border-t bg-slate-50 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">
            Other Options You Might Like
          </h3>
          <div className="grid gap-3">
            {alternatives.map((alt, idx) => (
              <AlternativeCard key={idx} alternative={alt} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// Alternative suggestion card
function AlternativeCard({ alternative }: { alternative: TripAlternative }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white rounded-lg border border-slate-200 p-4 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-slate-800">{alternative.title}</h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {alternative.destination}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {alternative.duration}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {alternative.estimatedBudget}
            </span>
          </div>
          <p className="text-xs text-purple-600 mt-2">{alternative.whyDifferent}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-400" />
      </div>
    </motion.div>
  );
}
