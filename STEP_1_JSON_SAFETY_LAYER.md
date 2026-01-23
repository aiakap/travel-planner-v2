# Step 1: JSON Safety Layer (Foundation)

## Goal
Add robust JSON parsing without changing AI behavior. This creates a safety net for future changes.

## Status
✅ COMPLETED

## Files Modified
- `lib/ai/profile-graph-chat.ts`

## Changes Made

### 1. Added Zod Schemas for Validation

```typescript
import { z } from "zod";

const InlineSuggestionSlotSchema = z.object({
  id: z.string(),
  options: z.array(z.string()),
  category: z.string(),
  subcategory: z.string(),
  metadata: z.record(z.string()).optional()
});

const ExtractedItemSchema = z.object({
  category: z.string(),
  subcategory: z.string(),
  value: z.string(),
  metadata: z.record(z.string()).optional()
});

const MadLibResponseSchema = z.object({
  message: z.string(),
  inlineSuggestions: z.array(InlineSuggestionSlotSchema).optional(),
  items: z.array(ExtractedItemSchema).optional(),
  suggestions: z.array(z.string()).optional()
});
```

### 2. Added JSON Sanitization Function

```typescript
/**
 * Sanitize JSON string - try parsing first, only apply fixes if needed
 */
function sanitizeJSON(text: string): string {
  // Try parsing first - if it works, return as-is
  try {
    JSON.parse(text);
    return text;
  } catch {
    // Only apply fixes if parsing failed
    return text
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim();
  }
}
```

### 3. Updated Response Processing

```typescript
// Sanitize JSON (try-parse-first approach)
cleanedText = sanitizeJSON(cleanedText);

// Parse and validate JSON response
const parsed = MadLibResponseSchema.parse(JSON.parse(cleanedText));
```

## Testing
- ✅ Mad-Lib format still works exactly as before
- ✅ No visual changes to UI
- ✅ Zod validation catches malformed responses
- ✅ JSON sanitization handles control characters

## Next Step
Proceed to Step 2: Concierge AI Prompt
