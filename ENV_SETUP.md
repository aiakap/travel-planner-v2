# Environment Variables Setup

Add the following environment variables to your `.env` file:

## NextAuth Configuration

NextAuth v5 uses `AUTH_SECRET` (preferred) or `NEXTAUTH_SECRET` (backward compatible).

```env
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your_auth_secret_generate_with_openssl_rand_base64_32"
```

**OR** use the old variable name (both work):
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_generate_with_openssl_rand_base64_32"
```

## OAuth Provider Credentials

### Google OAuth (Priority - includes YouTube access)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API and YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

```env
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
```

### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure OAuth redirect URI: `http://localhost:3000/api/auth/callback/facebook`

```env
FACEBOOK_CLIENT_ID="your_facebook_app_id"
FACEBOOK_CLIENT_SECRET="your_facebook_app_secret"
```

### Apple Sign In
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an App ID with Sign in with Apple capability
3. Create a Services ID
4. Configure return URL: `http://localhost:3000/api/auth/callback/apple`

```env
APPLE_CLIENT_ID="your_apple_services_id"
APPLE_CLIENT_SECRET="your_apple_client_secret_jwt"
```

### Twitter/X OAuth
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new app
3. Enable OAuth 2.0
4. Add callback URL: `http://localhost:3000/api/auth/callback/twitter`

```env
TWITTER_CLIENT_ID="your_twitter_client_id"
TWITTER_CLIENT_SECRET="your_twitter_client_secret"
```

### LinkedIn OAuth
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add Sign In with LinkedIn product
4. Configure redirect URL: `http://localhost:3000/api/auth/callback/linkedin`

```env
LINKEDIN_CLIENT_ID="your_linkedin_client_id"
LINKEDIN_CLIENT_SECRET="your_linkedin_client_secret"
```

### Spotify OAuth
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback/spotify`

```env
SPOTIFY_CLIENT_ID="your_spotify_client_id"
SPOTIFY_CLIENT_SECRET="your_spotify_client_secret"
```

### GitHub OAuth (Already configured)
```env
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"
```

## Production Configuration

For production, update all callback URLs to use your production domain:
- `https://yourdomain.com/api/auth/callback/{provider}`

And update:
```env
NEXTAUTH_URL="https://yourdomain.com"
```

## Testing Without All Providers

You can start with just Google and GitHub:
1. Comment out other providers in `auth.ts`
2. Only set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_ID, GITHUB_SECRET
3. Add more providers as you obtain credentials

## Generating NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

## OAuth Scopes Reference

### Google Scopes
- `openid` - OpenID Connect
- `profile` - Basic profile info
- `email` - Email address
- `https://www.googleapis.com/auth/youtube.readonly` - YouTube data (subscriptions, liked videos)

### Facebook Scopes
- `public_profile` - Basic profile
- `email` - Email address
- `user_likes` - Pages liked (requires app review)
- `user_friends` - Friends who use app (requires app review)

### Spotify Scopes
- `user-read-email` - Email address
- `user-read-private` - Private profile data
- `user-top-read` - Top artists and tracks
- `user-read-recently-played` - Recently played tracks
- `user-library-read` - Saved tracks

### Twitter Scopes
- `tweet.read` - Read tweets
- `users.read` - Read user profiles
- `follows.read` - Read follows/followers
- `offline.access` - Refresh token

## Notes

- Some providers require app verification before advanced permissions are granted
- Google OAuth verification can take 2-6 weeks for YouTube scopes
- Facebook requires App Review for `user_likes` and `user_friends` permissions
- Start with basic scopes and request advanced permissions after initial testing
