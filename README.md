This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

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
