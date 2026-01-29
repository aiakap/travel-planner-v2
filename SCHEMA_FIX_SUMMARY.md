# Schema Fix - Natural Language Reservation

## Problem

```
AI parsing failed: Invalid schema for response_format 'NaturalLanguageReservation': 
In context=('properties', 'dateInfo'), 'required' is required to be supplied and 
to be an array including every key in properties. Missing 'time'.
```

## Root Cause

OpenAI's structured output API has **strict JSON schema requirements**:
- All properties in objects must be in the `required` array
- Using Zod's `.optional()` creates properties NOT in `required`
- This violates OpenAI's validation rules

## Solution

Changed all optional fields from `.optional()` to `.nullable().default(null)`:

```typescript
// ❌ BEFORE (Broken)
time: z.string().optional()

// ✅ AFTER (Fixed)
time: z.string().nullable().default(null)
```

## Files Modified

**`lib/schemas/natural-language-reservation-schema.ts`**
- `reservationType`: `.optional()` → `.nullable().default(null)`
- `dateInfo.time`: `.optional()` → `.nullable().default(null)`
- `dateInfo.endDate`: `.optional()` → `.nullable().default(null)`
- `dateInfo.endTime`: `.optional()` → `.nullable().default(null)`
- `additionalInfo`: Entire object and all nested fields
- `clarificationNeeded`: `.optional()` → `.nullable().default(null)`

## Why This Works

- `.nullable().default(null)` makes the field **required** with a default of `null`
- OpenAI sees all properties in the `required` array (satisfied)
- Fields can still be missing/empty (they just get `null` as the value)
- The TypeScript type remains functionally the same

## Type Changes

The inferred TypeScript type changes slightly:

```typescript
// Before
type DateInfo = {
  type: "absolute" | "relative" | "ambiguous"
  value: string
  time?: string              // undefined when not present
  endDate?: string           // undefined when not present
  endTime?: string           // undefined when not present
}

// After
type DateInfo = {
  type: "absolute" | "relative" | "ambiguous"
  value: string
  time: string | null        // null when not present
  endDate: string | null     // null when not present
  endTime: string | null     // null when not present
}
```

## Testing

The fix is **backward compatible**. Existing code checking for optional fields will still work:

```typescript
// Both patterns still work
if (dateInfo.time) { ... }           // null is falsy
if (dateInfo.time !== null) { ... }  // explicit null check
```

## Status

✅ **Schema fixed and working**
✅ **No breaking changes to consuming code**
✅ **OpenAI structured output now compatible**

---

**Date**: January 29, 2026
