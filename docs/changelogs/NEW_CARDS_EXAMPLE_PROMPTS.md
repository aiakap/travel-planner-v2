# Example Prompts for Testing New Trip Chat Cards

## DINING_SCHEDULE_CARD Examples

### Basic Restaurant Suggestions
```
"Suggest restaurants for each night of my trip"
"Plan dinners for my Paris trip"
"Show me restaurant options for each evening"
"Find places to eat for each night"
"I need dinner recommendations for the whole trip"
```

### Specific Preferences
```
"Suggest Italian restaurants for each night"
"Find romantic restaurants for our anniversary trip"
"Show me budget-friendly dinner options for each night"
"Recommend restaurants near our hotel for each evening"
```

---

## ACTIVITY_TABLE_CARD Examples

### General Activity Requests
```
"What activities can we do in Paris?"
"Show me things to do in Tokyo"
"What are the top activities in Rome?"
"Find activities for our trip"
"Show me tours and attractions"
```

### Category-Specific
```
"Show me food tours in Paris"
"Find outdoor activities in Colorado"
"What museums can we visit?"
"Show me cultural activities"
"Find adventure activities"
```

### With Filters
```
"Show me activities in Paris - tours and food experiences"
"Find half-day activities in London"
"What are the highest-rated activities?"
"Show me budget-friendly activities"
```

---

## FLIGHT_COMPARISON_CARD Examples

### Basic Flight Search
```
"Find flights from NYC to Paris for March 15"
"Compare flight options to London"
"Show me flights for our trip dates"
"Search for flights from LAX to Tokyo"
```

### With Specific Details
```
"Find flights from JFK to CDG departing March 15, returning March 22"
"Show me direct flights to Paris"
"Compare economy vs premium economy flights"
"Find flights for 2 passengers"
```

### Round Trip
```
"Find round-trip flights from Boston to Rome"
"Show me return flights for our dates"
"Compare flight options for 4 people"
```

---

## BUDGET_BREAKDOWN_CARD Examples

### General Budget Queries
```
"What's my trip budget?"
"Show me the costs"
"How much is this trip going to cost?"
"Break down my expenses"
"Show me the budget"
```

### Category-Specific
```
"How much am I spending on hotels?"
"What's my food budget?"
"Show me transportation costs"
"How much are activities costing?"
```

### Status Queries
```
"What's confirmed vs planned?"
"Show me actual costs vs estimates"
"How much have I spent so far?"
"What's the total estimated cost?"
```

---

## DAY_PLAN_CARD Examples

### Specific Date Queries
```
"Show me what we're doing on March 15"
"What's the plan for Tuesday?"
"Show me our schedule for the first day"
"What do we have planned for March 20th?"
```

### Day References
```
"Show me tomorrow's schedule"
"What's happening on day 3?"
"Plan out our first day"
"Show me the itinerary for next Monday"
```

### Planning Requests
```
"Help me organize March 15"
"Show me the timeline for Tuesday"
"What's our schedule looking like for that day?"
"Break down our activities for March 15"
```

---

## Combined Examples (Multiple Cards)

### Full Trip Planning Session
```
User: "I'm planning a trip to Paris"
AI: [Creates trip with TRIP_CARD]

User: "Find flights from NYC for March 15-22"
AI: [Shows FLIGHT_COMPARISON_CARD]

User: "What activities can we do there?"
AI: [Shows ACTIVITY_TABLE_CARD]

User: "Suggest restaurants for each night"
AI: [Shows DINING_SCHEDULE_CARD]

User: "What's my total budget?"
AI: [Shows BUDGET_BREAKDOWN_CARD]

User: "Show me the plan for March 16"
AI: [Shows DAY_PLAN_CARD]
```

### Budget-Focused Session
```
User: "Show me my trip costs"
AI: [Shows BUDGET_BREAKDOWN_CARD]

User: "That's too expensive. Show me budget restaurants"
AI: [Shows DINING_SCHEDULE_CARD with budget options]

User: "Find cheaper activities"
AI: [Shows ACTIVITY_TABLE_CARD sorted by price]
```

### Day-by-Day Planning
```
User: "Let's plan out each day"
AI: "Sure! Let's start with day 1."

User: "Show me March 15"
AI: [Shows DAY_PLAN_CARD for March 15]

User: "Add activities for that day"
AI: [Shows ACTIVITY_TABLE_CARD for Paris]

User: "Where should we eat that night?"
AI: [Shows DINING_SCHEDULE_CARD focused on that date]
```

---

## Testing Tips

### For DINING_SCHEDULE_CARD:
1. Create a trip first with dates
2. Make sure the trip has a location (in title or segments)
3. The card will fetch restaurants for that location
4. Test the expand/collapse functionality
5. Try adding restaurants to the itinerary

### For ACTIVITY_TABLE_CARD:
1. Specify a clear location
2. Try different category filters
3. Test sorting by rating, price, duration
4. Check the add functionality
5. Verify activities appear in the itinerary

### For FLIGHT_COMPARISON_CARD:
1. Provide clear origin and destination codes (JFK, CDG, etc.)
2. Specify dates in YYYY-MM-DD format
3. Currently uses mock data (ready for Amadeus API)
4. Test the select functionality
5. Verify flight appears as reservation

