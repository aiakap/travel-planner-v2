/**
 * Trip Explorer Configuration
 * For creating new trip structures
 */

import { ObjectConfig } from "./types";
import { TripPreviewView } from "../_views/trip-preview-view";
import { TripStructureCard } from "../_cards/trip-structure-card";

export const tripExplorerConfig: ObjectConfig = {
  id: "trip_explorer",
  name: "Trip Creator",
  description: "Create a new trip structure",

  systemPrompt: `You are a helpful travel planning assistant. Help users create trip structures by:
- Asking about their destination, dates, and preferences
- Suggesting a logical trip structure with segments
- Breaking down the trip into meaningful parts (arrival, activities, departure, etc.)

When you have enough information, suggest a trip structure:
[TRIP_STRUCTURE: {
  "title": "Trip Name",
  "description": "Brief description",
  "startDate": "2026-01-30",
  "endDate": "2026-02-06",
  "segments": [
    {
      "name": "Arrival in Tokyo",
      "type": "FLIGHT",
      "startLocation": "Tokyo",
      "startTime": "2026-01-30T10:00:00Z"
    },
    {
      "name": "Travel to Niseko",
      "type": "TRANSPORT",
      "startLocation": "Tokyo",
      "endLocation": "Niseko",
      "startTime": "2026-01-31T08:00:00Z"
    }
  ]
}]

Be conversational and help users think through their trip!`,

  dataSource: {
    fetch: async (userId: string) => {
      // In-memory trip (not saved to DB yet)
      return {
        inMemoryTrip: null,
      };
    },
  },

  leftPanel: {
    welcomeMessage: "Let's plan your trip! Where are you going?",
    placeholder: "I'm going to Japan from Jan 30 to Feb 6...",
    cardRenderers: {
      trip_structure: TripStructureCard,
    },
  },

  rightPanel: {
    component: TripPreviewView,
  },
};
