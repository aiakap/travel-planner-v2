# Travel Planner v2

A comprehensive AI-powered travel planning application built with Next.js, featuring intelligent trip creation, real-time collaboration, and integration with multiple travel APIs.

## Features

- 🤖 **AI-Powered Planning** - Chat with GPT-4o to plan trips
- 🗺️ **Interactive Maps** - Google Maps integration with route visualization
- ✈️ **Flight Search** - Real-time flight search via Amadeus API
- 🏨 **Hotel & Restaurant Search** - Integrated with Google Places and Yelp
- 🎨 **AI Image Generation** - Automatic trip images with Vertex AI Imagen
- 🌤️ **Weather Forecasts** - Real-time weather for destinations
- 🎯 **Activity Recommendations** - Tours and activities via Viator
- 📱 **Responsive Design** - Works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Neon serverless)
- API keys for external services (see [API Documentation](./docs/API_REFERENCE.md))

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Fill in your API keys and database URL. See [API Reference](./docs/API_REFERENCE.md) for required variables.

4. Set up the database:

```bash
npx prisma generate
npx prisma migrate deploy
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Documentation

See the consolidated index in [`docs/README.md`](./docs/README.md) for navigation.

### API Documentation

Comprehensive documentation for all integrated APIs:

- **[API Reference](./docs/API_REFERENCE.md)** - Overview of all APIs
- **[API Specifications](./docs/api-specs/)** - Detailed specs for each API:
  - [OpenAI](./docs/api-specs/openai.md) - Chat, structured outputs, image generation
  - [Google Maps](./docs/api-specs/google-maps.md) - Maps, geocoding, places
  - [Amadeus](./docs/api-specs/amadeus.md) - Flights, hotels, airports
  - [Vertex AI Imagen](./docs/api-specs/vertex-ai-imagen.md) - AI image generation
  - [OpenWeatherMap](./docs/api-specs/openweather.md) - Weather forecasts
  - [Yelp Fusion](./docs/api-specs/yelp.md) - Restaurant search
  - [Viator](./docs/api-specs/viator.md) - Tours and activities
  - [UploadThing](./docs/api-specs/uploadthing.md) - File uploads
  - [NextAuth.js](./docs/api-specs/auth.md) - OAuth authentication
  - [Vercel AI SDK](./docs/api-specs/vercel-ai-sdk.md) - AI utilities
  - [Neon PostgreSQL](./docs/api-specs/neon.md) - Database platform
  - [Prisma ORM](./docs/api-specs/prisma.md) - Database ORM
- **[Usage Examples](./docs/API_USAGE_EXAMPLES.md)** - Real-world code examples

### System Documentation

- **[Image Generation System](./docs/IMAGE_GENERATION_SYSTEM.md)** - Complete architecture, troubleshooting, and maintenance guide

### Implementation Guides

- Feature and fix write-ups: see `docs/changelogs/` (formerly the `*_COMPLETE.md` and `*_FIX.md` files in the repo root).
- Setup/how-to content: see `docs/guides/` for quick starts, READMEs, and checklists.
- Operational/runbook notes: see `docs/runbooks/` for debugging and rollback procedures.

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Google Maps** - Map components

### Backend
- **Next.js API Routes** - Serverless API
- **Prisma** - Database ORM
- **Neon PostgreSQL** - Serverless database

### AI & Machine Learning
- **OpenAI GPT-4o** - Chat and content generation
- **Vertex AI Gemini 3 Pro Image** - AI image generation with text support
- **Vertex AI Imagen 4.0** - Fast image generation
- **Vercel AI SDK** - AI streaming and utilities

### External APIs
- **Google Maps Platform** - Location services
- **Amadeus** - Flight and hotel search
- **Yelp Fusion** - Restaurant data
- **Viator** - Tours and activities
- **OpenWeatherMap** - Weather data

### Authentication & Storage
- **NextAuth.js** - OAuth authentication
- **UploadThing** - File uploads

## Project Structure

```
travel-planner-v2/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin panel
│   ├── trip/              # Trip management
│   ├── view/              # Trip viewing
│   └── exp/               # Experimental features
├── components/            # React components
├── lib/                   # Utilities and libraries
│   ├── actions/          # Server actions
│   ├── ai/               # AI generation functions
│   ├── schemas/          # Zod schemas
│   └── types/            # TypeScript types
├── prisma/               # Database schema and migrations
├── docs/                 # Documentation
│   ├── API_REFERENCE.md  # API overview
│   ├── api-specs/        # Detailed API specs
│   ├── API_USAGE_EXAMPLES.md  # Code examples
│   └── IMAGE_GENERATION_SYSTEM.md  # Image generation guide
└── public/               # Static assets
```

## Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
npm start
```

### Database Management

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed
```

## Deploy on Vercel

The easiest way to deploy is using the [Vercel Platform](https://vercel.com/new).

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Contributing

This is a private project. For questions or issues, contact the development team.

## Project Progress Log (hour by hour, Pacific Time)

- **2026-01-14 21:30–22:30** — Initial import from prior travel planner, baseline Next.js app scaffold in place.
- **2026-01-14 22:30–23:00** — Wired Prisma/database basics; added trip/location creation; integrated Google Maps display.
- **2026-01-14 23:00–23:15** — Added segment support with start/end, notes, and times; improved globe page client load flow.
- **2026-01-14 23:15–23:30** — Enabled segment naming and image upload; built trip edit page with image upload.
- **2026-01-14 23:30–23:45** — Tweaked upload settings (anonymous uploads for testing, larger image limit).
- **2026-01-14 23:45–23:59** — Refined itinerary UI and usability.
- **2026-01-15 00:00–00:10** — Edit segments end-to-end working; ready to add reservations next.
- **2026-01-15 10:00–10:30** — Fixed AI chat to work with AI SDK v6; basic chat now functional.

## AI Chat Feature

The AI chat uses **Vercel AI SDK v6** with OpenAI GPT-4o. Key implementation notes:

### Environment Variables Required
```
OPENAI_API_KEY=your-openai-api-key
```

### Current Status
- ✅ Basic chat working - users can have conversations with the AI travel assistant
- ✅ Message streaming with real-time responses
- ✅ Messages saved to database per conversation

### Future Enhancements (TODO)
- [ ] **Enable AI Tools** - Uncomment and wire up `createTripPlanningTools()` in `/app/api/chat/route.ts` to allow the AI to:
  - Create trips automatically
  - Add segments/locations to trips
  - Suggest and create reservations
  - Fetch user's existing trips
- [ ] **Conversation History** - Load previous messages when returning to a conversation
- [ ] **Trip Context** - Pass current trip context to the AI for more relevant suggestions
- [ ] **File/Image Attachments** - Allow users to upload travel documents or images for the AI to analyze
- [ ] **Structured Output** - Use AI SDK's `output` feature for extracting structured trip data from conversations
