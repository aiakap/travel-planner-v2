/**
 * Generate Similar Tags AI Logic
 * 
 * AI-powered generation of similar interests/tags based on user preferences
 * with multi-dimensional exploration (direct, related, destination, culture, tangential)
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { PendingSuggestion, GraphCategory } from "@/lib/types/profile-graph";

export type SuggestionDimension = 'direct' | 'related' | 'destination' | 'culture' | 'tangential';

export interface EnhancedSuggestion extends PendingSuggestion {
  dimension: SuggestionDimension;
}

/**
 * Generate similar tags based on an accepted or rejected tag
 * Returns enhanced suggestions with dimension metadata
 */
export async function generateSimilarTags(
  referenceTag: string,
  category: GraphCategory,
  subcategory: string,
  existingTags: string[],
  count: number = 1,
  wasAccepted: boolean = true
): Promise<EnhancedSuggestion[]> {
  console.log(`🤖 [Similar Tags AI] Generating ${count} similar tags for "${referenceTag}" (${wasAccepted ? 'accepted' : 'rejected'})`);

  const action = wasAccepted ? "likes" : "is not interested in";
  const instruction = wasAccepted 
    ? "Suggest related interests they would likely enjoy across MULTIPLE DIMENSIONS"
    : "Suggest alternative interests exploring different angles they might prefer";

  const systemPrompt = `You are an AI assistant helping users build their travel profile by suggesting related interests across MULTIPLE DIMENSIONS.

## Your Task
The user ${action} "${referenceTag}" in the ${category}/${subcategory} category.
${instruction} for travel planning purposes.

## Existing Tags
The user already has these tags in their profile: ${existingTags.length > 0 ? existingTags.join(", ") : "none yet"}

## Suggestion Strategy - Explore DIFFERENT DIMENSIONS
Generate ${count} suggestion${count > 1 ? 's' : ''} that explore different aspects:

1. **direct** (20%): Activities/items very similar to the reference (same type)
2. **related** (20%): Activities in the same environment/context but different type
3. **destination** (20%): Places, locations, or regions associated with this interest
4. **culture** (20%): Cultural elements, music, food, art, or lifestyle related to it
5. **tangential** (20%): Broader connections, complementary interests, or unexpected links

## Examples

**Reference: "Surfing"**
- direct: Bodyboarding, Kitesurfing, Stand-up paddleboarding
- related: Snorkeling, Beach volleyball, Swimming
- destination: Hawaii, Bali, Costa Rica, Gold Coast Australia
- culture: Hawaiian music, Surf photography, Beach culture, Reggae
- tangential: Ocean conservation, Sunset watching, Tropical cocktails, Yoga

**Reference: "Photography"**
- direct: Landscape photography, Portrait photography, Street photography
- related: Hiking, Sunrise chasing, Wildlife watching
- destination: National parks, Iceland, Patagonia, New Zealand
- culture: Art galleries, Photo exhibitions, Visual storytelling, Film
- tangential: Journaling, Sketching, Drone flying, Architecture

**Reference: "Italian food"**
- direct: Pasta making, Pizza, Gelato, Risotto
- related: Wine tasting, Cooking classes, Food markets
- destination: Tuscany, Rome, Sicily, Bologna
- culture: Italian language, Opera, Renaissance art
- tangential: Mediterranean diet, Olive oil, Farm-to-table dining

**Reference: "Hiking"**
- direct: Backpacking, Trail running, Mountain climbing
- related: Camping, Nature photography, Bird watching
- destination: Patagonia, Swiss Alps, Appalachian Trail, Nepal
- culture: Outdoor gear, Trail culture, Conservation
- tangential: Meditation, Minimalism, Fitness training

## Category Mapping
When suggesting across dimensions, use appropriate categories:
- Activities (direct/related) → hobbies/sports, hobbies/arts, hobbies/outdoor, hobbies/culinary
- Destinations → destinations/wishlist, destinations/favorites, destinations/visited
- Culture → hobbies/entertainment, hobbies/culinary, hobbies/arts, other/general
- Travel Style → travel-style/solo-vs-group, travel-style/luxury-vs-budget, travel-style/adventure-vs-relaxation
- Tangential → Any relevant category based on the connection

## Rules
1. Suggest ${count} specific, concrete interest${count > 1 ? 's' : ''}
2. Make suggestions relevant to travel planning
3. Don't repeat existing tags: ${existingTags.join(", ") || "none"}
4. Don't repeat the reference tag: "${referenceTag}"
5. **VARY the dimensions** - don't make all suggestions the same type
6. **VARY the categories** - explore different categories when appropriate
7. Make suggestions evocative and inspiring for travel

## Response Format
Return ONLY valid JSON (no markdown, no code fences):

{
  "suggestions": [
    {
      "value": "Specific interest name",
      "dimension": "direct|related|destination|culture|tangential",
      "category": "hobbies|destinations|travel-style|spending-priorities|family|other",
      "subcategory": "appropriate subcategory",
      "reasoning": "Brief explanation of the connection"
    }
  ]
}

Example for "Surfing" (accepted, count=5):
{
  "suggestions": [
    {"value": "Bodyboarding", "dimension": "direct", "category": "hobbies", "subcategory": "sports", "reasoning": "Similar water sport"},
    {"value": "Hawaii", "dimension": "destination", "category": "destinations", "subcategory": "wishlist", "reasoning": "World-famous surf destination"},
    {"value": "Beach resorts", "dimension": "related", "category": "travel-style", "subcategory": "luxury-vs-budget", "reasoning": "Preferred accommodation near surf spots"},
    {"value": "Hawaiian music", "dimension": "culture", "category": "hobbies", "subcategory": "entertainment", "reasoning": "Cultural connection to surf lifestyle"},
    {"value": "Ocean conservation", "dimension": "tangential", "category": "hobbies", "subcategory": "outdoor", "reasoning": "Environmental interest linked to ocean activities"}
  ]
}`;

  try {
    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      prompt: `Generate exactly ${count} diverse suggestion${count > 1 ? 's' : ''} for "${referenceTag}" across different dimensions (direct, related, destination, culture, tangential).`,
      temperature: 0.8,
      maxTokens: 1000,
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
    const parsed = JSON.parse(cleanedText);

    console.log(`📊 [Similar Tags AI] Raw parsed response:`, JSON.stringify(parsed, null, 2));

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
      console.error(`❌ [Similar Tags AI] Invalid response format:`, parsed);
      throw new Error("Invalid response format");
    }

    console.log(`📊 [Similar Tags AI] Parsed ${parsed.suggestions.length} suggestions from AI`);

    // Convert to EnhancedSuggestion format
    const suggestions: EnhancedSuggestion[] = parsed.suggestions
      .slice(0, count)
      .map((item: any, index: number) => ({
        id: `similar-${Date.now()}-${index}`,
        category: (item.category || category) as GraphCategory,
        subcategory: item.subcategory || subcategory,
        value: item.value,
        dimension: item.dimension || 'direct',
        metadata: {
          reasoning: item.reasoning,
          generatedFrom: referenceTag,
          dimension: item.dimension
        }
      }));

    console.log(`✅ [Similar Tags AI] Generated ${suggestions.length} suggestions:`, 
      suggestions.map(s => `${s.value} (${s.dimension})`).join(", "));

    return suggestions;
  } catch (error) {
    console.error("❌ [Similar Tags AI] Error:", error);
    return [];
  }
}

