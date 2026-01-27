# API Reference - Travel Planner v2

## Overview

This document provides a comprehensive reference for all external APIs integrated into the Travel Planner v2 application. Each API is categorized by its primary function and includes authentication methods, key endpoints, and links to detailed specifications.

**Last Updated**: January 27, 2026

---

## Quick Reference by Category

### 🤖 AI Services
- [OpenAI API](#openai-api) - Chat, structured outputs, vision, image generation
- [Google Vertex AI (Imagen)](#google-vertex-ai-imagen) - AI image generation
- [Vercel AI SDK](#vercel-ai-sdk) - AI streaming and structured data utilities

### 🗺️ Maps & Location Services
- [Google Maps Platform](#google-maps-platform) - Maps, geocoding, places, autocomplete, timezone

### ✈️ Travel & Hospitality APIs
- [Amadeus Travel API](#amadeus-travel-api) - Flights, hotels, airports, transfers
- [Viator Partner API](#viator-partner-api) - Tours and activities
- [Yelp Fusion API](#yelp-fusion-api) - Restaurant search and reviews
- [OpenWeatherMap API](#openweathermap-api) - Weather forecasts

### 🔐 Authentication & Storage
- [NextAuth.js / Auth.js](#nextauthjs--authjs) - OAuth authentication
- [UploadThing](#uploadthing) - File uploads

### 💾 Database & ORM
- [Neon PostgreSQL](#neon-postgresql) - Serverless PostgreSQL database
- [Prisma ORM](#prisma-orm) - Database ORM

### 📊 Analytics & Infrastructure
- [Vercel Platform](#vercel-platform) - Hosting and analytics

---

## Detailed API Information

### OpenAI API

**Purpose**: AI-powered chat, content generation, structured data extraction, vision analysis, and image generation

**Models Used**:
- GPT-4o (gpt-4o-2024-11-20) - Latest reasoning model
- DALL-E 3 - Image generation (fallback)

**Authentication**: API Key via Bearer token

**Base URL**: `https://api.openai.com/v1`

**Key Endpoints**:
- `/chat/completions` - Chat completions with streaming
- `/images/generations` - DALL-E image generation
- `/embeddings` - Text embeddings
- `/moderations` - Content moderation

**Rate Limits**: Tier-based (see OpenAI dashboard)

**Usage in Project**:
- `app/api/chat/route.ts` - Main chat interface
- `app/api/chat/simple/route.ts` - Simple chat endpoint
- `lib/ai/generate-place-suggestions.ts` - Place suggestions
- `lib/ai/generate-content.ts` - Content generation
- `lib/image-generation.ts` - Image generation (DALL-E fallback)

**Documentation**: [Detailed OpenAI Specification](./api-specs/openai.md)

**Official Links**:
- [API Reference](https://platform.openai.com/docs/api-reference/introduction)
- [GPT-4o Models](https://platform.openai.com/docs/models/gpt-4o)
- [DALL-E 3 Guide](https://platform.openai.com/docs/models/dall-e-3)

---

### Google Maps Platform

**Purpose**: Maps display, geocoding, places search, autocomplete, and timezone lookup

**APIs Used**:
- Places API (New) - v1
- Geocoding API
- Timezone API
- Maps JavaScript API

**Authentication**: API Key (server and client-side)

**Environment Variables**:
- `GOOGLE_MAPS_API_KEY` (server-side)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (client-side)

**Base URLs**:
- Places API: `https://places.googleapis.com/v1`
- Other APIs: `https://maps.googleapis.com/maps/api`

**Key Endpoints**:
- `/v1/places:autocomplete` - Place autocomplete
- `/v1/places:searchNearby` - Nearby places
- `/v1/places:searchText` - Text search
- `/v1/places/{place_id}` - Place details
- `/geocode/json` - Geocoding
- `/timezone/json` - Timezone lookup

**Usage in Project**:
- `app/api/places/autocomplete/route.ts` - Autocomplete
- `app/api/places/nearby/route.ts` - Nearby search
- `app/api/places/details/route.ts` - Place details
- `app/api/geocode-timezone/route.ts` - Geocoding + timezone
- `app/api/airports/search-google/route.ts` - Airport search
- `app/view/components/trip-map-view.tsx` - Map display

**Documentation**: [Detailed Google Maps Specification](./api-specs/google-maps.md)

**Official Links**:
- [Places API Overview](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview)

---

### Amadeus Travel API

**Purpose**: Flight search, hotel search, airport/city data, and transfer bookings

**Version**: Self-Service APIs (REST/JSON)

**Authentication**: OAuth2 (Client ID + Secret)

**Environment Variables**:
- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`

**Base URL**: `https://api.amadeus.com`

**Key Endpoints**:
- `/v2/shopping/flight-offers` - Flight search
- `/v3/shopping/hotel-offers` - Hotel search
- `/v1/reference-data/locations` - Airport/city search
- `/v1/reference-data/locations/cities` - City search
- `/v1/shopping/transfer-offers` - Transfer search

**Usage in Project**:
- `lib/flights/amadeus-client.ts` - Client initialization
- `lib/amadeus/locations.ts` - Location search
- `app/api/flights/search/route.ts` - Flight search endpoint
- `app/api/amadeus-test/route.ts` - Test endpoint

**Documentation**: [Detailed Amadeus Specification](./api-specs/amadeus.md)

**Official Links**:
- [Developer Portal](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/)
- [API Catalog](https://developers.amadeus.com/self-service)
- [GitHub Examples](https://github.com/amadeus4dev/)

---

### Google Vertex AI (Imagen)

**Purpose**: AI-powered image generation for trip imagery

**Model**: imagen-4.0-generate-001 (Imagen 4.0 GA)

**Authentication**: Google Cloud Service Account

**Environment Variables**:
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `IMAGEN_MODEL`
- `IMAGE_PROVIDER` (set to "imagen")

**Base URL**: `https://{LOCATION}-aiplatform.googleapis.com/v1`

**Key Endpoint**:
- `/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL}:predict`

**Features**:
- Text-to-image generation
- SynthID watermarking
- Safety filters (configurable)
- Prompt enhancement
- Multiple aspect ratios (1:1, 3:4, 4:3, 16:9, 9:16)

**Usage in Project**:
- `lib/image-generation.ts` - Primary image generation
- `lib/actions/queue-image-generation.ts` - Queue management
- `app/api/admin/test/imagen-generate/route.ts` - Test endpoint

**Documentation**: [Detailed Vertex AI Specification](./api-specs/vertex-ai-imagen.md)

**Official Links**:
- [Image Generation API](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api)
- [Generate Images Guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images)

---

### OpenWeatherMap API

**Purpose**: Weather forecasts for trip destinations

**API**: One Call API 3.0

**Authentication**: API Key

**Environment Variable**: `OPENWEATHER_API_KEY`

**Base URL**: `https://api.openweathermap.org/data/2.5`

**Key Endpoints**:
- `/forecast` - 5-day forecast with 3-hour intervals
- `/weather` - Current weather

**Features**:
- Minute forecast (1 hour)
- Hourly forecast (48 hours)
- Daily forecast (8 days)
- Weather alerts
- Free tier: 1,000 calls/day

**Usage in Project**:
- `app/api/weather/forecast/route.ts` - Weather forecast
- `app/view/components/weather-section.tsx` - Weather display

**Documentation**: [Detailed OpenWeatherMap Specification](./api-specs/openweather.md)

**Official Links**:
- [API Documentation](https://openweathermap.org/api)
- [One Call API 3.0](https://openweathermap.org/api/one-call-3)

---

### Yelp Fusion API

**Purpose**: Restaurant search and business reviews

**Authentication**: Bearer Token (API Key)

**Environment Variables**:
- `YELP_API_KEY`
- `YELP_CLIENT_ID`

**Base URL**: `https://api.yelp.com/v3`

**Key Endpoints**:
- `/businesses/search` - Business search (up to 240 results)
- `/businesses/{id}` - Business details
- `/businesses/search/phone` - Phone search

**Usage in Project**:
- `app/api/admin/test/restaurants/route.ts` - Restaurant search
- `app/admin/apis/restaurants/page.tsx` - Admin testing

**Documentation**: [Detailed Yelp Specification](./api-specs/yelp.md)

**Official Links**:
- [Business Search API](https://docs.developer.yelp.com/reference/v3_business_search)
- [Getting Started](https://docs.developer.yelp.com/docs/getting-started)

---

### Viator Partner API

**Purpose**: Tours and activities search and booking

**Version**: 2.0

**Authentication**: API Key via `exp-api-key` header

**Environment Variable**: `VIATOR_API_KEY`

**Base URL**: `https://api.viator.com/partner`

**Key Endpoints**:
- `/products/search` - Product search
- `/products/{product-code}` - Product details
- `/availability/check` - Real-time availability
- `/bookings/book` - Create booking

**Features**:
- Product catalog with 240M+ places
- Real-time availability
- Booking management
- Multi-language support

**Usage in Project**:
- `app/api/admin/test/activities/route.ts` - Activity search
- `app/admin/apis/activities/page.tsx` - Admin testing

**Documentation**: [Detailed Viator Specification](./api-specs/viator.md)

**Official Links**:
- [Technical Documentation](https://docs.viator.com/partner-api/technical/)
- [Partner Resources](https://partnerresources.viator.com/)

---

### UploadThing

**Purpose**: File uploads (images, documents)

**Authentication**: Token-based

**Environment Variables**:
- `UPLOADTHING_APP_ID`
- `UPLOADTHING_SECRET`
- `UPLOADTHING_TOKEN`
- `NEXT_PUBLIC_UPLOADTHING_APP_ID` (client-side)

**Integration**: Next.js App Router with FileRouter pattern

**Max File Size**: 16MB for images

**Usage in Project**:
- `app/api/uploadthing/core.ts` - FileRouter configuration
- `app/api/uploadthing/route.ts` - Route handler
- `lib/upload-thing.ts` - Client utilities
- `lib/upload-thing-server.ts` - Server utilities

**Documentation**: [Detailed UploadThing Specification](./api-specs/uploadthing.md)

**Official Links**:
- [Next.js App Router Setup](https://docs.uploadthing.com/getting-started/appdir)
- [API Reference](https://docs.uploadthing.com/api-reference/server)

---

### NextAuth.js / Auth.js

**Purpose**: User authentication with OAuth providers

**Version**: v5 (Auth.js)

**Authentication**: Multiple OAuth providers

**Environment Variables**:
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- Provider-specific: `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, etc.

**Configured Providers** (7):
1. GitHub
2. Google (with YouTube readonly scope)
3. Facebook
4. Apple
5. Twitter
6. LinkedIn
7. Spotify

**Features**:
- OAuth 1.0, 1.0A, 2.0 support
- OpenID Connect (OIDC)
- Session management
- JWT support

**Usage in Project**:
- `auth.ts` - Main auth configuration
- Provider-specific config in auth setup

**Documentation**: [Detailed Auth Specification](./api-specs/auth.md)

**Official Links**:
- [OAuth Providers](https://authjs.dev/getting-started/authentication/oauth)
- [Provider List](https://authjs.dev/getting-started)

---

### Vercel AI SDK

**Purpose**: AI streaming, structured outputs, chat utilities

**Version**: 6.x (latest)

**Package**: `@ai-sdk/openai`, `@ai-sdk/react`

**Key Features**:
- `streamText()` - Stream text responses
- `Output.object()` - Structured data generation
- `Output.array()` - Array generation
- Tool calling support
- Zod schema validation

**Usage in Project**:
- `app/api/chat/route.ts` - Streaming chat
- `lib/ai/generate-place-suggestions.ts` - Structured outputs
- Multiple admin test endpoints

**Documentation**: [Detailed Vercel AI SDK Specification](./api-specs/vercel-ai-sdk.md)

**Official Links**:
- [Generating Structured Data](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data)
- [Streaming](https://sdk.vercel.ai/docs/foundations/streaming)

---

### Neon PostgreSQL

**Purpose**: Serverless PostgreSQL database

**Authentication**: Connection string

**Environment Variable**: `DATABASE_URL`

**Features**:
- Serverless architecture
- Autoscaling
- Database branching
- Connection pooling

**Connection**: Via Prisma ORM

**Usage in Project**:
- All database operations via Prisma Client
- `prisma/schema.prisma` - Database schema

**Documentation**: [Detailed Neon Specification](./api-specs/neon.md)

**Official Links**:
- [Neon Documentation](https://neon.tech/docs/introduction)
- [Data API](https://neon.tech/docs/data-api/get-started)

---

### Prisma ORM

**Purpose**: Type-safe database access and migrations

**Version**: 6.4.1

**Database**: PostgreSQL (via Neon)

**Schema File**: `prisma/schema.prisma`

**Key Features**:
- Type-safe database queries
- Schema migrations
- Relation handling
- Query building

**Usage in Project**:
- All database models and queries
- `lib/actions/*.ts` - Server actions with database access

**Documentation**: [Detailed Prisma Specification](./api-specs/prisma.md)

**Official Links**:
- [Prisma Client Reference](https://www.prisma.io/docs/orm/reference/prisma-client-reference)
- [PostgreSQL Connector](https://www.prisma.io/docs/orm/overview/databases/postgresql)

---

### Vercel Platform

**Purpose**: Application deployment, hosting, and analytics

**Features**:
- Serverless functions
- Edge runtime
- Analytics tracking
- Environment variables

**Package**: `@vercel/analytics`

**Usage in Project**:
- Deployment platform
- Analytics tracking throughout app

---

## API Security & Best Practices

### Environment Variables
All API keys and secrets are stored in `.env` and `.env.local` files. Never commit these files to version control.

### Rate Limiting
Each API has different rate limits:
- **OpenAI**: Tier-based, monitor via dashboard
- **Google Maps**: Per-API limits, quota management in Google Cloud
- **Amadeus**: Pay-as-you-go, monitor usage
- **Imagen**: 5 RPM limit (configurable via `IMAGEN_RPM_LIMIT`)
- **OpenWeather**: 1,000 calls/day (free tier)
- **Yelp**: Rate limits apply, monitor via headers
- **Viator**: Rate limits documented per endpoint

### Error Handling
All API routes implement error handling. Check individual route files for specific error handling patterns.

### Monitoring
Use the admin health check endpoint to monitor API status:
- `/api/admin/health` - Check all API configurations

---

## Adding New APIs

When integrating a new external API:

1. Add API credentials to `.env`
2. Create client/wrapper in `lib/` directory
3. Create API route in `app/api/`
4. Document in `docs/api-specs/[api-name].md`
5. Update this reference document
6. Add health check if applicable
7. Test via admin panel at `/admin`

---

## See Also

- [Individual API Specifications](./api-specs/) - Detailed docs for each API
- [Admin Panel](/admin) - API testing and monitoring interface
- [Environment Setup Guide](../.env.example) - Environment variable reference

---

## API Status Dashboard

Visit the admin panel to check API connectivity:
- **Production**: `/admin/apis`
- **Health Check**: `/api/admin/health`

---

## Support & Resources

### OpenAI
- [Platform Status](https://status.openai.com/)
- [Community Forum](https://community.openai.com/)

### Google Cloud
- [Cloud Status](https://status.cloud.google.com/)
- [Support](https://cloud.google.com/support)

### Amadeus
- [Support](https://developers.amadeus.com/support)
- [API Status](https://developers.amadeus.com/status)

### Others
Check individual API documentation links above for support channels.
