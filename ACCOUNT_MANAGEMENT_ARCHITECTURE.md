# Account Management System Architecture

## System Overview

```mermaid
graph TB
    User[User] -->|Visits| LoginPage[/login]
    User -->|Authenticated| SettingsPage[/settings/accounts]
    
    LoginPage --> ProviderButtons[Provider Selection UI]
    ProviderButtons --> Google[Google OAuth]
    ProviderButtons --> Facebook[Facebook OAuth]
    ProviderButtons --> Apple[Apple Sign In]
    ProviderButtons --> Twitter[Twitter OAuth]
    ProviderButtons --> LinkedIn[LinkedIn OAuth]
    ProviderButtons --> Spotify[Spotify OAuth]
    ProviderButtons --> GitHub[GitHub OAuth]
    
    Google --> NextAuthCallback[NextAuth Callback Handler]
    Facebook --> NextAuthCallback
    Apple --> NextAuthCallback
    Twitter --> NextAuthCallback
    LinkedIn --> NextAuthCallback
    Spotify --> NextAuthCallback
    GitHub --> NextAuthCallback
    
    NextAuthCallback --> AccountLinker{Account Exists?}
    AccountLinker -->|Yes| UpdateLogin[Update lastLoginAt]
    AccountLinker -->|No| EmailCheck{Email Matches?}
    
    EmailCheck -->|Yes| LinkToExisting[Link to Existing User]
    EmailCheck -->|No| CreateNew[Create New User]
    
    UpdateLogin --> Authenticate[Authenticate User]
    LinkToExisting --> SetPrimary{First Account?}
    CreateNew --> SetPrimary
    
    SetPrimary -->|Yes| MarkPrimary[Set isPrimaryLogin: true]
    SetPrimary -->|No| MarkSecondary[Set isPrimaryLogin: false]
    
    MarkPrimary --> Authenticate
    MarkSecondary --> Authenticate
    
    Authenticate --> Redirect[Redirect to /trips]
    
    SettingsPage --> AccountsList[Display Connected Accounts]
    SettingsPage --> AvailableProviders[Show Available Providers]
    
    AccountsList --> DisconnectBtn[Disconnect Button]
    AccountsList --> SetPrimaryBtn[Set Primary Button]
    
    DisconnectBtn --> ValidateCount{Count > 1?}
    ValidateCount -->|No| ShowError[Show Error: Cannot Disconnect]
    ValidateCount -->|Yes| ConfirmDialog[Confirmation Dialog]
    ConfirmDialog --> MarkDisconnected[Set canLogin: false]
    
    SetPrimaryBtn --> UpdatePrimary[Update isPrimaryLogin flags]
    
    AvailableProviders --> ConnectNew[Connect New Provider]
    ConnectNew --> Google
```

## Database Schema Relationships

```mermaid
erDiagram
    User ||--o{ Account : "has many"
    User ||--o{ Session : "has many"
    User ||--o{ Trip : "creates"
    User ||--o| UserProfile : "has one"
    
    User {
        string id PK
        string email UK
        string name
        string image
        datetime createdAt
        datetime updatedAt
    }
    
    Account {
        int id PK
        string userId FK
        string provider
        string providerAccountId
        string access_token
        string refresh_token
        int expires_at
        boolean isPrimaryLogin
        boolean canLogin
        datetime lastLoginAt
        string syncStatus
        datetime createdAt
        datetime updatedAt
    }
    
    Session {
        string id PK
        string sessionToken UK
        string userId FK
        datetime expires
    }
```

## Account Linking Logic Flow

