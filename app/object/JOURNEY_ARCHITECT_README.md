# Journey Architect - User Guide

## What is Journey Architect?

Journey Architect is an AI-powered conversational interface for building travel timeline structures. Unlike traditional trip planners that focus on bookings, Journey Architect helps you organize the **flow of time** in your journey.

## Core Philosophy

### Strict Terminology

Journey Architect uses precise terminology to maintain clarity:

| Term | Meaning | Database Model |
|------|---------|----------------|
| **Journey** | The entire trip/timeline from start to finish | Trip |
| **Chapter** | A distinct phase or segment of time (e.g., "Travel", "Stay") | Segment |
| **Moment** | Specific activities or reservations (NOT the focus yet) | Reservation |

### Intelligent Drafter

The AI acts as an "Intelligent Drafter" - it doesn't interrogate you with endless questions. Instead:
- Takes whatever information you provide
- Infers missing pieces using travel logic
- Proposes a complete draft immediately
- Asks for verification, not permission

## How It Works

### 1. Natural Language Input

Just tell the AI where you want to go and when:

```
"Hokkaido from SFO Jan 29 - Feb 7th for skiing"
```

### 2. AI Analyzes & Infers

The AI extracts:
- **Journey Identity**: "Hokkaido Winter Expedition" (enhanced to be aspirational)
- **Dates**: Jan 29 - Feb 7 (10 days total)
- **Logistics**: SFO → Hokkaido (long-haul flight)
- **Purpose**: Skiing (suggests Stay chapter type)

### 3. Travel Time Estimation

The AI automatically allocates appropriate travel time:

- **Long-haul** (US to Asia/Europe): 1-2 days for Travel Chapter
  - Accounts for flight time + timezone changes + transfers
- **Short-haul/Domestic**: 1 day (or half-day) for Travel Chapter
- **Multi-city**: Splits Stay Chapters roughly evenly unless specified

### 4. Proposes Complete Structure

The AI responds with:

**Markdown Table**:
| Dates | Day # | Type | Chapter Name | Est. Duration |
|-------|-------|------|--------------|---------------|
| Jan 29-30 | Day 1-2 | Travel | Journey to the East: SFO → Hokkaido | 2 Days |
| Jan 31 - Feb 6 | Day 3-9 | Stay | Hokkaido Alpine Adventure | 7 Days |
| Feb 7 | Day 10 | Travel | Return Journey Home | 1 Day |

**Verification Question**:
"Does this balance look right, or do you need more time for travel on the way back?"

**Right Panel Updates**:
The timeline view shows editable segments with full auto-save functionality.

## Chapter Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Travel** | Moving between locations | Flights, drives, trains |
| **Stay** | Staying in one location | Hotel stays, Airbnb |
| **Tour** | Guided experience | Structured activities |
| **Retreat** | Focused wellness/relaxation | Spa, meditation |
| **Road Trip** | Multi-stop driving journey | Scenic routes |

## Scope Control: Moments vs. Chapters

### What Journey Architect DOES

✅ Builds the structure (Chapters)
✅ Estimates travel time
✅ Organizes the flow of days
✅ Creates aspirational names
✅ Proposes balanced pacing

### What Journey Architect DOESN'T Do

❌ Book specific hotels
❌ Find flight numbers
❌ Recommend restaurants
❌ Search for activities

### Why This Matters

Journey Architect focuses on **structure first, details later**. This approach:
- Prevents decision paralysis
- Ensures logical flow before commitments
- Makes it easier to add Moments (bookings) later
- Keeps the timeline flexible

### Example: Moment Request Handling

**User**: "Can you find me a hotel in Hokkaido? Preferably ski-in ski-out."

**AI Response**:
```
I don't have access to live hotel inventory or specific property 
recommendations. My job is to help you build the Chapters of the 
journey first.

By finalizing this outline, you'll know that you specifically need 
a hotel from Jan 30th to Feb 7th. That specific hotel reservation 
will be a "Moment" you can add to your journey later.

Would you like to adjust the dates in the outline, or is this 
structure ready?
```

The AI shows an **INFO_REQUEST card** (amber background) to politely redirect.

## Example Conversations

### Example 1: Simple Trip

**User**: "Weekend in Portland from Seattle, June 15-17"

**AI Creates**:
- Journey: "Pacific Northwest Escape"
- Chapter 1: "Travel" (June 15, 1 day) - Seattle → Portland
- Chapter 2: "Stay" (June 16, 1 day) - Portland Urban Exploration
- Chapter 3: "Travel" (June 17, 1 day) - Return Home

### Example 2: Multi-City Europe

**User**: "Europe trip. Sept 1 to Sept 15. London, Paris, then Rome."

