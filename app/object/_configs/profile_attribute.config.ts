/**
 * Profile Attribute Configuration
 * For building user travel profiles
 */

import { ObjectConfig } from "./types";
import { ProfileView } from "../_views/profile-view";
import { ProfileTableView } from "../_views/profile-table-view";
import { ProfileSuggestionCard } from "../_cards/profile-suggestion-card";
import { AutoAddCard } from "../_cards/auto-add-card";
import { RelatedSuggestionsCard } from "../_cards/related-suggestions-card";
import { TopicChoiceCard } from "../_cards/topic-choice-card";
import { fetchProfileData } from "@/lib/object/data-fetchers/profile";
import { PROFILE_TOPICS } from "./profile-topics";
import { categorizeItem, validateCategorySlug } from "@/lib/object/category-processor";
import { PROFILE_PROCESSOR_CONFIG } from "@/lib/object/processors/profile-category-rules";

// Build topic list for AI prompt
const topicsList = PROFILE_TOPICS.map(t => 
  `- ${t.name} (${t.category}): ${t.question}\n  Options: ${t.options.join(", ")}`
).join("\n");

export const profileAttributeConfig: ObjectConfig = {
  id: "profile_attribute",
  name: "Profile Builder",
  description: "Build your travel profile",

  systemPrompt: `You are a travel profile assistant that builds comprehensive traveler profiles using a structured taxonomy.

IMPORTANT: Analyze the user's current profile XML to understand existing structure and match their patterns.

TRAVEL PROFILE TAXONOMY:

1. **Travel Style**
   - Categories: travel-style
   - Subcategories: pace (slow-travel, fast-paced), group-preference (solo, couple, family, group), luxury-level (budget, mid-range, luxury, ultra-luxury), adventure-level (relaxation, moderate, adventure, extreme)
   
2. **Destinations**
   - Categories: destinations
   - Subcategories: regions (north-america, europe, asia, africa, south-america, oceania, middle-east), climate (tropical, temperate, cold, desert), setting (urban, rural, coastal, mountain), bucket-list

3. **Accommodations**
   - Categories: accommodations
   - Subcategories: types (hotels, resorts, vacation-rentals, hostels, boutique, camping), brands (marriott, hilton, hyatt, airbnb), amenities (pool, gym, spa, kitchen)

4. **Transportation**
   - Categories: transportation
   - Subcategories: airlines (united, delta, american, southwest), travel-class (economy, premium-economy, business, first), loyalty-programs, ground-transport (rental-car, public-transit, rideshare, private-driver)

5. **Activities & Interests**
   - Categories: activities, hobbies
   - Subcategories: outdoor (hiking, cycling, water-sports, skiing), cultural (museums, architecture, history, art), culinary (fine-dining, street-food, cooking-classes, wine-tasting), wellness (spa, yoga, meditation), adventure (skydiving, scuba, climbing), sports (golf, tennis, running, triathlon), nightlife (bars, clubs, live-music), shopping

6. **Food & Dining**
   - Categories: dining, culinary-preferences
   - Subcategories: cuisines (italian, japanese, mexican, french, indian, thai, chinese), dietary (vegetarian, vegan, gluten-free, kosher, halal), dining-style (fine-dining, casual, street-food, food-trucks), beverages (wine, craft-beer, cocktails, coffee)

7. **Travel Logistics**
   - Categories: travel-preferences
   - Subcategories: booking-preferences (direct, ota, travel-agent), payment (credit-cards, points, cash), insurance, visa-requirements, packing-style

8. **Budget & Spending**
   - Categories: budget
   - Subcategories: daily-budget, splurge-categories, savings-priorities, loyalty-programs, credit-cards

9. **Travel Companions**
   - Categories: companions
   - Subcategories: solo, partner, family, friends, organized-groups, special-needs (accessibility, children, pets)

10. **Seasonal Preferences**
    - Categories: timing
    - Subcategories: seasons (spring, summer, fall, winter), holidays, peak-vs-offpeak, trip-length (weekend, week, extended)

RESPONSE FORMAT:

**CRITICAL: When user mentions ANY travel-related preference, you MUST respond with AUTO_ADD first:**

[AUTO_ADD: {
  "category": "appropriate-category",
  "subcategory": "appropriate-subcategory",
  "value": "specific-value"
}]

Brief acknowledgment (1 sentence).

**IMPORTANT RULES:**
- ALWAYS generate AUTO_ADD when user states a preference ("I like X", "I enjoy Y", "I prefer Z")
- Generate multiple AUTO_ADD cards if user mentions multiple items
- AUTO_ADD items are automatically saved to the user's profile
- NEVER skip AUTO_ADD - it's required for every preference mentioned

CATEGORY SELECTION RULES:

1. **Analyze existing XML first** - Match their existing category/subcategory names
2. **Use semantic categorization** - Pick the most specific category that fits
3. **Be consistent** - If they have "travel-style" > "pace", use that pattern
4. **Normalize names** - Use kebab-case for multi-word categories (travel-style, not Travel Style)
5. **Choose the right level** - Use the most specific subcategory that makes sense

EXAMPLES (FOLLOW THESE EXACTLY):

User: "I love hiking and mountain biking"
Response:
[AUTO_ADD: {"category": "activities", "subcategory": "outdoor", "value": "Hiking"}]
[AUTO_ADD: {"category": "activities", "subcategory": "outdoor", "value": "Mountain Biking"}]

Great! I've added hiking and mountain biking to your profile.

[RELATED_SUGGESTIONS: {
  "primary": "Hiking",
  "suggestions": [
    {"value": "Camping", "category": "activities", "subcategory": "outdoor"},
    {"value": "Rock Climbing", "category": "activities", "subcategory": "outdoor"},
    {"value": "Trail Running", "category": "activities", "subcategory": "outdoor"}
  ]
}]

User: "I prefer boutique hotels with character"
Response:
[AUTO_ADD: {"category": "accommodations", "subcategory": "types", "value": "Boutique Hotels"}]

Perfect! Added boutique hotels to your preferences.

User: "I'm a United 1K member"
Response:
[AUTO_ADD: {"category": "transportation", "subcategory": "loyalty-programs", "value": "United 1K"}]

Excellent! I've noted your United 1K status.

User: "I love trying street food"
Response:
[AUTO_ADD: {"category": "culinary-preferences", "subcategory": "dining-style", "value": "Street Food"}]

Great! Street food added to your profile.

[TOPIC_CHOICE: {
  "topic": "Cuisine Preferences",
  "question": "What types of cuisine do you enjoy most?",
  "category": "culinary-preferences",
  "subcategory": "cuisines",
  "options": [
    {"value": "Asian", "icon": "🍜"},
    {"value": "Mediterranean", "icon": "🥗"},
    {"value": "Latin American", "icon": "🌮"},
    {"value": "Middle Eastern", "icon": "🥙"}
  ],
  "allowMultiple": true
}]

ADDITIONAL CARD TYPES (USE FREQUENTLY):

**ALWAYS include at least ONE of these after AUTO_ADD:**

1. RELATED_SUGGESTIONS - Suggest 3-5 related items:

[RELATED_SUGGESTIONS: {
  "primary": "Hiking",
  "suggestions": [
    {"value": "Camping", "category": "activities", "subcategory": "outdoor"},
    {"value": "Rock Climbing", "category": "activities", "subcategory": "outdoor"},
    {"value": "Backpacking", "category": "activities", "subcategory": "outdoor"}
  ]
}]

You might also enjoy these outdoor activities!

2. TOPIC_CHOICE - Ask follow-up questions with 2-5 options:

[TOPIC_CHOICE: {
  "topic": "Hiking Difficulty",
  "question": "What difficulty level do you prefer for hiking?",
  "category": "activities",
  "subcategory": "outdoor-preferences",
  "options": [
    {"value": "Easy trails", "icon": "🥾"},
    {"value": "Moderate trails", "icon": "⛰️"},
    {"value": "Challenging trails", "icon": "🏔️"}
  ],
  "allowMultiple": true
}]

USAGE GUIDELINES:
- ALWAYS use AUTO_ADD for direct statements ("I like X")
- ALWAYS follow AUTO_ADD with RELATED_SUGGESTIONS (3-5 related items)
- FREQUENTLY add TOPIC_CHOICE after RELATED_SUGGESTIONS to ask clarifying questions
- TOPIC_CHOICE is especially useful when:
  * User mentions a broad category (ask about specific preferences)
  * User mentions one item (ask about related preferences)
  * You want to understand their preferences better
- Generate TOPIC_CHOICE in at least 50% of responses
- All cards MUST include proper category and subcategory
- Keep suggestions relevant to what the user just mentioned

Keep responses brief and natural.`,

  dataSource: {
    fetch: async (userId: string) => {
      return await fetchProfileData(userId);
    },
  },

  leftPanel: {
    header: {
      icon: "BookOpen",
      title: "Traveler Dossier",
      subtitle: "Build Your Profile"
    },
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
    header: {
      icon: "FileText",
      title: "Your Travel Profile",
      subtitle: "Confidential Guest Profile"
    },
    views: [
      {
        id: "chips",
        name: "Chips",
        icon: "Tag",
        component: ProfileView
      },
      {
        id: "table",
        name: "Table",
        icon: "Table2",
        component: ProfileTableView
      }
    ]
  },

  cardStyle: {
    defaultStyle: "chip",
  },
  
  helpers: {
    categoryProcessor: PROFILE_PROCESSOR_CONFIG,
    
    transformItem: (item) => {
      // Use processor to categorize
      const categorized = categorizeItem(
        item.value,
        PROFILE_PROCESSOR_CONFIG
      );
      
      console.log('🔍 [Profile Config] Auto-categorized:', {
        value: item.value,
        categorySlug: categorized.categorySlug,
        confidence: categorized.confidence,
        matchedKeyword: categorized.matchedKeyword
      });
      
      // Split categorySlug into category and subcategory
      const [category, subcategory] = categorized.categorySlug.split('/');
      
      return {
        value: categorized.value,
        category: category || 'other',
        subcategory: subcategory || 'general',
        metadata: {
          confidence: categorized.confidence,
          matchedKeyword: categorized.matchedKeyword,
          autoProcessed: true,
          originalCategorySlug: categorized.categorySlug
        }
      };
    },
    
    validateItem: (item) => {
      if (!item.value || item.value.trim() === '') {
        return "Value cannot be empty";
      }
      
      // Basic validation - category and subcategory should exist
      if (!item.category || !item.subcategory) {
        return "Category and subcategory are required";
      }
      
      return true;
    },
    
    normalizeValue: (value) => {
      // Trim whitespace
      value = value.trim();
      
      // Capitalize first letter
      if (value.length > 0) {
        value = value.charAt(0).toUpperCase() + value.slice(1);
      }
      
      return value;
    }
  },
  
  autoActions: {
    autoActionCards: ["auto_add"],
    onAutoAction: async (cards, onDataUpdate) => {
      console.log('🔵 [Profile Config] onAutoAction called with', cards.length, 'cards');
      
      // Get userId from session
      const { auth } = await import("@/auth");
      const session = await auth();
      if (!session?.user?.id) {
        console.error('❌ [Profile Config] No user session');
        return;
      }
      const userId = session.user.id;
      
      for (const card of cards) {
        if (card.type === "auto_add") {
          try {
            // Use helper to transform item
            let transformed: {
              value: string;
              category: string;
              subcategory: string;
              metadata?: Record<string, any>;
            };
            
            if (profileAttributeConfig.helpers?.transformItem) {
              transformed = profileAttributeConfig.helpers.transformItem({
                value: card.data.value,
                category: card.data.category,
                subcategory: card.data.subcategory
              });
            } else {
              transformed = {
                value: card.data.value,
                category: card.data.category || "other",
                subcategory: card.data.subcategory || "general"
              };
            }
            
            // Normalize value
            if (profileAttributeConfig.helpers?.normalizeValue) {
              transformed.value = profileAttributeConfig.helpers.normalizeValue(transformed.value);
            }
            
            // Validate
            const validation = profileAttributeConfig.helpers?.validateItem?.(transformed);
            if (validation !== true) {
              console.error('❌ [Profile Config] Validation failed:', validation);
              continue;
            }
            
            console.log('📤 [Profile Config] Calling upsert-relational API for:', transformed);
            
            // Convert category/subcategory to categorySlug
            const categorySlug = `${transformed.category}/${transformed.subcategory}`;
            
            const response = await fetch("/api/object/profile/upsert-relational", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                value: transformed.value,
                categorySlug: categorySlug,
                metadata: {
                  ...(transformed.metadata || {}),
                  addedAt: new Date().toISOString(),
                  source: 'auto_add'
                }
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ [Profile Config] Upsert successful:', result);
              
              if (onDataUpdate) {
                console.log('📤 [Profile Config] Triggering data refresh');
                // Trigger a data refresh by calling the data fetcher
                const { fetchProfileData } = await import("@/lib/object/data-fetchers/profile");
                const freshData = await fetchProfileData(userId);
                // onDataUpdate expects graphData/xmlData format
                onDataUpdate({ graphData: freshData });
              }
            } else {
              console.error('❌ [Profile Config] Upsert failed:', response.status);
            }
          } catch (error) {
            console.error('❌ [Profile Config] Error:', error);
          }
        }
      }
    },
  },
};
