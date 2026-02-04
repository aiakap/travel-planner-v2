"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Edit3 } from "lucide-react";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
} from "lucide-react";
import type {
  WizardStep,
  WizardSuggestionChip,
  WizardStepAnswer,
} from "@/lib/types/assisted-wizard";
import { cn } from "@/lib/utils";

interface WizardQuestionCardProps {
  step: WizardStep;
  suggestions: WizardSuggestionChip[];
  answer: WizardStepAnswer;
  onAnswerChange: (answer: WizardStepAnswer) => void;
  isActive: boolean;
  direction: "forward" | "backward";
}

// Icon mapping
const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Calendar,
  MapPin,
  DollarSign,
  Users,
  Sparkles,
};

// Animation variants for the card
const cardVariants = {
  enter: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: "forward" | "backward") => ({
    x: direction === "forward" ? -300 : 300,
    opacity: 0,
  }),
};

export const WizardQuestionCard = React.memo(function WizardQuestionCard({
  step,
  suggestions,
  answer,
  onAnswerChange,
  isActive,
  direction,
}: WizardQuestionCardProps) {
  const [showCustomInput, setShowCustomInput] = useState(!!answer.customValue);
  const [customInputValue, setCustomInputValue] = useState(answer.customValue || "");

  const IconComponent = STEP_ICONS[step.icon] || Sparkles;

  // Handle chip selection
  const handleChipClick = useCallback(
    (chipId: string) => {
      const isSelected = answer.selectedChips.includes(chipId);
      
      let newSelectedChips: string[];
      
      if (step.allowMultiple) {
        // Toggle selection for multi-select steps
        newSelectedChips = isSelected
          ? answer.selectedChips.filter((id) => id !== chipId)
          : [...answer.selectedChips, chipId];
      } else {
        // Single select - replace selection
        newSelectedChips = isSelected ? [] : [chipId];
      }

      onAnswerChange({
        ...answer,
        selectedChips: newSelectedChips,
        // Clear custom value if selecting a chip
        customValue: newSelectedChips.length > 0 ? undefined : answer.customValue,
      });

      // Hide custom input when selecting a chip
      if (newSelectedChips.length > 0) {
        setShowCustomInput(false);
        setCustomInputValue("");
      }
    },
    [answer, onAnswerChange, step.allowMultiple]
  );

  // Handle custom input
  const handleCustomInputChange = useCallback(
    (value: string) => {
      setCustomInputValue(value);
      onAnswerChange({
        ...answer,
        customValue: value,
        // Clear chip selections when using custom input
        selectedChips: value ? [] : answer.selectedChips,
      });
    },
    [answer, onAnswerChange]
  );

  // Toggle custom input visibility
  const handleToggleCustomInput = useCallback(() => {
    if (!showCustomInput) {
      setShowCustomInput(true);
      // Clear chip selections when switching to custom
      onAnswerChange({
        ...answer,
        selectedChips: [],
      });
    }
  }, [showCustomInput, answer, onAnswerChange]);

  if (!isActive) return null;

  return (
    <motion.div
      key={step.id}
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      }}
      className="w-full"
    >
      <div className="space-y-6">
        {/* Question Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-2">
            <IconComponent className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{step.question}</h2>
          <p className="text-slate-500">{step.subtext}</p>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap justify-center gap-3">
          {suggestions.map((chip) => {
            const isSelected = answer.selectedChips.includes(chip.id);
            
            return (
              <motion.button
                key={chip.id}
                onClick={() => handleChipClick(chip.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "relative px-4 py-3 rounded-xl border-2 transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                  isSelected
                    ? "border-purple-500 bg-purple-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                )}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}

                {/* Chip content */}
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={cn(
                      "font-medium",
                      isSelected ? "text-purple-700" : "text-slate-700"
                    )}
                  >
                    {chip.label}
                  </span>
                  {chip.description && (
                    <span className="text-xs text-slate-500">
                      {chip.description}
                    </span>
                  )}
                  {chip.fromProfile && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-green-100 text-green-700 mt-1"
                    >
                      From your profile
                    </Badge>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Custom Input Toggle & Field */}
        <div className="space-y-3">
          {!showCustomInput ? (
            <button
              onClick={handleToggleCustomInput}
              className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-purple-600 transition-colors"
            >
              <Edit3 className="h-4 w-4" />
              <span className="text-sm">Or type your own answer</span>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Input
                type="text"
                placeholder={getPlaceholder(step.id)}
                value={customInputValue}
                onChange={(e) => handleCustomInputChange(e.target.value)}
                className="text-center text-lg py-6 border-2 border-purple-200 focus:border-purple-500"
                autoFocus
              />
              {customInputValue && (
                <p className="text-xs text-center text-slate-500">
                  Press Enter or click Next to continue
                </p>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// Helper to get placeholder text for custom input
function getPlaceholder(stepId: string): string {
  switch (stepId) {
    case "when":
      return "e.g., March 15-22, 2026";
    case "where":
      return "e.g., Tokyo, Japan";
    case "budget":
      return "e.g., $2,000 per person";
    case "who":
      return "e.g., Traveling with my wife and 2 kids";
    case "what":
      return "e.g., Food tours, hiking, and photography";
    default:
      return "Type your answer...";
  }
}
