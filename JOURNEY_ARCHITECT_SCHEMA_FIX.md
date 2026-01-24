# Journey Architect Schema Fix

## Issue
The Journey Architect chat API was returning a 500 error with the following message:

```
Error [AI_APICallError]: Invalid schema for function 'update_in_memory_trip': 
schema must be a JSON Schema of 'type: "object"', got 'type: "None"'.
```

## Root Cause
The tool schema definitions in `lib/ai/journey-architect-chat.ts` were not properly typed for the Vercel AI SDK. The property types within the schema needed explicit `as const` type assertions to ensure they were recognized as literal string types rather than generic strings.

## Solution
Updated the tool definitions to include:

1. **Explicit type assertions**: Added `as const` to all property type definitions
2. **Schema validation**: Added `additionalProperties: false` to both tool schemas for stricter validation
3. **Proper typing**: Ensured all nested properties have proper TypeScript const assertions

### Changes Made

**File**: `lib/ai/journey-architect-chat.ts`

**Before**:
```typescript
properties: {
  title: {
    type: "string",
    description: "Journey title (use aspirational names)"
  },
  // ... other properties
}
```

**After**:
```typescript
properties: {
  title: {
    type: "string" as const,
    description: "Journey title (use aspirational names)"
  },
  // ... other properties
},
additionalProperties: false
```

## Testing
After the fix:
1. The server recompiled successfully
2. The Journey Architect chat should now accept messages without throwing schema validation errors
3. Tool calls (`update_in_memory_trip` and `add_in_memory_segment`) should execute properly

## Related Files
- `lib/ai/journey-architect-chat.ts` - Main fix location
- `app/api/chat/structure/route.ts` - API route that calls the Journey Architect
- `app/trips/new/client.tsx` - Client component that sends messages

## Date
January 23, 2026
