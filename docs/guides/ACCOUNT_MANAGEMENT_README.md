# Multi-Provider Account Management System

## Overview

A comprehensive account management system that allows users to link multiple social login providers (Google, Facebook, Apple, Twitter, LinkedIn, Spotify, GitHub) to a single profile and authenticate with any of them.

## Key Features

✅ **Multi-Provider Support**: 7 OAuth providers integrated
✅ **Flexible Login**: Log in with any linked account
✅ **Account Linking**: Automatic linking by email or manual linking
✅ **Safety Validation**: Prevents disconnecting last account
✅ **Primary Account**: Set preferred login method
✅ **Account Management UI**: Intuitive settings page
✅ **Secure**: CSRF protection, token management, ownership validation

## Quick Links

- **Setup Guide**: [`ENV_SETUP.md`](ENV_SETUP.md)
- **Quick Start**: [`ACCOUNT_MANAGEMENT_QUICK_START.md`](ACCOUNT_MANAGEMENT_QUICK_START.md)
- **Testing Guide**: [`ACCOUNT_MANAGEMENT_TESTING_GUIDE.md`](ACCOUNT_MANAGEMENT_TESTING_GUIDE.md)
- **Implementation Details**: [`ACCOUNT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md`](ACCOUNT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md)

## Architecture

### Core Components

1. **NextAuth Configuration** (`auth.ts`)
   - 7 OAuth providers configured
   - Account linking logic
   - Session management

2. **Account Management Actions** (`lib/actions/account-management-actions.ts`)
   - Get connected accounts
   - Disconnect provider (with validation)
   - Set primary account
   - Account statistics

3. **Login UI** (`app/login/`)
   - Multi-provider login page
   - Error handling
   - Terms acknowledgment

4. **Settings UI** (`app/settings/accounts/`)
   - View connected accounts
   - Add new providers
   - Disconnect accounts
   - Set primary account

5. **Provider Icons** (`components/provider-icon.tsx`)
   - Brand-accurate SVG icons
   - Consistent sizing

## Database Schema

```prisma
model Account {
  // Standard NextAuth fields
  id, userId, type, provider, providerAccountId
  refresh_token, access_token, expires_at, token_type, scope
  id_token, session_state
  
  // Account management fields
  isPrimaryLogin    Boolean   @default(false)
  canLogin          Boolean   @default(true)
  lastLoginAt       DateTime?
  syncStatus        String    @default("active")
  
  @@unique([provider, providerAccountId])
  @@index([userId, canLogin])
}
```

## User Flows

### New User Signup
```
User → /login → Select Provider → OAuth → Account Created (primary) → /trips
```

### Add Second Account
```
Logged In → /settings/accounts → Connect Provider → OAuth → Account Linked → Settings
```

### Login with Any Account
```
User → /login → Select Any Linked Provider → OAuth → Authenticated → /trips
```

### Disconnect Account
```
Settings → Disconnect → Validation Check → Confirm → Account Disabled
```

## API Reference

### Server Actions

```typescript
// Get connected accounts
const accounts = await getConnectedAccounts();
// Returns: ConnectedAccount[]

// Get available providers
const available = await getAvailableProviders();
// Returns: string[] (e.g., ["facebook", "spotify"])

// Disconnect provider
const result = await disconnectProvider("spotify");
// Returns: { success: boolean; error?: string }

// Set primary account
await setPrimaryAccount("google");
// Returns: { success: boolean }

// Validate account requirement
const isValid = await validateAccountRequirement(userId);
// Returns: boolean

// Get account statistics
const stats = await getAccountStats();
// Returns: { total, active, disconnected, providers, lastUsed }
```

### Client-Side Login

```typescript
import { signIn } from "next-auth/react";

// Login with specific provider
await signIn("google", { callbackUrl: "/trips" });
```

## Security

### Built-in Protections
- CSRF protection (NextAuth)
- Ownership validation (all actions verify user owns account)
- Duplicate prevention (unique constraint on provider + providerAccountId)
- Session-based authentication
- Secure token storage

