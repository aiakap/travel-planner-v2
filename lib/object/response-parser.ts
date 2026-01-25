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

  // Clean up text
  text = text.trim();

  return { text, cards };
}
