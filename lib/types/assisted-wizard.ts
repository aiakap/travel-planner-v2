/**
 * Assisted Trip Planning Wizard Types
 * 
 * Types for the interactive wizard that guides users through trip planning
 */

import type { AITripSuggestion } from "@/lib/ai/generate-trip-suggestions";
import type { ProfileGraphItem } from "./profile-graph";

// Wizard step identifiers
export type WizardStepId = "when" | "where" | "budget" | "who" | "what";

// Individual wizard step configuration
export interface WizardStep {
  id: WizardStepId;
  question: string;
  subtext: string;
  icon: string; // Lucide icon name
  allowMultiple?: boolean; // For 'what' step - allow multiple selections
}

// Suggestion chip for each step
export interface WizardSuggestionChip {
  id: string;
  label: string;
  description?: string;
  fromProfile?: boolean; // Whether this was derived from user's profile
}

// Answer for a single step
export interface WizardStepAnswer {
  stepId: WizardStepId;
  selectedChips: string[]; // IDs of selected chips
  customValue?: string; // Custom text input
}

// All wizard answers collected
export interface WizardAnswers {
  when: WizardStepAnswer;
  where: WizardStepAnswer;
  budget: WizardStepAnswer;
  who: WizardStepAnswer;
  what: WizardStepAnswer;
}

// Trip type for categorization
export type TripType = "local_experience" | "road_trip" | "single_destination" | "multi_destination";

// Alternative trip suggestion (brief summary with enough info to expand)
export interface TripAlternative {
  title: string;
  destination: string;
  duration: string;
  estimatedBudget: string;
  whyDifferent: string; // e.g., "Lower budget option", "Different destination"
  tripType: TripType; // Needed for expansion to full suggestion
}

// Request payload for expanding an alternative to a full suggestion
export interface ExpandAlternativeRequest {
  alternative: TripAlternative;
  originalAnswers: WizardAnswers;
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
}

// Result from the assisted trip generation
export interface AssistedTripResult {
  mainSuggestion: AITripSuggestion;
  alternatives: TripAlternative[];
}

// Wizard state
export type WizardState = "idle" | "in_progress" | "generating" | "complete";

// Props for the wizard component
export interface AssistedTripWizardProps {
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
  onComplete?: (result: AssistedTripResult) => void;
}

// Props for individual question card
export interface WizardQuestionCardProps {
  step: WizardStep;
  suggestions: WizardSuggestionChip[];
  answer: WizardStepAnswer;
  onAnswerChange: (answer: WizardStepAnswer) => void;
  isActive: boolean;
  direction: "forward" | "backward";
}

// API request payload
export interface AssistedTripRequest {
  answers: WizardAnswers;
  profileItems: ProfileGraphItem[];
  userProfile: {
    name: string;
    dateOfBirth: Date | null;
    city: string | null;
    country: string | null;
  };
}

// Step configuration with all options
export const WIZARD_STEPS: WizardStep[] = [
  {
    id: "when",
    question: "When do you want to travel?",
    subtext: "Choose a timeframe or enter specific dates",
    icon: "Calendar",
  },
  {
    id: "where",
    question: "Where would you like to go?",
    subtext: "Pick a destination type or name a specific place",
    icon: "MapPin",
  },
  {
    id: "budget",
    question: "What's your budget?",
    subtext: "Per person, including flights and accommodation",
    icon: "DollarSign",
  },
  {
    id: "who",
    question: "Who's joining you?",
    subtext: "Solo adventure or traveling with others?",
    icon: "Users",
  },
  {
    id: "what",
    question: "What kind of experience?",
    subtext: "Select one or more trip styles",
    icon: "Sparkles",
    allowMultiple: true,
  },
];

// Default suggestion chips for each step (used when no profile data available)
export const DEFAULT_SUGGESTIONS: Record<WizardStepId, WizardSuggestionChip[]> = {
  when: [
    { id: "this-weekend", label: "This Weekend" },
    { id: "next-month", label: "Next Month" },
    { id: "spring", label: "Spring 2026" },
    { id: "summer", label: "Summer 2026" },
    { id: "flexible", label: "I'm Flexible" },
  ],
  where: [
    { id: "beach", label: "Beach & Sun" },
    { id: "city", label: "City Break" },
    { id: "mountains", label: "Mountains" },
    { id: "europe", label: "Europe" },
    { id: "asia", label: "Asia" },
    { id: "surprise", label: "Surprise Me" },
  ],
  budget: [
    { id: "budget", label: "Budget", description: "Under $500" },
    { id: "moderate", label: "Moderate", description: "$500-1,500" },
    { id: "comfortable", label: "Comfortable", description: "$1,500-3,000" },
    { id: "luxury", label: "Luxury", description: "$3,000+" },
    { id: "no-limit", label: "No Limit" },
  ],
  who: [
    { id: "solo", label: "Solo" },
    { id: "partner", label: "With Partner" },
    { id: "family", label: "Family" },
    { id: "friends", label: "With Friends" },
    { id: "group", label: "Group Trip" },
  ],
  what: [
    { id: "relaxation", label: "Relaxation" },
    { id: "adventure", label: "Adventure" },
    { id: "culture", label: "Culture & History" },
    { id: "food", label: "Food & Wine" },
    { id: "nature", label: "Nature & Wildlife" },
    { id: "nightlife", label: "Nightlife" },
    { id: "shopping", label: "Shopping" },
    { id: "wellness", label: "Wellness & Spa" },
  ],
};

// Helper to create empty answers
export function createEmptyAnswers(): WizardAnswers {
  return {
    when: { stepId: "when", selectedChips: [] },
    where: { stepId: "where", selectedChips: [] },
    budget: { stepId: "budget", selectedChips: [] },
    who: { stepId: "who", selectedChips: [] },
    what: { stepId: "what", selectedChips: [] },
  };
}
