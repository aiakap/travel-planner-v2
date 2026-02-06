# Step 2: Concierge AI Prompt (No UI Changes)

## Goal
Update AI to return new concierge format with auto-add items and suggestions, but keep UI displaying old Mad-Lib format for backward compatibility.

## Status
✅ COMPLETED

## Files Modified
- `lib/ai/profile-graph-chat.ts`

## Changes Made

### 1. Updated System Prompt

Changed from Mad-Lib instructions to concierge-style instructions:

```
## Response Strategy: Two-Tier Confidence System

### HIGH CONFIDENCE (0.9+): Auto-Add Items
Items you're VERY confident about based on explicit user statements should be auto-added:
- Direct statements: "I like swimming" → Auto-add "Swimming"
- Explicit preferences: "I fly United" → Auto-add "United Airlines"
- Clear facts: "I have 3 kids" → Auto-add "3 children"

### MEDIUM CONFIDENCE (0.5-0.8): Suggest Items
Items that are likely relevant but not explicitly stated should be suggested with [brackets]:
- Related preferences: User mentions swimming → Suggest [lap pools], [open water]
- Inferred interests: User mentions triathlon → Suggest [running shoes], [bike gear]
- Contextual items: User has kids → Suggest [family resorts], [kid-friendly activities]
```

### 2. Updated Response Format

```json
{
  "message": "Your conversational response mentioning auto-added items and using [brackets] for suggestions",
  "autoAddItems": [
    {
      "value": "Swimming",
      "category": "hobbies",
      "subcategory": "sports",
      "confidence": 0.95,
      "metadata": {}
    }
  ],
  "suggestionItems": [
    {
      "value": "Lap Pools",
      "category": "travel-preferences",
      "subcategory": "hotels",
      "confidence": 0.7,
      "metadata": {"amenity": "pool"}
    }
  ]
}
```

### 3. Added Zod Schemas for Concierge Format

```typescript
const AutoAddItemSchema = z.object({
  value: z.string(),
  category: z.string(),
  subcategory: z.string(),
  confidence: z.number(),
  metadata: z.record(z.string()).optional()
});

const SuggestionItemSchema = z.object({
  value: z.string(),
  category: z.string(),
  subcategory: z.string(),
  confidence: z.number(),
  metadata: z.record(z.string()).optional()
});

const ConciergeResponseSchema = z.object({
  message: z.string(),
  autoAddItems: z.array(AutoAddItemSchema).optional(),
  suggestionItems: z.array(SuggestionItemSchema).optional()
});
```

### 4. Added 5 Example Scenarios

- Example 1: Swimming
- Example 2: Triathlete
- Example 3: Family with Toddler
- Example 4: Remote Work
- Example 5: Mobility Needs

### 5. Updated Response Processing Logic

```typescript
// Try parsing as concierge format first, fall back to Mad-Lib format
let parsed: any;
try {
  parsed = ConciergeResponseSchema.parse(JSON.parse(cleanedText));
  console.log("✅ [Profile Graph AI] Parsed as Concierge format");
} catch (conciergeError) {
  // Fall back to Mad-Lib format
  try {
    parsed = MadLibResponseSchema.parse(JSON.parse(cleanedText));
    console.log("✅ [Profile Graph AI] Parsed as Mad-Lib format");
  } catch (madlibError) {
    console.error("❌ [Profile Graph AI] Failed to parse response");
    throw new Error("Failed to parse AI response");
  }
}

// Handle concierge responses (new format with auto-add and suggestions)
if (parsed.autoAddItems || parsed.suggestionItems) {
  return {
    message: parsed.message,
    items: [],
    pendingSuggestions: [],
    suggestions: [],
    inlineSuggestions: [],
    autoAddItems: parsed.autoAddItems || [],
    suggestionItems: parsed.suggestionItems || []
  };
}

// Handle mad-lib responses (backward compatibility)
if (parsed.inlineSuggestions && parsed.inlineSuggestions.length > 0) {
  return {
    message: parsed.message,
    items: [],
    pendingSuggestions: [],
    suggestions: [],
    inlineSuggestions: parsed.inlineSuggestions.map(slot => ({...}))
  };
}
```

## Testing
- ✅ AI returns new concierge format
- ✅ Response includes autoAddItems and suggestionItems
- ✅ UI still shows Mad-Lib style (no visual change yet)
- ✅ Backward compatible with old format

## Next Step
Proceed to Step 3: Auto-Add Items Backend
