# PromptStyle Type Error Fix - COMPLETE

**Date**: January 27, 2026  
**Status**: ✅ Fixed

## Problem

Image generation was failing with a Prisma validation error:

```
PrismaClientValidationError: 
Invalid `prisma.imageGenerationLog.create()` invocation:

Argument `promptStyle`: Invalid value provided. Expected String or Null, provided Object.
```

The error occurred when trying to create an `ImageGenerationLog` record during trip creation.

## Root Cause

In `lib/actions/queue-image-generation.ts`, the code was passing the entire `prompt.style` object instead of just the style name:

```typescript
// WRONG - passing entire object
promptStyle: prompt.style || undefined,
```

The `prompt.style` is a full `ImagePromptStyle` object with fields like `id`, `name`, `slug`, `description`, etc., but the database expects a simple string (the style name) or null.

## Solution

Changed all three occurrences in `lib/actions/queue-image-generation.ts` to extract just the `name` property:

```typescript
// CORRECT - passing just the name string
promptStyle: prompt.style?.name || null,
```

### Files Modified

**File**: [`lib/actions/queue-image-generation.ts`](lib/actions/queue-image-generation.ts)

Changed in three functions:
1. `queueTripImageGeneration()` - Line 47
2. `queueSegmentImageGeneration()` - Line 117  
3. `queueReservationImageGeneration()` - Line 187

### Changes Made

```typescript
// Before (all 3 functions)
promptStyle: prompt.style || undefined,

// After (all 3 functions)
promptStyle: prompt.style?.name || null,
```

## Why This Happened

This error was introduced during the recent refactoring that moved from a string `style` field to a relational `ImagePromptStyle` table. The logging code wasn't updated to handle the new object relationship.

Previously:
- `ImagePrompt` had a `style: String` field
- Could directly pass: `promptStyle: prompt.style`

Now:
- `ImagePrompt` has a `style: ImagePromptStyle` relation (object)
- Must extract the name: `promptStyle: prompt.style?.name`

## Testing

After this fix:
1. ✅ Image generation logs should create successfully
2. ✅ Trip creation should proceed without Prisma errors
3. ✅ The `promptStyle` field in logs will contain the style name (e.g., "Travel Scrapbook")

## Related Context

This fix is part of the larger image generation debugging effort documented in:
- [`IMAGE_GENERATION_DEBUG_COMPLETE.md`](IMAGE_GENERATION_DEBUG_COMPLETE.md)

The enhanced logging added in that effort helped surface this error, which would have been silent before.

## Next Steps

**User should now**:
1. Restart the dev server (if not already done)
2. Try creating a trip again
3. Check terminal logs for the detailed diagnostic output

The image generation should now proceed past the logging step and either:
- ✅ Successfully generate an image (ideal outcome)
- ❌ Show a more specific error from the Imagen API (which we can then debug)

The Prisma validation error is now resolved.
