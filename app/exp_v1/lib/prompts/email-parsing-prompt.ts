/**
 * Email Parsing Prompt - Conditional
 * 
 * Extracts reservation data from confirmation emails.
 * Included when user message looks like a pasted confirmation email.
 */

export const EMAIL_PARSING_PROMPT = `## Hotel Confirmation Email Detection

When a user pastes a hotel confirmation email or provides detailed hotel reservation information, you should:

1. **Detect the hotel reservation** - Look for confirmation numbers, check-in/check-out dates, hotel names, booking references
2. **Extract all available fields**:
   - Hotel name (vendor/property name)
   - Confirmation number or itinerary number
   - Check-in date and time (e.g., "Jan 30" and "3:00pm")
   - Check-out date and time (e.g., "Feb 6" and "12:00pm")
   - Number of nights (calculate from dates if not provided)
   - Number of guests/adults
   - Number of rooms
   - Room type (e.g., "Suite, 1 Bedroom, Non Smoking")
   - Full address
   - Total cost (including all fees and taxes)
   - Currency (USD, EUR, JPY, etc.)
   - Contact phone number
   - Cancellation policy
3. **Output a HOTEL_RESERVATION_CARD** with all extracted information
4. **Provide a confirmation message** like: "I've captured your hotel reservation for [Hotel Name]. The reservation has been saved and you can edit any details by clicking on the fields."

**Example Hotel Email Formats to Recognize:**
- Hotels.com confirmations (with itinerary numbers)
- Booking.com confirmations
- Expedia confirmations
- Direct hotel booking confirmations
- Airbnb confirmations

**Field Extraction Tips:**
- Dates: Convert relative dates like "Fri, Jan 30" to "2026-01-30" format
- Times: Use 12-hour format with AM/PM (e.g., "3:00 PM")
- Nights: Calculate from check-in to check-out dates
- Cost: Use the final total including all taxes and fees
- Address: Extract full address including city, state/province, postal code, country
- Cancellation policy: Summarize key points (refundable/non-refundable, deadlines)

**CRITICAL**: When you detect a hotel confirmation, you MUST:
1. Output valid JSON with all 4 fields (text, places, transport, hotels)
2. Include the HOTEL_RESERVATION_CARD syntax INSIDE the "text" field
3. Use the exact format shown in the example above
4. Include ALL 15 fields in the card syntax (use "N/A" for missing fields)

### Example: Hotel Email Response

{
  "text": "I've captured your hotel reservation for Sansui Niseko.\\n\\n[HOTEL_RESERVATION_CARD: Sansui Niseko, 73351146941654, 2026-01-30, 3:00 PM, 2026-02-06, 12:00 PM, 7, 2, 1, Suite 1 Bedroom Non Smoking, 5 32 1 Jo 4 Chome Niseko Hirafu Kutchan Cho Kutchan 01 0440080 Japan, 8688.33, USD, 818113655622, Non-refundable]\\n\\nThe reservation has been saved and you can edit any details by clicking on the fields.",
  "places": [],
  "transport": [],
  "hotels": []
}`;
