# Amadeus Client Browser Error Fix

## Problem
The application was throwing an error in the browser:
```
ArgumentError: Missing required argument: clientId
    at eval (amadeus-client.ts:13:17)
```

This error occurred when loading the `/exp` page because the Amadeus SDK client was being instantiated in browser-side code, where `process.env.AMADEUS_CLIENT_ID` is not available.

## Root Cause
The import chain was:
1. `app/exp/client.tsx` (client component)
2. → `app/exp/components/message-segments-renderer.tsx` (client component)
3. → `app/exp/components/place-hover-card.tsx` (client component)
4. → `lib/amadeus/hotels.ts` (**server-only module**)
5. → `lib/flights/amadeus-client.ts` (**server-only module**)

When `lib/flights/amadeus-client.ts` was imported, it tried to instantiate the Amadeus SDK client at module initialization:

```typescript
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,  // ❌ Undefined in browser
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
});
```

The specific import that triggered this chain was `place-hover-card.tsx` importing `calculateNights` from `lib/amadeus/hotels.ts`.

## Solution
Created a new utility module `lib/utils/date-utils.ts` that contains client-safe date utility functions, including `calculateNights`. This module has **no server-side dependencies** and can be safely imported in both client and server components.

### Changes Made

1. **Created `lib/utils/date-utils.ts`**
   - Extracted `calculateNights` function
   - Added other date utilities (`formatDate`, `isFutureDate`)
   - No dependencies on server-only modules

2. **Updated `app/exp/components/place-hover-card.tsx`**
   - Changed import from `@/lib/amadeus/hotels` to `@/lib/utils/date-utils`
   - This breaks the import chain that was causing the client to load server-only code

3. **Updated `lib/amadeus/hotels.ts`**
   - Kept the `calculateNights` function for backward compatibility
   - Added deprecation comment pointing to the new location

## Verification
After this fix:
- ✅ Client components can use date utilities without importing server-only modules
- ✅ The Amadeus client is never instantiated in the browser
- ✅ Server-side code continues to work normally
- ✅ No breaking changes to existing API routes or server components

## Best Practices
To prevent similar issues in the future:

1. **Never import server-only modules in client components**
   - Server-only: Database clients, API SDKs, modules using `process.env` at module level
   - Mark server-only files with comments if needed

2. **Extract shared utilities**
   - If a utility function is needed in both client and server, extract it to a separate file with no dependencies

3. **Use dynamic imports for conditional server code**
   - If you must access server code from a client component, use dynamic imports in API routes

4. **Consider "use server" directive**
   - Mark server-only functions with `"use server"` to make the boundary explicit

## Related Files
- `lib/utils/date-utils.ts` (new)
- `app/exp/components/place-hover-card.tsx` (modified)
- `lib/amadeus/hotels.ts` (modified)
