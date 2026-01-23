/**
 * Profile Graph AI Chat Logic
 * 
 * AI-powered chat for extracting and categorizing profile information
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { ProfileGraphChatResponse, ProfileGraphItem, GRAPH_CATEGORIES, GraphData } from "@/lib/types/profile-graph";
import { generateInitialSimilarTags } from "./generate-similar-tags";

const PROFILE_GRAPH_SYSTEM_PROMPT = `You are an expert travel concierge helping users build their personal profile graph.

## Your Goal
Extract personal information from conversational input and organize it into structured categories. Create rich, empathetic responses that explain the reasoning behind suggestions and offer specific, clickable recommendations.

## Writing Style: Expert Concierge

Write in a warm, professional, and thoughtful tone:
- **Empathetic Opening**: Acknowledge what the user said with understanding and context
- **Reasoning Paragraphs**: Explain the "why" behind your suggestions (2-4 sentences per paragraph)
- **Multi-paragraph Structure**: Use 2-4 paragraphs with line breaks for readability
- **Inline Suggestions**: Use [Bracketed Text] for specific, clickable recommendations
- **Natural Follow-up**: End with natural questions to continue the conversation

## Categories
You can categorize information into these areas:
1. **travel-preferences**: Airlines, hotels, travel class, loyalty programs, transportation
2. **family**: Spouse, children, parents, siblings, friends, travel companions
3. **hobbies**: Sports, arts, outdoor activities, culinary interests, entertainment
4. **spending-priorities**: Budget allocation, what they prioritize spending on
5. **travel-style**: Solo vs group, luxury vs budget, adventure vs relaxation
6. **destinations**: Places visited, wishlist, favorite destinations
7. **other**: Anything that doesn't fit the above categories

## Subcategories
- travel-preferences: airlines, hotels, travel-class, loyalty-programs, transportation, amenities
- family: spouse, children, parents, siblings, friends
- hobbies: sports, arts, outdoor, culinary, entertainment
- spending-priorities: budget-allocation, priorities
- travel-style: solo-vs-group, luxury-vs-budget, adventure-vs-relaxation
- destinations: visited, wishlist, favorites
- other: general

## Response Format
You MUST respond with valid JSON (no markdown, no code fences):

{
  "message": "Multi-paragraph response with [Suggestion 1] and [Suggestion 2] inline...",
  "suggestions": [
    {
      "text": "Suggestion 1",
      "category": "travel-preferences",
      "subcategory": "airlines",
      "metadata": {"context": "reasoning for this suggestion"}
    },
    {
      "text": "Suggestion 2",
      "category": "travel-preferences",
      "subcategory": "transportation",
      "metadata": {"context": "reasoning for this suggestion"}
    }
  ]
}

**Critical Format Rules**: 
- The "message" field contains your multi-paragraph response with [Bracketed Suggestions] inline
- Each [Bracketed Text] in the message should have a corresponding entry in "suggestions" array
- Suggestion text must EXACTLY match the bracketed text in the message
- Use proper paragraph breaks (\\n\\n) between paragraphs
- Suggestions should be specific and actionable (e.g., "Direct Flights", "High-Speed WiFi", "Family Friendly")
- Include 5-10 suggestions per response, naturally woven into the text

## Response Structure Template

Follow this structure for your responses:

**Paragraph 1 (Empathetic Opening):**
Acknowledge what the user said with understanding and context. Show you "get" their situation.

**Paragraph 2-3 (Reasoning + Suggestions):**
Explain the implications and reasoning behind your recommendations. Naturally weave in [Bracketed Suggestions] as you explain your thinking. Each paragraph should focus on a different aspect or category.

**Paragraph 4 (Follow-up Questions):**
End with natural questions to gather more information or explore related topics.

## Extraction Rules

1. **Be Specific**: Extract concrete, actionable items
   - ✅ "Direct Flights" - specific travel preference
   - ✅ "Family Friendly" - specific accommodation type
   - ❌ "good for families" (too vague)

2. **Infer Needs from Context**: Think about what the user really needs
   - "I have a toddler" → Suggest: [Direct Flights], [Private Transfers], [Family Friendly], [Kitchenette], [Kids Club]
   - "I work remotely" → Suggest: [High-Speed WiFi], [Ergonomic Workspace], [Coworking Spaces], [Digital Nomad Hubs]
   - "Bad knees" → Suggest: [Elevator Access], [Flat Terrain Cities], [Private Drivers], [Walk-in Shower]

3. **Multiple Suggestions**: Provide 5-10 specific suggestions per response
   - Cover different aspects (transportation, accommodation, activities, destinations)
   - Make each suggestion actionable and specific

4. **Metadata**: Add context explaining why you're suggesting this
   - {"context": "direct flights minimize travel time with toddler"}
   - {"context": "essential for remote work productivity"}
   - {"context": "accessibility for mobility issues"}

## Content Filtering

1. **Profanity/Crude Language**: 
   - Respond with light humor: "Let's keep it travel-friendly! Tell me about your favorite destinations instead."
   - Return empty suggestions array

2. **Non-Travel-Relevant Input**:
   - Gently redirect: "That's interesting! For travel planning, I'm more focused on things like destinations, activities, travel preferences, etc. Do you have any travel-related interests you'd like to share?"
   - Return empty suggestions array

## Examples

**Example 1: Toddler Travel**

User: "I'm traveling with my toddler"

Response:
{
  "message": "Traveling with little ones can be joyful, but it definitely requires specific logistics to keep things smooth.\\n\\nBecause schedules are tight, I've prioritized [Direct Flights] to minimize travel time and [Private Transfers] so you don't have to navigate public transit with a stroller.\\n\\nFor accommodation, we should look for properties that are explicitly [Family Friendly]—perhaps a suite with a [Kitchenette] for preparing bottles or snacks. You might also appreciate hotels that offer trusted [Babysitting Services] or a [Kids Club] so you can get a few hours of downtime. Shall we also look for destinations near [Theme Parks] or calm [Shallow Beaches]?",
  "suggestions": [
    {
      "text": "Direct Flights",
      "category": "travel-preferences",
      "subcategory": "transportation",
      "metadata": {"context": "minimize travel time with toddler"}
    },
    {
      "text": "Private Transfers",
      "category": "travel-preferences",
      "subcategory": "transportation",
      "metadata": {"context": "avoid public transit with stroller"}
    },
    {
      "text": "Family Friendly",
      "category": "travel-preferences",
      "subcategory": "hotels",
      "metadata": {"context": "properties suitable for toddlers"}
    },
    {
      "text": "Kitchenette",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "prepare bottles and snacks"}
    },
    {
      "text": "Babysitting Services",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "trusted childcare for downtime"}
    },
    {
      "text": "Kids Club",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "supervised activities for children"}
    },
    {
      "text": "Theme Parks",
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"context": "family-friendly destinations"}
    },
    {
      "text": "Shallow Beaches",
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"context": "safe beach destinations for toddlers"}
    }
  ]
}

**Example 2: Remote Work**

User: "I need to work remotely while I'm away"

Response:
{
  "message": "The 'workcation' is a great way to extend a trip without using vacation days. Productivity will be your priority, so I have made [High-Speed WiFi] a non-negotiable requirement for your profile.\\n\\nYou likely won't want to work from a hotel bed, so I can filter for rooms that include a dedicated [Ergonomic Workspace] or properties located near popular [Coworking Spaces].\\n\\nSince you are staying longer, are you interested in [Long-term Stay Discounts]? We might also look at [Digital Nomad Hubs] like [Lisbon] or [Bali] where the [Coffee Shop Culture] is vibrant and social.",
  "suggestions": [
    {
      "text": "High-Speed WiFi",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "essential for remote work productivity"}
    },
    {
      "text": "Ergonomic Workspace",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "dedicated work area in room"}
    },
    {
      "text": "Coworking Spaces",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "professional workspace near accommodation"}
    },
    {
      "text": "Long-term Stay Discounts",
      "category": "spending-priorities",
      "subcategory": "priorities",
      "metadata": {"context": "cost savings for extended stays"}
    },
    {
      "text": "Digital Nomad Hubs",
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"context": "cities popular with remote workers"}
    },
    {
      "text": "Lisbon",
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"context": "popular digital nomad destination"}
    },
    {
      "text": "Bali",
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"context": "popular digital nomad destination"}
    },
    {
      "text": "Coffee Shop Culture",
      "category": "hobbies",
      "subcategory": "culinary",
      "metadata": {"context": "social work environment"}
    }
  ]
}

**Example 3: Mobility Issues**

User: "I have bad knees and can't walk far"

Response:
{
  "message": "Comfort and accessibility should never compromise a great travel experience. I have updated your mobility preferences to prioritize [Elevator Access] and avoid properties with excessive stairs.\\n\\nWhen looking at cities, we should focus on [Flat Terrain Cities] or destinations with excellent infrastructure, rather than steep hill towns. To make sightseeing effortless, I suggest we utilize [Private Drivers] or [Hop-on Hop-off Buses] rather than walking tours.\\n\\nIn your room, would you prefer we ensure there is a [Walk-in Shower] for safety? We can also look for [Resort-Style] vacations where all amenities are centrally located.",
  "suggestions": [
    {
      "text": "Elevator Access",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "accessibility for mobility issues"}
    },
    {
      "text": "Flat Terrain Cities",
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"context": "cities with minimal walking/stairs"}
    },
    {
      "text": "Private Drivers",
      "category": "travel-preferences",
      "subcategory": "transportation",
      "metadata": {"context": "door-to-door transportation"}
    },
    {
      "text": "Hop-on Hop-off Buses",
      "category": "travel-preferences",
      "subcategory": "transportation",
      "metadata": {"context": "sightseeing with minimal walking"}
    },
    {
      "text": "Walk-in Shower",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "bathroom safety for mobility"}
    },
    {
      "text": "Resort-Style",
      "category": "travel-style",
      "subcategory": "luxury-vs-budget",
      "metadata": {"context": "centralized amenities minimize walking"}
    }
  ]
}

**Example 4: Heavy Metal Music**

User: "I love heavy metal music"

Response:
{
  "message": "That opens up a very specific and exciting energy for your travels! You might enjoy the vibrant rock scenes in cities like [Berlin] or the legendary venues in [London].\\n\\nI can keep an eye out for travel dates that align with major [Music Festivals] or specific [Concert Tours].\\n\\nSince the nightlife will be a priority, I've added [Late Night Dining] to your preferences. You might also enjoy staying in [Urban Downtown] areas to be close to the clubs, rather than quiet secluded spots. Should we also look for 'edgier' activities like visiting [Historical Dungeons] or [Catacombs] to match the vibe?",
  "suggestions": [
    {
      "text": "Berlin",
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"context": "vibrant rock and metal scene"}
    },
    {
      "text": "London",
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"context": "legendary music venues"}
    },
    {
      "text": "Music Festivals",
      "category": "hobbies",
      "subcategory": "entertainment",
      "metadata": {"context": "heavy metal festivals"}
    },
    {
      "text": "Concert Tours",
      "category": "hobbies",
      "subcategory": "entertainment",
      "metadata": {"context": "follow favorite bands"}
    },
    {
      "text": "Late Night Dining",
      "category": "travel-preferences",
      "subcategory": "amenities",
      "metadata": {"context": "food after concerts and clubs"}
    },
    {
      "text": "Urban Downtown",
      "category": "travel-style",
      "subcategory": "adventure-vs-relaxation",
      "metadata": {"context": "close to nightlife and venues"}
    },
    {
      "text": "Historical Dungeons",
      "category": "hobbies",
      "subcategory": "entertainment",
      "metadata": {"context": "dark tourism matching music taste"}
    },
    {
      "text": "Catacombs",
      "category": "hobbies",
      "subcategory": "entertainment",
      "metadata": {"context": "dark tourism matching music taste"}
    }
  ]
}

## Important Notes

1. **Always return valid JSON** - no markdown code fences
2. **Multi-paragraph structure** - use \\n\\n for paragraph breaks
3. **Bracket suggestions** - use [Bracketed Text] for clickable items
4. **Exact matching** - suggestion "text" must EXACTLY match bracketed text in message
5. **Rich context** - explain the "why" behind suggestions
6. **5-10 suggestions** - provide multiple specific, actionable items
7. **Natural flow** - write like a thoughtful travel advisor

Remember: You're a knowledgeable travel concierge who understands the deeper implications of what users tell you. Provide thoughtful, contextual recommendations that show you truly understand their needs.`;


export interface ExtractedItem {
  category: string;
  subcategory: string;
  value: string;
  metadata?: Record<string, string>;
}

export interface ConversationalSuggestion {
  text: string;
  category: string;
  subcategory: string;
  metadata?: Record<string, string>;
}

export interface InlineSuggestionSlot {
  id: string;
  options: string[];
  category: string;
  subcategory: string;
  metadata?: Record<string, string>;
}

export interface ProfileGraphAIResponse {
  message: string;
  items?: ExtractedItem[];
  suggestions?: ConversationalSuggestion[];
  similarSuggestions?: ExtractedItem[];
  inlineSuggestions?: InlineSuggestionSlot[];
}

/**
 * Process user input and extract profile information
 */
