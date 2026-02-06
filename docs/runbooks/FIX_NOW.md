# 🔧 IMMEDIATE FIX NEEDED

## Your Error: SessionTokenError

This is happening because `AUTH_SECRET` is missing from your `.env` file.

## Fix in 3 Steps (2 minutes)

### 1. Add to .env file

Open your `.env` file and add this line:

```env
AUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="
```

### 2. Clear browser cookies (CRITICAL!)

Your old session tokens are incompatible with the new system.

**EASIEST METHOD**: Use incognito/private window
- Open new incognito/private window
- Go to `http://localhost:3000/login`
- Try logging in there

**OR** Clear cookies manually:
1. Open DevTools (F12)
2. Go to Application tab → Storage → Cookies
3. Click on `http://localhost:3000`
4. Right-click → "Clear" (delete ALL cookies)
5. Refresh the page (Cmd+R or Ctrl+R)

### 3. Restart server

```bash
# Press Ctrl+C to stop
npm run dev
```

## Test It

1. Go to `http://localhost:3000/login`
2. Click "Continue with GitHub"
3. Should work now!

---

**That's it!** The error should be gone.

## Still Having Issues?

See these guides:
- `SESSION_ERROR_TROUBLESHOOTING.md` - Complete troubleshooting guide
- `QUICK_FIX_SESSION_ERROR.md` - Detailed fix instructions

## Why This Happened

The auth system was updated to support multiple accounts. Old session cookies are incompatible with the new system. Clearing cookies forces creation of new, compatible session tokens.
