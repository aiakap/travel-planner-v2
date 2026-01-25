/**
 * Profile Attribute Configuration
 * For building user travel profiles
 */

import { ObjectConfig } from "./types";
import { ProfileView } from "../_views/profile-view";
import { ProfileSuggestionCard } from "../_cards/profile-suggestion-card";
import { AutoAddCard } from "../_cards/auto-add-card";
import { RelatedSuggestionsCard } from "../_cards/related-suggestions-card";
import { TopicChoiceCard } from "../_cards/topic-choice-card";
import { fetchProfileData } from "@/lib/object/data-fetchers/profile";
import { PROFILE_TOPICS } from "./profile-topics";

// Build topic list for AI prompt
const topicsList = PROFILE_TOPICS.map(t => 
  `- ${t.name} (${t.category}): ${t.question}\n  Options: ${t.options.join(", ")}`
).join("\n");

export const profileAttributeConfig: ObjectConfig = {
  id: "profile_attribute",
  name: "Profile Builder",
  description: "Build your travel profile",

  systemPrompt: `You are a helpful travel profile assistant that intelligently categorizes user preferences.

IMPORTANT: You will receive the user's current profile XML. Analyze it to understand:
1. What categories already exist (e.g., Hobbies, travel-preferences, hobbies, etc.)
2. What subcategories are used within each category (e.g., hobby, sport, culinary, etc.)
3. The naming conventions being used

RESPONSE FORMAT - Use AUTO_ADD cards:

When the user mentions preferences/interests, respond with:

[AUTO_ADD: {
  "category": "Hobbies",
  "subcategory": "sport",
  "value": "Triathlon"
}]

Great! I'll add Triathlon to your profile under Hobbies > sport.

RULES FOR CATEGORY/SUBCATEGORY SELECTION:

1. **Match existing structure**: If the user already has "Hobbies" with "sport" subcategory, use that
2. **Use semantic subcategories**: 
   - For activities/sports: use "sport" or "hobby"
   - For food preferences: use "culinary"
   - For travel preferences: use specific subcategories like "airlines", "hotels", "amenities", "travel-class", "loyalty-programs"
   - For travel style: use "solo-vs-group", "luxury-vs-budget", "adventure-vs-relaxation"
3. **Be consistent**: If you see "travel-preferences" > "hotels", use that pattern for hotel-related items
4. **Normalize names**: Use the same category/subcategory names that already exist in their profile

EXAMPLES:

User profile has: <Hobbies><hobby><item>Swimming</item></hobby></Hobbies>
User says: "I like cycling"
Response: [AUTO_ADD: {"category": "Hobbies", "subcategory": "hobby", "value": "Cycling"}]

User profile has: <travel-preferences><hotels><item>Marriott</item></hotels></travel-preferences>
User says: "I prefer Hilton hotels"
Response: [AUTO_ADD: {"category": "travel-preferences", "subcategory": "hotels", "value": "Hilton"}]

User profile has: <hobbies><culinary><item>Italian Food</item></culinary></hobbies>
User says: "I love sushi"
Response: [AUTO_ADD: {"category": "hobbies", "subcategory": "culinary", "value": "Sushi"}]

Keep responses to 1-2 sentences acknowledging what you're adding and where.`,

  dataSource: {
    fetch: async (userId: string) => {
      return await fetchProfileData(userId);
    },
  },

  leftPanel: {
    welcomeMessage: "Let's build your travel profile! Tell me about yourself - what do you enjoy?",
    placeholder: "I love dancing, hiking...",
    cardRenderers: {
      suggestion: ProfileSuggestionCard,
      auto_add: AutoAddCard,
      related_suggestions: RelatedSuggestionsCard,
      topic_choice: TopicChoiceCard,
    },
  },

  rightPanel: {
    component: ProfileView,
  },

  cardStyle: {
    defaultStyle: "chip",
  },
  
  autoActions: {
    autoActionCards: ["auto_add"],
    onAutoAction: async (cards, onDataUpdate) => {
      console.log('🔵 [Profile Config] onAutoAction called with', cards.length, 'cards');
      
      for (const card of cards) {
        if (card.type === "auto_add") {
          try {
            console.log('📤 [Profile Config] Calling upsert API for:', card.data.value);
            
            // Call API route instead of server action directly
            const response = await fetch("/api/object/profile/upsert", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                category: card.data.category || "Hobbies",
                subcategory: card.data.type || "hobby",
                value: card.data.value,
                metadata: { addedAt: new Date().toISOString() }
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ [Profile Config] Upsert successful:', {
                success: result.success,
                nodeCount: result.graphData?.nodes?.length,
                nodes: result.graphData?.nodes?.map((n: any) => n.value).join(', '),
                hasXmlData: !!result.xmlData
              });
              
              // Trigger UI update via callback
              if (onDataUpdate) {
                console.log('📤 [Profile Config] Calling onDataUpdate with graphData');
                onDataUpdate({
                  graphData: result.graphData,
                  xmlData: result.xmlData
                });
              }
            } else {
              console.error('❌ [Profile Config] Upsert failed:', response.status);
            }
          } catch (error) {
            console.error('❌ [Profile Config] Error calling upsert API:', error);
          }
        }
      }
    },
  },
};
