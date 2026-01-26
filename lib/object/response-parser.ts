/**
 * Response parser for object chat system
 * Parses AI responses and extracts cards
 */

export interface ParsedResponse {
  text: string;
  cards: Array<{
    id: string;
    type: string;
    data: any;
  }>;
}

/**
 * Parse AI response and extract cards
 */
export function parseAIResponse(response: string): ParsedResponse {
  const cards: Array<{ id: string; type: string; data: any }> = [];
  let text = response;

  // Extract hotel cards
  const hotelRegex = /\[HOTEL_CARD:\s*(\{[\s\S]*?\})\]/g;
  let match;
  while ((match = hotelRegex.exec(response)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      cards.push({
        id: `hotel-${Date.now()}-${Math.random()}`,
        type: "hotel",
        data,
      });
      // Remove card syntax from text
      text = text.replace(match[0], "");
    } catch (e) {
      console.error("Failed to parse hotel card:", e);
    }
  }

  // Extract profile suggestion cards
  const suggestionRegex = /\[PROFILE_SUGGESTION:\s*(\{[\s\S]*?\})\]/g;
  while ((match = suggestionRegex.exec(response)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      cards.push({
        id: `suggestion-${Date.now()}-${Math.random()}`,
        type: "suggestion",
        data,
      });
      text = text.replace(match[0], "");
    } catch (e) {
      console.error("Failed to parse suggestion card:", e);
    }
  }

  // Extract trip structure cards
  const tripStructureRegex = /\[TRIP_STRUCTURE:\s*(\{[\s\S]*?\})\]/g;
  while ((match = tripStructureRegex.exec(response)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      cards.push({
        id: `trip-structure-${Date.now()}-${Math.random()}`,
        type: "trip_structure",
        data,
      });
      text = text.replace(match[0], "");
    } catch (e) {
      console.error("Failed to parse trip structure card:", e);
    }
  }

  // Extract auto-add cards
  const autoAddRegex = /\[AUTO_ADD:\s*(\{[\s\S]*?\})\]/g;
  while ((match = autoAddRegex.exec(response)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      console.log('🔍 [RESPONSE PARSER] Parsed AUTO_ADD card:', data);
      cards.push({
        id: `auto-add-${Date.now()}-${Math.random()}`,
        type: "auto_add",
        data,
      });
      text = text.replace(match[0], "");
    } catch (e) {
      console.error("❌ [RESPONSE PARSER] Failed to parse auto-add card:", e);
    }
  }

  // Extract related suggestions cards
  const relatedSuggestionsRegex = /\[RELATED_SUGGESTIONS:\s*(\{[\s\S]*?\})\]/g;
  while ((match = relatedSuggestionsRegex.exec(response)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      console.log('🔍 [RESPONSE PARSER] Parsed RELATED_SUGGESTIONS card:', data);
      cards.push({
        id: `related-suggestions-${Date.now()}-${Math.random()}`,
        type: "related_suggestions",
        data,
      });
      text = text.replace(match[0], "");
    } catch (e) {
      console.error("❌ [RESPONSE PARSER] Failed to parse related suggestions card:", e);
    }
  }

  // Extract topic choice cards
  const topicChoiceRegex = /\[TOPIC_CHOICE:\s*(\{[\s\S]*?\})\]/g;
  while ((match = topicChoiceRegex.exec(response)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      console.log('🔍 [RESPONSE PARSER] Parsed TOPIC_CHOICE card:', data);
      cards.push({
        id: `topic-choice-${Date.now()}-${Math.random()}`,
        type: "topic_choice",
        data,
      });
      text = text.replace(match[0], "");
    } catch (e) {
      console.error("❌ [RESPONSE PARSER] Failed to parse topic choice card:", e);
    }
  }

  // Clean up text
  text = text.trim();

  return { text, cards };
}