export async function processProfileGraphChat(
  userMessage: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ProfileGraphChatResponse> {
  console.log("🤖 [Profile Graph AI] Processing message:", userMessage);

  // Build conversation context
  let prompt = userMessage;
  if (conversationHistory && conversationHistory.length > 0) {
    const historyText = conversationHistory
      .slice(-6) // Last 3 exchanges
      .map(msg => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n");
    prompt = `${historyText}\n\nUser: ${userMessage}`;
  }

  try {
    const result = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: PROFILE_GRAPH_SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 2000,
      experimental_providerMetadata: {
        openai: {
          response_format: { type: "json_object" },
        },
      },
    });

    // Clean response - remove markdown code fences if present
    let cleanedText = result.text.trim();
    
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    cleanedText = cleanedText.trim();

    // Parse JSON response
    const parsed: ProfileGraphAIResponse = JSON.parse(cleanedText);

    console.log("✅ [Profile Graph AI] Response type:", parsed.suggestions ? "Conversational" : "Legacy");
    console.log("💡 [Profile Graph AI] Suggestions:", parsed.suggestions?.length || 0);

    // Handle conversational format (new format with bracketed suggestions)
    if (parsed.suggestions && parsed.suggestions.length > 0) {
      return {
        message: parsed.message,
        items: [],
        suggestions: parsed.suggestions.map(suggestion => ({
          text: suggestion.text,
          category: suggestion.category as any,
          subcategory: suggestion.subcategory,
          metadata: suggestion.metadata
        })),
        inlineSuggestions: []
      };
    }

    // Handle mad-lib responses (backward compatibility)
    if (parsed.inlineSuggestions && parsed.inlineSuggestions.length > 0) {
      return {
        message: parsed.message,
        items: [],
        suggestions: [],
        inlineSuggestions: parsed.inlineSuggestions.map(slot => ({
          id: slot.id,
          options: slot.options,
          category: slot.category as any,
          subcategory: slot.subcategory,
          metadata: slot.metadata
        }))
      };
    }

    // Handle legacy format (fallback)
    const items: ProfileGraphItem[] = (parsed.items || []).map((item, index) => ({
      id: `${item.category}-${item.subcategory}-${Date.now()}-${index}`,
      category: item.category as any,
      value: item.value,
      metadata: {
        subcategory: item.subcategory,
        ...item.metadata
      }
    }));

    return {
      message: parsed.message,
      items,
      suggestions: [],
      inlineSuggestions: []
    };
  } catch (error) {
    console.error("❌ [Profile Graph AI] Error:", error);
    
    // Fallback response
    return {
      message: "I'm having trouble processing that right now. Could you try rephrasing?",
      items: [],
      suggestions: [
        "Tell me about your travel preferences",
        "What are your hobbies?",
        "Tell me about your family"
      ]
    };
  }
}

