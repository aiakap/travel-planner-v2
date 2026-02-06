# Natural Language Reservation - Schema & Error Handling Fix

## Issues

1. Error message "Failed to parse input" was too generic and didn't show the actual problem
2. Zod schema had optional fields that violated OpenAI's strict JSON schema requirements

## Root Causes

### 1. Invalid Zod Schema for OpenAI Structured Output

**Error**: `Invalid schema for response_format 'NaturalLanguageReservation': In context=('properties', 'dateInfo'), 'required' is required to be supplied and to be an array including every key in properties. Missing 'time'.`

**Problem**: OpenAI's structured output API requires that all properties in nested objects must either:
- Be listed in the `required` array, OR
- Use `.nullable().default(null)` instead of `.optional()`

The schema used `.optional()` for fields like `time`, `endDate`, etc., which violates OpenAI's strict JSON schema requirements.

### 2. Poor Error Handling

The natural language parsing API route was failing but the client wasn't showing the actual error details.

Issues:
1. **Missing OpenAI API Key check** - The route uses `gpt-4o-mini` but doesn't validate `OPENAI_API_KEY` is configured
2. **Generic error messages** - Client was throwing "Failed to parse input" without showing the actual API error

## Fixes Applied

### 1. Zod Schema Fix (`lib/schemas/natural-language-reservation-schema.ts`)

**Changed from `.optional()` to `.nullable().default(null)`**:

Before (BROKEN):
```typescript
dateInfo: z.object({
  type: z.enum(["absolute", "relative", "ambiguous"]),
  value: z.string(),
  time: z.string().optional(),        // ❌ Causes OpenAI schema error
  endDate: z.string().optional(),     // ❌ Causes OpenAI schema error
  endTime: z.string().optional(),     // ❌ Causes OpenAI schema error
}),
```

After (FIXED):
```typescript
dateInfo: z.object({
  type: z.enum(["absolute", "relative", "ambiguous"]),
  value: z.string(),
  time: z.string().nullable().default(null),      // ✅ Works with OpenAI
  endDate: z.string().nullable().default(null),   // ✅ Works with OpenAI
  endTime: z.string().nullable().default(null),   // ✅ Works with OpenAI
}),
```

**Why this matters**:
- OpenAI's structured output requires all properties to be in the `required` array
- Using `.optional()` creates properties that are NOT in `required`
- Using `.nullable().default(null)` makes the field required but allows `null` as a value
- This satisfies OpenAI's strict JSON schema validation

**All fixed fields**:
- `reservationType`: Changed from `.optional()` to `.nullable().default(null)`
- `dateInfo.time`: Changed from `.optional()` to `.nullable().default(null)`
- `dateInfo.endDate`: Changed from `.optional()` to `.nullable().default(null)`
- `dateInfo.endTime`: Changed from `.optional()` to `.nullable().default(null)`
- `additionalInfo`: Object itself and all nested fields changed to `.nullable().default(null)`
- `clarificationNeeded`: Changed from `.optional()` to `.nullable().default(null)`

### 2. API Route Error Handling (`app/api/reservations/parse-natural-language/route.ts`)

**Added OpenAI API key check**:
```typescript
// Check for OpenAI API key
if (!process.env.OPENAI_API_KEY) {
  console.error("[Parse Natural Language] OPENAI_API_KEY not configured");
  return NextResponse.json(
    { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." },
    { status: 500 }
  );
}
```

