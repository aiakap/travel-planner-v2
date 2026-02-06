# Auth Debug Logging Implementation Complete

## Overview

Added comprehensive logging throughout the entire authentication flow to diagnose why GitHub OAuth login redirects to the error page instead of successfully authenticating.

## Problem

User completes GitHub OAuth flow but gets redirected to `/login/error` instead of being logged in. We need to see exactly what data GitHub is returning and where the authentication flow is failing.

## Solution Implemented

Added detailed console logging at every stage of the authentication process:

1. **Startup validation** - Confirms GitHub OAuth is configured
2. **signIn callback** - Logs all data from GitHub
3. **jwt callback** - Logs token creation
4. **session callback** - Logs session creation
5. **Error page** - Displays all query parameters

## Files Modified

### 1. [`auth.ts`](auth.ts)

#### Startup Logging (Lines 14-28)

Added GitHub-specific configuration check:

```typescript
if (process.env.NODE_ENV === "development") {
  validateAndLog();
  
  const configuredProviders = getConfiguredProviders();
  console.log(`🔐 Auth providers: ${configuredProviders.join(", ") || "None configured"}`);
  
  // Verify GitHub specifically
  const hasGitHub = (process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID) && 
                    (process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_SECRET);
  console.log(`GitHub OAuth configured: ${hasGitHub ? "YES" : "NO"}`);
  if (hasGitHub) {
    console.log(`GitHub Client ID: ${(process.env.AUTH_GITHUB_ID || process.env.GITHUB_ID)?.substring(0, 10)}...`);
  }
}
```

#### signIn Callback (Lines 124-175)

Added comprehensive logging of all data received from GitHub:

```typescript
async signIn({ user, account, profile }) {
  try {
    console.log("=== SIGNIN CALLBACK START ===");
    console.log("User object:", JSON.stringify(user, null, 2));
    console.log("Account object:", JSON.stringify(account, null, 2));
    console.log("Profile object:", JSON.stringify(profile, null, 2));
    console.log("User ID:", user.id);
    console.log("User Email:", user.email);
    console.log("User Name:", user.name);
    console.log("Account Provider:", account?.provider);
    console.log("Account Provider Account ID:", account?.providerAccountId);
    console.log("Account Access Token:", account?.access_token ? "Present" : "Missing");
    console.log("Account Refresh Token:", account?.refresh_token ? "Present" : "Missing");
    console.log("=== SIGNIN CALLBACK END ===");
    
    // ... existing logic with added logging
    console.log("DB User lookup result:", dbUser ? "Found" : "Not found");
    console.log("Creating new user via PrismaAdapter");
    console.log("signIn callback returning: true");
    
    return true;
  } catch (error) {
    console.error("=== SIGNIN CALLBACK ERROR ===");
    console.error("Error:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
    console.error("=== SIGNIN CALLBACK ERROR END ===");
    
    // Changed to return false to trigger error page
    return false;
  }
}
```

#### jwt Callback (Lines 177-233)

Added logging for token creation:

```typescript
async jwt({ token, account, user, trigger }) {
  try {
    console.log("=== JWT CALLBACK START ===");
    console.log("Trigger:", trigger);
    console.log("Token:", JSON.stringify(token, null, 2));
    console.log("Account:", account ? JSON.stringify(account, null, 2) : "None");
    console.log("User:", user ? JSON.stringify(user, null, 2) : "None");
    
    // ... existing logic with added logging
    console.log("Added account data to token");
    console.log("Added userId to token:", user.id);
    console.log("Migrated userId from sub:", token.sub);
    console.log("JWT callback returning token with userId:", token.userId);
    console.log("=== JWT CALLBACK END ===");
    
    return token;
  } catch (error) {
    console.error("=== JWT CALLBACK ERROR ===");
    console.error("Error:", error);
    console.error("=== JWT CALLBACK ERROR END ===");
    throw error;
  }
}
```

#### session Callback (Lines 235-267)

Added logging for session creation:

