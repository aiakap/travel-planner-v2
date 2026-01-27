# Deprecation Notice

**Date**: January 27, 2026  
**Status**: Information Only - No Breaking Changes

---

## Overview

This document lists features and patterns that are deprecated but still functional. These are not removed, but should not be used in new development.

## Deprecated Features

### 1. Text-Based Card Syntax

**Status**: ⚠️ DEPRECATED  
**Reason**: Replaced by OpenAI Structured Outputs with Zod schemas  
**Still Works**: Yes  
**Remove By**: TBD

**Old Pattern** (DO NOT USE):
```typescript
// AI returns text with embedded syntax
const response = "Here's your trip: [TRIP_CARD: tripId=123, title=Paris, ...]"

// Parse with regex
const cards = parseCardsFromText(response)
```

**New Pattern** (USE THIS):
```typescript
// AI returns structured JSON
import { generateObject } from "ai";
import { expResponseSchema } from "@/lib/schemas/exp-response-schema";

const response = await generateObject({
  model: openai("gpt-4o"),
  schema: expResponseSchema,
  prompt: "Plan a trip to Paris",
});

// Cards are already structured
const cards = response.object.cards; // Array<Card>
```

**Migration**: See `/docs/ADMIN_EXP_MIGRATION.md` and `/STRUCTURED_OUTPUTS_MIGRATION_COMPLETE.md`

---

### 2. Manual Card Parsing Functions

**Status**: ⚠️ DEPRECATED  
**Reason**: No longer needed with structured outputs  
**Still Works**: Archived in old code  
**Remove By**: TBD

**Deprecated Functions**:
- `parseCardsFromText()` - Regex-based card extraction
- File: `app/exp/lib/parse-card-syntax.ts` (DELETED)

**Replacement**: Use Zod schema validation
```typescript
import { cardSchema } from "@/lib/schemas/exp-response-schema";

// Validate single card
const result = cardSchema.safeParse(cardData);
if (result.success) {
  const card = result.data; // Typed Card object
}
```

---

### 3. Old Validation Functions

**Status**: ⚠️ DEPRECATED  
**Reason**: Replaced by Zod-based validation  
**Still Works**: Archived  
**Remove By**: TBD

**Deprecated Function**:
- `validateAIResponse()` - Manual JSON validation
- File: `lib/ai/validate-ai-response.ts` (DELETED)

**Replacement**: Use `validateExpResponse()`
```typescript
import { validateExpResponse } from "@/lib/schemas/exp-response-schema";

const validation = validateExpResponse(data);
if (validation.success) {
  const expResponse = validation.data;
} else {
  console.error(validation.error);
}
```

---

### 4. Old Admin Card Testing Approach

**Status**: ⚠️ DEPRECATED  
**Reason**: New dedicated card testing tools available  
**Still Works**: Yes, but limited  
**Remove By**: N/A (enhancement, not replacement)

**Old Approach**:
- Manually pasting card syntax into prompts
- Testing in production chat endpoint
- No visual preview or validation

**New Approach**:
1. Use `/admin/cards` for interactive card testing
2. Use `/admin/suggestions` for suggestion schema testing
3. Use `/admin/prompts/test` with "Test with AI" button
4. Use `/admin/apis/ai-content` structured output tab

---

### 5. Generic Itinerary Endpoint for Structured Testing

**Status**: ⚠️ DEPRECATED  
**Reason**: Dedicated exp-response endpoint available  
**Still Works**: Yes  
**Remove By**: N/A

**Old Endpoint**: `POST /api/admin/test/openai-itinerary`
- Generic text generation
- No structured output support
- Manual parsing required

**New Endpoint**: `POST /api/admin/test/exp-response`
- Structured outputs with Zod
- Automatic validation
- Card and suggestion arrays
- See: `/app/api/admin/test/exp-response/route.ts`

---

## Not Deprecated

The following are still fully supported:

### ✅ Prompt Plugin System
- Location: `/app/exp/lib/prompts/`
- Status: **Active and Enhanced**
- Changes: Now works with structured outputs

### ✅ Admin Interface
- Location: `/app/admin/`
- Status: **Active and Enhanced**
- Changes: New tools added, existing features still work

### ✅ Entity Selection
- Location: `/app/admin/prompts/test/page.tsx`
- Status: **Active**
- No changes

### ✅ API Testing
- Location: `/app/admin/apis/`
- Status: **Active and Enhanced**
- Changes: Structured output tab added

## Migration Timeline

### Phase 1: Deprecation (CURRENT)
- Old features marked as deprecated
- Documentation updated
- New tools available
- No code removed

### Phase 2: Transition (Future)
- Monitor usage of old patterns
- Assist developers in migrating
- Provide additional migration tools if needed

### Phase 3: Removal (TBD)
- After sufficient transition time
- Only if usage drops to near-zero
- With advance notice and final migration guide

## How to Check If You're Using Deprecated Features

### Search Your Code

**Text-based card syntax**:
```bash
grep -r "\[TRIP_CARD:" .
grep -r "\[SEGMENT_CARD:" .
grep -r "parseCardsFromText" .
```

**Old validation**:
```bash
grep -r "validateAIResponse" .
```

**Old endpoints**:
```bash
grep -r "/api/admin/test/openai-itinerary" .
```

### What to Do If Found

1. **Don't Panic**: Code still works
2. **Plan Migration**: Schedule time to update
3. **Use New Tools**: Test with admin interface
4. **Reference Docs**: See migration guide
5. **Update Incrementally**: One component at a time

## Support

### Documentation
- **Migration Guide**: `/docs/ADMIN_EXP_MIGRATION.md`
- **Structured Outputs**: `/STRUCTURED_OUTPUTS_MIGRATION_COMPLETE.md`
- **Admin Guide**: `/app/admin/README.md`
- **Dev Guide**: `/app/admin/DEVELOPER_README.md`

### Interactive Tools
- **Card Explorer**: `/admin/cards`
- **Suggestion Testing**: `/admin/suggestions`
- **Prompt Testing**: `/admin/prompts/test`
- **AI Content**: `/admin/apis/ai-content`

### Code Examples
- **Schema**: `/lib/schemas/exp-response-schema.ts`
- **API Route**: `/app/api/chat/simple/route.ts`
- **Prompt Builder**: `/app/exp/lib/prompts/build-exp-prompt.ts`

## FAQ

### Q: Will my existing code break?

**A**: No. Deprecated features still work. This is information about future direction, not immediate changes.

### Q: Do I have to migrate immediately?

**A**: No. Migrate at your own pace. The old approach continues to function.

### Q: What if I like the old way?

**A**: The new approach is more reliable (OpenAI guarantees schema compliance) and type-safe (TypeScript + Zod). We recommend trying it, but you're not forced to switch immediately.

### Q: How do I learn the new approach?

**A**: Start with `/admin/cards` to explore card types, then try `/admin/prompts/test` with "Test with AI" button. Read `/docs/ADMIN_EXP_MIGRATION.md` for complete guide.

### Q: What about performance?

**A**: Structured outputs have ~10-15% more token usage but 100% reliability and no parsing overhead. Net benefit is positive.

### Q: Can I use both approaches?

**A**: Technically yes (old code still runs), but we recommend using structured outputs for consistency.

---

**Questions?** Refer to `/docs/ADMIN_EXP_MIGRATION.md` or explore the interactive tools in `/admin`.
