# NextAuth.js / Auth.js OAuth Specification

## Overview

NextAuth.js (now part of Better Auth as Auth.js v5) provides authentication for Next.js applications with support for multiple OAuth providers, email/magic links, and credentials-based authentication.

**Version**: Auth.js v5 (NextAuth.js v5)

**Last Updated**: January 27, 2026

---

## Authentication Configuration

**File**: `auth.ts` (project root)

**Environment Variables**:
- `AUTH_SECRET` - Secret for signing tokens
- `NEXTAUTH_URL` - Application URL (e.g., http://localhost:3000)

**Provider-Specific Variables**: See below

---

## Configured OAuth Providers

This project has 7 OAuth providers configured:

### 1. GitHub

**Environment Variables**:
```
AUTH_GITHUB_ID=your_github_client_id
AUTH_GITHUB_SECRET=your_github_secret

# Legacy names also supported:
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_secret
```

**Scopes**: Default (user:email, read:user)

**Setup**:
1. Create OAuth App at [GitHub Developer Settings](https://github.com/settings/developers)
2. Set callback URL: `http://localhost:3000/api/auth/callback/github`
3. Copy Client ID and Secret

### 2. Google

**Environment Variables**:
```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret
```

**Scopes**: 
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/youtube.readonly` (YouTube access)

**Setup**:
1. Create OAuth 2.0 Client in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Copy Client ID and Secret

### 3. Facebook

**Environment Variables**:
```
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_secret
```

**Setup**: [Facebook for Developers](https://developers.facebook.com/)

### 4. Apple

**Environment Variables**:
```
APPLE_CLIENT_ID=your_apple_service_id
APPLE_CLIENT_SECRET=your_apple_secret
```

**Setup**: [Apple Developer Portal](https://developer.apple.com/)

### 5. Twitter (X)

**Environment Variables**:
```
TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_secret
```

**Setup**: [Twitter Developer Portal](https://developer.twitter.com/)

### 6. LinkedIn

**Environment Variables**:
```
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_secret
```

**Setup**: [LinkedIn Developers](https://www.linkedin.com/developers/)

### 7. Spotify

**Environment Variables**:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
```

**Setup**: [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

---

## Auth.js Configuration

### Basic Setup

From `auth.ts`:

```typescript
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Apple from "next-auth/providers/apple";
import Twitter from "next-auth/providers/twitter";
import LinkedIn from "next-auth/providers/linkedin";
import Spotify from "next-auth/providers/spotify";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly'
        }
      }
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
```

---

## API Routes

Auth.js automatically creates these routes:

- `GET /api/auth/signin` - Sign in page
- `POST /api/auth/signin/:provider` - Initiate OAuth flow
- `GET /api/auth/callback/:provider` - OAuth callback
- `GET /api/auth/signout` - Sign out page
- `POST /api/auth/signout` - Sign out action
- `GET /api/auth/session` - Get session
- `GET /api/auth/csrf` - CSRF token
- `GET /api/auth/providers` - List providers

---

## Usage in Components

### Server Components

```typescript
import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session) {
    redirect('/api/auth/signin');
  }
  
  return <div>Hello {session.user.name}</div>;
}
```

### Client Components

```typescript
"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function LoginButton() {
  const { data: session, status } = useSession();
  
  if (status === "loading") {
    return <div>Loading...</div>;
  }
  
  if (session) {
    return (
      <button onClick={() => signOut()}>
        Sign out {session.user.name}
      </button>
    );
  }
  
  return <button onClick={() => signIn()}>Sign in</button>;
}
```

### Sign In with Specific Provider

```typescript
// Sign in with GitHub
<button onClick={() => signIn('github')}>
  Sign in with GitHub
</button>

// Sign in with Google
<button onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
  Sign in with Google
</button>
```

---

## Session Management

### Session Object

```typescript
interface Session {
  user: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  expires: string; // ISO 8601 date
}
```

### Getting Session

**Server-side**:
```typescript
import { auth } from "@/auth";

const session = await auth();
```

**Client-side**:
```typescript
import { useSession } from "next-auth/react";

const { data: session } = useSession();
```

**API Routes**:
```typescript
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use session.user.id
}
```

---

## Callbacks & Events

### Session Callback

```typescript
callbacks: {
  async session({ session, token, user }) {
    // Add custom fields to session
    if (token.sub) {
      session.user.id = token.sub;
    }
    
    // Add role from database
    const dbUser = await getUserById(token.sub);
    session.user.role = dbUser.role;
    
    return session;
  },
  
  async jwt({ token, user, account }) {
    // Persist user ID to token
    if (user) {
      token.sub = user.id;
    }
    
    // Add OAuth access token
    if (account) {
      token.accessToken = account.access_token;
    }
    
    return token;
  },
}
```

### Sign In Callback

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // Create user in database if doesn't exist
    await createUserIfNotExists(user);
    
    // Custom validation
    if (!user.email?.endsWith('@company.com')) {
      return false; // Reject sign in
    }
    
    return true; // Allow sign in
  },
}
```

---

## Database Adapter

For persistent sessions, use a database adapter:

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // ... rest of config
});
```

**Required Prisma Models**:
- User
- Account
- Session
- VerificationToken

---

## Protecting Routes

### Middleware Protection

```typescript
// middleware.ts
import { auth } from "@/auth";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname !== '/login') {
    const newUrl = new URL('/login', req.nextUrl.origin);
    return Response.redirect(newUrl);
  }
});

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*'],
};
```

### Page-Level Protection

```typescript
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/api/auth/signin');
  }
  
  return <div>Protected content</div>;
}
```

---

## Custom Pages

### Sign In Page

```typescript
// app/auth/signin/page.tsx
import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div>
      <h1>Sign In</h1>
      <form
        action={async () => {
          "use server";
          await signIn("github");
        }}
      >
        <button type="submit">Sign in with GitHub</button>
      </form>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button type="submit">Sign in with Google</button>
      </form>
    </div>
  );
}
```

---

## Security Best Practices

### 1. Secret Generation

```bash
# Generate secure AUTH_SECRET
openssl rand -base64 32
```

### 2. HTTPS in Production

Always use HTTPS in production:
```
NEXTAUTH_URL=https://yourdomain.com
```

### 3. Callback URL Validation

Ensure callback URLs are whitelisted in provider settings.

### 4. CSRF Protection

Auth.js includes CSRF protection by default. Don't disable it.

---

## Error Handling

### Auth Errors

```typescript
// app/auth/error/page.tsx
export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;
  
  const errorMessages = {
    Configuration: 'Server configuration error',
    AccessDenied: 'Access denied',
    Verification: 'Verification failed',
    Default: 'Authentication error',
  };
  
  return (
    <div>
      <h1>Error</h1>
      <p>{errorMessages[error] || errorMessages.Default}</p>
    </div>
  );
}
```

---

## Testing

### Local Testing

1. Start development server: `npm run dev`
2. Navigate to `/api/auth/signin`
3. Test each provider
4. Check session persistence

### Test Accounts

Create test accounts for each provider:
- GitHub test account
- Google test account
- etc.

### Callback URLs for Development

```
http://localhost:3000/api/auth/callback/github
http://localhost:3000/api/auth/callback/google
http://localhost:3000/api/auth/callback/facebook
```

---

## Troubleshooting

### Common Issues

**1. "Configuration" Error**
- Check all required environment variables are set
- Verify `AUTH_SECRET` is present
- Ensure provider credentials are correct

**2. OAuth Callback Errors**
- Verify callback URL in provider settings
- Check `NEXTAUTH_URL` is correct
- Ensure provider is enabled

**3. Session Not Persisting**
- Check cookies are enabled
- Verify `AUTH_SECRET` hasn't changed
- Check for CORS issues

**4. "AccessDenied" Error**
- User cancelled OAuth flow
- Provider denied access
- Email not verified (some providers)

---

## Migration from v4 to v5

### Key Changes

1. **Import Changes**:
```typescript
// v4
import NextAuth from "next-auth/next";

// v5
import NextAuth from "next-auth";
```

2. **Configuration Export**:
```typescript
// v5
export const { handlers, auth, signIn, signOut } = NextAuth({...});
```

3. **Route Handler**:
```typescript
// app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

---

## Session Strategies

### JWT (Default)

**Pros**:
- No database required
- Fast access
- Stateless

**Cons**:
- Can't revoke sessions easily
- Limited data storage

**Configuration**:
```typescript
export const { auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
```

### Database Sessions

**Pros**:
- Can revoke sessions
- More secure
- Unlimited data

**Cons**:
- Requires database
- Slightly slower

**Configuration**:
```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";

export const { auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
});
```

---

## Usage in Project

### Protecting API Routes

```typescript
import { auth } from "@/auth";

export async function GET(request: Request) {
  const session = await auth();
  
  if (!session) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Protected route logic
  const userId = session.user.id;
  const data = await getUserData(userId);
  
  return Response.json(data);
}
```

### Conditional Rendering

```typescript
import { auth } from "@/auth";

export default async function Layout({ children }) {
  const session = await auth();
  
  return (
    <div>
      <nav>
        {session ? (
          <UserMenu user={session.user} />
        ) : (
          <SignInButton />
        )}
      </nav>
      {children}
    </div>
  );
}
```

---

## Provider-Specific Features

### Google - YouTube Access

The Google provider is configured with YouTube readonly scope:

```typescript
Google({
  authorization: {
    params: {
      scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly'
    }
  }
})
```

This allows accessing user's YouTube data if needed.

---

## Events

Listen to auth events:

```typescript
export const { auth } = NextAuth({
  events: {
    async signIn({ user, account, profile }) {
      console.log('User signed in:', user.email);
      await logAuthEvent('signin', user.id);
    },
    async signOut({ token }) {
      console.log('User signed out');
      await logAuthEvent('signout', token.sub);
    },
    async createUser({ user }) {
      console.log('New user created:', user.email);
      await sendWelcomeEmail(user.email);
    },
  },
});
```

---

## Extending Session

### Add Custom Fields

```typescript
// types/next-auth.d.ts
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }
}

