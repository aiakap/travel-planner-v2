# Flight Extraction Schema Fix - Complete

## Problem
The Vercel AI SDK's `generateObject` function was failing with this error:
```
Invalid schema for response_format 'response': In context=('properties', 'flights', 'items'), 
'required' is required to be supplied and to be an array including every key in properties. 
Missing 'cabin'.
```

This occurred because the Vercel AI SDK (v6.0.35) does not properly convert Zod schemas with `.nullable().default(null)` or `.default("")` into OpenAI's required JSON Schema format where all properties must be in the `required` array.

## Root Cause
The Vercel AI SDK's internal Zod-to-JSON-Schema converter treats fields with `.default()` or `.nullable()` as optional, which means they are **not** included in the JSON Schema's `required` array. However, OpenAI's Structured Outputs API requires **all** properties to be in the `required` array when using strict mode.

## Solution
Instead of using `.nullable().default(null)` or `.default("")`, we made **all fields truly required** in the Zod schema (no modifiers). The AI is instructed via the prompt to provide empty strings (`""`) for missing text fields and `0` for missing numeric fields.

### Key Changes

1. **Schema Definition** (`lib/schemas/flight-extraction-schema.ts`)
   - Removed all `.nullable()`, `.default(null)`, and `.default("")` modifiers
   - All fields are now plain required types (e.g., `z.string()`, `z.number()`)
   - Updated documentation to explain the pattern

2. **AI Prompt** (`app/api/admin/email-extract/route.ts`)
   - Added explicit instruction: "If any optional information is not available in the email, use an empty string ("") for text fields and 0 for numeric fields. Do NOT use null."

3. **Display Logic** (`app/admin/email-extract/page.tsx`)
   - Updated to check for empty strings: `field && field !== ""`
   - Updated to check for zero: `cost && cost !== 0`

4. **Server Action** (`lib/actions/add-flights-to-trip.ts`)
   - Updated to handle empty strings and zeros properly
   - Fields with empty strings are excluded from database writes

5. **Unit Tests** (`lib/schemas/__tests__/flight-extraction-schema.test.ts`)
   - Replaced all `null` references with empty strings (`""`) and zeros (`0`)
   - Updated test descriptions to reflect empty string pattern
   - Added backwards compatibility tests

6. **Test Script** (`scripts/test-email-extraction.ts`)
   - Created standalone test script to verify extraction works
   - Successfully tested with United Airlines confirmation email

## Testing

### Standalone Test
```bash
npx tsx scripts/test-email-extraction.ts
```

**Result**: ✅ Passed
- Successfully extracted 4 flight segments
- All fields parsed correctly
- Empty string handling working as expected
- Total tokens: 1,639

### Dashboard Test
Navigate to: `http://localhost:3000/admin/email-extract`

**Test Steps**:
1. Paste United Airlines confirmation email
2. Click "Extract Flight Data"
3. Verify all flights display correctly
4. Verify optional fields show "N/A" when empty
5. (Optional) Add flights to a trip

## Why This Pattern Works

OpenAI's Structured Outputs requires that:
1. All properties be listed in the `required` array
2. No properties use `additionalProperties` or have optional/nullable semantics that exclude them from `required`

By making all fields truly required in the Zod schema and using empty strings/zeros for missing values:
- The Vercel AI SDK includes all fields in the `required` array
- The AI prompt instructs the model to provide appropriate "empty" values
- Post-processing logic treats empty strings/zeros as "not provided"

## Alternative Considered

**Using Native OpenAI SDK**: We could switch to OpenAI's native SDK for structured outputs, which gives more direct control over JSON Schema. However, this would require:
- Refactoring 15+ files that use `generateObject`
- Losing Vercel AI SDK's streaming benefits
- More verbose code

The empty string pattern is simpler and works reliably with the existing infrastructure.

## Files Modified

- `lib/schemas/flight-extraction-schema.ts` - Schema definition
- `app/api/admin/email-extract/route.ts` - API endpoint
- `app/admin/email-extract/page.tsx` - Display component
- `lib/actions/add-flights-to-trip.ts` - Server action
- `lib/schemas/__tests__/flight-extraction-schema.test.ts` - Unit tests
- `scripts/test-email-extraction.ts` - Test script (new)

## Status
✅ **Complete** - All components updated and tested successfully.

The flight extraction feature now works reliably with OpenAI's Structured Outputs via Vercel AI SDK.
