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
  
  // Parse HOTEL_RESERVATION_CARD
  // Format: [HOTEL_RESERVATION_CARD: hotelName, confirmationNumber, checkInDate, checkInTime, checkOutDate, checkOutTime, nights, guests, rooms, roomType, address, totalCost, currency, contactPhone, cancellationPolicy]
  const hotelCardRegex = /\[HOTEL_RESERVATION_CARD: ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^,]+), ([^\]]+)\]/g;
  
  while ((match = hotelCardRegex.exec(text)) !== null) {
    segments.push({
      type: "hotel_reservation_card",
      hotelName: match[1].trim(),
      confirmationNumber: match[2].trim() || undefined,
      checkInDate: match[3].trim(),
      checkInTime: match[4].trim() || undefined,
      checkOutDate: match[5].trim(),
      checkOutTime: match[6].trim() || undefined,
      nights: match[7] ? parseInt(match[7].trim()) : undefined,
      guests: match[8] ? parseInt(match[8].trim()) : undefined,
      rooms: match[9] ? parseInt(match[9].trim()) : undefined,
      roomType: match[10].trim() || undefined,
      address: match[11].trim() || undefined,
      totalCost: match[12] ? parseFloat(match[12].trim()) : undefined,
      currency: match[13].trim() || undefined,
      contactPhone: match[14].trim() || undefined,
      cancellationPolicy: match[15].trim() || undefined,
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Clean up extra whitespace
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();
  
  return { segments, cleanText };
}
