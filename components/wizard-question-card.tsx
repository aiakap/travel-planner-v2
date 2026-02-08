"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Edit3, Plus, Minus, Calendar as CalendarIcon, X } from "lucide-react";
import {
  Calendar,
  MapPin,
  DollarSign,
  Users,
} from "lucide-react";
import { DatePopover } from "@/components/ui/date-popover";
import type {
  WizardStep,
  WizardSuggestionChip,
  WizardStepAnswer,
  ChipGroup,
} from "@/lib/types/assisted-wizard";
import { DEFAULT_DURATION_DAYS } from "@/lib/types/assisted-wizard";
import { cn } from "@/lib/utils";

interface WizardQuestionCardProps {
  step: WizardStep;
  suggestions: WizardSuggestionChip[];
  answer: WizardStepAnswer;
  onAnswerChange: (answer: WizardStepAnswer) => void;
  isActive: boolean;
  direction: "forward" | "backward";
  durationDays?: number;
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

// Group labels for where step
const GROUP_LABELS: Record<ChipGroup, string> = {
  profile: "From Your Profile",
  category: "Destination Type",
  suggested: "Suggested For You",
  preset: "Quick Presets",
};

export const WizardQuestionCard = React.memo(function WizardQuestionCard({
  step,
  suggestions,
  answer,
  onAnswerChange,
  isActive,
  direction,
  durationDays = DEFAULT_DURATION_DAYS,
}: WizardQuestionCardProps) {
  const [showCustomInput, setShowCustomInput] = useState(!!answer.customValue);
  const [customInputValue, setCustomInputValue] = useState(answer.customValue || "");

  const IconComponent = STEP_ICONS[step.icon] || Sparkles;

  // Handle chip selection
  const handleChipClick = useCallback(
    (chip: WizardSuggestionChip) => {
      const chipId = chip.id;
      const isSelected = answer.selectedChips.includes(chipId);
      
      let newSelectedChips: string[];
      
      if (step.allowMultiple) {
        newSelectedChips = isSelected
          ? answer.selectedChips.filter((id) => id !== chipId)
          : [...answer.selectedChips, chipId];
      } else {
        newSelectedChips = isSelected ? [] : [chipId];
      }

      // For budget chips with value, also set the per-day budget
      const updates: Partial<WizardStepAnswer> = {
        selectedChips: newSelectedChips,
        customValue: newSelectedChips.length > 0 ? undefined : answer.customValue,
      };

      if (step.id === "budget" && chip.value && !isSelected) {
        updates.budgetPerDay = chip.value;
        updates.budgetTotal = chip.value * durationDays;
      }

      onAnswerChange({
        ...answer,
        ...updates,
      });

      if (newSelectedChips.length > 0) {
        setShowCustomInput(false);
        setCustomInputValue("");
      }
    },
    [answer, onAnswerChange, step.allowMultiple, step.id, durationDays]
  );

  // Handle custom input
  const handleCustomInputChange = useCallback(
    (value: string) => {
      setCustomInputValue(value);
      onAnswerChange({
        ...answer,
        customValue: value,
        selectedChips: value ? [] : answer.selectedChips,
      });
    },
    [answer, onAnswerChange]
  );

  // Toggle custom input visibility
  const handleToggleCustomInput = useCallback(() => {
    if (!showCustomInput) {
      setShowCustomInput(true);
      onAnswerChange({
        ...answer,
        selectedChips: [],
      });
    }
  }, [showCustomInput, answer, onAnswerChange]);

  // ===== WHEN STEP HANDLERS =====
  const handleDurationChange = useCallback(
    (newDuration: number) => {
      const clampedDuration = Math.min(90, Math.max(1, newDuration));
      onAnswerChange({
        ...answer,
        durationDays: clampedDuration,
        selectedChips: [], // Clear chips when using duration
      });
    },
    [answer, onAnswerChange]
  );

  const handleStartDateChange = useCallback(
    (date: string) => {
      onAnswerChange({
        ...answer,
        startDate: date,
        selectedChips: [], // Clear chips when selecting date
      });
    },
    [answer, onAnswerChange]
  );

  // Handle quick option clicks for "when" step - sets both date and duration
  const handleQuickOptionClick = useCallback(
    (optionId: string) => {
      const today = new Date();
      let startDate: Date;
      let duration: number;

      switch (optionId) {
        case "this-weekend": {
          // Find next Friday
          const dayOfWeek = today.getDay();
          const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7; // If today is Friday, go to next Friday
          startDate = new Date(today);
          startDate.setDate(today.getDate() + daysUntilFriday);
          duration = 2; // Friday to Sunday
          break;
        }
        case "next-month": {
          // Random day in next month, random 5-15 days
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate();
          const randomDay = Math.floor(Math.random() * Math.min(daysInMonth - 15, 20)) + 1;
          startDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), randomDay);
          duration = Math.floor(Math.random() * 11) + 5; // 5-15 days
          break;
        }
        case "spring": {
          // Random day in March-May, random 5-15 days
          const year = today.getMonth() >= 5 ? today.getFullYear() + 1 : today.getFullYear();
          const springMonth = Math.floor(Math.random() * 3) + 2; // March (2), April (3), May (4)
          const randomDay = Math.floor(Math.random() * 20) + 1;
          startDate = new Date(year, springMonth, randomDay);
          duration = Math.floor(Math.random() * 11) + 5; // 5-15 days
          break;
        }
        case "summer": {
          // Random day in June-August, random 5-15 days
          const year = today.getMonth() >= 8 ? today.getFullYear() + 1 : today.getFullYear();
          const summerMonth = Math.floor(Math.random() * 3) + 5; // June (5), July (6), August (7)
          const randomDay = Math.floor(Math.random() * 20) + 1;
          startDate = new Date(year, summerMonth, randomDay);
          duration = Math.floor(Math.random() * 11) + 5; // 5-15 days
          break;
        }
        case "flexible":
        default: {
          // Don't set date, just random duration
          onAnswerChange({
            ...answer,
            durationDays: Math.floor(Math.random() * 11) + 5, // 5-15 days
            startDate: undefined,
            selectedChips: [optionId],
          });
          return;
        }
      }

      // Format date as YYYY-MM-DD
      const formattedDate = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      
      onAnswerChange({
        ...answer,
        startDate: formattedDate,
        durationDays: duration,
        selectedChips: [optionId],
      });
    },
    [answer, onAnswerChange]
  );

