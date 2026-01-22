# Account Management Setup Checklist

Use this checklist to set up and verify the account management system.

## Pre-Implementation Checklist

- [x] Database schema updated with new fields
- [x] Prisma migration created
- [x] Prisma client generated
- [x] NextAuth configured with 7 providers
- [x] Account management actions created
- [x] Settings UI created
- [x] Login UI created
- [x] Provider icons created
- [x] Documentation created

## Setup Checklist

### 1. Environment Variables

- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Add NEXTAUTH_SECRET to .env
- [ ] Set NEXTAUTH_URL (http://localhost:3000 for dev)
- [ ] Keep existing GITHUB_ID and GITHUB_SECRET

### 2. Google OAuth Setup (Priority)

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project or select existing
- [ ] Enable APIs:
  - [ ] Google+ API
  - [ ] YouTube Data API v3
- [ ] Create OAuth 2.0 credentials
- [ ] Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
- [ ] Copy Client ID to GOOGLE_CLIENT_ID in .env
- [ ] Copy Client Secret to GOOGLE_CLIENT_SECRET in .env

### 3. Facebook OAuth Setup (Optional)

- [ ] Go to [Facebook Developers](https://developers.facebook.com/)
- [ ] Create new app
- [ ] Add Facebook Login product
- [ ] Add redirect URI: `http://localhost:3000/api/auth/callback/facebook`
- [ ] Copy App ID to FACEBOOK_CLIENT_ID in .env
- [ ] Copy App Secret to FACEBOOK_CLIENT_SECRET in .env

### 4. Apple Sign In Setup (Optional)

- [ ] Go to [Apple Developer](https://developer.apple.com/)
- [ ] Create App ID with Sign in with Apple capability
- [ ] Create Services ID
- [ ] Configure return URL: `http://localhost:3000/api/auth/callback/apple`
- [ ] Generate client secret JWT
- [ ] Add APPLE_CLIENT_ID and APPLE_CLIENT_SECRET to .env

### 5. Twitter/X OAuth Setup (Optional)

- [ ] Go to [Twitter Developer Portal](https://developer.twitter.com/)
- [ ] Create new app
- [ ] Enable OAuth 2.0
- [ ] Add callback URL: `http://localhost:3000/api/auth/callback/twitter`
- [ ] Copy credentials to .env

### 6. LinkedIn OAuth Setup (Optional)

- [ ] Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
- [ ] Create new app
- [ ] Add Sign In with LinkedIn
- [ ] Configure redirect URL: `http://localhost:3000/api/auth/callback/linkedin`
- [ ] Copy credentials to .env

### 7. Spotify OAuth Setup (Optional)

- [ ] Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- [ ] Create new app
- [ ] Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`
- [ ] Copy credentials to .env

### 8. Database Migration

- [ ] Verify .env has DATABASE_URL
- [ ] Run migration (if not already applied):
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Verify migration applied:
  ```bash
  npx prisma migrate status
  ```

### 9. Migrate Existing Users

If you have existing users with GitHub accounts:

- [ ] Run migration script:
  ```bash
  npx ts-node scripts/migrate-existing-accounts.ts
  ```
- [ ] Verify in Prisma Studio that accounts have new fields

### 10. Start Development Server

- [ ] Start server: `npm run dev`
- [ ] Verify no errors in console
- [ ] Check that server starts on port 3000

## Testing Checklist

### Basic Functionality

- [ ] Navigate to http://localhost:3000/login
- [ ] Verify all configured providers show up
- [ ] Google has "Recommended" badge
- [ ] Provider icons display correctly

### Test Scenario 1: New User Signup

- [ ] Click "Continue with Google" (or any provider you configured)
- [ ] Complete OAuth flow
- [ ] Verify redirected to /trips
- [ ] Check Prisma Studio: new user and account created
- [ ] Verify account has isPrimaryLogin: true

### Test Scenario 2: Add Second Account

- [ ] Log in with first provider
- [ ] Navigate to /settings/accounts
- [ ] Verify current account shows with "Primary" badge
- [ ] Click "Connect" on another provider
- [ ] Complete OAuth flow
- [ ] Verify both accounts show in list
- [ ] Verify second account doesn't have "Primary" badge

### Test Scenario 3: Login with Different Account

- [ ] Log out
- [ ] Go to /login
- [ ] Click on second provider (not the primary one)
- [ ] Complete OAuth
- [ ] Verify logged in as same user
- [ ] Verify can see same trips/data

### Test Scenario 4: Disconnect Validation

- [ ] If you have only one account, verify disconnect button is disabled
- [ ] If you have multiple accounts, disconnect button should be enabled
- [ ] Try to disconnect (if multiple accounts)
- [ ] Verify confirmation dialog appears
- [ ] Confirm disconnect
- [ ] Verify account removed from list

### Test Scenario 5: Set Primary Account

- [ ] Have at least 2 accounts connected
- [ ] Click "Set as Primary" on non-primary account
- [ ] Verify "Primary" badge moves to selected account
- [ ] Verify only one account has primary badge

### Test Scenario 6: Cannot Disconnect Last Account

- [ ] Disconnect all accounts except one
- [ ] Verify disconnect button is disabled on last account
- [ ] Hover over button (if tooltip implemented)
- [ ] Try to click - should show error or be disabled

## Verification Checklist

### Database Verification

- [ ] Open Prisma Studio: `npx prisma studio`
- [ ] Navigate to Account table
- [ ] Verify new fields exist:
  - [ ] isPrimaryLogin
  - [ ] canLogin
  - [ ] lastLoginAt
  - [ ] syncStatus
- [ ] Check that each user has at least one account with canLogin: true
- [ ] Verify no duplicate provider accounts

### Code Verification

- [ ] No TypeScript errors: `npm run build`
- [ ] No linter errors: `npm run lint`
- [ ] All imports resolve correctly
- [ ] No console errors in browser

### UI Verification

- [ ] Login page responsive on mobile
- [ ] Settings page responsive on mobile
- [ ] All buttons have proper hover states
- [ ] Loading states work during async operations
- [ ] Badges display correctly
- [ ] Icons render properly

## Production Checklist

Before deploying to production:

### OAuth Configuration

- [ ] Update all provider redirect URIs to production domain
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Verify all OAuth apps are in production mode (not sandbox)
- [ ] Test OAuth flows on production domain

### Security

- [ ] Implement token encryption (Phase 5)
- [ ] Enable rate limiting
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure CORS properly
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags

### Compliance

- [ ] Update Privacy Policy with provider data usage
- [ ] Update Terms of Service
- [ ] Add GDPR compliance (EU users)
- [ ] Add CCPA compliance (CA users)
- [ ] Create data deletion workflow

### Provider Verification

- [ ] Submit Google app for verification (YouTube scopes)
- [ ] Submit Facebook app for review (user_likes permission)
- [ ] Verify Apple Sign In requirements met
- [ ] Test all providers in production

### Monitoring

- [ ] Set up analytics for login methods
- [ ] Track account linking rates
- [ ] Monitor OAuth errors
- [ ] Alert on high disconnect rates

## Troubleshooting

### Issue: OAuth callback error

**Check**:
- [ ] Redirect URI matches exactly in provider settings
- [ ] Environment variables are set correctly
- [ ] Server restarted after adding env vars
- [ ] Provider app is in correct mode (dev/production)

### Issue: Cannot see new fields in database

**Check**:
- [ ] Migration was applied successfully
- [ ] Prisma client was regenerated
- [ ] Database connection is working

### Issue: Accounts not linking automatically

**Check**:
- [ ] Email is returned by provider
- [ ] Email matches exactly (case-sensitive)
- [ ] signIn callback logic is working
- [ ] No errors in server logs

## Next Steps

After completing this checklist:

1. **Test thoroughly** using `ACCOUNT_MANAGEMENT_TESTING_GUIDE.md`
2. **Monitor usage** for first few days
3. **Gather feedback** from users
4. **Proceed to Phase 2**: Implement social data extractors
5. **Submit for provider verification**: Google, Facebook (allow 4-8 weeks)

## Support Resources

- **Setup**: `ENV_SETUP.md`
- **Quick Start**: `ACCOUNT_MANAGEMENT_QUICK_START.md`
- **Testing**: `ACCOUNT_MANAGEMENT_TESTING_GUIDE.md`
- **Implementation**: `ACCOUNT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md`
- **Main Plan**: See plan files in `.cursor/plans/`

---

**Status**: ✅ All implementation complete - Ready for OAuth setup and testing
