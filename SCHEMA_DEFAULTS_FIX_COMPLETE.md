# Schema Validation Fix - Default Values Added ✅

**Date**: January 27, 2026  
**Issue**: Schema validation error - "the AI response didn't match the expected format"  
**Root Cause**: Missing `.default()` values on required Zod schema fields  
**Status**: Fixed

---

## Problem

When clicking "Continue with AI Selection: Private Driver", the extraction failed with:
```
Schema validation error - the AI response didn't match the expected format
```

### Root Cause

The Zod schemas had fields defined as `z.string()` without `.default()` or `.optional()`. When the AI couldn't extract a value for these fields (or returned undefined), Zod validation failed because:

1. **Base schema** - Fields like `confirmationNumber`, `guestName`, `currency` had no defaults
2. **Private driver schema** - All driver-specific fields had no defaults

**OpenAI Structured Outputs** with `generateObject` requires that:
- All fields either have explicit values, OR
- Have `.default()` fallback values, OR  
- Are marked as `.optional()`

Without defaults, any missing field causes validation to fail.

---

## Solution Applied

### Fix 1: Base Extraction Schema

Updated [`lib/schemas/base-extraction-schema.ts`](lib/schemas/base-extraction-schema.ts):

**Before**:
```typescript
confirmationNumber: z.string().describe("..."),
guestName: z.string().describe("..."),
currency: z.string().describe("..."),
// ... etc
```

**After**:
```typescript
confirmationNumber: z.string().default("").describe("..."),
guestName: z.string().default("").describe("..."),
currency: z.string().default("").describe("..."),
// ... etc
```

**Changes**:
- Added `.default("")` to `confirmationNumber`
- Added `.default("")` to `guestName`
- Added `.default("")` to `currency`
- Added `.default("")` to `contactEmail`
- Added `.default("")` to `contactPhone`
- Added `.default("")` to `notes`
- Added `.default("")` to `bookingDate`

### Fix 2: Private Driver Schema

Updated [`lib/schemas/extraction/travel/private-driver-extraction-schema.ts`](lib/schemas/extraction/travel/private-driver-extraction-schema.ts):

**Before**:
```typescript
driverName: z.string().describe("..."),
vehicleType: z.string().describe("..."),
company: z.string().describe("..."),
pickupLocation: z.string().describe("..."),
pickupDate: z.string().describe("..."),
dropoffLocation: z.string().describe("..."),
// ... etc (all without defaults)
```

**After**:
```typescript
driverName: z.string().default("").describe("..."),
vehicleType: z.string().default("").describe("..."),
company: z.string().default("").describe("..."),
pickupLocation: z.string().default("").describe("..."),
pickupDate: z.string().default("").describe("..."),
dropoffLocation: z.string().default("").describe("..."),
// ... etc (all with .default(""))
```

**All 18 fields now have defaults**:
- `driverName` → `.default("")`
- `driverPhone` → `.default("")`
- `vehicleType` → `.default("")`
- `plateNumber` → `.default("")`
- `company` → `.default("")`
- `pickupLocation` → `.default("")`
- `pickupAddress` → `.default("")`
- `pickupDate` → `.default("")`
- `pickupTime` → `.default("")`
- `pickupInstructions` → `.default("")`
- `dropoffLocation` → `.default("")`
- `dropoffAddress` → `.default("")`
- `transferDuration` → `.default("")`
- `waitingInstructions` → `.default("")`
- `passengerCount` → `.default(1)` (already had default)
- `luggageDetails` → `.default("")`
- `meetAndGreet` → `.default(false)` (already had default)
- `specialRequests` → `.default("")`

### Fix 3: Debug Logging

Added logging in [`app/api/admin/email-extract/route.ts`](app/api/admin/email-extract/route.ts):

```typescript
// Log the AI response for debugging
console.log('🔍 AI Response Object:', JSON.stringify(result.object, null, 2));

// Validate the extracted data
const validation = validator(result.object);
```

This allows you to see exactly what the AI returned vs what the schema expected.

---

## Pattern Followed

This matches the pattern used in [`lib/schemas/car-rental-extraction-schema.ts`](lib/schemas/car-rental-extraction-schema.ts), which has this comment:

```typescript
/**
 * Car Rental Extraction Schema for OpenAI Structured Outputs
 * 
 * This schema is designed to be compatible with OpenAI's Structured Outputs feature.
 * All fields are required (no .optional() or .nullable()) and use empty strings ("") 
 * or 0 as defaults for missing values, ensuring compatibility with Vercel AI SDK's generateObject.
 */
```

**Key principles**:
1. ✅ Use `.default("")` for string fields
2. ✅ Use `.default(0)` for number fields
3. ✅ Use `.default(false)` for boolean fields
4. ✅ Use `.default([])` for array fields
5. ❌ DON'T use `.optional()` or `.nullable()`

This ensures OpenAI Structured Outputs always returns a complete object that passes validation.

---

## Expected Behavior

### Before Fix
```
User clicks "Continue with AI Selection: Private Driver"
  ↓
AI extracts data (some fields might be undefined/missing)
  ↓
Zod validation: ❌ FAIL - "confirmationNumber is required"
  ↓
Error: "Schema validation error"
```

