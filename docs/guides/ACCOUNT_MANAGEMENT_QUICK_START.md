# Account Management Quick Start Guide

## Getting Started

### 1. Set Up OAuth Credentials

Follow the detailed instructions in `ENV_SETUP.md` to obtain credentials for each provider.

**Minimum Required** (to start testing):
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate_with_openssl_rand_base64_32"
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### 2. Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in your `.env` file.

### 3. Migrate Existing Users

If you have existing users with GitHub accounts, run:

```bash
npx ts-node scripts/migrate-existing-accounts.ts
```

This will:
- Set `isPrimaryLogin: true` for their GitHub account
- Set `canLogin: true`
- Set `syncStatus: "active"`

### 4. Start Development Server

```bash
npm run dev
```

---

## Using the System

### For New Users

1. Navigate to `http://localhost:3000/login`
2. Choose any provider (Google recommended)
3. Complete OAuth flow
4. Redirected to `/trips`

### For Existing Users

1. Log in with your existing GitHub account
2. Go to `/settings/accounts`
3. Click "Connect Google" (or any other provider)
4. Complete OAuth flow
5. Now you can log in with either GitHub or Google

### Managing Accounts

**View Connected Accounts**:
- Navigate to `/settings/accounts`
- See all linked accounts with status badges

**Add New Account**:
- In `/settings/accounts`, scroll to "Add More Accounts"
- Click on any available provider
- Complete OAuth flow

**Set Primary Account**:
- In `/settings/accounts`, click "Set as Primary" on any non-primary account
- Primary badge will move to selected account

**Disconnect Account**:
- In `/settings/accounts`, click "Disconnect" on any account
- Confirm in dialog
- Note: Cannot disconnect if it's your only account

---

## Quick Reference

### Routes

| Route | Purpose |
|-------|---------|
| `/login` | Multi-provider login page |
| `/settings/accounts` | Manage connected accounts |
| `/api/auth/signin/{provider}` | Initiate OAuth flow |
| `/api/auth/callback/{provider}` | OAuth callback |

### Server Actions

```typescript
import { 
  getConnectedAccounts,
  getAvailableProviders,
  disconnectProvider,
  setPrimaryAccount,
  validateAccountRequirement,
  getAccountStats
} from "@/lib/actions/account-management-actions";

// Get user's accounts
const accounts = await getConnectedAccounts();

// Get providers not yet connected
const available = await getAvailableProviders();

// Disconnect a provider
const result = await disconnectProvider("spotify");

// Set primary account
await setPrimaryAccount("google");

// Check if user has valid account
const isValid = await validateAccountRequirement(userId);

// Get statistics
const stats = await getAccountStats();
```

### Client-Side Login

```typescript
import { signIn } from "next-auth/react";

// Initiate login with specific provider
await signIn("google", { callbackUrl: "/trips" });
```

---

## Troubleshooting

### Issue: Provider not showing on login page

**Check**:
1. Environment variables are set
2. Provider is not commented out in `auth.ts`
3. Server restarted after adding env vars

### Issue: OAuth callback error

**Check**:
1. Redirect URI in provider settings matches exactly
2. Format: `http://localhost:3000/api/auth/callback/{provider}`
3. Provider credentials are correct

### Issue: Cannot disconnect account

**Check**:
1. User has more than one account
2. Account is not the only active account
3. Check `canLogin` and `syncStatus` in database

### Issue: Accounts not linking automatically

**Check**:
1. Both accounts have same email
2. Email is returned by provider (some providers don't return email)
3. Check signIn callback logic in `auth.ts`

---

## Development Tips

### View Database in Prisma Studio

```bash
npx prisma studio
```

Navigate to `Account` table to see all accounts with new fields.

### Check Session Data

Add this to any server component:

```typescript
import { auth } from "@/auth";

const session = await auth();
console.log("Session:", session);
```

### Debug OAuth Flow

Add logging to `auth.ts` signIn callback:

```typescript
console.log("OAuth sign in:", {
  provider: account.provider,
  email: user.email,
  existingAccount: !!existingAccount
});
```

---

## Production Checklist

Before deploying to production:

- [ ] All OAuth apps created and configured
- [ ] Production redirect URIs added to all providers
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] `NEXTAUTH_SECRET` is secure (32+ characters)
- [ ] Token encryption implemented
- [ ] Rate limiting configured
- [ ] Error monitoring set up
- [ ] Analytics tracking added
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance verified
- [ ] Provider app verification completed (Google, Facebook)

---

## Support

For issues or questions:
1. Check `ACCOUNT_MANAGEMENT_TESTING_GUIDE.md` for test scenarios
2. Review `ENV_SETUP.md` for provider setup
3. Check `ACCOUNT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md` for architecture details
4. Review NextAuth.js documentation: https://next-auth.js.org/

---

## What's Next?

After account management is working:

1. **Phase 2**: Implement data extractors for each provider
   - YouTube subscriptions and liked videos
   - Spotify listening history
   - Facebook liked pages
   - Twitter follows and interests

2. **Phase 3**: Build AI interest analyzer
   - Categorize social data into travel interests
   - Generate confidence scores
   - Consolidate across providers

3. **Phase 4**: Integrate with personalization
   - Enhance trip suggestions
   - Improve AI chat context
   - Add social proof features

See the main plan file for complete roadmap.