// auth.ts
callbacks: {
  async session({ session, token }) {
    if (token.sub) {
      session.user.id = token.sub;
      
      // Fetch role from database
      const user = await prisma.user.findUnique({
        where: { id: token.sub }
      });
      session.user.role = user?.role || 'user';
    }
    return session;
  },
}
```

---

## Best Practices

### 1. Environment Setup

Create `.env.local` for local development:
```bash
cp .env.example .env.local
# Fill in OAuth credentials
```

### 2. Provider Configuration

Only enable providers you'll use:
```typescript
providers: [
  GitHub({...}),
  Google({...}),
  // Comment out unused providers
]
```

### 3. Error Pages

Create custom error pages for better UX:
- `/auth/error` - Authentication errors
- `/auth/verify-request` - Email verification
- `/auth/signin` - Custom sign-in page

### 4. Security

- Use strong `AUTH_SECRET` (32+ characters)
- Enable HTTPS in production
- Set secure cookie options
- Implement CSRF protection (enabled by default)

---

## OAuth Flow

### Authorization Flow

1. User clicks "Sign in with Provider"
2. Redirects to provider's OAuth page
3. User authorizes application
4. Provider redirects to callback URL
5. Auth.js exchanges code for tokens
6. Session created and user signed in

### Callback URL Pattern

```
{NEXTAUTH_URL}/api/auth/callback/{provider}
```

Examples:
- `http://localhost:3000/api/auth/callback/github`
- `https://app.com/api/auth/callback/google`

