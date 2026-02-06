# Quick Fix: SessionTokenError

## The Problem

You're getting a `SessionTokenError` because `NEXTAUTH_SECRET` is missing from your `.env` file. This is required for NextAuth to encrypt and decrypt session tokens.

## The Solution

### Step 1: Add AUTH_SECRET to .env

NextAuth v5 uses `AUTH_SECRET` (preferred) or `NEXTAUTH_SECRET` (backward compatible).

Add this line to your `.env` file:

```env
AUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="
```

**OR** use the old name (both work):
```env
NEXTAUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="
```

Or generate your own:
```bash
openssl rand -base64 32
```

### Step 2: Clear Browser Cookies (Important!)

Since the session token format changed, you need to clear your browser cookies:

**Option A: Clear specific cookies**
1. Open browser DevTools (F12)
2. Go to Application tab → Cookies
3. Delete cookies starting with `next-auth` or `__Secure-next-auth`

**Option B: Use incognito/private window**
1. Open incognito/private browsing window
2. Navigate to `http://localhost:3000/login`
3. Try logging in again

**Option C: Clear all localhost cookies**
1. In DevTools → Application → Cookies
2. Right-click on `http://localhost:3000`
3. Click "Clear"

### Step 3: Restart Development Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### Step 4: Test Login

1. Navigate to `http://localhost:3000/login`
2. Click "Continue with GitHub"
3. Should work now!

## Why This Happened

When we updated the auth configuration:
1. Added new fields to Account model
2. Changed the session callback
3. Old session tokens are now invalid
4. Need `NEXTAUTH_SECRET` to create new valid tokens

## Verification

After adding `NEXTAUTH_SECRET` and clearing cookies:

```bash
# Check .env has the secret
cat .env | grep NEXTAUTH_SECRET

# Should show:
# NEXTAUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="
```

## If Still Not Working

1. **Check environment variables are loaded**:
   - Restart dev server after adding to .env
   - Verify no typos in variable names

2. **Check database connection**:
   ```bash
   npx prisma studio
   ```
   Should open without errors

3. **Check Account table has new fields**:
   - Open Prisma Studio
   - Navigate to Account table
   - Verify `isPrimaryLogin`, `canLogin`, `lastLoginAt`, `syncStatus` columns exist

4. **Run migration if needed**:
   ```bash
   npx prisma migrate deploy
   ```

5. **Regenerate Prisma client**:
   ```bash
   npx prisma generate
   ```

## Complete .env Template

Your `.env` file should have at minimum:

```env
# Database
DATABASE_URL="your_existing_database_url"

# NextAuth v5 (REQUIRED!)
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="
# OR use old name (both work in v5):
# NEXTAUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="

# GitHub (Existing)
GITHUB_ID="your_existing_github_id"
GITHUB_SECRET="your_existing_github_secret"

# Google (Optional for now, but recommended)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Other existing variables...
OPENAI_API_KEY="..."
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="..."
```

## Expected Behavior After Fix

1. Navigate to `/login`
2. See all provider options
3. Click "Continue with GitHub"
4. OAuth flow completes
5. Redirected to `/trips`
6. No errors in console

---

**Quick Summary**: Add `NEXTAUTH_SECRET` to `.env`, clear browser cookies, restart server, try again!
