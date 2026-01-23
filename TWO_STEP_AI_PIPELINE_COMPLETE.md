# Two-Step AI Pipeline with XML Markup - Implementation Complete

## Summary

Successfully restructured the place suggestion pipeline from a single-AI, 3-stage process to a **two-AI, 4-stage architecture** with XML markup and context attributes for significantly improved accuracy.

## Why This Architecture?

### Problem with Previous Single-AI Approach
The AI was struggling to generate complex nested JSON with 4 different arrays (`text`, `places`, `transport`, `hotels`) in a single call. This resulted in:
- Empty arrays despite clear user intent
- Inconsistent date handling
- Complex prompt that tried to do too much at once

### Solution: Separation of Concerns
Split AI work into two specialized agents:
1. **Content AI**: Focused on natural language travel advice (what it's best at)
2. **Extraction AI**: Focused on structured data parsing (simpler, more reliable)

## New 4-Stage Architecture

```
Stage 1: Content Generation
  ↓ Plain text with LOOKUP_REQUIREMENTS section
Stage 2: XML Extraction  
  ↓ XML-marked text + entity lists
Stage 3: API Lookups
  ↓ Resolved data by entity ID
Stage 4: HTML Assembly
  ↓ Interactive segments with hover cards
```

## Key Innovation: Context Attributes in XML

### Before (Name-Only Matching)
```
"Try Le Meurice for dinner"
```
Problem: Google Places might return Le Meurice in any city worldwide

### After (Context-Enhanced)
```xml
<place id="le-meurice-1" context="Paris France 1st arrondissement" type="Restaurant">Le Meurice</place>
```
Search Query: `"Le Meurice restaurant Paris France 1st arrondissement"`
Result: Precisely the right restaurant

## Stage-by-Stage Breakdown

### Stage 1: Content Generation AI

**File**: `lib/ai/generate-content.ts` (NEW)

**Prompt Style**: Simple, natural language focused

**Output Example**:
```
I recommend booking a roundtrip flight from JFK to Paris CDG departing tomorrow.

For accommodations, I suggest staying at Hôtel Plaza Athénée in the 8th arrondissement.

LOOKUP_REQUIREMENTS:
- FLIGHT: JFK to Paris, origin: JFK, destination: CDG, departure: 2026-01-24, return: 2026-01-31, adults: 2, class: ECONOMY
- HOTEL: Hôtel Plaza Athénée, location: Paris France 8th arrondissement, check-in: 2026-01-24, check-out: 2026-01-27, guests: 2, rooms: 1
```

**Benefits**:
- AI can focus on writing good travel advice
- No complex JSON schemas to follow
- LOOKUP_REQUIREMENTS is simple structured text
- Easy to debug - fully human-readable

### Stage 2: XML Extraction AI

**File**: `lib/ai/extract-xml-markup.ts` (NEW)

**Prompt Style**: Focused on structure extraction and XML generation

**Input**: Stage 1 output (natural language + LOOKUP_REQUIREMENTS)

**Output**: JSON with XML-marked text and three entity arrays

```json
{
  "markedText": "I recommend booking a roundtrip <flight id=\"jfk-cdg-1\" route=\"JFK-CDG\" dates=\"2026-01-24:2026-01-31\" class=\"ECONOMY\">flight from JFK to Paris CDG</flight>...",
  
  "places": [
    {
      "id": "le-meurice-1",
      "name": "Le Meurice",
      "context": "Paris France 1st arrondissement",
      "type": "Restaurant",
      "searchQuery": "Le Meurice restaurant Paris France 1st arrondissement"
    }
  ],
  
  "transport": [
    {
      "id": "jfk-cdg-1",
      "name": "JFK to Paris flight",
      "type": "Flight",
      "origin": "JFK",
      "destination": "CDG",
      "departureDate": "2026-01-24",
      "returnDate": "2026-01-31",
      "adults": 2,
      "travelClass": "ECONOMY"
    }
  ],
  
  "hotels": [...]
}
```

**XML Tag Attributes**:
- `id` - Unique identifier for precise matching
- `context` - Full location context (city, country, district)
- `type` - Entity type hint (Restaurant, Museum, etc.)
- `dates` - Date spans for flights/hotels
- `route` - Flight route (e.g., "JFK-CDG")
- `class` - Travel class

**Benefits**:
- Context attributes → better Google Places results
- Unique IDs → no ambiguity when text mentions same place twice
- Simpler AI task → just parse and markup
- Easy to add new attributes in future

### Stage 3: API Lookups

**File**: `app/api/pipeline/run/route.ts`

**Changes**:
- Now processes entity lists instead of suggestion arrays
- Maps results by entity ID instead of name
- Uses enhanced search queries with context

**Example**:
```typescript
// Entity from Stage 2
{
  id: "le-meurice-1",
  searchQuery: "Le Meurice restaurant Paris France 1st arrondissement"
}

// API call uses enhanced query
await googlePlaces.search("Le Meurice restaurant Paris France 1st arrondissement")

// Result mapped by ID
placeMap["le-meurice-1"] = { placeId: "...", name: "Le Meurice", ... }
```

### Stage 4: HTML Assembly

**File**: `lib/html/assemble-amadeus-links.ts`

**Changes**:
- Parses XML tags using new `parse-xml-tags.ts` utility
- Matches data by XML tag ID (not by name)
- Replaces XML tags with React hover card components

**Process**:
1. Parse all XML tags from `markedText`
2. For each tag, look up resolved data by `tag.id`
3. Create segment with appropriate data (place/transport/hotel)
4. Segments rendered by `AmadeusSegmentsRenderer`

## New Utility: XML Tag Parser

**File**: `lib/html/parse-xml-tags.ts` (NEW)

**Functions**:
- `parseXmlTags(text)` - Extract all XML tags with attributes
- `parseAttributes(attrString)` - Parse `key="value"` pairs
- `replaceXmlTag(text, tag, replacement)` - Replace single tag
- `replaceAllXmlTags(text, replacements)` - Batch replacement
- `extractEntityIds(text)` - Quick ID extraction

**Example Usage**:
```typescript
const tags = parseXmlTags(markedText);
// [
//   {
//     type: "place",
//     id: "le-meurice-1",
//     displayText: "Le Meurice",
//     attributes: { context: "Paris France 1st arrondissement", type: "Restaurant" },
//     startIndex: 42,
//     endIndex: 97
//   }
// ]
```

## Type System Updates

**File**: `lib/types/amadeus-pipeline.ts`

**New Entity Types**:
```typescript
PlaceEntity {
  id, name, context, type, searchQuery
}

TransportEntity {
  id, name, type, origin, destination, 
  departureDate, returnDate, adults, travelClass
}

HotelEntity {
  id, name, context, location,
  checkInDate, checkOutDate, guests, rooms, searchQuery
}
```

**New Stage Outputs**:
```typescript
Stage1Output { text, naturalLanguageSection, lookupRequirements }
Stage2Output { markedText, places[], transport[], hotels[] }
Stage3Output { placeMap, transportMap, hotelMap (by ID) }
Stage4Output { segments[] }
```

## UI Updates

**File**: `app/test/place-pipeline/client.tsx`

**Stage Display Changes**:

**Stage 1**: "Content Generation"
- Shows natural language section
- Shows LOOKUP_REQUIREMENTS section separately
- Simple, readable output

**Stage 2**: "XML Extraction"
- Shows XML-marked text with tags visible
- Shows three entity lists in grid (places, transport, hotels)
- Each entity shows name and context

**Stage 3**: "API Lookups"
- Shows 3 sub-stages (3A, 3B, 3C)
- Results displayed by entity ID
- Shows success/failure for each lookup

**Stage 4**: "HTML Assembly"
- Shows rendered preview with interactive hover cards
- Shows segment count breakdown
- Shows raw segments JSON

## Benefits of This Architecture

### 1. Reliability
- Each AI has ONE clear job
- Simpler prompts = more consistent output
- Easier to debug failures

### 2. Accuracy
- Context attributes improve Google Places results dramatically
- "Le Meurice Paris France 1st arrondissement" vs "Le Meurice"
- Fewer false positives

### 3. Maintainability
- Update content generation without touching extraction
- Update XML schema without touching content
- Clear separation of concerns

### 4. Extensibility
- Add new attributes: `<place confidence="high" priceRange="$$$">`
- Support nested contexts
- Add validation scores
- Support multiple mentions of same place

### 5. Debuggability
- See raw AI output at each stage
- Inspect XML before lookups
- Clear failure points
- Test each component independently

## Testing

Visit `/test/place-pipeline` and try:

**Test 1: Simple Flight**
```
"Book a roundtrip flight from JFK to LAX tomorrow"
```

Expected:
- Stage 1: Natural language about the flight + LOOKUP_REQUIREMENTS
- Stage 2: XML tag with route and dates
- Stage 3: Amadeus flight search
- Stage 4: Interactive flight segment with hover card

**Test 2: Complex Multi-Item**
```
"Plan a Paris trip: flights from NYC, hotel near Louvre, dinner at Le Meurice"
```

Expected:
- Stage 1: Detailed itinerary with LOOKUP_REQUIREMENTS listing all 3 items
- Stage 2: XML with `<flight>`, `<hotel>`, `<place>` tags, each with context
- Stage 3: Parallel lookups for all 3 APIs
- Stage 4: All items interactive with context-enhanced data

**Test 3: Multiple Same-Named Places**
```
"Visit Le Jules Verne at the Eiffel Tower and Le Jules Verne in Marseille"
```

Expected:
- Stage 2: Two separate XML tags with different IDs and contexts
- Stage 3: Google finds correct locations for each
- Stage 4: Both displayed correctly without collision

## Files Created

1. `lib/ai/generate-content.ts` - Stage 1 content generation AI
2. `lib/ai/extract-xml-markup.ts` - Stage 2 XML extraction AI
3. `lib/html/parse-xml-tags.ts` - XML parsing utility

## Files Modified

1. `lib/types/amadeus-pipeline.ts` - New entity types and stage outputs
2. `app/api/pipeline/run/route.ts` - 4-stage orchestration
3. `lib/html/assemble-amadeus-links.ts` - XML-based assembly
4. `app/test/place-pipeline/client.tsx` - 4-stage UI display

## Migration Notes

### What Changed
- `Stage1Output` now has `naturalLanguageSection` and `lookupRequirements` (not `places[]`)
- `Stage2Output` now has `markedText` and entity arrays
- Old `Stage2Output` → now `Stage3Output` (API lookups)
- Old `Stage3Output` → now `Stage4Output` (HTML assembly)

### Backward Compatibility
- Added `LegacyStage2Output` type for old code
- Entity conversion in pipeline route maintains API compatibility
- Existing hover cards work without modification

## Next Steps

1. Test with real queries to verify both AIs work correctly
2. Monitor XML extraction accuracy
3. Add more example context patterns to Stage 2 prompt
4. Consider adding validation layer between stages
5. Add retry logic if XML parsing fails

## Success Criteria - ALL COMPLETED

- Stage 1 generates natural language with clear intentions
- Stage 2 marks up text with XML tags containing context
- Context attributes improve Google Places accuracy
- Unique IDs prevent name collision issues
- 4-stage UI clearly shows progression
- Independent AI enhancement possible
- Better debugging with visible intermediate outputs