### Validation Rules
- At least one active account required
- Cannot disconnect last account
- Cannot modify other users' accounts
- Email-based linking only for matching emails

## Configuration

### Environment Variables

See `ENV_SETUP.md` for complete setup instructions.

**Required**:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_secret_here"
```

**Per Provider**:
```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
# ... etc for each provider
```

### OAuth Redirect URIs

Format: `{NEXTAUTH_URL}/api/auth/callback/{provider}`

Examples:
- `http://localhost:3000/api/auth/callback/google`
- `http://localhost:3000/api/auth/callback/facebook`
- `https://yourdomain.com/api/auth/callback/google` (production)

## Testing

Run the comprehensive test suite:

```bash
# Manual testing
# Follow ACCOUNT_MANAGEMENT_TESTING_GUIDE.md

# Migrate existing users
npx ts-node scripts/migrate-existing-accounts.ts

# View database
npx prisma studio
```

## Monitoring

### Key Metrics to Track
- Login method distribution (which providers are used most)
- Account linking rate (% of users with 2+ accounts)
- Disconnect rate (how often users disconnect accounts)
- OAuth errors by provider
- Average accounts per user

### Database Queries

```sql
-- Account distribution by provider
SELECT provider, COUNT(*) as count
FROM "Account"
WHERE "canLogin" = true AND "syncStatus" = 'active'
GROUP BY provider
ORDER BY count DESC;

-- Users with multiple accounts
SELECT "userId", COUNT(*) as account_count
FROM "Account"
WHERE "canLogin" = true
GROUP BY "userId"
HAVING COUNT(*) > 1;

-- Recently used accounts
SELECT provider, "lastLoginAt"
FROM "Account"
WHERE "lastLoginAt" IS NOT NULL
ORDER BY "lastLoginAt" DESC
LIMIT 10;
```

## Limitations

### Provider-Specific Limitations
- **YouTube Watch History**: Not accessible via API
- **Facebook Friends**: Only mutual app users visible
- **Apple**: Minimal data (name/email one-time only)
- **Instagram**: Requires business account for insights
- **LinkedIn**: Skills/interests deprecated

### Technical Limitations
- OAuth tokens stored in database (should be encrypted in production)
- No automatic token refresh (implement in Phase 5)
- No login history tracking (optional enhancement)

## Roadmap

### Completed (Phase 1)
- ✅ Multi-provider OAuth setup
- ✅ Account linking and management
- ✅ Settings UI
- ✅ Login UI
- ✅ Validation logic

### Next Steps (Phase 2-7)
- [ ] Social data extractors (YouTube, Spotify, Facebook, etc.)
- [ ] AI-powered interest analysis
- [ ] Integration with personalization system
- [ ] Background data sync pipeline
- [ ] Token encryption
- [ ] Provider app verification

## Contributing

When adding new providers:

1. Add provider to `auth.ts`:
```typescript
NewProvider({
  clientId: process.env.NEW_PROVIDER_CLIENT_ID!,
  clientSecret: process.env.NEW_PROVIDER_CLIENT_SECRET!,
  authorization: {
    params: {
      scope: "required scopes here"
    }
  }
})
```

2. Add icon to `components/provider-icon.tsx`
3. Add to provider list in `app/login/client.tsx`
4. Add environment variables to `ENV_SETUP.md`
5. Test all 8 scenarios

## Support

### Documentation
- Setup: `ENV_SETUP.md`
- Quick Start: `ACCOUNT_MANAGEMENT_QUICK_START.md`
- Testing: `ACCOUNT_MANAGEMENT_TESTING_GUIDE.md`
- Implementation: `ACCOUNT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md`

### Common Commands

```bash
# Generate Prisma client
npx prisma generate

# View database
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Migrate existing users
npx ts-node scripts/migrate-existing-accounts.ts
```

---

## License

Part of the Ntourage Travel Planner application.