```typescript
async session({ session, token }) {
  try {
    console.log("=== SESSION CALLBACK START ===");
    console.log("Session:", JSON.stringify(session, null, 2));
    console.log("Token:", JSON.stringify(token, null, 2));
    
    const userId = token.userId || token.sub;
    console.log("Extracted userId:", userId);
    
    // ... existing logic with added logging
    console.log("Set session.user.id:", userId);
    console.log("Session callback returning session");
    console.log("=== SESSION CALLBACK END ===");
    
    return session;
  } catch (error) {
    console.error("=== SESSION CALLBACK ERROR ===");
    console.error("Error:", error);
    console.error("=== SESSION CALLBACK ERROR END ===");
    throw error;
  }
}
```

### 2. [`app/login/error/page.tsx`](app/login/error/page.tsx)

#### Console Logging (Lines 90-96)

Added logging of all query parameters:

```typescript
// CAPTURE ALL QUERY PARAMS FOR DEBUGGING
const allParams = JSON.stringify(params, null, 2);
console.log("=== ERROR PAGE ===");
console.log("All query params:", allParams);
console.log("Error:", error);
console.log("Details:", details);
console.log("=== ERROR PAGE END ===");
```

#### Debug Display Section (After line 257)

Added visual debug card in development mode:

```typescript
{/* DEBUG: Show all query parameters in development */}
{process.env.NODE_ENV === "development" && (
  <Card className="border-yellow-200 bg-yellow-50">
    <CardHeader>
      <CardTitle className="text-yellow-800">Debug Information</CardTitle>
      <CardDescription>All query parameters received</CardDescription>
    </CardHeader>
    <CardContent>
      <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
        {allParams}
      </pre>
    </CardContent>
  </Card>
)}
```

## How to Use This Debug System

### Step 1: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Check Startup Logs

Look for these lines in your terminal:

```
✅ Auth configuration is valid
   Configured providers: GitHub
🔐 Auth providers: GitHub
GitHub OAuth configured: YES
GitHub Client ID: Iv1.abc123...
```

### Step 3: Attempt Login

1. Clear browser cookies
2. Navigate to `/login`
3. Click "Sign in with GitHub"
4. Complete GitHub OAuth

### Step 4: Check Terminal Output

You should see detailed logs for each callback:

```
=== SIGNIN CALLBACK START ===
User object: { ... }
Account object: { ... }
Profile object: { ... }
...
=== SIGNIN CALLBACK END ===

=== JWT CALLBACK START ===
...
=== JWT CALLBACK END ===

=== SESSION CALLBACK START ===
...
=== SESSION CALLBACK END ===
```

### Step 5: If Redirected to Error Page

**In Terminal:**
- Look for `=== ERROR PAGE ===` section
- Check the error type and all query params

**In Browser:**
- Scroll down to see the yellow "Debug Information" card
- This shows all query parameters passed by NextAuth

## What to Look For

### Success Indicators

- signIn callback receives user data from GitHub
- User has an ID and email
- Database lookup succeeds (or user is created)
- JWT callback creates token with userId
- Session callback creates session with user.id
- No error logs

### Failure Indicators

- Any `=== [CALLBACK] ERROR ===` sections
- Missing user ID or email
- Database connection errors
- Token creation failures
- Error page with specific error code

## Expected Behavior

### If Login Succeeds

- Terminal shows all three callbacks completing successfully
- Browser redirects to home page (or callback URL)
- User is authenticated

### If Login Fails

- Terminal shows which callback failed and why
- Error page displays with specific error code
- Debug Information card shows all error details
- Stack traces help identify the exact issue

## Key Changes from Previous Implementation

1. **More Verbose Logging**: Every data point is logged, not just summaries
2. **JSON Stringification**: Full objects are logged for inspection
3. **Error Stack Traces**: Complete stack traces for debugging
4. **Visual Debug Display**: Error page shows query params in UI
5. **Startup Validation**: Confirms GitHub OAuth is properly configured

## Next Steps

After you attempt login and collect the logs:

1. **Share the terminal output** - Copy the entire callback sequence
2. **Share the error page URL** - Include all query parameters
3. **Share the Debug Information** - From the yellow card on error page

This will reveal exactly where and why the authentication is failing.

---

**Implemented**: January 22, 2026
**Status**: Complete - Ready for Testing
**Files Modified**: 2 (`auth.ts`, `app/login/error/page.tsx`)
**Linter Errors**: 0
