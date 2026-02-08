"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Loader2,
  Wand2,
  RotateCcw,
} from "lucide-react";
import { WizardQuestionCard } from "./wizard-question-card";
import { AssistedTripResultCard } from "./assisted-trip-result-card";
import type { ProfileGraphItem } from "@/lib/types/profile-graph";
import {
  WIZARD_STEPS,
  DEFAULT_SUGGESTIONS,
  DEFAULT_DURATION_DAYS,
  createEmptyAnswers,
  type WizardStepId,
  type WizardAnswers,
  type WizardSuggestionChip,
  type WizardState,
  type AssistedTripResult,
  type TripAlternative,
} from "@/lib/types/assisted-wizard";
import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";

interface AssistedTripWizardProps {
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
  onComplete?: (result: AssistedTripResult) => void;
}

// Loading messages for generation
const LOADING_MESSAGES = [
  "Analyzing your preferences...",
  "Finding the perfect destination...",
  "Crafting your ideal itinerary...",
  "Checking the best times to visit...",
  "Finalizing your personalized trip...",
];

export function AssistedTripWizard({
  profileItems,
  userProfile,
  onComplete,
}: AssistedTripWizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>(createEmptyAnswers());
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [wizardState, setWizardState] = useState<WizardState>("idle");
  const [result, setResult] = useState<AssistedTripResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [expandingAlternativeIndex, setExpandingAlternativeIndex] = useState<number | null>(null);

  const currentStep = WIZARD_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  // Generate suggestions for each step based on profile data
  const getSuggestionsForStep = useCallback(
    (stepId: WizardStepId): WizardSuggestionChip[] => {
      const defaultSuggestions = DEFAULT_SUGGESTIONS[stepId];

      // Extract relevant profile items based on step
      switch (stepId) {
        case "when": {
          // For "when" step, just return the default quick options
          return defaultSuggestions;
        }
        
        case "where": {
          // For "where" step, organize into groups: profile destinations, categories, suggested
          const allSuggestions: WizardSuggestionChip[] = [];
          
          // 1. Profile destinations (ALL of them)
          const destinationItems = profileItems.filter(
            (item) =>
              item.category === "destinations" ||
              item.metadata?.subcategory === "wishlist" ||
              item.metadata?.subcategory === "favorites"
          );
          destinationItems.forEach((item) => {
            allSuggestions.push({
              id: `profile-${item.id}`,
              label: item.value,
              fromProfile: true,
              group: "profile",
            });
          });
          
          // 2. Category chips (from defaults)
          defaultSuggestions.forEach((chip) => {
            allSuggestions.push({
              ...chip,
              group: "category",
            });
          });
          
          // 3. AI-suggested destinations based on profile interests
          // Generate suggestions from hobbies and travel style
          const interestItems = profileItems.filter(
            (item) =>
              item.category === "hobbies" ||
              item.category === "travel-style" ||
              item.category === "activities"
          );
          
          // Map interests to destination suggestions
          const interestToDestination: Record<string, { label: string; id: string }[]> = {
            hiking: [{ id: "suggest-swiss-alps", label: "Swiss Alps" }, { id: "suggest-patagonia", label: "Patagonia" }],
            photography: [{ id: "suggest-iceland", label: "Iceland" }, { id: "suggest-japan", label: "Japan" }],
            food: [{ id: "suggest-italy", label: "Italy" }, { id: "suggest-thailand", label: "Thailand" }],
            wine: [{ id: "suggest-napa", label: "Napa Valley" }, { id: "suggest-bordeaux", label: "Bordeaux" }],
            surfing: [{ id: "suggest-bali", label: "Bali" }, { id: "suggest-hawaii", label: "Hawaii" }],
            diving: [{ id: "suggest-maldives", label: "Maldives" }, { id: "suggest-great-barrier", label: "Great Barrier Reef" }],
            history: [{ id: "suggest-rome", label: "Rome" }, { id: "suggest-egypt", label: "Egypt" }],
            art: [{ id: "suggest-paris", label: "Paris" }, { id: "suggest-florence", label: "Florence" }],
            adventure: [{ id: "suggest-new-zealand", label: "New Zealand" }, { id: "suggest-costa-rica", label: "Costa Rica" }],
            relaxation: [{ id: "suggest-maldives-relax", label: "Maldives" }, { id: "suggest-santorini", label: "Santorini" }],
            skiing: [{ id: "suggest-whistler", label: "Whistler" }, { id: "suggest-zermatt", label: "Zermatt" }],
            culture: [{ id: "suggest-kyoto", label: "Kyoto" }, { id: "suggest-morocco", label: "Morocco" }],
          };
          
          const existingLabels = new Set(allSuggestions.map(s => s.label.toLowerCase()));
          const suggestedDestinations: WizardSuggestionChip[] = [];
          
          interestItems.forEach((item) => {
            const value = item.value.toLowerCase();
            Object.entries(interestToDestination).forEach(([interest, destinations]) => {
              if (value.includes(interest)) {
                destinations.forEach((dest) => {
                  if (!existingLabels.has(dest.label.toLowerCase()) && suggestedDestinations.length < 4) {
                    existingLabels.add(dest.label.toLowerCase());
                    suggestedDestinations.push({
                      id: dest.id,
                      label: dest.label,
                      group: "suggested",
                    });
                  }
                });
              }
            });
          });
          
          allSuggestions.push(...suggestedDestinations);
          return allSuggestions;
        }
        
        case "budget": {
          // For "budget" step, just return the preset chips
          return defaultSuggestions;
        }
        
        case "who": {
          // Look for family/companions
          const profileSuggestions: WizardSuggestionChip[] = [];
          const companionItems = profileItems.filter(
            (item) =>
              item.category === "family" ||
              item.category === "companions"
          );
          companionItems.slice(0, 3).forEach((item) => {
            const label = item.value.toLowerCase().includes("spouse") || 
                         item.value.toLowerCase().includes("wife") ||
                         item.value.toLowerCase().includes("husband")
              ? "With Partner"
              : item.value.toLowerCase().includes("child") ||
                item.value.toLowerCase().includes("kid")
              ? "Family"
              : item.value;
            
            if (!profileSuggestions.find(s => s.label === label)) {
              profileSuggestions.push({
                id: `profile-${item.id}`,
                label,
                fromProfile: true,
              });
            }
          });
          
          // Merge with defaults
          const mergedSuggestions = [...profileSuggestions];
          const existingLabels = new Set(profileSuggestions.map((s) => s.label.toLowerCase()));
          for (const defaultSuggestion of defaultSuggestions) {
            if (!existingLabels.has(defaultSuggestion.label.toLowerCase())) {
              mergedSuggestions.push(defaultSuggestion);
            }
            if (mergedSuggestions.length >= 6) break;
          }
          return mergedSuggestions;
        }
        
        case "what": {
          // Look for hobbies, travel style, activities
          const profileSuggestions: WizardSuggestionChip[] = [];
          const interestItems = profileItems.filter(
            (item) =>
              item.category === "hobbies" ||
              item.category === "travel-style" ||
              item.category === "activities"
          );
          interestItems.slice(0, 4).forEach((item) => {
            profileSuggestions.push({
              id: `profile-${item.id}`,
              label: item.value,
              fromProfile: true,
            });
          });
          
          // Merge with defaults
          const mergedSuggestions = [...profileSuggestions];
          const existingLabels = new Set(profileSuggestions.map((s) => s.label.toLowerCase()));
          for (const defaultSuggestion of defaultSuggestions) {
            if (!existingLabels.has(defaultSuggestion.label.toLowerCase())) {
              mergedSuggestions.push(defaultSuggestion);
            }
          }
          return mergedSuggestions;
        }
        
        default:
          return defaultSuggestions;
      }
    },
    [profileItems]
  );

  // Get current step suggestions
  const currentSuggestions = useMemo(
    () => getSuggestionsForStep(currentStep.id),
    [currentStep.id, getSuggestionsForStep]
  );

  // Get the current duration from the "when" step
  const currentDurationDays = useMemo(() => {
    return answers.when.durationDays || DEFAULT_DURATION_DAYS;
  }, [answers.when.durationDays]);

  // Check if current step has a valid answer
  const hasValidAnswer = useCallback(
    (stepId: WizardStepId): boolean => {
      const answer = answers[stepId];
      
      // For "when" step: valid if duration is set OR chips selected OR custom value
      if (stepId === "when") {
        return (
          (answer.durationDays !== undefined && answer.durationDays > 0) ||
          answer.selectedChips.length > 0 ||
          !!answer.customValue?.trim()
        );
      }
      
      // For "where" step: valid if any selection or custom places/types
      if (stepId === "where") {
        return (
          answer.selectedChips.length > 0 ||
          (answer.customPlaces && answer.customPlaces.length > 0) ||
          (answer.customTypes && answer.customTypes.length > 0) ||
          !!answer.customValue?.trim()
        );
      }
      
      // For "budget" step: valid if budget is set OR chips selected OR custom value
      if (stepId === "budget") {
        return (
          (answer.budgetPerDay !== undefined && answer.budgetPerDay > 0) ||
          (answer.budgetTotal !== undefined && answer.budgetTotal > 0) ||
          answer.selectedChips.length > 0 ||
          !!answer.customValue?.trim()
        );
      }
      
      // For other steps: valid if chips selected or custom value
      return answer.selectedChips.length > 0 || !!answer.customValue?.trim();
    },
    [answers]
  );

  // Handle answer change
  const handleAnswerChange = useCallback(
    (stepId: WizardStepId, answer: typeof answers.when) => {
      setAnswers((prev) => ({
        ...prev,
        [stepId]: answer,
      }));
    },
    []
  );

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (isLastStep) {
      // Generate trip
      handleGenerateTrip();
    } else {
      setDirection("forward");
      setCurrentStepIndex((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  }, [isLastStep]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    setDirection("backward");
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Generate trip from answers
  const handleGenerateTrip = useCallback(async () => {
    setWizardState("generating");
    setError(null);

    // Start rotating loading messages
    const messageInterval = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    try {
      const response = await fetch("/api/suggestions/assisted-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          profileItems,
          userProfile,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate trip suggestion");
      }

      const data: AssistedTripResult = await response.json();
      setResult(data);
      setWizardState("complete");
      onComplete?.(data);
    } catch (err) {
      console.error("Error generating trip:", err);
      setError("Failed to generate your trip. Please try again.");
      setWizardState("in_progress");
    } finally {
      clearInterval(messageInterval);
    }
  }, [answers, profileItems, userProfile, onComplete]);

  // Reset wizard
  const handleReset = useCallback(() => {
    setCurrentStepIndex(0);
    setAnswers(createEmptyAnswers());
    setDirection("forward");
    setWizardState("idle");
    setResult(null);
    setError(null);
    setExpandingAlternativeIndex(null);
  }, []);

  // Handle selecting an alternative - expand it to full suggestion and swap
  const handleSelectAlternative = useCallback(async (alternative: TripAlternative) => {
    if (!result) return;

    // Find the index of this alternative
    const altIndex = result.alternatives.findIndex(
      (alt) => alt.title === alternative.title && alt.destination === alternative.destination
    );
    
    setExpandingAlternativeIndex(altIndex);
    setError(null);

    try {
      const response = await fetch("/api/suggestions/expand-alternative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alternative,
          originalAnswers: answers,
          profileItems,
          userProfile,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to expand alternative");
      }

      const data = await response.json();
      const expandedSuggestion: AITripSuggestion = data.suggestion;

      // Create a new alternative from the old main suggestion
      const oldMainAsAlternative: TripAlternative = {
        title: result.mainSuggestion.title,
        destination: result.mainSuggestion.destination,
        duration: result.mainSuggestion.duration,
        estimatedBudget: result.mainSuggestion.estimatedBudget,
        whyDifferent: "Your previous selection",
        tripType: result.mainSuggestion.tripType,
      };

      // Build new alternatives list: remove selected, add old main
      const newAlternatives = result.alternatives
        .filter((_, idx) => idx !== altIndex)
        .concat(oldMainAsAlternative);

      // Update result with swapped suggestion
      setResult({
        mainSuggestion: expandedSuggestion,
        alternatives: newAlternatives,
      });
    } catch (err) {
      console.error("Error expanding alternative:", err);
      setError("Failed to load alternative details. Please try again.");
    } finally {
      setExpandingAlternativeIndex(null);
    }
  }, [result, answers, profileItems, userProfile]);

  // Start wizard
  const handleStart = useCallback(() => {
    setWizardState("in_progress");
  }, []);

  // Render idle state
  if (wizardState === "idle") {
    return (
      <Card className="border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 text-purple-600 mx-auto mb-4">
            <Wand2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Plan Your Perfect Trip</CardTitle>
          <CardDescription className="text-base">
            Answer a few quick questions and we&apos;ll create a personalized trip suggestion just for you
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button
            onClick={handleStart}
            size="lg"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Start Planning
          </Button>
          {profileItems.length > 0 && (
            <p className="text-sm text-slate-500 mt-4">
              We&apos;ll use your profile to personalize suggestions
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Render generating state
  if (wizardState === "generating") {
    return (
      <Card className="border-2 border-purple-100">
        <CardContent className="py-16">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 mx-auto">
              <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Creating Your Trip
              </h3>
              <motion.p
                key={loadingMessageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-slate-500"
              >
                {LOADING_MESSAGES[loadingMessageIndex]}
              </motion.p>
            </div>
            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {LOADING_MESSAGES.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === loadingMessageIndex
                      ? "bg-purple-600"
                      : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render complete state with result
  if (wizardState === "complete" && result) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
            {error}
          </div>
        )}
        <AssistedTripResultCard
          result={result}
          onReset={handleReset}
          userProfile={userProfile}
          profileItems={profileItems}
        />
      </div>
    );
  }

  // Render wizard steps
  return (
    <Card className="border-2 border-purple-100 overflow-hidden">
      <CardHeader className="pb-2 border-b bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Trip Planner</CardTitle>
          </div>
          <button
            onClick={handleReset}
            className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Start Over
          </button>
        </div>
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-4">
          {WIZARD_STEPS.map((step, idx) => (
            <div
              key={step.id}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                idx === currentStepIndex
                  ? "bg-purple-600 scale-125"
                  : idx < currentStepIndex
                  ? "bg-purple-400"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>
      </CardHeader>

      <CardContent className="pt-8 pb-6 min-h-[400px] flex flex-col">
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
            {error}
          </div>
        )}

        {/* Question Card with AnimatePresence */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <WizardQuestionCard
              key={currentStep.id}
              step={currentStep}
              suggestions={currentSuggestions}
              answer={answers[currentStep.id]}
              onAnswerChange={(answer) =>
                handleAnswerChange(currentStep.id, answer)
              }
              isActive={true}
              direction={direction}
              durationDays={currentDurationDays}
            />
          </AnimatePresence>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isFirstStep}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <span className="text-sm text-slate-400">
            {currentStepIndex + 1} of {WIZARD_STEPS.length}
          </span>

          <Button
            onClick={handleNext}
            disabled={!hasValidAnswer(currentStep.id)}
            className={
              isLastStep
                ? "bg-purple-600 hover:bg-purple-700 gap-1"
                : "gap-1"
            }
          >
            {isLastStep ? (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Trip
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
