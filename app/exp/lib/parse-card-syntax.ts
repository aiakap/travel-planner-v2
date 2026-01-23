import { MessageSegment } from "@/lib/types/place-pipeline";

/**
 * Parse card syntax from AI response text and convert to segments
 * 
 * Example:
 * "[TRIP_CARD: abc123, Trip to Paris, 2026-03-15, 2026-03-22, Spring in Paris]"
 * becomes
 * { type: "trip_card", tripId: "abc123", title: "Trip to Paris", ... }
 */
export function parseCardsFromText(text: string): {
  segments: MessageSegment[];
  cleanText: string;
} {
  const segments: MessageSegment[] = [];
  let cleanText = text;
  
  // Parse TRIP_CARD
  const tripCardRegex = /\[TRIP_CARD: ([^,]+), ([^,]+), ([^,]+), ([^,]+)(?:, ([^\]]+))?\]/g;
  let match;
  
  while ((match = tripCardRegex.exec(text)) !== null) {
    segments.push({
      type: "trip_card",
      tripId: match[1].trim(),
      title: match[2].trim(),
      startDate: match[3].trim(),
      endDate: match[4].trim(),
      description: match[5]?.trim(),
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Parse SEGMENT_CARD
  const segmentCardRegex = /\[SEGMENT_CARD: ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+)(?:, ([^,]+))?(?:, ([^\]]+))?\]/g;
  
  while ((match = segmentCardRegex.exec(text)) !== null) {
    segments.push({
      type: "segment_card",
      segmentId: match[1].trim(),
      name: match[2].trim(),
      segmentType: match[3].trim(),
      startLocation: match[4].trim(),
      endLocation: match[5].trim(),
      startTime: match[6]?.trim(),
      endTime: match[7]?.trim(),
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Parse RESERVATION_CARD
  const resCardRegex = /\[RESERVATION_CARD: ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+)(?:, ([^,]+))?(?:, ([^,]+))?(?:, ([^,]+))?(?:, ([^\]]+))?\]/g;
  
  while ((match = resCardRegex.exec(text)) !== null) {
    segments.push({
      type: "reservation_card",
      reservationId: match[1].trim(),
      name: match[2].trim(),
      category: match[3].trim(),
      reservationType: match[4].trim(),
      status: match[5].trim(),
      cost: match[6] ? parseFloat(match[6].trim()) : undefined,
      currency: match[7]?.trim(),
      location: match[8]?.trim(),
      startTime: match[9]?.trim(),
    } as any); // Type assertion needed due to type field conflict
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Clean up extra whitespace
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();
  
  return { segments, cleanText };
}
