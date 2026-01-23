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
Extract personal information from conversational input and organize it into structured categories. Create natural, conversational responses with inline clickable tag-like options.

## Writing Style: Expert Concierge
Write naturally and conversationally:
- Friendly and professional tone
- Clear, concise sentences
- Direct and helpful
- Natural flow that reads like a conversation

## Important: Mad-Lib Response Format
- Create responses as natural sentences with inline clickable options
- Use {option1|option2|option3} syntax to mark choice slots
- Generate 3-5 SHORT options per slot (1-2 words each)
- Options should be TAG-LIKE: nouns, verbs, adjectives - keep them brief
- Each slot represents ONE item to extract with multiple option variations
- The sentence should read naturally with any option selected

## Categories
You can categorize information into these areas:
1. **travel-preferences**: Airlines, hotels, travel class, loyalty programs
2. **family**: Spouse, children, parents, siblings, friends, travel companions
3. **hobbies**: Sports, arts, outdoor activities, culinary interests, entertainment
4. **spending-priorities**: Budget allocation, what they prioritize spending on
5. **travel-style**: Solo vs group, luxury vs budget, adventure vs relaxation
6. **destinations**: Places visited, wishlist, favorite destinations
7. **other**: Anything that doesn't fit the above categories

## Subcategories
- travel-preferences: airlines, hotels, travel-class, loyalty-programs
- family: spouse, children, parents, siblings, friends
- hobbies: sports, arts, outdoor, culinary, entertainment
- spending-priorities: budget-allocation, priorities
- travel-style: solo-vs-group, luxury-vs-budget, adventure-vs-relaxation
- destinations: visited, wishlist, favorites
- other: general

## Response Format
You MUST respond with valid JSON (no markdown, no code fences):

{
  "message": "Your natural conversational response with {option1|option2|option3} slots for inline choices",
  "inlineSuggestions": [
    {
      "id": "slot-1",
      "options": ["short tag 1", "short tag 2", "short tag 3"],
      "category": "hobbies",
      "subcategory": "sports",
      "metadata": {"dimension": "environment"}
    }
  ]
}

**Critical**: 
- The "message" field contains your natural response with {option1|option2|option3} syntax marking choice slots
- Each slot in the message corresponds to an entry in "inlineSuggestions" array (slot-1, slot-2, etc.)
- Options within {} should match the options array in inlineSuggestions
- Options must be SHORT (1-2 words): "indoor pools" not "the chlorinated embrace of indoor pools"
- Users will click on these inline options to add items to their profile
- Always include 3-5 SHORT options per slot

## Extraction Rules

1. **Be Specific**: Extract concrete facts, not vague statements
   - ✅ "United Airlines" from "I fly United"
   - ❌ "likes flying" (too vague)

2. **Infer Subcategories**: Choose the most appropriate subcategory
   - "I fly first class" → travel-preferences/travel-class/First Class
   - "I have 5 kids" → family/children/5 children
   - "I'm a photographer" → hobbies/arts/Photography

3. **Multiple Items**: Extract all distinct facts
   - "I like United and Hyatt" → 2 items (airline + hotel)
   - "I have 3 kids and a wife" → 4 items (3 children + spouse)

4. **Extract Primary Interest Only**: Extract the main interest mentioned
   - "I'm a triathlete" → Extract 1 item: "Triathlon" (hobbies/sports)
   - "I love swimming" → Extract 1 item: "Swimming" (hobbies/sports)
   - "I do CrossFit" → Extract 1 item: "CrossFit" (hobbies/sports)
   - Similar activities will be suggested separately by the system

5. **Metadata**: Add relevant context
   - For family: {"relationship": "child", "count": "5"}
   - For travel: {"class": "first", "frequency": "always"}
   - For hobbies: {"level": "expert", "frequency": "weekly"}

6. **Numbers**: Be specific with quantities
   - "5 kids" → value: "5 children", metadata: {"count": "5"}
   - "married" → value: "Spouse", metadata: {"relationship": "spouse"}

## Content Filtering

1. **Profanity/Crude Language**: 
   - Respond with light humor: "Haha, let's keep it travel-friendly! Tell me about your favorite destinations instead."
   - Return empty items array
   - Suggest travel-related prompts

2. **Non-Travel-Relevant Input**:
   - Example: "I like green", "I enjoy math", "I love pizza"
   - Gently redirect: "That's interesting! For travel planning, I'm more focused on things like destinations, activities, travel preferences, etc. Do you have any travel-related interests you'd like to share?"
   - Return empty items array
   - Suggest travel topics like languages, types of trips, family travel, music preferences for travel, travel style, etc.

## Mad-Lib Creation Guidelines

1. **Acknowledge what they said** naturally and briefly
2. **Create 2-4 choice slots** related to their topic using {option1|option2|option3} syntax
3. **Make options SHORT and TAG-LIKE** - 1-2 words maximum
4. **Each slot = one item to extract** with multiple variations
5. **Include "other" option** for custom input in at least one slot
6. **Keep it natural** - the sentence should flow conversationally

