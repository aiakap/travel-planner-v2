# Authentication Setup Guide

Complete guide for setting up and troubleshooting the authentication system in the Travel Planner application.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Provider Setup](#provider-setup)
- [Common Errors](#common-errors)
- [Troubleshooting](#troubleshooting)
- [Debug Tools](#debug-tools)
- [Testing](#testing)

---

## Quick Start

### 1. Generate AUTH_SECRET

The `AUTH_SECRET` is required for NextAuth v5 to encrypt session tokens.

```bash
# Generate a secure random secret
openssl rand -base64 32
```

### 2. Add to .env file

Create or update your `.env` file:

```env
# Required - Auth Secret
AUTH_SECRET="your-generated-secret-here"

# Required - Database
DATABASE_URL="postgresql://user:password@localhost:5432/travel_planner"

# Required - At least one OAuth provider
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### 3. Restart Development Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

### 4. Clear Browser Cookies

**Option A: Use Incognito/Private Window** (Recommended)
- Open a new incognito/private browsing window
- Navigate to `http://localhost:3000/login`

**Option B: Clear Cookies Manually**
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Delete all cookies for `localhost:3000`
4. Refresh the page

---

## Environment Variables

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `AUTH_SECRET` | Session encryption key | `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection string | Your database provider |

### OAuth Provider Variables

At least one OAuth provider must be configured:

#### GitHub (Recommended for Development)

```env
GITHUB_CLIENT_ID="your-client-id"
GITHUB_CLIENT_SECRET="your-client-secret"
```

[Create GitHub OAuth App →](https://github.com/settings/developers)

#### Google

```env
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

[Create Google OAuth App →](https://console.cloud.google.com/apis/credentials)

#### Facebook

```env
FACEBOOK_CLIENT_ID="your-app-id"
FACEBOOK_CLIENT_SECRET="your-app-secret"
```

[Create Facebook App →](https://developers.facebook.com/apps)

#### Apple

```env
APPLE_CLIENT_ID="your-service-id"
APPLE_CLIENT_SECRET="your-client-secret"
```

[Create Apple Service ID →](https://developer.apple.com/account/resources/identifiers/list/serviceId)

#### Twitter (X)

```env
TWITTER_CLIENT_ID="your-client-id"
TWITTER_CLIENT_SECRET="your-client-secret"
```

[Create Twitter App →](https://developer.twitter.com/en/portal/dashboard)

#### LinkedIn

```env
LINKEDIN_CLIENT_ID="your-client-id"
LINKEDIN_CLIENT_SECRET="your-client-secret"
```

[Create LinkedIn App →](https://www.linkedin.com/developers/apps)

#### Spotify

```env
SPOTIFY_CLIENT_ID="your-client-id"
SPOTIFY_CLIENT_SECRET="your-client-secret"
```

[Create Spotify App →](https://developer.spotify.com/dashboard)

### Optional Variables

```env
# NextAuth URL (auto-detected in development)
NEXTAUTH_URL="http://localhost:3000"

# Google Maps (for location features)
GOOGLE_MAPS_API_KEY="your-maps-api-key"
```

---

## Provider Setup

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Travel Planner (Dev)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID**
6. Click "Generate a new client secret"
7. Copy the **Client Secret**
8. Add both to your `.env` file

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure consent screen if prompted
6. Choose "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy **Client ID** and **Client Secret**
9. Add to `.env` file

### Callback URLs

All OAuth providers need the callback URL configured:

```
http://localhost:3000/api/auth/callback/{provider}
```

Replace `{provider}` with: `github`, `google`, `facebook`, `apple`, `twitter`, `linkedin`, or `spotify`

---

## Common Errors

### SessionTokenError

**Error**: `SessionTokenError: Cannot read properties of undefined`

**Cause**: Missing `AUTH_SECRET` in `.env` file

**Fix**:
1. Add `AUTH_SECRET` to `.env` file
2. Clear all browser cookies
3. Restart development server

```bash
# Generate secret
openssl rand -base64 32

# Add to .env
echo 'AUTH_SECRET="paste-secret-here"' >> .env

# Restart
npm run dev
```

### OAuthAccountNotLinked

**Error**: `OAuthAccountNotLinked`

**Cause**: Email already associated with another provider

**Fix**:
1. Sign in with your original provider
2. Go to Settings → Accounts
3. Link additional providers from there

### Configuration Error

**Error**: `Configuration error`

**Cause**: Missing or invalid OAuth provider credentials

**Fix**:
1. Check all provider credentials in `.env`
2. Ensure both CLIENT_ID and CLIENT_SECRET are set
3. Verify callback URLs in provider settings
4. Check [Debug Dashboard](/auth/debug) for details

### Database Connection Error

**Error**: `Can't reach database server`

**Cause**: Invalid `DATABASE_URL` or database not running

**Fix**:
```bash
# Check DATABASE_URL format
# postgresql://USER:PASSWORD@HOST:PORT/DATABASE

# Test connection
npx prisma db push

# If using Docker
docker-compose up -d postgres
```

### Access Denied

**Error**: `Access denied`

**Cause**: User cancelled OAuth flow or denied permissions

**Fix**: Simply try signing in again and approve the permissions

---

## Troubleshooting

### Step 1: Check Environment Variables

```bash
# Verify AUTH_SECRET is set
cat .env | grep AUTH_SECRET

# Should output something like:
# AUTH_SECRET="ZrdWCbMtIPw2bQ7WRISNioCnLo8CjtcMkDcaY/8BRRg="
```

### Step 2: Validate Configuration

Visit the debug dashboard:
```
http://localhost:3000/auth/debug
```

This shows:
- ✅ Environment status
- ✅ Database connection
- ✅ Session status
- ✅ Cookie information
- ✅ Configured providers

### Step 3: Check Server Logs

Look for auth-related logs in your terminal:

```
[AUTH:SIGNIN] User signed in
[AUTH:SESSION_CREATED] Session created
[AUTH:ERROR] Error details...
```

### Step 4: Clear Everything

If issues persist:

```bash
# 1. Stop server
Ctrl+C

# 2. Clear cookies (in browser)
# DevTools → Application → Cookies → Delete All

# 3. Restart server
npm run dev

# 4. Try in incognito window
```

### Step 5: Check Database

```bash
# Ensure database is up to date
npx prisma db push

# Check if User table exists
npx prisma studio
```

---

## Debug Tools

### Debug Dashboard

Comprehensive debugging interface:
```
http://localhost:3000/auth/debug
```

Features:
- Real-time auth status
- Environment validation
- Database connection test
- Cookie inspection
- Session details
- Clear cookies button

### Validation API

Programmatic access to auth status:
```bash
curl http://localhost:3000/api/auth/validate
```

Returns JSON with:
- Overall status (healthy/warning/error)
- Environment configuration
- Session information
- Database status
- Cookie validation
- Recommendations

### Auth Status Indicator

In development mode, a status indicator appears in the bottom-right corner:

- 🟢 Green: Everything working
- 🟡 Yellow: Warnings detected
- 🔴 Red: Errors present

Click it to open the debug dashboard.

---

## Testing

### Test Authentication Flow

1. **Start Fresh**:
   ```bash
   # Clear cookies
   # Open incognito window
   ```

2. **Test Sign In**:
   - Go to `/login`
   - Click a provider
   - Complete OAuth flow
   - Should redirect to dashboard

3. **Verify Session**:
   - Check `/auth/debug`
   - Session should show as authenticated
   - User should exist in database

4. **Test Sign Out**:
   - Click "Sign Out"
   - Session should be cleared
   - Redirected to home page

### Test Error Handling

1. **Missing AUTH_SECRET**:
   ```bash
   # Remove AUTH_SECRET from .env
   # Restart server
   # Try to sign in
   # Should see clear error message
   ```

2. **Invalid Provider Credentials**:
   ```bash
   # Set invalid GITHUB_CLIENT_ID
   # Try GitHub sign in
   # Should show provider error
   ```

3. **Database Disconnected**:
   ```bash
   # Stop database
   # Try to sign in
   # Should show database error
   ```

### Automated Testing

Run the validation script:
```bash
# Check auth configuration
npm run auth:validate
```

---

## Best Practices

### Development

1. **Always use incognito windows** when testing auth changes
2. **Check debug dashboard** before asking for help
3. **Keep AUTH_SECRET secure** - never commit to git
4. **Use environment-specific secrets** for dev/staging/prod

### Production

1. **Rotate AUTH_SECRET periodically**
2. **Use strong, unique secrets** for each environment
3. **Enable HTTPS** for all OAuth callbacks
4. **Monitor auth errors** in production logs
5. **Set up proper error tracking** (Sentry, etc.)

### Security

1. **Never expose AUTH_SECRET** in client code
2. **Validate all OAuth callbacks** server-side
3. **Use CSRF protection** (enabled by default)
4. **Implement rate limiting** on auth endpoints
5. **Log all auth events** for audit trail

---

## FAQ

### Q: Do I need all OAuth providers?

**A**: No, configure only the providers you want to support. At minimum, configure one provider (GitHub recommended for development).

### Q: Can I use NEXTAUTH_SECRET instead of AUTH_SECRET?

**A**: Yes, but `AUTH_SECRET` is preferred for NextAuth v5. `NEXTAUTH_SECRET` is supported for backward compatibility.

### Q: Why do I need to clear cookies?

**A**: Old session cookies from previous auth configurations are incompatible with the current system. Clearing them forces creation of new, valid cookies.

### Q: How do I add a new OAuth provider?

**A**: 
1. Add credentials to `.env`
2. Provider is automatically configured in `auth.ts`
3. Restart server
4. Test sign in

### Q: Can users link multiple accounts?

**A**: Yes! Users can link multiple OAuth providers to a single account via Settings → Accounts.

### Q: What if my database is on a different machine?

**A**: Update `DATABASE_URL` with the correct host, port, and credentials. Ensure the database is accessible from your development machine.

---

## Support

### Getting Help

1. **Check Debug Dashboard**: `/auth/debug`
2. **Review Logs**: Look for `[AUTH:ERROR]` messages
3. **Check Documentation**: This file and NextAuth docs
4. **Search Issues**: Common problems have known solutions

### Reporting Issues

When reporting auth issues, include:

1. Error message (exact text)
2. Steps to reproduce
3. Debug dashboard screenshot
4. Validation API response
5. Relevant environment variables (without secrets!)

Example:
```json
{
  "error": "SessionTokenError",
  "environment": {
    "hasAuthSecret": false,
    "hasDatabaseUrl": true,
    "configuredProviders": ["GitHub"]
  }
}
```

---

## Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Adapter Docs](https://authjs.dev/reference/adapter/prisma)
- [OAuth Provider Guides](https://next-auth.js.org/providers/)
- [Environment Variables Best Practices](https://nextjs.org/docs/basic-features/environment-variables)

---

**Last Updated**: January 2026  
**NextAuth Version**: 5.x  
**Prisma Version**: 5.x
