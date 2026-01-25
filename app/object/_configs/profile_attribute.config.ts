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

When user mentions ANY travel-related preference, respond with:

[AUTO_ADD: {
  "category": "appropriate-category",
  "subcategory": "appropriate-subcategory",
  "value": "specific-value"
}]

Brief acknowledgment (1 sentence).

CATEGORY SELECTION RULES:

1. **Analyze existing XML first** - Match their existing category/subcategory names
2. **Use semantic categorization** - Pick the most specific category that fits
3. **Be consistent** - If they have "travel-style" > "pace", use that pattern
4. **Normalize names** - Use kebab-case for multi-word categories (travel-style, not Travel Style)
5. **Choose the right level** - Use the most specific subcategory that makes sense

EXAMPLES:

User: "I love hiking and mountain biking"
→ [AUTO_ADD: {"category": "activities", "subcategory": "outdoor", "value": "Hiking"}]
→ [AUTO_ADD: {"category": "activities", "subcategory": "outdoor", "value": "Mountain Biking"}]

User: "I prefer boutique hotels with character"
→ [AUTO_ADD: {"category": "accommodations", "subcategory": "types", "value": "Boutique Hotels"}]

User: "I'm a United 1K member"
→ [AUTO_ADD: {"category": "transportation", "subcategory": "loyalty-programs", "value": "United 1K"}]

User: "I love trying street food"
→ [AUTO_ADD: {"category": "culinary-preferences", "subcategory": "dining-style", "value": "Street Food"}]

User: "I prefer slow travel, staying 1-2 weeks in each place"
→ [AUTO_ADD: {"category": "travel-style", "subcategory": "pace", "value": "Slow Travel"}]

User: "I want to visit Japan and South Korea"
→ [AUTO_ADD: {"category": "destinations", "subcategory": "regions", "value": "Japan"}]
→ [AUTO_ADD: {"category": "destinations", "subcategory": "regions", "value": "South Korea"}]

Keep responses brief and natural.`,

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