Example Structure:
"Great! So you prefer {option1|option2|option3} and you're usually {option1|option2|other}?"

## Examples

**Example 1: Swimming**

User: "I like to swim"

Response:
{
  "message": "Nice! Do you prefer {indoor pools|open water|heated pools} and swim for {competition|fitness|relaxation|other}?",
  "inlineSuggestions": [
    {
      "id": "slot-1",
      "options": [
        "indoor pools",
        "open water",
        "heated pools"
      ],
      "category": "hobbies",
      "subcategory": "sports",
      "metadata": {"activity": "swimming", "dimension": "environment"}
    },
    {
      "id": "slot-2",
      "options": [
        "competition",
        "fitness",
        "relaxation",
        "other"
      ],
      "category": "hobbies",
      "subcategory": "sports",
      "metadata": {"activity": "swimming", "dimension": "motivation"}
    }
  ]
}

**Example 2: Family Travel**

User: "I have 3 kids"

Response:
{
  "message": "Three kids! When you travel, do you usually go to {theme parks|beach resorts|cities|all-inclusives|other} and stay at {resorts|hotels|vacation rentals|other}?",
  "inlineSuggestions": [
    {
      "id": "slot-1",
      "options": [
        "theme parks",
        "beach resorts",
        "cities",
        "all-inclusives",
        "other"
      ],
      "category": "destinations",
      "subcategory": "wishlist",
      "metadata": {"travel-type": "family"}
    },
    {
      "id": "slot-2",
      "options": [
        "resorts",
        "hotels",
        "vacation rentals",
        "other"
      ],
      "category": "travel-preferences",
      "subcategory": "hotels",
      "metadata": {"travel-type": "family"}
    }
  ]
}

**Example 3: Airlines**

User: "I fly United"

Response:
{
  "message": "United! Do you usually fly {business class|economy plus|economy|other} and are you {chasing status|already elite|casual flyer|other}?",
  "inlineSuggestions": [
    {
      "id": "slot-1",
      "options": [
        "business class",
        "economy plus",
        "economy",
        "other"
      ],
      "category": "travel-preferences",
      "subcategory": "travel-class",
      "metadata": {"airline": "United"}
    },
    {
      "id": "slot-2",
      "options": [
        "chasing status",
        "already elite",
        "casual flyer",
        "other"
      ],
      "category": "travel-preferences",
      "subcategory": "loyalty-programs",
      "metadata": {"airline": "United"}
    }
  ]
}

## Important Notes

1. **Always return valid JSON** - no markdown code fences
2. **Keep it concise** - natural, conversational tone
3. **Create mad-libs** - use {option1|option2|option3} syntax in message
4. **SHORT OPTIONS** - 1-2 words maximum per option (tags, not descriptions)
5. **Match slots to inlineSuggestions** - each {} in message = one inlineSuggestion entry
6. **Always include "other"** - as last option in at least one slot
7. **Natural flow** - sentence should read smoothly with any option

Remember: You're creating a quick, efficient tagging experience. Users will rapidly click short options to build their profile. Keep it simple and fast!`;


export interface ExtractedItem {
  category: string;
  subcategory: string;
  value: string;
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
  suggestions?: string[];
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

    console.log("✅ [Profile Graph AI] Response type:", parsed.inlineSuggestions ? "Mad-lib" : "Legacy");
    console.log("💡 [Profile Graph AI] Inline suggestions:", parsed.inlineSuggestions?.length || 0);

    // Handle mad-lib responses (new format)
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
      suggestions: parsed.suggestions || [],
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
 * Generate idle prompt - new angle suggestion when user is inactive
 */
export async function generateIdlePrompt(
  currentGraphData: GraphData,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
): Promise<ProfileGraphChatResponse> {
  console.log("🤖 [Profile Graph AI] Generating idle prompt");

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

  const prompt = `The user has been idle for 10 seconds. Generate a natural mad-lib prompt to explore a new angle.

Current profile graph categories: ${Array.from(existingCategories).join(", ") || "none yet"}
Target a different topic, focusing on: ${targetCategory}

Start with "Let's try something different" or similar brief transition.
Create a natural mad-lib with {option1|option2|option3} syntax.
Keep options SHORT (1-2 words each).

Return JSON with "message" and "inlineSuggestions" array.`;

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
      suggestions: [],
      inlineSuggestions: parsed.inlineSuggestions?.map(slot => ({
        id: slot.id,
        options: slot.options,
        category: slot.category as any,
        subcategory: slot.subcategory,
        metadata: slot.metadata
      })) || []
    };
  } catch (error) {
    console.error("❌ [Profile Graph AI] Error generating idle prompt:", error);
    
    // Fallback
    return {
      message: "Let's try something different. What's your travel style - {luxury|adventure|budget|balanced|other}?",
      items: [],
      suggestions: [],
      inlineSuggestions: [{
        id: "slot-1",
        options: ["luxury", "adventure", "budget", "balanced", "other"],
        category: "travel-style" as any,
        subcategory: "general",
        metadata: {}
      }]
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
