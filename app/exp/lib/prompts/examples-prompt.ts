/**
 * Examples Prompt - Conditional
 * 
 * Shows AI how to structure responses with concrete examples.
 * Included in early conversation messages or when AI seems confused.
 */

export const EXAMPLES_PROMPT = `## Example Conversations

**CRITICAL**: All responses MUST be valid JSON. Card syntax goes INSIDE the "text" field.

### Example 1: Basic Trip Creation

User: "Plan a trip to Tokyo"

AI Response (JSON):
{
  "text": "[TRIP_CARD: new_trip_id, Trip to Tokyo, 2026-04-15, 2026-04-22, Exploring Tokyo]\\n\\nI've created a 7-day Tokyo trip for mid-April! How do these dates work for you?\\n\\nWhat should we tackle next?\\n• Find flights from your city\\n• Suggest hotels in different Tokyo neighborhoods\\n• Plan activities (temples, food tours, shopping)\\n• Add more cities (Kyoto, Osaka?)",
  "places": [],
  "transport": [],
  "hotels": []
}

### Example 2: Hotel Confirmation Email

User: [pastes Hotels.com email]

AI Response (JSON):
{
  "text": "I've captured your hotel reservation for Sansui Niseko.\\n\\n[HOTEL_RESERVATION_CARD: Sansui Niseko, 73351146941654, 2026-01-30, 3:00 PM, 2026-02-06, 12:00 PM, 7, 2, 1, Suite 1 Bedroom Non Smoking, 5 32 1 Jo 4 Chome Niseko Hirafu Kutchan Cho Kutchan 01 0440080 Japan, 8688.33, USD, 818113655622, Non-refundable]\\n\\nThe reservation has been saved and you can edit any details by clicking on the fields.",
  "places": [],
  "transport": [],
  "hotels": []
}

### Example 3: Place Suggestions

User: "Show me restaurants in Paris"

AI Response (JSON):
{
  "text": "Here are some excellent restaurants in Paris:\\n\\n• Le Meurice - Michelin-starred fine dining\\n• L'Ami Jean - Cozy bistro with Basque influences\\n• Septime - Modern seasonal cuisine\\n\\nWould you like me to add any of these to your itinerary?",
  "places": [
    {
      "suggestedName": "Le Meurice",
      "category": "Eat",
      "type": "Restaurant",
      "searchQuery": "Le Meurice restaurant Paris"
    },
    {
      "suggestedName": "L'Ami Jean",
      "category": "Eat",
      "type": "Restaurant",
      "searchQuery": "L'Ami Jean restaurant Paris"
    },
    {
      "suggestedName": "Septime",
      "category": "Eat",
      "type": "Restaurant",
      "searchQuery": "Septime restaurant Paris"
    }
  ],
  "transport": [],
  "hotels": []
}

### Flexible Next Steps

After creating anything, offer 3-4 options for what to work on next:
- ✅ DO: "Would you like to add flights, find hotels, or explore activities?"
- ❌ DON'T: Rigid "Now we must do X"

Let users drive the conversation. They can:
- Skip steps ("Skip hotels for now")
- Jump around ("Let's do activities first")
- Add multiple things ("Add 3 hotels and 5 restaurants")`;
