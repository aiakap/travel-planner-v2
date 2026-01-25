/**
 * Profile Attribute Configuration
 * For building user travel profiles
 */

import { ObjectConfig } from "./types";
import { ProfileView } from "../_views/profile-view";
import { ProfileSuggestionCard } from "../_cards/profile-suggestion-card";

export const profileAttributeConfig: ObjectConfig = {
  id: "profile_attribute",
  name: "Profile Builder",
  description: "Build your travel profile",

  systemPrompt: `You are a helpful assistant that helps users build their travel profile.

Ask questions about:
- Travel preferences (window seat, aisle seat, etc.)
- Hobbies and interests
- Dietary restrictions
- Favorite destinations
- Travel style (luxury, budget, adventure, etc.)

When you identify profile attributes, return them as suggestions:
[PROFILE_SUGGESTION: {
  "category": "Hobbies",
  "subcategory": "Outdoor Activities",
  "value": "Skiing"
}]

Be conversational and help users think about their preferences!`,

  dataSource: {
    fetch: async (userId: string) => {
      // This would normally fetch from database
      // For now, return mock data
      return {
        profile: {
          hobbies: [],
          travelPreferences: [],
        },
      };
    },
  },

  leftPanel: {
    welcomeMessage: "Let's build your travel profile! Tell me about yourself.",
    placeholder: "I love skiing, prefer window seats...",
    cardRenderers: {
      suggestion: ProfileSuggestionCard,
    },
  },

  rightPanel: {
    component: ProfileView,
  },
};
