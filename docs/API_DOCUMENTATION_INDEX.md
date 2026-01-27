# API Documentation Index

## Quick Navigation

This is your central hub for all API documentation in the Travel Planner v2 project.

**Last Updated**: January 27, 2026

---

## 📚 Documentation Structure

### Main Documents

1. **[API_REFERENCE.md](./API_REFERENCE.md)** 
   - Master overview of all 13+ APIs
   - Quick reference by category
   - Authentication methods
   - Rate limits and quotas
   - Links to detailed specs

2. **[API_USAGE_EXAMPLES.md](./API_USAGE_EXAMPLES.md)**
   - Real-world code examples from the project
   - Multi-API integration patterns
   - Error handling examples
   - Caching strategies
   - Rate limiting implementations

### Detailed API Specifications

Located in `./api-specs/`:

#### AI Services

- **[openai.md](./api-specs/openai.md)** - OpenAI API (GPT-4o, DALL-E 3)
  - Chat completions
  - Structured outputs
  - Vision API
  - Image generation
  - Embeddings

- **[vertex-ai-imagen.md](./api-specs/vertex-ai-imagen.md)** - Google Vertex AI Imagen
  - Image generation (primary)
  - Model parameters
  - Safety filters
  - SynthID watermarking

- **[vercel-ai-sdk.md](./api-specs/vercel-ai-sdk.md)** - Vercel AI SDK
  - Streaming text/objects
  - Tool calling
  - React hooks
  - Output types

#### Maps & Location

- **[google-maps.md](./api-specs/google-maps.md)** - Google Maps Platform
  - Places API (New)
  - Geocoding API
  - Timezone API
  - Maps JavaScript API

#### Travel Services

- **[amadeus.md](./api-specs/amadeus.md)** - Amadeus Travel API
  - Flight search
  - Hotel search
  - Airport/city data
  - Transfer services

- **[yelp.md](./api-specs/yelp.md)** - Yelp Fusion API
  - Business search
  - Restaurant ratings
  - Reviews

- **[viator.md](./api-specs/viator.md)** - Viator Partner API
  - Activity search
  - Tour details
  - Availability checking
  - Booking (if merchant)

- **[openweather.md](./api-specs/openweather.md)** - OpenWeatherMap API
  - Weather forecasts
  - Current conditions
  - Hourly/daily forecasts

#### Authentication & Storage

- **[auth.md](./api-specs/auth.md)** - NextAuth.js / Auth.js
  - OAuth providers (7 configured)
  - Session management
  - Protected routes
  - Custom pages

- **[uploadthing.md](./api-specs/uploadthing.md)** - UploadThing
  - File uploads
  - CDN delivery
  - FileRouter pattern
  - Image optimization

#### Database

- **[neon.md](./api-specs/neon.md)** - Neon PostgreSQL
  - Serverless database
  - Connection pooling
  - Database branching
  - Performance optimization

- **[prisma.md](./api-specs/prisma.md)** - Prisma ORM
  - Schema management
  - Type-safe queries
  - Migrations
  - Best practices

---

## 🔍 Find What You Need

### By Use Case

**Setting up a new API?**
→ Check [API_REFERENCE.md](./API_REFERENCE.md) for authentication and environment variables

**Looking for code examples?**
→ See [API_USAGE_EXAMPLES.md](./API_USAGE_EXAMPLES.md)

**Need endpoint details?**
→ Go to specific API spec in `./api-specs/`

**Troubleshooting API issues?**
→ Each API spec has a Troubleshooting section

**Understanding rate limits?**
→ Check individual API specs or [API_REFERENCE.md](./API_REFERENCE.md)

---

## 📊 API Overview

### Total APIs Integrated: 13

**By Category**:
- AI Services: 3 (OpenAI, Imagen, Vercel AI SDK)
- Maps & Location: 1 (Google Maps Platform - 4 APIs)
- Travel Services: 4 (Amadeus, Viator, Yelp, OpenWeather)
- Auth & Storage: 2 (NextAuth.js, UploadThing)
- Database: 2 (Neon, Prisma)
- Infrastructure: 1 (Vercel)

---

## 🚀 Quick Start Guide