### For BUDGET_BREAKDOWN_CARD:
1. Create a trip with some reservations first
2. Add costs to reservations
3. Mix confirmed, planned, and suggested statuses
4. Check category totals
5. Verify percentage calculations

### For DAY_PLAN_CARD:
1. Create reservations with specific dates and times
2. Use YYYY-MM-DD format for dates
3. Add multiple activities to the same day
4. Check timeline visualization
5. Verify gap indicators for free time

---

## Advanced Testing Scenarios

### Scenario 1: Multi-City Trip
```
1. "Plan a trip to Paris and Rome"
2. "Show me activities in Paris" [ACTIVITY_TABLE_CARD]
3. "Show me activities in Rome" [ACTIVITY_TABLE_CARD]
4. "Suggest restaurants for each night" [DINING_SCHEDULE_CARD]
5. "What's my budget?" [BUDGET_BREAKDOWN_CARD]
```

### Scenario 2: Weekend Getaway
```
1. "Plan a weekend trip to Boston"
2. "Find flights from NYC" [FLIGHT_COMPARISON_CARD]
3. "Show me Saturday's plan" [DAY_PLAN_CARD]
4. "Show me Sunday's plan" [DAY_PLAN_CARD]
5. "What restaurants should we try?" [DINING_SCHEDULE_CARD]
```

### Scenario 3: Budget-Conscious Planning
```
1. "Plan a budget trip to Mexico City"
2. "Show me the costs" [BUDGET_BREAKDOWN_CARD]
3. "Find cheap activities" [ACTIVITY_TABLE_CARD sorted by price]
4. "Suggest affordable restaurants" [DINING_SCHEDULE_CARD]
5. "Show me the cheapest flights" [FLIGHT_COMPARISON_CARD]
```

### Scenario 4: Detailed Day Planning
```
1. "I need help planning March 15"
2. "Show me the current plan" [DAY_PLAN_CARD]
3. "Add morning activities" [ACTIVITY_TABLE_CARD]
4. "Where should we have lunch?" [DINING_SCHEDULE_CARD]
5. "Add afternoon activities" [ACTIVITY_TABLE_CARD]
6. "Show me the updated schedule" [DAY_PLAN_CARD]
```

---

## Expected AI Responses

The AI should detect these intents and respond with the appropriate card syntax:

### Restaurant Intent → DINING_SCHEDULE_CARD
```json
{
  "text": "I'll create a dining schedule for your 5 nights in Paris.\n\n[DINING_SCHEDULE_CARD: trip_abc123, segment_xyz789]\n\nI've found great restaurants near your hotel for each evening. Hover over any restaurant to see photos and reviews, then click 'Add' to book it into your itinerary.",
  "places": [],
  "transport": [],
  "hotels": []
}
```

### Activity Intent → ACTIVITY_TABLE_CARD
```json
{
  "text": "Here are the top-rated activities in Paris.\n\n[ACTIVITY_TABLE_CARD: Paris, segment_xyz789, Tours|Museums|Food]\n\nI've organized them by category with suggested times that fit your schedule. Click any activity to see full details and reviews.",
  "places": [],
  "transport": [],
  "hotels": []
}
```

### Flight Intent → FLIGHT_COMPARISON_CARD
```json
{
  "text": "I found 5 flight options for your dates.\n\n[FLIGHT_COMPARISON_CARD: JFK, CDG, 2026-03-15, 2026-03-22, 2]\n\nThe options range from $650 to $1,200. The Air France direct flight is the fastest, while the TAP Portugal option with a Lisbon layover is the most affordable.",
  "places": [],
  "transport": [],
  "hotels": []
}
```

### Budget Intent → BUDGET_BREAKDOWN_CARD
```json
{
  "text": "Here's your budget breakdown.\n\n[BUDGET_BREAKDOWN_CARD: trip_abc123]\n\nYour total estimated cost is $3,450. The largest expense is accommodation at $1,200, followed by flights at $800.",
  "places": [],
  "transport": [],
  "hotels": []
}
```

### Day Plan Intent → DAY_PLAN_CARD
```json
{
  "text": "Here's your schedule for March 15.\n\n[DAY_PLAN_CARD: trip_abc123, 2026-03-15, segment_xyz789]\n\nYou have 4 activities scheduled from 9:00 AM to 9:00 PM. You have a 2-hour gap in the afternoon for lunch and rest.",
  "places": [],
  "transport": [],
  "hotels": []
}
```

---

## Troubleshooting

### Card Not Appearing?
1. Check that the AI included the card syntax in the response
2. Verify the card syntax is correctly formatted
3. Check browser console for errors
4. Ensure required IDs (tripId, segmentId) are valid

### Data Not Loading?
1. Check API endpoints are accessible
2. Verify API keys are configured (Yelp, Viator)
3. Check network tab for failed requests
4. Look for error messages in the card

### Add Button Not Working?
1. Verify tripId or segmentId is provided
2. Check reservation creation endpoint
3. Look for error alerts or console messages
4. Ensure user has permission to modify trip

---

## Next Steps

After testing these cards:
1. Gather user feedback on UX
2. Monitor API usage and costs
3. Optimize loading times
4. Add more filtering options
5. Implement Phase 2 cards (Weather, Packing, Map)
6. Add real Amadeus integration for flights
7. Implement drag-to-reorder for DAY_PLAN_CARD