### After Fix
```
User clicks "Continue with AI Selection: Private Driver"
  ↓
AI extracts data (some fields might be undefined/missing)
  ↓
Zod applies defaults: "" for missing strings, 0 for numbers, false for booleans
  ↓
Zod validation: ✅ PASS - all fields present (with defaults if needed)
  ↓
Success: Data returned to UI
```

---

## Testing Instructions

1. **Navigate to**: `http://localhost:3000/admin/email-extract`

2. **Paste your tabi pirka private driver email**

3. **Click**: "Analyze Email"
   - Should see: "Private Driver" (99% confidence)
   - Should see: Scoring breakdown

4. **Click**: "Continue with AI Selection: Private Driver"

5. **Expected result**: 
   - ✅ No schema validation error
   - ✅ Console shows: "🔍 AI Response Object: {...}"
   - ✅ Console shows: "✅ Successfully extracted private driver transfer"
   - ✅ Extracted data displays with all fields
   - ✅ Missing fields show as empty strings (not errors)

6. **Check console logs** to see:
```
🤖 Starting AI extraction with private-driver schema...
⏱️ AI extraction completed in 3200ms
🔍 AI Response Object: {
  "confirmationNumber": "R08010702",
  "guestName": "Mr Alex Kaplinsky",
  "driverName": "Marumoto, Mr",
  "driverPhone": "81(0) 90 8908 9969",
  "vehicleType": "Alphard",
  "plateNumber": "1",
  "company": "tabi pirka LLC",
  "pickupLocation": "New Chitose Airport (CTS)",
  "pickupDate": "2026-01-30",
  "dropoffLocation": "SANSUI NISEKO",
  "cost": 52000,
  "currency": "JPY",
  "passengerCount": 2,
  "luggageDetails": "2 ski bags",
  "waitingInstructions": "showing a name board",
  "transferDuration": "2-2.5 hours",
  // ... other fields with values or empty strings
}
✅ Successfully extracted private driver transfer in 3200ms
```

---

## Files Modified

1. ✅ [`lib/schemas/base-extraction-schema.ts`](lib/schemas/base-extraction-schema.ts)
   - Added `.default("")` to 7 fields

2. ✅ [`lib/schemas/extraction/travel/private-driver-extraction-schema.ts`](lib/schemas/extraction/travel/private-driver-extraction-schema.ts)
   - Added `.default("")` to 16 string fields
   - Already had `.default(1)` for passengerCount
   - Already had `.default(false)` for meetAndGreet

3. ✅ [`app/api/admin/email-extract/route.ts`](app/api/admin/email-extract/route.ts)
   - Added debug logging to show AI response before validation

---

## Why This Works

### Zod Schema Validation Rules

1. **Without `.default()`**: Field is REQUIRED, must have a value
   ```typescript
   z.string() // MUST be present, no undefined/null
   ```

2. **With `.default()`**: Field can be missing, will use default
   ```typescript
   z.string().default("") // If missing, use ""
   ```

3. **With `.optional()`**: Field can be undefined (not compatible with OpenAI)
   ```typescript
   z.string().optional() // Can be undefined - DON'T USE
   ```

### OpenAI Structured Outputs

OpenAI's `generateObject` with structured outputs:
- Generates JSON matching the schema
- May omit fields if not found in source text
- Expects schema to handle missing fields via defaults
- Does NOT support `.optional()` or `.nullable()`

**Solution**: Use `.default()` for all fields so validation always passes.

---

## Future Type Implementations

When creating new type-specific handlers (Taxi, Ride Share, etc.), remember:

### Checklist for New Schema

- [ ] Import base schema: `import { baseExtractionFields } from "@/lib/schemas/base-extraction-schema";`
- [ ] Extend with `...baseExtractionFields` in your schema
- [ ] Add `.default("")` to ALL string fields
- [ ] Add `.default(0)` to ALL number fields  
- [ ] Add `.default(false)` to ALL boolean fields
- [ ] Add `.default([])` to ALL array fields
- [ ] DON'T use `.optional()` or `.nullable()`
- [ ] Test with sample email before deploying

### Example Template

```typescript
export const newTypeExtractionSchema = z.object({
  ...baseExtractionFields,
  
  // Custom fields - ALL with defaults
  specificField: z.string().default("").describe("..."),
  numericField: z.number().default(0).describe("..."),
  booleanField: z.boolean().default(false).describe("..."),
  arrayField: z.array(z.string()).default([]).describe("..."),
});
```

---

## Success Criteria

- [x] Base schema has defaults for all fields
- [x] Private driver schema has defaults for all fields
- [x] Debug logging added for troubleshooting
- [x] No linter errors
- [x] Pattern matches working schemas (car-rental)
- [x] Ready for user testing

---

## Testing Status

**Ready to test!** 

Try the extraction flow again:
1. Paste email
2. Analyze
3. See type approval
4. Click "Continue with AI Selection: Private Driver"
5. **Should work now!** ✅

If you still see an error, check the console logs - the debug logging will show exactly what the AI returned and what field is causing issues.

---

## Summary

The schema validation error was caused by missing `.default()` values on Zod schema fields. When the AI couldn't extract certain fields (like `confirmationNumber` or `company`), Zod validation failed because these fields were required but had no defaults.

**Fix**: Added `.default("")` to all string fields in both the base schema and private driver schema, matching the pattern used in other working schemas.

**Result**: Validation now passes even if AI can't extract all fields - missing values default to empty strings instead of causing errors.

**Your private driver extraction should now work perfectly!** 🎉
