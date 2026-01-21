# Place Suggestion Pipeline Integration Guide

## Overview

The place suggestion pipeline is a 3-stage system that generates AI place suggestions with guaranteed clickable links in the chat interface.

## Architecture

```
Stage 1: AI Generation (GPT-4o with JSON mode)
  ↓ Outputs: { text, places[] }
  
Stage 2: Google Places Resolution
  ↓ Outputs: { placeMap: { [name]: GooglePlaceData } }
  
Stage 3: HTML Assembly
  ↓ Outputs: { segments: MessageSegment[] }
```

## Testing the Pipeline

### 1. Start the Development Server

```bash
npm run dev
```

### 2. Navigate to the Test Page

```
http://localhost:3000/test/place-pipeline
```

### 3. Test Queries

Try these sample queries:
- "suggest 2 hotels in Paris"
- "where should I eat dinner in Tokyo?"
- "plan activities for day 3 in Dubai"
- "find transportation from JFK to Manhattan"

### 4. Observe Each Stage

The test page shows:
- **Stage 1**: AI-generated text and places array (with exact name matching)
- **Stage 2**: Google Places resolution results for each place
- **Stage 3**: Final assembled segments with clickable links

### 5. Verify Success Criteria

✅ Stage 1 outputs valid JSON with places array  
✅ Place names in text exactly match `suggestedName` in places array  
✅ Stage 2 resolves 90%+ of places successfully  
✅ Stage 3 creates clickable links for all matched places  

## API Endpoint

### POST /api/pipeline/run

**Request:**
```json
{
  "query": "suggest 2 hotels in Paris",
  "tripContext": {
    "tripId": "optional-trip-id",
    "segmentId": "optional-segment-id"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stage1": {
      "text": "I recommend...",
      "places": [...],
      "timing": 1234
    },
    "stage2": {
      "placeMap": {...},
      "timing": 2345
    },
    "stage3": {
      "segments": [...],
      "timing": 12
    }
  }
}
```

## Integration into Chat Interface

### Option A: Replace Current Implementation (Recommended)

This completely removes the old suggest_place tool and uses the pipeline.

**Step 1**: Modify `/app/api/chat/route.ts`:

```typescript
import { generatePlaceSuggestions } from "@/lib/ai/generate-place-suggestions";
import { resolvePlaces } from "@/lib/google-places/resolve-suggestions";
import { assemblePlaceLinks } from "@/lib/html/assemble-place-links";

// Remove suggest_place from tools
const tools = createTripPlanningTools(session.user.id, conversationId);
delete tools.suggest_place; // Remove the old tool

// After streamText completes, check if we should run pipeline
onFinish: async ({ text, toolCalls }) => {
  // Detect if response mentions places (heuristic)
  const mentionsPlaces = /\b(hotel|restaurant|museum|activity|eat|stay|visit|dine|tour)\b/i.test(text);
  
  if (mentionsPlaces) {
    // Run pipeline to get structured segments
    const stage1 = await generatePlaceSuggestions(text);
    const stage2 = await resolvePlaces(stage1.places);
    const stage3 = assemblePlaceLinks(stage1.text, stage1.places, stage2.placeMap);
    
    // Store segments in message metadata
    await saveMessageDirect({
      conversationId,
      userId,
      role: "assistant",
      content: text,
      metadata: JSON.stringify({ segments: stage3.segments }),
    });
  }
  
  // ... rest of save logic
}
```

**Step 2**: Modify `/components/chat-interface.tsx`:

```typescript
import { MessageSegmentsRenderer } from "@/components/message-segments-renderer";
import { MessageSegment } from "@/lib/types/place-pipeline";

// In the message rendering:
{message.role === "assistant" && (
  <>
    {/* Check if message has segments metadata */}
    {message.metadata?.segments ? (
      <MessageSegmentsRenderer
        segments={message.metadata.segments}
        onPlaceClick={(suggestion, placeData) => {
          if (tripId || suggestion.tripId) {
            // Open modal with place details
            setSelectedSuggestion({
              suggestion,
              placeData,
              tripId: tripId || suggestion.tripId!,
            });
          }
        }}
      />
    ) : (
      <div className="whitespace-pre-wrap">{message.content}</div>
    )}
  </>
)}
```

### Option B: Hybrid Approach

Keep the current tool-based system but add pipeline as fallback when text matching fails.

### Option C: Standalone Mode

Use pipeline only for specific contexts (e.g., "I'm feeling lucky" button, initial suggestions).

## Component Usage

### MessageSegmentsRenderer

```tsx
import { MessageSegmentsRenderer } from "@/components/message-segments-renderer";

<MessageSegmentsRenderer
  segments={messageSegments}
  onPlaceClick={(suggestion, placeData) => {
    // Handle place click - open modal, etc.
    openPlaceDetailModal(suggestion, placeData);
  }}
/>
```

## Files Created

**Core Pipeline:**
- `lib/types/place-pipeline.ts` - Type definitions
- `lib/ai/generate-place-suggestions.ts` - Stage 1: AI generation
- `lib/google-places/resolve-suggestions.ts` - Stage 2: Places resolution
- `lib/html/assemble-place-links.ts` - Stage 3: Assembly

**API:**
- `app/api/pipeline/run/route.ts` - Main pipeline orchestrator

**UI:**
- `app/test/place-pipeline/page.tsx` - Test page
- `components/message-segments-renderer.tsx` - Segment renderer for chat

**Documentation:**
- `PIPELINE_INTEGRATION_GUIDE.md` - This file

## Troubleshooting

### Stage 1 Issues

**Problem:** AI doesn't output valid JSON  
**Solution:** Check system prompt in `lib/ai/generate-place-suggestions.ts`, ensure `response_format: { type: "json_object" }` is set

**Problem:** Place names don't match between text and places array  
**Solution:** Enhance system prompt to be more explicit about exact matching

### Stage 2 Issues

**Problem:** Places not found in Google Places  
**Solution:** Improve `searchQuery` field generation in Stage 1 to be more specific

**Problem:** API key errors  
**Solution:** Verify `GOOGLE_PLACES_API_KEY` or `GOOGLE_MAPS_API_KEY` is set in `.env.local`

### Stage 3 Issues

**Problem:** Place names not found in text  
**Solution:** This should never happen if Stage 1 works correctly. Check Stage 1 output.

**Problem:** Links not clickable  
**Solution:** Verify `MessageSegmentsRenderer` component is being used and `onPlaceClick` handler is provided

## Performance

Typical pipeline execution times:
- **Stage 1 (AI):** 1-3 seconds
- **Stage 2 (Google Places):** 2-5 seconds (depends on number of places)
- **Stage 3 (Assembly):** < 50ms

Total: 3-8 seconds per request with place suggestions

## Next Steps

1. Test the pipeline on `/test/place-pipeline`
2. Verify all stages complete successfully
3. Choose integration approach (A, B, or C)
4. Implement chosen approach in chat interface
5. Test end-to-end with real conversations
6. Monitor Stage 2 success rate and adjust search queries as needed
