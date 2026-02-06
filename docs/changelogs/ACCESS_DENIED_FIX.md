# Access Denied Error - Fix Guide

## What Happened

You got redirected to `/login/error?error=AccessDenied` which means:

✅ **Good news**: The session cookie errors are gone!  
✅ **Good news**: The server is working correctly!  
❌ **Issue**: GitHub OAuth is denying access

## Common Causes

### 1. You Clicked "Cancel" During OAuth
- When GitHub asks for permission, you clicked "Cancel" or "Deny"
- **Fix**: Try logging in again and click "Authorize" when GitHub asks

### 2. GitHub OAuth App Configuration Issue
Your GitHub OAuth app might not have the correct callback URL configured.

**Check Your GitHub OAuth App Settings**:

1. Go to: https://github.com/settings/developers
2. Click on your OAuth App
3. Verify the **Authorization callback URL** is:
   ```
   http://localhost:3000/api/auth/callback/github
   ```
4. If it's different, update it and save

### 3. Environment Variables Mismatch

Your `.env` file has:
```env
AUTH_GITHUB_ID=Ov23li5aqAYfaYRZnoKe
AUTH_GITHUB_SECRET=7c57d31770d310864a30004b592dc15c9903cb76
```

I've updated `auth.ts` to support both `AUTH_GITHUB_ID` and `GITHUB_ID` formats, so this should work now.

## How to Fix

### Step 1: Verify GitHub OAuth App Settings

1. **Go to GitHub**: https://github.com/settings/developers
2. **Find your OAuth App** (or create one if missing)
3. **Check these settings**:
   - **Application name**: Can be anything (e.g., "Ntourage Travel Dev")
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
   - **Enable Device Flow**: Not required

4. **Copy the credentials**:
   - Client ID should match `AUTH_GITHUB_ID` in your `.env`
   - Generate new Client Secret if needed

### Step 2: Verify .env File

Your `.env` should have:

```env
# NextAuth
AUTH_SECRET="238ee17bc98fb82b20e7311903d69a846bebd67c58bd7943ff982d8ac66b424e"
NEXTAUTH_URL="http://localhost:3000"

# GitHub OAuth
AUTH_GITHUB_ID="Ov23li5aqAYfaYRZnoKe"
AUTH_GITHUB_SECRET="7c57d31770d310864a30004b592dc15c9903cb76"
```

### Step 3: Restart Server

```bash
# Stop the server (Ctrl+C in the terminal running npm run dev)
# Then restart:
npm run dev
```

### Step 4: Try Login Again

1. **Open incognito window** (to avoid cookie issues)
2. **Go to**: `http://localhost:3000/login`
3. **Click**: "Continue with GitHub"
4. **When GitHub asks for permission**: Click "Authorize"
5. **Should work!** ✅

## Troubleshooting

### If You See "Application Suspended" on GitHub

Your OAuth app might be suspended. Check:
1. GitHub Settings → Developer Settings → OAuth Apps
2. If suspended, you'll see a warning
3. Create a new OAuth app if needed

### If You See "Redirect URI Mismatch"

The callback URL is wrong. It must be **exactly**:
```
http://localhost:3000/api/auth/callback/github
```

**Common mistakes**:
- ❌ `http://localhost:3000/api/auth/callback` (missing `/github`)
- ❌ `http://localhost:3000/callback` (wrong path)
- ❌ `https://localhost:3000/...` (should be `http` for local dev)
- ❌ `http://127.0.0.1:3000/...` (should be `localhost`)

### If You See "Invalid Client ID"

Your `AUTH_GITHUB_ID` in `.env` doesn't match your GitHub OAuth app.

**Fix**:
1. Go to GitHub OAuth app settings
2. Copy the **Client ID**
3. Update `.env`:
   ```env
   AUTH_GITHUB_ID="your_actual_client_id_here"
   ```
4. Restart server

### If You See "Invalid Client Secret"

Your `AUTH_GITHUB_SECRET` is wrong or expired.

**Fix**:
1. Go to GitHub OAuth app settings
2. Click "Generate a new client secret"
3. Copy the new secret
4. Update `.env`:
   ```env
   AUTH_GITHUB_SECRET="your_new_secret_here"
   ```
5. Restart server

## Quick Checklist

- [ ] GitHub OAuth app exists at https://github.com/settings/developers
- [ ] Callback URL is `http://localhost:3000/api/auth/callback/github`
- [ ] Client ID matches `AUTH_GITHUB_ID` in `.env`
- [ ] Client Secret is valid and matches `AUTH_GITHUB_SECRET` in `.env`
- [ ] `AUTH_SECRET` exists in `.env`
- [ ] `NEXTAUTH_URL=http://localhost:3000` in `.env`
- [ ] Dev server restarted after any `.env` changes
- [ ] Using incognito window to test
- [ ] Clicked "Authorize" when GitHub asks for permission

## Expected Flow

1. Click "Continue with GitHub" on `/login`
2. Redirected to GitHub.com
3. GitHub shows: "Authorize [Your App Name]"
4. Click "Authorize"
5. Redirected back to your app
6. Lands on `/trips` page
7. ✅ Success!

## Still Getting Access Denied?

### Check Browser Console

1. Open DevTools (F12)
2. Go to Console tab
3. Look for any error messages
4. Share them if you need help

### Check Server Logs

Look at your terminal where `npm run dev` is running. Any errors there?

### Try Different Browser

Sometimes browser extensions can interfere. Try:
1. Different browser
2. Incognito/private window
3. Disable browser extensions

### Create New OAuth App

If nothing works, create a fresh GitHub OAuth app:

1. **Go to**: https://github.com/settings/applications/new
2. **Fill in**:
   - Application name: `Ntourage Travel Local`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. **Click**: "Register application"
4. **Copy** Client ID and generate Client Secret
5. **Update** `.env` with new credentials
6. **Restart** server
7. **Try** login again

## What Changed

I've made these fixes:

1. ✅ Created `/app/login/error/page.tsx` - Now you'll see a proper error page instead of 404
2. ✅ Updated `auth.ts` to support both `AUTH_GITHUB_ID` and `GITHUB_ID` formats
3. ✅ The error page explains what went wrong and how to fix it

## Next Steps

1. **Verify GitHub OAuth app settings** (most common issue)
2. **Try login again** in incognito window
3. **Click "Authorize"** when GitHub asks
4. **Should work!** ✅

---

**TL;DR**: Check that your GitHub OAuth app callback URL is `http://localhost:3000/api/auth/callback/github`, then try logging in again and click "Authorize" when GitHub asks for permission.
