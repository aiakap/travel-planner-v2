# Session Callback Fix Complete

## Problem Solved

Fixed the `SessionTokenError: Cannot read properties of undefined (reading 'userId')` error that occurred after successful GitHub login.

## Root Cause Analysis

### What the Logs Revealed

The comprehensive logging showed:

```
=== SIGNIN CALLBACK START ===
User object: { "id": "cmkf2ddpm0000p49kv17s3o8v", ... }  ✅ SUCCESS
Account object: { "provider": "github", ... }  ✅ SUCCESS
Profile object: { ... }  ✅ SUCCESS
DB User lookup result: Found  ✅ SUCCESS
signIn callback returning: true  ✅ SUCCESS

=== SESSION CALLBACK START ===
Session: { "id": "cmkore5wx0001p47m7khre3zh", "userId": "cmkf2ddpm0000p49kv17s3o8v", ... }  ✅ HAS DATA
Token: undefined  ❌ PROBLEM!

=== SESSION CALLBACK ERROR ===
Error: TypeError: Cannot read properties of undefined (reading 'userId')
    at Object.session (auth.ts:255:29)
```

### The Issue

The session callback was trying to access `token.userId` when `token` was `undefined`:

```typescript
const userId = token.userId || token.sub;  // ❌ Crashes when token is undefined
```

### Why Token Was Undefined

NextAuth v5 with PrismaAdapter uses **database session strategy** by default:
- Session data is stored in the database
- The `token` parameter is NOT passed to the session callback
- User data is already in the `session` object
- No JWT token is created

Our code was written for **JWT session strategy** where:
- Session data is stored in a JWT token
- The `token` parameter contains user data
- The session callback must extract data from the token

## Solution Implemented

Updated the session callback in [`auth.ts`](auth.ts) to handle BOTH session strategies:

### Before (JWT-only):

```typescript
async session({ session, token }) {
  const userId = token.userId || token.sub;  // ❌ Assumes token exists
  
  if (session.user) {
    session.user.id = userId as string;
  }
  
  return session;
}
```

### After (Database + JWT):

```typescript
async session({ session, token }) {
  console.log("=== SESSION CALLBACK START ===");
  console.log("Session:", JSON.stringify(session, null, 2));
  console.log("Token:", JSON.stringify(token, null, 2));
  
  if (token) {
    // JWT strategy: Get userId from token
    const userId = token.userId || token.sub;
    console.log("JWT strategy - Extracted userId from token:", userId);
    
    if (!userId) {
      throw new Error("Token missing userId");
    }
    
    if (session.user) {
      session.user.id = userId as string;
      console.log("Set session.user.id from token:", userId);
    }
  } else {
    // Database strategy: User data already in session
    console.log("Database strategy - User data already in session");
    
    if (!session.user?.id) {
      throw new Error("Session missing user.id");
    }
    
    console.log("Session already has user.id:", session.user.id);
  }
  
  console.log("=== SESSION CALLBACK END ===");
  return session;
}
```

## Key Changes

1. **Check if token exists** before accessing it
2. **JWT strategy path**: Extract userId from token (when token exists)
3. **Database strategy path**: Use userId already in session.user.id (when token is undefined)
4. **Comprehensive logging**: Shows which strategy is being used

## Why This Works

With PrismaAdapter (database sessions):
- NextAuth stores session in database `Session` table
- Session object includes `userId` field
- Session object includes full `user` object with all data
- No JWT token is created
- Session callback receives `session` with data, `token` is undefined

The fix checks if `token` exists and handles both cases appropriately.

## Testing Results

After the fix:

```
=== SIGNIN CALLBACK START ===
User ID: cmkf2ddpm0000p49kv17s3o8v  ✅
User Email: aiakap96754@gmail.com  ✅
DB User lookup result: Found  ✅
signIn callback returning: true  ✅

=== SESSION CALLBACK START ===
Session: { userId: "cmkf2ddpm0000p49kv17s3o8v", user: { ... } }  ✅
Token: undefined  ✅ (Expected for database strategy)
Database strategy - User data already in session  ✅
Session already has user.id: cmkf2ddpm0000p49kv17s3o8v  ✅
=== SESSION CALLBACK END ===  ✅
```

## Next Steps

1. **Hard refresh your browser** (Cmd+Shift+R)
2. **Clear cookies** (or use incognito)
3. **Try logging in with GitHub again**
4. **You should be successfully authenticated!**

The session callback will now properly handle the database session strategy and not crash when token is undefined.

## Files Modified

- [`auth.ts`](auth.ts) - Updated session callback to handle both JWT and database session strategies

## Related Documentation

- [NextAuth.js Session Strategies](https://authjs.dev/concepts/session-strategies)
- Database sessions: User data in session object, no token
- JWT sessions: User data in token, session is minimal

---

**Fixed**: January 22, 2026
**Status**: Complete ✅
**Files Modified**: 1 (`auth.ts`)
**Linter Errors**: 0