```mermaid
flowchart TD
    Start[User Initiates OAuth] --> OAuthFlow[Complete OAuth Flow]
    OAuthFlow --> CheckAccount{Provider Account<br/>Exists in DB?}
    
    CheckAccount -->|Yes| GetUser[Get Linked User]
    GetUser --> UpdateTokens[Update Tokens & lastLoginAt]
    UpdateTokens --> AuthAsUser[Authenticate as Linked User]
    
    CheckAccount -->|No| CheckEmail{User Email<br/>Matches Existing?}
    
    CheckEmail -->|Yes| LinkToUser[Link to Existing User]
    CheckEmail -->|No| CreateUser[Create New User]
    
    LinkToUser --> CountAccounts[Count User's Accounts]
    CreateUser --> CountAccounts
    
    CountAccounts --> CheckFirst{First Account?}
    CheckFirst -->|Yes| SetPrimary[isPrimaryLogin = true]
    CheckFirst -->|No| SetSecondary[isPrimaryLogin = false]
    
    SetPrimary --> CreateAccount[Create Account Record]
    SetSecondary --> CreateAccount
    
    CreateAccount --> SetFields[Set canLogin = true<br/>syncStatus = active<br/>lastLoginAt = now]
    SetFields --> AuthAsUser
    
    AuthAsUser --> Success[Login Successful]
```

## Disconnect Validation Flow

```mermaid
flowchart TD
    Start[User Clicks Disconnect] --> GetAccounts[Query Active Accounts]
    GetAccounts --> CountAccounts{Active Count > 1?}
    
    CountAccounts -->|No| DisableButton[Disable Disconnect Button]
    DisableButton --> ShowTooltip[Show: Cannot disconnect<br/>last login method]
    ShowTooltip --> End[Action Blocked]
    
    CountAccounts -->|Yes| ShowDialog[Show Confirmation Dialog]
    ShowDialog --> UserConfirms{User Confirms?}
    
    UserConfirms -->|No| Cancel[Cancel Action]
    Cancel --> End
    
    UserConfirms -->|Yes| UpdateAccount[Set canLogin = false<br/>syncStatus = disconnected]
    UpdateAccount --> Revalidate[Revalidate /settings/accounts]
    Revalidate --> Success[Account Disconnected]
```

## Component Architecture

```mermaid
graph TB
    subgraph LoginFlow [Login Flow]
        LoginPage[app/login/page.tsx<br/>Server Component]
        LoginClient[app/login/client.tsx<br/>Client Component]
        
        LoginPage --> LoginClient
        LoginClient --> ProviderIcon[components/provider-icon.tsx]
        LoginClient --> SignInAction[signIn from next-auth/react]
    end
    
    subgraph SettingsFlow [Settings Flow]
        SettingsPage[app/settings/accounts/page.tsx<br/>Server Component]
        SettingsClient[app/settings/accounts/client.tsx<br/>Client Component]
        
        SettingsPage --> GetAccounts[getConnectedAccounts]
        SettingsPage --> GetAvailable[getAvailableProviders]
        SettingsPage --> GetStats[getAccountStats]
        
        SettingsPage --> SettingsClient
        SettingsClient --> ProviderIcon2[components/provider-icon.tsx]
        SettingsClient --> DisconnectAction[disconnectProvider]
        SettingsClient --> SetPrimaryAction[setPrimaryAccount]
        SettingsClient --> AlertDialog[components/ui/alert-dialog.tsx]
    end
    
    subgraph AuthCore [Auth Core]
        AuthConfig[auth.ts<br/>NextAuth Config]
        AuthActions[lib/auth-actions.ts<br/>Server Actions]
        AccountActions[lib/actions/account-management-actions.ts<br/>Server Actions]
        
        AuthConfig --> Providers[7 OAuth Providers]
        AuthConfig --> Callbacks[signIn/jwt/session callbacks]
        
        Callbacks --> PrismaDB[(Prisma Database)]
        AccountActions --> PrismaDB
    end
    
    SignInAction --> AuthConfig
    GetAccounts --> AccountActions
    GetAvailable --> AccountActions
    GetStats --> AccountActions
    DisconnectAction --> AccountActions
    SetPrimaryAction --> AccountActions
```

## Data Flow: New User Signup