**AI Creates**:
- Journey: "Grand European Odyssey"
- 15 days split across 3 cities
- Travel Chapters between cities (1 day each)
- Stay Chapters balanced (4 days London, 3 days Paris, 4 days Rome)
- Verification: "Would you like to shift more days to a specific city?"

### Example 3: Refinement

**User**: "Actually, give me 5 days in Paris instead"

**AI Adjusts**:
- Recalculates: 3 days London, 5 days Paris, 3 days Rome
- Updates right panel automatically
- Shows new markdown table

## Aspirational Naming

Journey Architect enhances names to be evocative and memorable:

| User Input | AI Enhancement |
|------------|----------------|
| "Ski trip" | "Alpine Winter Expedition" |
| "Beach vacation" | "Coastal Retreat & Renewal" |
| "Visit family" | "Homecoming Journey" |
| "Business trip" | "Professional Expedition" |

This makes your timeline feel intentional and exciting.

## Right Panel: Full Trip Builder

The right panel shows the complete trip builder interface from `/trip/new`:

### Features
- ✅ Editable segments (drag to reorder)
- ✅ Location autocomplete
- ✅ Image generation for locations
- ✅ Auto-save (saves as you type)
- ✅ Date adjustments
- ✅ Segment type changes
- ✅ Duration controls

### Integration
- Journey → Trip (database)
- Chapters → Segments (database)
- All changes save to DRAFT status
- Can be promoted to active trip later

## Tips for Best Results

### Be Specific About Dates
✅ "Jan 29 - Feb 7"
✅ "10 days starting March 15"
❌ "Next month sometime"

### Mention Origin/Destination
✅ "From SFO to Tokyo"
✅ "Starting in New York"
❌ "Going to Europe" (no origin)

### Indicate Multi-City
✅ "London, Paris, then Rome"
✅ "Visiting 3 cities in Spain"
❌ "Europe" (too vague)

### Let AI Infer First
✅ Give basic info, let AI propose structure
❌ Don't over-specify every detail upfront

### Refine Iteratively
✅ "Give Paris 2 more days"
✅ "Add a day for travel"
❌ Don't restart from scratch

## Access

Visit: **`http://localhost:3000/object/journey_architect`**

## Technical Details

### Data Flow

1. User sends message
2. AI parses natural language
3. AI returns markdown table + structured JSON
4. System updates Trip and Segments in database
5. Right panel refreshes with new timeline
6. Auto-save keeps everything in sync

### Structured Response Format

The AI returns data in this format:

```json
[JOURNEY_DATA: {
  "journey": {
    "name": "Hokkaido Winter Expedition",
    "startDate": "2025-01-29",
    "endDate": "2025-02-07",
    "totalDays": 10
  },
  "chapters": [
    {
      "type": "Travel",
      "name": "Journey to the East: SFO -> Hokkaido",
      "startDate": "2025-01-29",
      "days": 2,
      "startLocation": "San Francisco, CA",
      "endLocation": "Hokkaido, Japan"
    }
  ]
}]
```

### Database Models

- **Trip**: Stores journey metadata (title, dates, status)
- **Segment**: Stores chapter data (type, name, duration, locations)
- **SegmentType**: Defines available chapter types (Travel, Stay, etc.)

## Future Enhancements

- [ ] AI response parsing to auto-update database
- [ ] Chapter proposal cards (preview before adding)
- [ ] Moment integration (drill into Chapters to add activities)
- [ ] Journey templates (Weekend Getaway, Grand Tour, etc.)
- [ ] Smart suggestions based on locations
- [ ] Duration adjustment recommendations

## Comparison to Other Tools

| Feature | Journey Architect | Trip Chat | Trip Explorer |
|---------|-------------------|-----------|---------------|
| **Focus** | Timeline structure | Bookings & activities | Preview planning |
| **AI Role** | Intelligent Drafter | Booking assistant | Structure helper |
| **Right Panel** | Editable timeline | Trip view | Preview only |
| **Saves to DB** | Yes (DRAFT) | Yes | No |
| **Best For** | Planning flow | Managing details | Exploring ideas |

## Troubleshooting

### AI Keeps Asking Questions
- Provide more context upfront (dates, origin, destination)
- The AI should draft immediately - if it doesn't, try rephrasing

### Wrong Travel Time Allocation
- Tell the AI: "Give me 3 days for travel instead of 2"
- It will adjust and explain the change

### Can't Find Hotels/Flights
- This is expected! Journey Architect focuses on structure only
- Use Trip Chat for bookings after structure is finalized

### Right Panel Not Updating
- Check that you're logged in
- Verify the trip is in DRAFT status
- Try refreshing the page

## Summary

Journey Architect is your timeline designer. It helps you:
1. **Organize time** before committing to bookings
2. **Maintain clarity** with strict terminology
3. **Move fast** with intelligent drafting
4. **Stay flexible** by focusing on structure first

Start building your journey at `/object/journey_architect`!