**Added AI error handling**:
```typescript
try {
  result = await generateObject({
    model: openai("gpt-4o-mini"),
    // ... config
  });
} catch (aiError) {
  console.error('[Parse NL] AI generation error:', aiError);
  throw new Error(`AI parsing failed: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
}
```

### 3. Client Error Handling (`app/reservations/new/natural/client.tsx`)

**Improved error message extraction**:
```typescript
if (!parseResponse.ok) {
  const errorData = await parseResponse.json().catch(() => ({ error: "Unknown error" }));
  console.error('[NL Client] Parse failed:', parseResponse.status, errorData);
  throw new Error(errorData.error || `Failed to parse input (${parseResponse.status})`);
}
```

**Added debug logging**:
```typescript
console.log('[NL Client] Parsing:', { input, segmentId, tripId });
```

## How to Fix the Error

### Check Environment Variables

Make sure you have the OpenAI API key configured:

```bash
# .env.local
OPENAI_API_KEY=sk-...
```

The natural language parser uses `gpt-4o-mini` for fast, cost-effective extraction.

### Restart the Development Server

After adding the API key, restart your Next.js server:

```bash
npm run dev
```

### Test the Feature

1. Navigate to a trip in journey view (`/view1/[tripId]`)
2. Click the "Add" button in a segment header
3. Type a natural language reservation (e.g., "dinner at Chez Panisse at 5 PM on Friday")
4. Submit and check the console for detailed error messages

## Console Output

With the fix applied, you'll now see:

**Success case**:
```
[NL Client] Parsing: { input: "...", segmentId: "...", tripId: "..." }
[Parse NL] Input: dinner at Chez Panisse at 5 PM on Friday
[Parse NL] Context: { name: "Paris", location: "Paris", ... }
[Parse NL] Result: { placeName: "Chez Panisse", ... }
```

**Error case (missing API key)**:
```
[NL Client] Parsing: { input: "...", segmentId: "...", tripId: "..." }
[Parse Natural Language] OPENAI_API_KEY not configured
[NL Client] Parse failed: 500 { error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." }
```

**Error case (AI failure)**:
```
[Parse NL] Input: ...
[Parse NL] Context: ...
[Parse NL] AI generation error: [detailed error]
[NL Client] Parse failed: 500 { error: "AI parsing failed: [detailed message]" }
```

## What the Error Message Will Now Show

Instead of the generic "Failed to parse input", users will see:
- "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." (if key missing)
- "AI parsing failed: [specific error]" (if AI call fails)
- "Failed to parse input (500)" (if other server error)

## API Requirements

For the natural language reservation feature to work, you need:

1. **OpenAI API Key** - For parsing natural language with `gpt-4o-mini`
   - Set: `OPENAI_API_KEY=sk-...`
   - Used in: `/api/reservations/parse-natural-language`

2. **Google Places API Key** - For place lookup and details
   - Set: `GOOGLE_PLACES_API_KEY` or `GOOGLE_MAPS_API_KEY`
   - Used in: `lib/actions/google-places.ts`

## Testing Checklist

After applying the fix:

- [ ] Check that error messages are now descriptive
- [ ] Verify console logs show detailed information
- [ ] Test with missing OPENAI_API_KEY (should show clear error)
- [ ] Test with valid API key (should work)
- [ ] Check network tab for actual API response

## Related Files

- `app/api/reservations/parse-natural-language/route.ts` - API endpoint
- `app/reservations/new/natural/client.tsx` - Frontend client
- `lib/schemas/natural-language-reservation-schema.ts` - Zod schema
- `lib/actions/resolve-reservation-context.ts` - Context resolution
- `lib/actions/google-places.ts` - Place search

## Cost Estimate

Using `gpt-4o-mini` for parsing:
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Typical reservation parse: ~500 input tokens, ~100 output tokens
- Cost per parse: ~$0.0001 (essentially free)

## Key Takeaway: OpenAI Structured Output Schema Requirements

When using OpenAI's `response_format` with JSON schema (via AI SDK's `generateObject`):

**❌ Don't use `.optional()`**:
```typescript
z.object({
  field: z.string().optional()  // Will cause schema validation error
})
```

**✅ Use `.nullable().default(null)` instead**:
```typescript
z.object({
  field: z.string().nullable().default(null)  // Works correctly
})
```

This ensures all properties are in the `required` array but can still have `null` values.

## Testing the Fix

After restarting your dev server, try creating a reservation:

1. Navigate to journey view
2. Click "Add" button in a segment header
3. Type: "dinner at Chez Panisse at 5 PM on Friday"
4. Submit

Expected console output:
```
[NL Client] Parsing: { input: "dinner...", segmentId: "...", tripId: "..." }
[Parse NL] Input: dinner at Chez Panisse at 5 PM on Friday
[Parse NL] Context: { name: "...", location: "...", ... }
[Parse NL] Result: {
  "placeName": "Chez Panisse",
  "reservationType": "restaurant",
  "dateInfo": {
    "type": "relative",
    "value": "Friday",
    "time": "5 PM",
    "endDate": null,
    "endTime": null
  },
  "additionalInfo": null,
  "confidence": "high",
  "clarificationNeeded": null
}
```

---

**Status**: Schema fixed for OpenAI compatibility, error handling improved, API key validation added
**Date**: January 29, 2026
