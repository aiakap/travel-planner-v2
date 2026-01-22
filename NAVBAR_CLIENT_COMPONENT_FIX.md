# Client Component Server Action Fix

## Issue

After implementing the auth debug system, users encountered this error when trying to log in:

```
Error: Event handlers cannot be passed to Client Component props.
  <button ... onClick={function onClick} ...>
                      ^^^^^^^^^^^^^^^^^^
```

## Root Cause

The `Navbar` component is a client component (`"use client"`) but was importing and directly calling server actions:

```typescript
import { login, logout } from "@/lib/auth-actions";

// Later in component:
<button onClick={logout}>Sign Out</button>
```

In Next.js 15, you cannot pass server actions directly as event handlers to client components. Server actions must be called from server components or wrapped in client-side functions.

## Solution

Changed the Navbar to use the client-side `signOut` from `next-auth/react` instead of the server action:

### Before (❌ Broken)
```typescript
"use client";

import { login, logout } from "@/lib/auth-actions";

export default function Navbar({ session }: NavbarProps) {
  return (
    <button onClick={logout}>Sign Out</button>
  );
}
```

### After (✅ Fixed)
```typescript
"use client";

import { signOut } from "next-auth/react";

export default function Navbar({ session }: NavbarProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <button onClick={handleSignOut}>Sign Out</button>
  );
}
```

## Changes Made

### File 1: `components/Navbar.tsx`

1. Removed import of server actions: `import { login, logout } from "@/lib/auth-actions"`
2. Added import of client-side signOut: `import { signOut } from "next-auth/react"`
3. Created `handleSignOut` function that calls the client-side `signOut`
4. Updated button onClick to use `handleSignOut` instead of `logout`

### File 2: `components/activity-side-panel.tsx`

1. Removed import of server action: `import { login } from "@/lib/auth-actions"`
2. Added import: `import { useRouter } from "next/navigation"`
3. Changed `handleLogin` to use router navigation instead of server action:
   ```typescript
   // Before
   const handleLogin = async () => {
     await login("/test/place-pipeline");
   };
   
   // After
   const handleLogin = () => {
     router.push("/login?callbackUrl=/test/place-pipeline");
   };
   ```

## Why This Works

- `signOut` from `next-auth/react` is a client-side function designed to be called from client components
- It handles the sign-out process entirely on the client side
- It can redirect after sign out using the `callbackUrl` option
- No server action is passed as a prop, avoiding the Next.js 15 error

## Testing

✅ Login with GitHub works  
✅ Sign out button works  
✅ No client component prop errors  
✅ No linter errors  

## Related Files

- `components/Navbar.tsx` - Fixed ✅
- `components/activity-side-panel.tsx` - Fixed ✅
- `lib/auth-actions.ts` - Server actions (not used in client components anymore)
- `app/login/client.tsx` - Already using client-side `signIn` correctly

## Best Practice

**Rule**: In Next.js 15, when working with client components:
- ✅ Use client-side NextAuth functions: `signIn`, `signOut`, `useSession` from `next-auth/react`
- ❌ Don't pass server actions directly as event handlers
- ✅ If you must use server actions, wrap them in client-side functions

---

**Fixed**: January 21, 2026  
**Status**: Complete ✅