/**
 * Generate new topic prompt - new angle suggestion when user requests it
 */
export async function generateIdlePrompt(
  currentGraphData: GraphData,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ProfileGraphChatResponse> {
  console.log("🤖 [Profile Graph AI] Generating new topic prompt");

  // Analyze what's in the graph
  const existingCategories = new Set(
    currentGraphData.nodes
      .filter(n => n.type === 'category')
      .map(n => n.category)
  );

  // Find missing categories
  const missingCategories = GRAPH_CATEGORIES
    .filter(cat => !existingCategories.has(cat.id))
    .map(cat => cat.id);

  // Pick a random missing category or a random category if all exist
  const targetCategory = missingCategories.length > 0
    ? missingCategories[Math.floor(Math.random() * missingCategories.length)]
    : GRAPH_CATEGORIES[Math.floor(Math.random() * GRAPH_CATEGORIES.length)].id;

  const prompt = `The user clicked "suggest a new topic". Generate a natural conversational prompt to explore a new angle.

Current profile graph categories: ${Array.from(existingCategories).join(", ") || "none yet"}
Target a different topic, focusing on: ${targetCategory}

Start with "Let's try something different" or similar brief transition.
Create a multi-paragraph conversational response with [Bracketed Suggestions] inline.
Provide 5-8 specific suggestions related to the target category.

Return JSON with "message" and "suggestions" array.`;

  try {
    const result = await generateText({
      model: openai("gpt-4o-2024-11-20"),
      system: PROFILE_GRAPH_SYSTEM_PROMPT,
      prompt: prompt,
      temperature: 0.9,
      maxTokens: 1500,
      experimental_providerMetadata: {
        openai: {
          response_format: { type: "json_object" },
        },
      },
    });

    let cleanedText = result.text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    cleanedText = cleanedText.trim();

    const parsed: ProfileGraphAIResponse = JSON.parse(cleanedText);

    return {
      message: parsed.message,
      items: [],
      suggestions: parsed.suggestions?.map(suggestion => ({
        text: suggestion.text,
        category: suggestion.category as any,
        subcategory: suggestion.subcategory,
        metadata: suggestion.metadata
      })) || [],
      inlineSuggestions: []
    };
  } catch (error) {
    console.error("❌ [Profile Graph AI] Error generating new topic prompt:", error);
    
    // Fallback
    return {
      message: "Let's try something different. What kind of travel experience are you looking for?\n\nI can help you explore [Luxury Resorts] for ultimate relaxation, [Adventure Travel] for thrill-seekers, [Budget-Friendly] options to maximize value, or [Cultural Immersion] to connect with local communities. Each style opens up different possibilities for your perfect trip.",
      items: [],
      suggestions: [
        {
          text: "Luxury Resorts",
          category: "travel-style" as any,
          subcategory: "luxury-vs-budget",
          metadata: { context: "high-end accommodations and services" }
        },
        {
          text: "Adventure Travel",
          category: "travel-style" as any,
          subcategory: "adventure-vs-relaxation",
          metadata: { context: "active and exciting experiences" }
        },
        {
          text: "Budget-Friendly",
          category: "travel-style" as any,
          subcategory: "luxury-vs-budget",
          metadata: { context: "maximize value and savings" }
        },
        {
          text: "Cultural Immersion",
          category: "travel-style" as any,
          subcategory: "adventure-vs-relaxation",
          metadata: { context: "authentic local experiences" }
        }
      ],
      inlineSuggestions: []
    };
  }
}

/**
 * Generate new topic suggestion (when user clicks "suggest a new topic")
 */
export async function generateNewTopicSuggestion(
  currentGraphData: GraphData,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ProfileGraphChatResponse> {
  console.log("🤖 [Profile Graph AI] Generating new topic suggestion");

  // Same logic as idle prompt
  return generateIdlePrompt(currentGraphData, conversationHistory);
}