/**
 * Generate initial similar tags when user first mentions an interest
 * Generates 5 diverse suggestions per item across multiple dimensions
 */
export async function generateInitialSimilarTags(
  extractedItems: Array<{ category: GraphCategory; subcategory: string; value: string }>,
  existingTags: string[],
  countPerItem: number = 5
): Promise<EnhancedSuggestion[]> {
  console.log(`🤖 [Similar Tags AI] Generating initial similar tags for ${extractedItems.length} items, ${countPerItem} per item`);

  const allSuggestions: EnhancedSuggestion[] = [];

  // Generate similar tags for each extracted item
  for (const item of extractedItems) {
    try {
      console.log(`🤖 [Similar Tags AI] Generating ${countPerItem} suggestions for "${item.value}"`);
      
      const suggestions = await generateSimilarTags(
        item.value,
        item.category,
        item.subcategory,
        existingTags,
        countPerItem,
        true
      );
      
      console.log(`✅ [Similar Tags AI] Got ${suggestions.length} suggestions for "${item.value}"`);
      
      allSuggestions.push(...suggestions);
    } catch (error) {
      console.error(`❌ [Similar Tags AI] Error generating similar tags for ${item.value}:`, error);
    }
  }

  console.log(`✅ [Similar Tags AI] Total suggestions generated: ${allSuggestions.length}`);

  return allSuggestions;
}

/**
 * Ensure diversity in suggestions by checking dimension distribution
 */
export function ensureDimensionDiversity(
  suggestions: EnhancedSuggestion[],
  targetCount: number = 5
): EnhancedSuggestion[] {
  if (suggestions.length <= targetCount) {
    return suggestions;
  }

  // Count dimensions
  const dimensionCounts: Record<SuggestionDimension, number> = {
    direct: 0,
    related: 0,
    destination: 0,
    culture: 0,
    tangential: 0
  };

  const selected: EnhancedSuggestion[] = [];
  const remaining = [...suggestions];

  // First pass: select one from each dimension if available
  const dimensions: SuggestionDimension[] = ['direct', 'related', 'destination', 'culture', 'tangential'];
  
  for (const dimension of dimensions) {
    const index = remaining.findIndex(s => s.dimension === dimension);
    if (index !== -1 && selected.length < targetCount) {
      selected.push(remaining[index]);
      remaining.splice(index, 1);
      dimensionCounts[dimension]++;
    }
  }

  // Second pass: fill remaining slots with most interesting suggestions
  while (selected.length < targetCount && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }

  return selected;
}