```mermaid
sequenceDiagram
    actor User
    participant UI as Login UI
    participant NextAuth
    participant Provider as OAuth Provider
    participant Callback as signIn Callback
    participant DB as Database
    
    User->>UI: Click "Continue with Google"
    UI->>NextAuth: signIn("google")
    NextAuth->>Provider: Redirect to OAuth
    Provider->>User: Show consent screen
    User->>Provider: Grant permissions
    Provider->>NextAuth: Callback with tokens
    NextAuth->>Callback: Execute signIn callback
    
    Callback->>DB: Check if account exists
    DB-->>Callback: Not found
    
    Callback->>DB: Check if email exists
    DB-->>Callback: Not found
    
    Callback->>DB: Count user's accounts
    DB-->>Callback: 0 accounts
    
    Callback->>DB: Create Account<br/>(isPrimaryLogin: true)
    DB-->>Callback: Account created
    
    Callback-->>NextAuth: Return true
    NextAuth->>UI: Redirect to /trips
    UI->>User: Show dashboard
```

## Data Flow: Add Second Account

```mermaid
sequenceDiagram
    actor User
    participant Settings as Settings UI
    participant NextAuth
    participant Provider as OAuth Provider
    participant Callback as signIn Callback
    participant DB as Database
    
    User->>Settings: Navigate to /settings/accounts
    Settings->>DB: getConnectedAccounts()
    DB-->>Settings: [Google account]
    Settings->>User: Show 1 connected account
    
    User->>Settings: Click "Connect Spotify"
    Settings->>NextAuth: signIn("spotify")
    NextAuth->>Provider: Redirect to OAuth
    Provider->>User: Show consent screen
    User->>Provider: Grant permissions
    Provider->>NextAuth: Callback with tokens
    NextAuth->>Callback: Execute signIn callback
    
    Callback->>DB: Check if Spotify account exists
    DB-->>Callback: Not found
    
    Callback->>DB: Get user by email
    DB-->>Callback: Found existing user
    
    Callback->>DB: Count user's accounts
    DB-->>Callback: 1 account (Google)
    
    Callback->>DB: Create Spotify Account<br/>(isPrimaryLogin: false)
    DB-->>Callback: Account created
    
    Callback-->>NextAuth: Return true
    NextAuth->>Settings: Redirect to /settings/accounts
    Settings->>User: Show 2 connected accounts
```

## Security Model

```mermaid
graph TB
    subgraph AuthLayer [Authentication Layer]
        OAuth[OAuth Providers]
        NextAuth[NextAuth.js]
        Session[Session Management]
    end
    
    subgraph ValidationLayer [Validation Layer]
        OwnerCheck[Ownership Validation]
        CountCheck[Account Count Check]
        StatusCheck[Account Status Check]
    end
    
    subgraph DataLayer [Data Layer]
        Prisma[Prisma ORM]
        Postgres[(PostgreSQL)]
    end
    
    OAuth --> NextAuth
    NextAuth --> Session
    
    Session --> OwnerCheck
    OwnerCheck --> CountCheck
    CountCheck --> StatusCheck
    
    StatusCheck --> Prisma
    Prisma --> Postgres
    
    Postgres -.->|Constraints| UniqueConstraint[UNIQUE provider+providerAccountId]
    Postgres -.->|Indexes| CanLoginIndex[INDEX userId+canLogin]
```

## Account States

```mermaid
stateDiagram-v2
    [*] --> Created: User signs up
    Created --> Active: Account activated
    
    Active --> PrimaryActive: isPrimaryLogin = true<br/>canLogin = true<br/>syncStatus = active
    Active --> SecondaryActive: isPrimaryLogin = false<br/>canLogin = true<br/>syncStatus = active
    
    PrimaryActive --> SecondaryActive: Set another as primary
    SecondaryActive --> PrimaryActive: Set as primary
    
    SecondaryActive --> Disconnected: User disconnects<br/>(if count > 1)
    Disconnected --> SecondaryActive: User reconnects
    
    PrimaryActive --> Disconnected: User disconnects<br/>(if count > 1)
    
    Active --> Expired: Token expires
    Expired --> Active: Token refreshed
    
    Active --> Revoked: User revokes in provider
    Revoked --> Active: User re-authorizes
    
    Disconnected --> [*]: Account deleted
    
    note right of PrimaryActive
        Cannot disconnect if
        this is the only account
    end note
```

