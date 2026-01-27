import { PlaceSuggestion, GooglePlaceData, PlaceDataMap, MessageSegment, Stage3Output } from "@/lib/types/place-pipeline";

/**
 * Flexible place name matching with fallbacks
 * Handles variations in prefixes, capitalization, and common patterns
 */
function findPlaceInText(text: string, placeName: string, startFrom: number): number {
  // Try exact match first
  let index = text.indexOf(placeName, startFrom);
  if (index !== -1) return index;
  
  // Try with "the " prefix (e.g., "the Grand Hotel" when placeName is "Grand Hotel")
  index = text.indexOf(`the ${placeName}`, startFrom);
  if (index !== -1) return index + 4; // Return position of actual name (skip "the ")
  
  // Try with "The " prefix
  index = text.indexOf(`The ${placeName}`, startFrom);
  if (index !== -1) return index + 4; // Return position of actual name (skip "The ")
  
  // Try case-insensitive search
  const lowerText = text.toLowerCase();
  const lowerPlace = placeName.toLowerCase();
  index = lowerText.indexOf(lowerPlace, startFrom);
  if (index !== -1) return index;
  
  // Try matching without common prefixes like "Hotel", "The", etc.
  const placeWithoutPrefix = placeName.replace(/^(Hotel|The|Le|La|L'|Restaurant)\s+/i, '');
  if (placeWithoutPrefix !== placeName) {
    index = lowerText.indexOf(placeWithoutPrefix.toLowerCase(), startFrom);
    if (index !== -1) {
      // Find the actual start in the original text (accounting for case)
      const actualText = text.substring(index);
      const match = actualText.match(new RegExp(`\\b${placeWithoutPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i'));
      if (match && match.index !== undefined) {
        return index + match.index;
      }
    }
  }
  
  return -1; // Not found
}

/**
 * Stage 3: HTML Assembly
 * 
 * Takes the AI-generated text, place suggestions, and Google Places data,
 * and assembles a structured message with clickable place links.
 * 
 * Uses flexible string matching to handle variations in place names.
 */
export function assemblePlaceLinks(
  text: string,
  suggestions: PlaceSuggestion[],
  placeMap: PlaceDataMap
): Stage3Output {
  console.log(`🔨 [Stage 3] Assembling place links from text (${text.length} chars)`);
  console.log(`   Looking for ${suggestions.length} place names`);

  const segments: MessageSegment[] = [];

  // Sort suggestions by their first appearance in the text
  const sortedSuggestions = [...suggestions].sort((a, b) => {
    const indexA = text.indexOf(a.suggestedName);
    const indexB = text.indexOf(b.suggestedName);
    return indexA - indexB;
  });

  let lastIndex = 0;

  for (const suggestion of sortedSuggestions) {
    console.log(`\n   🔍 Searching for: "${suggestion.suggestedName}"`);
    console.log(`      Starting from position: ${lastIndex}`);
    
    const placeIndex = findPlaceInText(text, suggestion.suggestedName, lastIndex);
    
    console.log(`      Result: ${placeIndex === -1 ? '❌ NOT FOUND' : `✅ FOUND at ${placeIndex}`}`);

    if (placeIndex === -1) {
      // Show surrounding text for debugging
      const contextStart = Math.max(0, lastIndex - 100);
      const contextEnd = Math.min(text.length, lastIndex + 200);
      console.warn(`      ⚠️  Place "${suggestion.suggestedName}" not found in text`);
      console.warn(`      Text context (pos ${contextStart}-${contextEnd}):`);
      console.warn(`      "${text.substring(contextStart, contextEnd)}"`);
      console.warn(`      Tried matching strategies:`);
      console.warn(`        - Exact: "${suggestion.suggestedName}"`);
      console.warn(`        - With 'the': "the ${suggestion.suggestedName}"`);
      console.warn(`        - Case-insensitive: "${suggestion.suggestedName.toLowerCase()}"`);
      continue;
    }
    
    // Log what we actually matched
    const matchedText = text.substring(placeIndex, placeIndex + suggestion.suggestedName.length);
    console.log(`      Matched text: "${matchedText}"`);

    // Add text segment before the place name
    if (placeIndex > lastIndex) {
      const textContent = text.substring(lastIndex, placeIndex);
      segments.push({
        type: "text",
        content: textContent,
      });
    }

    // Add place segment
    const placeData = placeMap[suggestion.suggestedName];
    
    // Extract the actual text that was matched (might include "the " prefix or case variations)
    const actualMatchLength = suggestion.suggestedName.length;
    const actualText = text.substring(placeIndex, placeIndex + actualMatchLength);
    
    segments.push({
      type: "place",
      suggestion,
      placeData,
      display: actualText, // Use actual text from message, not suggestedName
    });

    lastIndex = placeIndex + actualMatchLength;
  }

  // Add remaining text after the last place
  if (lastIndex < text.length) {
    const textContent = text.substring(lastIndex);
    segments.push({
      type: "text",
      content: textContent,
    });
  }

  const placeSegmentCount = segments.filter(s => s.type === "place").length;
  console.log(`✅ [Stage 3] Created ${segments.length} segments (${placeSegmentCount} places)`);

  return {
    segments,
  };
}

/**
 * Helper function to render segments as plain text (for debugging)
 */
export function segmentsToText(segments: MessageSegment[]): string {
  return segments
    .map(segment => {
      if (segment.type === "text") {
        return segment.content || "";
      } else {
        return segment.display || "";
      }
    })
    .join("");
}

/**
 * Helper function to extract all place names from segments
 */
export function extractPlaceNames(segments: MessageSegment[]): string[] {
  return segments
    .filter(s => s.type === "place")
    .map(s => s.display || "")
    .filter(Boolean);
}
