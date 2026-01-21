import { PlaceSuggestion, GooglePlaceData, PlaceDataMap, MessageSegment, Stage3Output } from "@/lib/types/place-pipeline";

/**
 * Stage 3: HTML Assembly
 * 
 * Takes the AI-generated text, place suggestions, and Google Places data,
 * and assembles a structured message with clickable place links.
 * 
 * This uses EXACT string matching since the AI was instructed to use
 * identical place names in both the text and the places array.
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
    const placeIndex = text.indexOf(suggestion.suggestedName, lastIndex);

    if (placeIndex === -1) {
      console.warn(`   ⚠️  Place "${suggestion.suggestedName}" not found in text`);
      continue;
    }

    console.log(`   ✅ Found "${suggestion.suggestedName}" at position ${placeIndex}`);

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
    segments.push({
      type: "place",
      suggestion,
      placeData,
      display: suggestion.suggestedName,
    });

    lastIndex = placeIndex + suggestion.suggestedName.length;
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