## File Structure

```
travel-planner-v2/
├── auth.ts                                    # NextAuth config with 7 providers
├── prisma/
│   ├── schema.prisma                          # Extended Account model
│   └── migrations/
│       └── 20260121150301_add_account_management_fields/
│           └── migration.sql                  # Account management fields
├── lib/
│   └── actions/
│       ├── auth-actions.ts                    # Login/logout actions
│       └── account-management-actions.ts      # Account CRUD operations
├── components/
│   ├── provider-icon.tsx                      # Provider SVG icons
│   ├── auth-button.tsx                        # Updated auth button
│   ├── Navbar.tsx                             # Updated with Accounts link
│   └── ui/
│       ├── alert-dialog.tsx                   # Confirmation dialogs
│       └── alert.tsx                          # Error alerts
├── app/
│   ├── login/
│   │   ├── page.tsx                           # Login server component
│   │   └── client.tsx                         # Login client component
│   └── settings/
│       └── accounts/
│           ├── page.tsx                       # Settings server component
│           └── client.tsx                     # Settings client component
├── scripts/
│   └── migrate-existing-accounts.ts           # Migration script
└── docs/
    ├── ENV_SETUP.md                           # OAuth setup guide
    ├── ACCOUNT_MANAGEMENT_QUICK_START.md      # Quick start guide
    ├── ACCOUNT_MANAGEMENT_TESTING_GUIDE.md    # Testing scenarios
    ├── ACCOUNT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md
    ├── ACCOUNT_MANAGEMENT_SETUP_CHECKLIST.md
    └── ACCOUNT_MANAGEMENT_README.md
```

## Technology Stack

### Core
- **Next.js 15**: App Router
- **NextAuth.js v5**: Authentication
- **Prisma**: ORM and database migrations
- **PostgreSQL**: Database (Neon)

### UI Components
- **Radix UI**: Accessible components (Dialog, Alert)
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Custom SVG**: Provider brand icons

### OAuth Providers
- Google (with YouTube)
- Facebook
- Apple
- Twitter/X
- LinkedIn
- Spotify
- GitHub

## API Endpoints (Auto-generated by NextAuth)

```
GET  /api/auth/signin                    # Sign in page
POST /api/auth/signin/:provider          # Initiate OAuth
GET  /api/auth/callback/:provider        # OAuth callback
GET  /api/auth/signout                   # Sign out
POST /api/auth/signout                   # Sign out action
GET  /api/auth/session                   # Get session
GET  /api/auth/csrf                      # CSRF token
GET  /api/auth/providers                 # List providers
```

## State Management

### Session State
- Managed by NextAuth.js
- JWT-based (stateless)
- Contains: userId, accessToken, refreshToken, provider

### Account State
- Stored in PostgreSQL via Prisma
- Fields: isPrimaryLogin, canLogin, lastLoginAt, syncStatus
- Cached and revalidated on changes

### UI State
- React useState for loading, dialogs
- Server actions for data mutations
- Optimistic updates where appropriate

## Security Architecture

```mermaid
graph LR
    subgraph Client [Client Side]
        Browser[Browser]
        UI[React Components]
    end
    
    subgraph Server [Server Side]
        NextAuth[NextAuth.js]
        ServerActions[Server Actions]
        Middleware[Auth Middleware]
    end
    
    subgraph Database [Database Layer]
        Prisma[Prisma ORM]
        Postgres[(PostgreSQL)]
    end
    
    Browser -->|HTTPS| UI
    UI -->|Server Action| ServerActions
    UI -->|OAuth Flow| NextAuth
    
    ServerActions -->|Verify Session| Middleware
    NextAuth -->|Verify Session| Middleware
    
    Middleware -->|Authorized| Prisma
    Prisma -->|Query| Postgres
    
    Postgres -.->|Constraints| Validation[Unique Constraints<br/>Foreign Keys<br/>Indexes]
```

## Performance Considerations

### Database Indexes

