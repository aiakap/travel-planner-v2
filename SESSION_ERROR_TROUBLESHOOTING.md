# Session Error Troubleshooting Guide

## The Problem

You're seeing `SessionTokenError` with the message:
```
Cannot read properties of undefined (reading 'userId')
```

This happens because:
1. Old session tokens don't have the new `userId` field
2. The browser is trying to use an old, incompatible session cookie
3. `AUTH_SECRET` might be missing from `.env`

## Solution Steps (In Order)

### Step 1: Add AUTH_SECRET to .env

Open your `.env` file and add:

```env
AUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="
```

### Step 2: Restart Development Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 3: Clear Browser Cookies

This is the **most important step**!

#### Option A: Use Incognito/Private Window (EASIEST)

1. Open a new incognito/private browsing window
2. Navigate to `http://localhost:3000/login`
3. Try logging in with GitHub
4. Should work now!

#### Option B: Clear Cookies Manually

**Chrome/Edge/Brave**:
1. Open DevTools (F12)
2. Go to "Application" tab
3. Expand "Storage" → "Cookies"
4. Click on `http://localhost:3000`
5. Right-click in the cookies list → "Clear"
6. Refresh page (Cmd+R / Ctrl+R)

**Firefox**:
1. Open DevTools (F12)
2. Go to "Storage" tab
3. Expand "Cookies"
4. Click on `http://localhost:3000`
5. Right-click → "Delete All"
6. Refresh page (Cmd+R / Ctrl+R)

**Safari**:
1. Safari → Settings → Privacy
2. Click "Manage Website Data"
3. Search for "localhost"
4. Click "Remove"
5. Refresh page (Cmd+R)

### Step 4: Test Login

1. Go to `http://localhost:3000/login`
2. Click "Continue with GitHub"
3. Complete OAuth flow
4. Should redirect to `/trips` successfully

## Verification Checklist

After following the steps above, verify:

- [ ] `.env` file contains `AUTH_SECRET`
- [ ] Dev server restarted after adding `AUTH_SECRET`
- [ ] Browser cookies cleared (or using incognito)
- [ ] No errors in browser console
- [ ] Can access `/login` page
- [ ] Can click "Continue with GitHub"
- [ ] OAuth flow completes successfully
- [ ] Redirected to `/trips` after login

## Still Getting Errors?

### Error: "Cannot read properties of undefined (reading 'userId')"

**Cause**: Old session cookie still exists

**Fix**: 
1. Clear cookies again (try incognito window)
2. Make sure you refreshed the page after clearing cookies
3. Try a different browser

### Error: "Configuration error"

**Cause**: Missing OAuth credentials

**Fix**:
```bash
# Check your .env file has these:
cat .env | grep -E "GITHUB_ID|GITHUB_SECRET|AUTH_SECRET"
```

Should show:
```
GITHUB_ID="your_github_id"
GITHUB_SECRET="your_github_secret"
AUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="
```

### Error: "Database error"

**Cause**: Database schema not updated

**Fix**:
```bash
# Check if migration was applied
npx prisma studio
```

In Prisma Studio:
1. Open "Account" table
2. Verify these columns exist:
   - `isPrimaryLogin`
   - `canLogin`
   - `lastLoginAt`
   - `syncStatus`

If columns are missing:
```bash
npx prisma migrate deploy
npx prisma generate
```

### Error: Still seeing SessionTokenError after all steps

**Nuclear Option** - Complete reset:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear Next.js cache
rm -rf .next

# 3. Verify .env
cat .env | grep AUTH_SECRET

# 4. Regenerate Prisma client
npx prisma generate

# 5. Start fresh
npm run dev
```

Then:
1. Open **incognito window**
2. Go to `http://localhost:3000/login`
3. Try login

## Understanding the Fix

### What Changed

The auth system was updated to support multiple accounts. This required:
1. New fields in the `Account` database table
2. Updated JWT token structure (added `userId` field)
3. New session callback logic

### Why Old Tokens Break

Old session tokens were created with the old structure:
```json
{
  "sub": "user_id_here",
  "email": "user@example.com"
}
```

New tokens have:
```json
{
  "sub": "user_id_here",
  "userId": "user_id_here",
  "email": "user@example.com",
  "provider": "github"
}
```

The code now expects `userId` to exist, so old tokens cause errors.

### The Fix in auth.ts

Updated the JWT callback to use `token.sub` as a fallback:

```typescript
async jwt({ token, account, user, trigger }) {
  // ... other code ...
  
  // If token doesn't have userId (old token), use sub as fallback
  if (!token.userId && token.sub) {
    token.userId = token.sub;
  }
  
  return token;
}

async session({ session, token }) {
  // Safely handle token.userId - use sub as fallback
  const userId = token.userId || token.sub;
  
  if (userId && session.user) {
    session.user.id = userId as string;
  }
  
  return session;
}
```

This makes the code backward-compatible with old tokens, but **you still need to clear cookies** because the old tokens might be corrupted or expired.

## Quick Reference

| Issue | Solution |
|-------|----------|
| SessionTokenError | Clear cookies + add AUTH_SECRET |
| "Cannot read properties of undefined" | Clear cookies (use incognito) |
| Configuration error | Check GITHUB_ID, GITHUB_SECRET in .env |
| Database error | Run `npx prisma migrate deploy` |
| Still broken after everything | Delete `.next` folder, restart server, use incognito |

## Success Indicators

You'll know it's working when:

1. ✅ No errors in browser console
2. ✅ `/login` page loads with all provider buttons
3. ✅ Clicking "Continue with GitHub" redirects to GitHub
4. ✅ After authorizing, redirected back to your app
5. ✅ Lands on `/trips` page
6. ✅ Can see your name in the navbar
7. ✅ Can access `/settings/accounts`

## Next Steps After Login Works

1. **Test account management**:
   - Go to `/settings/accounts`
   - See your GitHub account listed
   - Try setting it as primary

2. **Add more providers** (optional):
   - Follow `ENV_SETUP.md` to set up Google, Facebook, etc.
   - Test linking multiple accounts

3. **Proceed with development**:
   - Continue with Phase 2 (data extraction)
   - Build social data fetchers
   - Implement AI personalization

---

**TL;DR**: Add `AUTH_SECRET` to `.env`, restart server, clear cookies (or use incognito), try login again.