---

## Rate Limits

**Auth.js**: No built-in rate limiting

**Recommendation**: Implement rate limiting for sign-in attempts:

```typescript
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: Request) {
  try {
    await limiter.check(request, 10); // 10 requests per minute
    // ... sign in logic
  } catch {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }
}
```

---

## Testing

### Local Development

1. Set up OAuth apps with `http://localhost:3000` callback
2. Add credentials to `.env.local`
3. Test each provider flow
4. Verify session persistence

### Test Checklist

- [ ] Sign in with each provider
- [ ] Check session persists across page reloads
- [ ] Test sign out functionality
- [ ] Verify protected routes work
- [ ] Test error handling
- [ ] Check callback URLs

---

## Troubleshooting

### Debug Mode

Enable debug logging:

```typescript
export const { auth } = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  // ... config
});
```

### Common Issues

**1. Redirect URI Mismatch**
```
Error: redirect_uri_mismatch
```
**Solution**: Update callback URL in provider settings

**2. Invalid Client**
```
Error: invalid_client
```
**Solution**: Check client ID and secret are correct

**3. Session Undefined**
```
session is undefined
```
**Solution**: 
- Ensure `SessionProvider` wraps app (client components)
- Use `auth()` for server components
- Check session strategy configuration

**4. CSRF Error**
```
Error: CSRF token mismatch
```
**Solution**:
- Don't disable CSRF protection
- Check cookies are enabled
- Verify `NEXTAUTH_URL` is correct

---

## Production Deployment

### Environment Variables

Set in production:
```
AUTH_SECRET=production_secret_value
NEXTAUTH_URL=https://yourdomain.com
# All provider credentials
```

### Callback URLs

Update provider settings with production URLs:
```
https://yourdomain.com/api/auth/callback/{provider}
```

### Security Checklist

- [ ] Strong `AUTH_SECRET` generated
- [ ] HTTPS enabled
- [ ] Callback URLs updated in all providers
- [ ] Environment variables set
- [ ] Cookie settings configured
- [ ] CSP headers configured

---

## Official Resources

### Documentation
- [Auth.js Documentation](https://authjs.dev/)
- [OAuth Providers](https://authjs.dev/getting-started/authentication/oauth)
- [Migration to v5](https://authjs.dev/getting-started/migrating-to-v5)
- [Database Adapters](https://authjs.dev/getting-started/adapters)

### Provider Setup Guides
- [GitHub Setup](https://authjs.dev/getting-started/providers/github)
- [Google Setup](https://authjs.dev/getting-started/providers/google)
- [Facebook Setup](https://authjs.dev/getting-started/providers/facebook)

### Community
- [GitHub Discussions](https://github.com/nextauthjs/next-auth/discussions)
- [Discord](https://discord.authjs.dev/)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [Prisma ORM](./prisma.md) - Database adapter option