### 1. Get API Keys

Visit each provider's website to obtain credentials:

- [OpenAI Platform](https://platform.openai.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Amadeus Developers](https://developers.amadeus.com/)
- [OpenWeatherMap](https://openweathermap.org/api)
- [Yelp Developers](https://www.yelp.com/developers)
- [Viator Partners](https://viator.com/partners)
- [UploadThing](https://uploadthing.com/)
- [Neon Console](https://console.neon.tech/)

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your keys.

See [API_REFERENCE.md](./API_REFERENCE.md) for required environment variables.

### 3. Test APIs

Use the admin panel at `/admin/apis` to test API connectivity.

### 4. Start Development

```bash
npm run dev
```

---

## 🔧 Maintenance

### Updating Documentation

When adding or modifying API integrations:

1. Update the relevant spec file in `./api-specs/`
2. Add usage examples to [API_USAGE_EXAMPLES.md](./API_USAGE_EXAMPLES.md)
3. Update [API_REFERENCE.md](./API_REFERENCE.md) if adding new API
4. Test via admin panel

### Monitoring API Health

- Use `/api/admin/health` endpoint
- Check individual API test endpoints
- Monitor usage in provider dashboards

---

## 📖 Additional Resources

### Project Documentation

- [Main README](../README.md) - Project overview
- Implementation guides (various `*_COMPLETE.md` files in root)
- [Admin Panel](../app/admin/) - API testing interface

### External Documentation

Each API specification includes links to:
- Official documentation
- API reference guides
- SDKs and tools
- Support resources
- Community forums

---

## 💡 Tips

### Finding Examples

Use your editor's search (Cmd/Ctrl+F) across the documentation:
- Search "Example:" for code examples
- Search "Usage in Project:" for file locations
- Search "Troubleshooting" for common issues

### Understanding Integration

Each API spec includes:
- ✅ Authentication setup
- ✅ Request/response formats
- ✅ Real code examples from this project
- ✅ Error handling
- ✅ Best practices
- ✅ Testing instructions

---

## 📞 Support

### API Issues

Check troubleshooting sections in individual API specs.

### Project Questions

Review implementation guides and usage examples.

### External API Support

Each API spec includes official support links and community resources.

---

## 🔄 Last Updated

This documentation was last comprehensively updated on **January 27, 2026**.

API specifications reflect the latest available versions as of this date. Always check official documentation for the most current information.

---

## 📝 Quick Links

| API | Spec | Official Docs | Used In Project |
|-----|------|---------------|-----------------|
| OpenAI | [Spec](./api-specs/openai.md) | [Docs](https://platform.openai.com/docs) | Chat, AI generation |
| Google Maps | [Spec](./api-specs/google-maps.md) | [Docs](https://developers.google.com/maps) | Maps, places, geocoding |
| Amadeus | [Spec](./api-specs/amadeus.md) | [Docs](https://developers.amadeus.com/) | Flights, hotels |
| Imagen | [Spec](./api-specs/vertex-ai-imagen.md) | [Docs](https://cloud.google.com/vertex-ai) | Trip images |
| OpenWeather | [Spec](./api-specs/openweather.md) | [Docs](https://openweathermap.org/api) | Weather forecasts |
| Yelp | [Spec](./api-specs/yelp.md) | [Docs](https://docs.developer.yelp.com/) | Restaurants |
| Viator | [Spec](./api-specs/viator.md) | [Docs](https://docs.viator.com/) | Activities |
| UploadThing | [Spec](./api-specs/uploadthing.md) | [Docs](https://docs.uploadthing.com/) | File uploads |
| NextAuth | [Spec](./api-specs/auth.md) | [Docs](https://authjs.dev/) | Authentication |
| Vercel AI SDK | [Spec](./api-specs/vercel-ai-sdk.md) | [Docs](https://sdk.vercel.ai/) | AI utilities |
| Neon | [Spec](./api-specs/neon.md) | [Docs](https://neon.tech/docs) | Database |
| Prisma | [Spec](./api-specs/prisma.md) | [Docs](https://www.prisma.io/docs) | ORM |

---

**Happy Coding! 🚀**
