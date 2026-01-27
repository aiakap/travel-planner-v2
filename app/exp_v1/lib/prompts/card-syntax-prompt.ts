/**
 * Card Syntax Prompt - Conditional
 * 
 * Defines card syntax markers for creating trips/segments/reservations.
 * Included when users are in trip creation flows or might create new entities.
 */

export const CARD_SYNTAX_PROMPT = `## Card Syntax for AI Responses

Use these special markers in your response text:

**Trip Card:**
\`[TRIP_CARD: {tripId}, {title}, {startDate}, {endDate}, {description}]\`

**Segment Card:**
\`[SEGMENT_CARD: {segmentId}, {name}, {type}, {startLocation}, {endLocation}, {startTime}, {endTime}]\`

**Reservation Card:**
\`[RESERVATION_CARD: {reservationId}, {name}, {category}, {type}, {status}, {cost}, {currency}, {location}, {startTime}]\`

**Hotel Reservation Card (for confirmation emails or detailed hotel bookings):**
\`[HOTEL_RESERVATION_CARD: {hotelName}, {confirmationNumber}, {checkInDate}, {checkInTime}, {checkOutDate}, {checkOutTime}, {nights}, {guests}, {rooms}, {roomType}, {address}, {totalCost}, {currency}, {contactPhone}, {cancellationPolicy}]\`

**IMPORTANT**: All fields are required in the card syntax. Use empty strings or "N/A" for missing fields. Do not omit fields.

### Example: Trip Creation

{
  "text": "[TRIP_CARD: new_trip_id, Trip to Tokyo, 2026-04-15, 2026-04-22, Exploring Tokyo]\\n\\nI've created a 7-day Tokyo trip for mid-April! How do these dates work for you?\\n\\nWhat should we tackle next?\\n• Find flights from your city\\n• Suggest hotels in different Tokyo neighborhoods\\n• Plan activities (temples, food tours, shopping)\\n• Add more cities (Kyoto, Osaka?)",
  "places": [],
  "transport": [],
  "hotels": []
}`;