  // Calculate end date from start date and duration
  const calculateEndDate = useCallback((startDateStr: string | undefined, days: number): string | null => {
    if (!startDateStr) return null;
    const [year, month, day] = startDateStr.split('-').map(Number);
    const startDate = new Date(year, month - 1, day);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + days - 1); // -1 because start day counts as day 1
    return `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
  }, []);

  // Format date for display
  const formatDateDisplay = useCallback((dateStr: string | null): string => {
    if (!dateStr) return "—";
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, []);

  // ===== WHERE STEP HANDLERS =====
  const [customPlaceInput, setCustomPlaceInput] = useState("");
  const [customTypeInput, setCustomTypeInput] = useState("");

  const handleAddCustomPlace = useCallback(() => {
    if (!customPlaceInput.trim()) return;
    const newPlaces = [...(answer.customPlaces || []), customPlaceInput.trim()];
    onAnswerChange({
      ...answer,
      customPlaces: newPlaces,
    });
    setCustomPlaceInput("");
  }, [answer, onAnswerChange, customPlaceInput]);

  const handleRemoveCustomPlace = useCallback((index: number) => {
    const newPlaces = (answer.customPlaces || []).filter((_, i) => i !== index);
    onAnswerChange({
      ...answer,
      customPlaces: newPlaces,
    });
  }, [answer, onAnswerChange]);

  const handleAddCustomType = useCallback(() => {
    if (!customTypeInput.trim()) return;
    const newTypes = [...(answer.customTypes || []), customTypeInput.trim()];
    onAnswerChange({
      ...answer,
      customTypes: newTypes,
    });
    setCustomTypeInput("");
  }, [answer, onAnswerChange, customTypeInput]);

  const handleRemoveCustomType = useCallback((index: number) => {
    const newTypes = (answer.customTypes || []).filter((_, i) => i !== index);
    onAnswerChange({
      ...answer,
      customTypes: newTypes,
    });
  }, [answer, onAnswerChange]);

  // Handle multi-select chip click for where step
  const handleWhereChipClick = useCallback(
    (chipId: string) => {
      const isSelected = answer.selectedChips.includes(chipId);
      const newSelectedChips = isSelected
        ? answer.selectedChips.filter((id) => id !== chipId)
        : [...answer.selectedChips, chipId];

      onAnswerChange({
        ...answer,
        selectedChips: newSelectedChips,
      });
    },
    [answer, onAnswerChange]
  );

  // ===== BUDGET STEP HANDLERS =====
  const handleBudgetPerDayChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
      onAnswerChange({
        ...answer,
        budgetPerDay: numValue,
        budgetTotal: numValue * durationDays,
        selectedChips: [], // Clear chips when typing
        customValue: undefined,
      });
    },
    [answer, onAnswerChange, durationDays]
  );

  const handleBudgetTotalChange = useCallback(
    (value: string) => {
      const numValue = parseInt(value.replace(/[^0-9]/g, ""), 10) || 0;
      const perDay = durationDays > 0 ? Math.round(numValue / durationDays) : 0;
      onAnswerChange({
        ...answer,
        budgetTotal: numValue,
        budgetPerDay: perDay,
        selectedChips: [], // Clear chips when typing
        customValue: undefined,
      });
    },
    [answer, onAnswerChange, durationDays]
  );

  // Group suggestions by their group property
  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, WizardSuggestionChip[]> = {};
    suggestions.forEach((chip) => {
      const group = chip.group || "category";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(chip);
    });
    return groups;
  }, [suggestions]);

  if (!isActive) return null;

  // ===== RENDER WHEN STEP =====
  if (step.id === "when") {
    const currentDuration = answer.durationDays || DEFAULT_DURATION_DAYS;
    const endDate = calculateEndDate(answer.startDate, currentDuration);
    
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

          {/* Date Range Selector - All on one line */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 flex-wrap justify-center">
              {/* Start Date */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">From:</span>
                <DatePopover
                  value={answer.startDate || ""}
                  onChange={handleStartDateChange}
                  label="Select start date"
                />
              </div>

              {/* Duration */}
              <div className="flex items-center gap-2 px-3 border-l border-r border-slate-200">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDurationChange(currentDuration - 1)}
                  disabled={currentDuration <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="w-16 text-center">
                  <span className="text-xl font-bold text-purple-600">{currentDuration}</span>
                  <span className="text-xs text-slate-500 ml-1">days</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDurationChange(currentDuration + 1)}
                  disabled={currentDuration >= 90}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* End Date (Read-only) */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">To:</span>
                <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
                  <CalendarIcon className="h-4 w-4 text-slate-400" />
                  <span className={cn(
                    "text-sm font-medium",
                    endDate ? "text-slate-900" : "text-slate-400"
                  )}>
                    {formatDateDisplay(endDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Options */}
          <div className="space-y-2">
            <p className="text-xs text-center text-slate-400 uppercase tracking-wide">Quick Options</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((chip) => {
                const isSelected = answer.selectedChips.includes(chip.id);
                return (
                  <motion.button
                    key={chip.id}
                    onClick={() => handleQuickOptionClick(chip.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative px-3 py-2 rounded-lg border transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                      isSelected
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center"
                      >
                        <Check className="h-2.5 w-2.5 text-white" />
                      </motion.div>
                    )}
                    <span className={cn("text-sm font-medium", isSelected ? "text-purple-700" : "text-slate-700")}>
                      {chip.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div className="space-y-3">
            {!showCustomInput ? (
              <button
                onClick={handleToggleCustomInput}
                className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-purple-600 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span className="text-sm">Or describe in your own words</span>
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <Input
                  type="text"
                  placeholder="e.g., First week of March for 10 days"
                  value={customInputValue}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  className="text-center text-lg py-6 border-2 border-purple-200 focus:border-purple-500"
                  autoFocus
                />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ===== RENDER WHERE STEP =====
  if (step.id === "where") {
    // Separate chips into Places (profile + suggested) and Types (category)
    const placeChips = [...(groupedSuggestions["profile"] || []), ...(groupedSuggestions["suggested"] || [])];
    const typeChips = groupedSuggestions["category"] || [];
    
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
            <p className="text-slate-500">Select any combination of places and destination types</p>
          </div>

          {/* Places Section */}
          <div className="space-y-3">
            <p className="text-xs text-slate-400 uppercase tracking-wide px-2 font-semibold">
              Places
            </p>
            
            {/* Place Chips */}
            {placeChips.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {placeChips.map((chip) => {
                  const isSelected = answer.selectedChips.includes(chip.id);
                  return (
                    <motion.button
                      key={chip.id}
                      onClick={() => handleWhereChipClick(chip.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "relative px-3 py-2 rounded-lg border-2 transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                        isSelected
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : chip.group === "profile"
                          ? "border-green-200 bg-green-50/50 hover:border-green-400"
                          : "border-amber-200 bg-amber-50/50 hover:border-amber-400"
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center"
                        >
                          <Check className="h-2.5 w-2.5 text-white" />
                        </motion.div>
                      )}
                      <span className={cn("text-sm font-medium", isSelected ? "text-purple-700" : "text-slate-700")}>
                        {chip.label}
                      </span>
                      {chip.fromProfile && (
                        <span className="ml-1 text-xs text-green-600">★</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Custom Places */}
            {(answer.customPlaces || []).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {(answer.customPlaces || []).map((place, index) => (
                  <div
                    key={`custom-place-${index}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-purple-500 bg-purple-50"
                  >
                    <span className="text-sm font-medium text-purple-700">{place}</span>
                    <button
                      onClick={() => handleRemoveCustomPlace(index)}
                      className="ml-1 text-purple-400 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Place Input */}
            <div className="flex items-center justify-center gap-2">
              <Input
                type="text"
                placeholder="Add a place..."
                value={customPlaceInput}
                onChange={(e) => setCustomPlaceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomPlace();
                  }
                }}
                className="w-48 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustomPlace}
                disabled={!customPlaceInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Types Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 uppercase tracking-wide px-2 font-semibold">
              Destination Types
            </p>
            
            {/* Type Chips */}
            <div className="flex flex-wrap justify-center gap-2">
              {typeChips.map((chip) => {
                const isSelected = answer.selectedChips.includes(chip.id);
                return (
                  <motion.button
                    key={chip.id}
                    onClick={() => handleWhereChipClick(chip.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative px-3 py-2 rounded-lg border-2 transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                      isSelected
                        ? "border-purple-500 bg-purple-50 shadow-md"
                        : "border-slate-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center"
                      >
                        <Check className="h-2.5 w-2.5 text-white" />
                      </motion.div>
                    )}
                    <span className={cn("text-sm font-medium", isSelected ? "text-purple-700" : "text-slate-700")}>
                      {chip.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Custom Types */}
            {(answer.customTypes || []).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {(answer.customTypes || []).map((type, index) => (
                  <div
                    key={`custom-type-${index}`}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border-2 border-purple-500 bg-purple-50"
                  >
                    <span className="text-sm font-medium text-purple-700">{type}</span>
                    <button
                      onClick={() => handleRemoveCustomType(index)}
                      className="ml-1 text-purple-400 hover:text-purple-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Custom Type Input */}
            <div className="flex items-center justify-center gap-2">
              <Input
                type="text"
                placeholder="Add a type..."
                value={customTypeInput}
                onChange={(e) => setCustomTypeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomType();
                  }
                }}
                className="w-48 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddCustomType}
                disabled={!customTypeInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // ===== RENDER BUDGET STEP =====
  if (step.id === "budget") {
    const perDay = answer.budgetPerDay || 0;
    const total = answer.budgetTotal || 0;

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

          {/* Budget Inputs */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 w-full max-w-md">
              <div className="flex-1 text-center">
                <label className="text-xs text-slate-500 uppercase tracking-wide">Per Day</label>
                <div className="flex items-center justify-center mt-1">
                  <span className="text-lg text-slate-400 mr-1">$</span>
                  <Input
                    type="text"
                    value={perDay > 0 ? perDay.toLocaleString() : ""}
                    onChange={(e) => handleBudgetPerDayChange(e.target.value)}
                    placeholder="150"
                    className="w-24 text-center text-xl font-bold border-0 bg-transparent focus:ring-0 p-0"
                  />
                </div>
              </div>
              
              <div className="text-slate-300 font-light text-2xl">×</div>
              
              <div className="text-center px-2">
                <span className="text-xs text-slate-500 uppercase tracking-wide block">Days</span>
                <span className="text-xl font-medium text-slate-600">{durationDays}</span>
              </div>
              
              <div className="text-slate-300 font-light text-2xl">=</div>
              
              <div className="flex-1 text-center">
                <label className="text-xs text-slate-500 uppercase tracking-wide">Total</label>
                <div className="flex items-center justify-center mt-1">
                  <span className="text-lg text-slate-400 mr-1">$</span>
                  <Input
                    type="text"
                    value={total > 0 ? total.toLocaleString() : ""}
                    onChange={(e) => handleBudgetTotalChange(e.target.value)}
                    placeholder="1,050"
                    className="w-24 text-center text-xl font-bold border-0 bg-transparent focus:ring-0 p-0"
                  />
                </div>
              </div>
            </div>
            
            <p className="text-xs text-slate-400">
              Edit either field - they sync automatically
            </p>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <p className="text-xs text-center text-slate-400 uppercase tracking-wide">Quick Presets</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((chip) => {
                const isSelected = answer.selectedChips.includes(chip.id);
                const chipTotal = chip.value ? chip.value * durationDays : null;
                
                return (
                  <motion.button
                    key={chip.id}
                    onClick={() => handleChipClick(chip)}
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
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                      >
                        <Check className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                    <div className="flex flex-col items-center gap-1">
                      <span className={cn("font-medium", isSelected ? "text-purple-700" : "text-slate-700")}>
                        {chip.label}
                      </span>
                      {chip.description && (
                        <span className="text-xs text-slate-500">{chip.description}</span>
                      )}
                      {chipTotal && (
                        <span className="text-xs text-purple-600 font-medium">
                          ~${chipTotal.toLocaleString()} total
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Custom Input */}
          <div className="space-y-3">
            {!showCustomInput ? (
              <button
                onClick={handleToggleCustomInput}
                className="w-full flex items-center justify-center gap-2 py-3 text-slate-500 hover:text-purple-600 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span className="text-sm">Or describe your budget</span>
              </button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                <Input
                  type="text"
                  placeholder="e.g., About $200/day or $2,000 total"
                  value={customInputValue}
                  onChange={(e) => handleCustomInputChange(e.target.value)}
                  className="text-center text-lg py-6 border-2 border-purple-200 focus:border-purple-500"
                  autoFocus
                />
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // ===== DEFAULT RENDER (who, what, etc.) =====
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
                onClick={() => handleChipClick(chip)}
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
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
                <div className="flex flex-col items-center gap-1">
                  <span className={cn("font-medium", isSelected ? "text-purple-700" : "text-slate-700")}>
                    {chip.label}
                  </span>
                  {chip.description && (
                    <span className="text-xs text-slate-500">{chip.description}</span>
                  )}
                  {chip.fromProfile && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 mt-1">
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
