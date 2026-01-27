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
  
  // Parse DINING_SCHEDULE_CARD
  const diningScheduleRegex = /\[DINING_SCHEDULE_CARD: ([^,]+)(?:, ([^\]]+))?\]/g;
  
  while ((match = diningScheduleRegex.exec(text)) !== null) {
    segments.push({
      type: "dining_schedule_card",
      tripId: match[1].trim(),
      segmentId: match[2]?.trim(),
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Parse ACTIVITY_TABLE_CARD
  const activityTableRegex = /\[ACTIVITY_TABLE_CARD: ([^,]+)(?:, ([^,]+))?(?:, ([^\]]+))?\]/g;
  
  while ((match = activityTableRegex.exec(text)) !== null) {
    segments.push({
      type: "activity_table_card",
      location: match[1].trim(),
      segmentId: match[2]?.trim(),
      categories: match[3]?.trim(),
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Parse FLIGHT_COMPARISON_CARD
  const flightComparisonRegex = /\[FLIGHT_COMPARISON_CARD: ([^,]+), ([^,]+), ([^,]+)(?:, ([^,]+))?(?:, ([^\]]+))?\]/g;
  
  while ((match = flightComparisonRegex.exec(text)) !== null) {
    segments.push({
      type: "flight_comparison_card",
      origin: match[1].trim(),
      destination: match[2].trim(),
      departDate: match[3].trim(),
      returnDate: match[4]?.trim(),
      passengers: match[5] ? parseInt(match[5].trim()) : undefined,
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Parse BUDGET_BREAKDOWN_CARD
  const budgetBreakdownRegex = /\[BUDGET_BREAKDOWN_CARD: ([^\]]+)\]/g;
  
  while ((match = budgetBreakdownRegex.exec(text)) !== null) {
    segments.push({
      type: "budget_breakdown_card",
      tripId: match[1].trim(),
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Parse DAY_PLAN_CARD
  const dayPlanRegex = /\[DAY_PLAN_CARD: ([^,]+), ([^,]+)(?:, ([^\]]+))?\]/g;
  
  while ((match = dayPlanRegex.exec(text)) !== null) {
    segments.push({
      type: "day_plan_card",
      tripId: match[1].trim(),
      date: match[2].trim(),
      segmentId: match[3]?.trim(),
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Parse PLACES_MAP_CARD
  const placesMapRegex = /\[PLACES_MAP_CARD: ([^,]+), ([^,]+), ([^,]+)(?:, ([^,]+))?(?:, ([^\]]+))?\]/g;
  
  while ((match = placesMapRegex.exec(text)) !== null) {
    segments.push({
      type: "places_map_card",
      centerLat: parseFloat(match[1].trim()),
      centerLng: parseFloat(match[2].trim()),
      centerName: match[3].trim(),
      placeType: match[4]?.trim(),
      radius: match[5] ? parseInt(match[5].trim()) : 1000,
    });
    cleanText = cleanText.replace(match[0], '');
  }
  
  // Clean up extra whitespace
  cleanText = cleanText.replace(/\n{3,}/g, '\n\n').trim();
  
  return { segments, cleanText };
}