```sql
-- Efficient account lookups
CREATE INDEX "Account_userId_canLogin_idx" 
ON "Account"("userId", "canLogin");

-- Existing unique constraint
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key"
ON "Account"("provider", "providerAccountId");
```

### Query Optimization

```typescript
// Efficient: Uses index
await prisma.account.findMany({
  where: { 
    userId: "user_123",
    canLogin: true 
  }
});

// Efficient: Parallel queries
const [accounts, available, stats] = await Promise.all([
  getConnectedAccounts(),
  getAvailableProviders(),
  getAccountStats()
]);
```

### Caching Strategy

- Session data cached by NextAuth
- Account lists revalidated on changes via `revalidatePath()`
- Statistics can be cached with short TTL

## Error Handling

### OAuth Errors

```typescript
// In auth.ts signIn callback
try {
  // Account linking logic
} catch (error) {
  console.error("Sign in error:", error);
  return false; // Prevents sign in
}
```

### User-Facing Errors

```typescript
// In server actions
if (activeAccounts <= 1) {
  return {
    success: false,
    error: "Cannot disconnect your only login method."
  };
}
```

### Error Pages

- `/login?error=OAuthAccountNotLinked` - Account already linked
- `/login?error=Callback` - OAuth callback failed
- `/login/error` - Generic error page

## Monitoring & Observability

### Key Metrics

```typescript
// Track in analytics
{
  event: "user_login",
  provider: "google",
  isNewUser: false,
  accountCount: 2
}

{
  event: "account_linked",
  provider: "spotify",
  totalAccounts: 3
}

{
  event: "account_disconnected",
  provider: "facebook",
  remainingAccounts: 2
}
```

### Database Monitoring

```sql
-- Active users by provider
SELECT provider, COUNT(DISTINCT "userId") as users
FROM "Account"
WHERE "canLogin" = true AND "syncStatus" = 'active'
GROUP BY provider;

-- Account health
SELECT syncStatus, COUNT(*) as count
FROM "Account"
GROUP BY syncStatus;

-- Multi-account adoption
SELECT account_count, COUNT(*) as users
FROM (
  SELECT "userId", COUNT(*) as account_count
  FROM "Account"
  WHERE "canLogin" = true
  GROUP BY "userId"
) subquery
GROUP BY account_count;
```

## Scalability Considerations

### Current Design (Good for 0-100K users)
- Single database
- JWT sessions (stateless)
- Indexed queries
- Efficient account lookups

### Future Scaling (100K+ users)
- Implement token encryption
- Add Redis for session caching
- Consider read replicas for account queries
- Implement rate limiting per user
- Add CDN for static assets

## Integration Points

### With Existing Features

1. **Profile System**: Account data enhances user profile
2. **Trip Planning**: Social data improves recommendations
3. **AI Chat**: Social interests provide context
4. **Personalization**: Multi-provider data = better insights

### With Future Features (Main Plan)

1. **Data Extractors**: Use account tokens to fetch social data
2. **Interest Analyzer**: Analyze data from all linked accounts
3. **Social Graph**: Map connections across providers
4. **Friend Matching**: "Friends who visited" features

## Deployment

### Development
```bash
npm run dev
# Access at http://localhost:3000
```

### Production
1. Set production environment variables
2. Update OAuth redirect URIs
3. Deploy to hosting platform
4. Run migrations
5. Monitor for errors

### Environment-Specific Config

```typescript
// Development
NEXTAUTH_URL="http://localhost:3000"

// Production
NEXTAUTH_URL="https://yourdomain.com"
```

## Maintenance

### Regular Tasks
- Monitor OAuth error rates
- Check for expired tokens
- Review account statistics
- Update provider SDKs
- Rotate NEXTAUTH_SECRET periodically

### User Support
- Help users reconnect expired accounts
- Assist with account linking issues
- Handle account merge requests
- Process account deletion requests

---

## Summary

The account management system provides a robust foundation for multi-provider authentication with:
- Flexible account linking
- Strong validation
- Intuitive UI
- Comprehensive error handling
- Security best practices
- Scalable architecture

Ready for OAuth setup and testing!
