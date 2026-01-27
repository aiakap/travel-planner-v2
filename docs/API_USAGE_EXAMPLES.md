# API Usage Examples from Travel Planner v2

## Overview

This document provides real-world code examples showing how each external API is integrated and used throughout the Travel Planner v2 application.

**Last Updated**: January 27, 2026

---

## Table of Contents

- [OpenAI API](#openai-api)
- [Google Maps Platform](#google-maps-platform)
- [Amadeus Travel API](#amadeus-travel-api)
- [Vertex AI Imagen](#vertex-ai-imagen)
- [OpenWeatherMap](#openweathermap)
- [Yelp Fusion API](#yelp-fusion-api)
- [Viator Partner API](#viator-partner-api)
- [UploadThing](#uploadthing)
- [NextAuth.js](#nextauthjs)
- [Vercel AI SDK](#vercel-ai-sdk)
- [Database (Prisma + Neon)](#database-prisma--neon)

---

## OpenAI API

### Chat with Streaming

**File**: `app/api/chat/route.ts`

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: openai('gpt-4o-2024-11-20'),
    messages,
    system: 'You are a helpful travel planning assistant.',
    temperature: 0.7,
  });
  
  return result.toDataStreamResponse();
}
```

### Structured Place Suggestions

**File**: `lib/ai/generate-place-suggestions.ts`

```typescript
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const placeSuggestionSchema = z.object({
  places: z.array(z.object({
    name: z.string(),
    description: z.string(),
    category: z.enum(['restaurant', 'attraction', 'hotel', 'activity']),
    priceLevel: z.enum(['$', '$$', '$$$', '$$$$']),
    estimatedDuration: z.string(),
  })),
});

export async function generatePlaceSuggestions(
  location: string,
  preferences?: string[]
) {
  const { output } = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    output: Output.object({
      schema: placeSuggestionSchema,
    }),
    prompt: `Generate 5 place suggestions for ${location}. 
    ${preferences ? `User preferences: ${preferences.join(', ')}` : ''}`,
  });
  
  return output.places;
}
```

### Email Content Extraction

**File**: `app/api/admin/email-extract/route.ts`

```typescript
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const extractionSchema = z.object({
  flights: z.array(z.object({
    airline: z.string(),
    flightNumber: z.string(),
    origin: z.string(),
    destination: z.string(),
    departureTime: z.string(),
    arrivalTime: z.string(),
  })),
  hotels: z.array(z.object({
    name: z.string(),
    checkIn: z.string(),
    checkOut: z.string(),
    confirmationNumber: z.string().optional(),
  })),
});

export async function POST(req: Request) {
  const { emailContent } = await req.json();
  
  const { output } = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    output: Output.object({ schema: extractionSchema }),
    prompt: `Extract travel information from this email:\n\n${emailContent}`,
  });
  
  return Response.json(output);
}
```

---

## Google Maps Platform

### Place Autocomplete

**File**: `app/api/places/autocomplete/route.ts`

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  const types = searchParams.get('types')?.split(',') || ['locality', 'airport'];
  
  if (!input) {
    return Response.json({ error: 'Input required' }, { status: 400 });
  }
  
  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
        },
        body: JSON.stringify({
          input,
          includedPrimaryTypes: types,
          languageCode: 'en',
        }),
      }
    );
    
    const data = await response.json();
    
    return Response.json({
      suggestions: data.suggestions?.map((s: any) => ({
        placeId: s.placePrediction?.placeId,
        text: s.placePrediction?.text?.text,
        mainText: s.placePrediction?.structuredFormat?.mainText?.text,
        secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text,
        types: s.placePrediction?.types,
      })) || [],
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    return Response.json({ error: 'Autocomplete failed' }, { status: 500 });
  }
}
```

### Geocoding with Timezone

**File**: `app/api/geocode-timezone/route.ts`

```typescript
export async function POST(request: Request) {
  const { address } = await request.json();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY!;
  
  try {
    // Geocode address
    const geocodeResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const geocodeData = await geocodeResponse.json();
    
    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      return Response.json({ error: 'Geocoding failed' }, { status: 404 });
    }
    
    const { lat, lng } = geocodeData.results[0].geometry.location;
    const formattedAddress = geocodeData.results[0].formatted_address;
    
    // Get timezone
    const timestamp = Math.floor(Date.now() / 1000);
    const timezoneResponse = await fetch(
      `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${timestamp}&key=${apiKey}`
    );
    const timezoneData = await timezoneResponse.json();
    
    return Response.json({
      coordinates: { latitude: lat, longitude: lng },
      address: formattedAddress,
      timezone: timezoneData.timeZoneId,
      timezoneName: timezoneData.timeZoneName,
    });
  } catch (error) {
    console.error('Geocode/timezone error:', error);
    return Response.json({ error: 'Failed to geocode' }, { status: 500 });
  }
}
```

### Airport Search

**File**: `app/api/airports/search-google/route.ts`

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  
  if (!query) {
    return Response.json({ error: 'Query required' }, { status: 400 });
  }
  
  const response = await fetch(
    'https://places.googleapis.com/v1/places:searchText',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types,places.id',
      },
      body: JSON.stringify({
        textQuery: `${query} airport`,
        includedType: 'airport',
        maxResultCount: 10,
      }),
    }
  );
  
  const data = await response.json();
  
  const airports = data.places?.map((place: any) => ({
    name: place.displayName?.text,
    address: place.formattedAddress,
    coordinates: {
      lat: place.location?.latitude,
      lng: place.location?.longitude,
    },
    placeId: place.id,
  })) || [];
  
  return Response.json({ airports });
}
```

---

## Amadeus Travel API

### Flight Search

**File**: `app/api/flights/search/route.ts` (conceptual example)

```typescript
import amadeus from '@/lib/flights/amadeus-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const params = {
    originLocationCode: searchParams.get('origin')!,
    destinationLocationCode: searchParams.get('destination')!,
    departureDate: searchParams.get('departureDate')!,
    adults: searchParams.get('adults') || '1',
    max: '10',
  };
  
  try {
    const response = await amadeus.shopping.flightOffersSearch.get(params);
    
    const flights = response.data.map((offer: any) => ({
      id: offer.id,
      price: {
        total: parseFloat(offer.price.total),
        currency: offer.price.currency,
      },
      itineraries: offer.itineraries.map((it: any) => ({
        duration: it.duration,
        segments: it.segments.map((seg: any) => ({
          departure: {
            airport: seg.departure.iataCode,
            time: seg.departure.at,
          },
          arrival: {
            airport: seg.arrival.iataCode,
            time: seg.arrival.at,
          },
          airline: seg.carrierCode,
          flightNumber: seg.number,
        })),
      })),
    }));
    
    return Response.json({ flights });
  } catch (error) {
    console.error('Flight search error:', error);
    return Response.json({ error: 'Flight search failed' }, { status: 500 });
  }
}
```

### Airport Search with Amadeus

**File**: `lib/amadeus/locations.ts`

```typescript
import amadeus from '@/lib/flights/amadeus-client';

export async function searchAirportsByKeyword(keyword: string) {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: 'AIRPORT',
      'page[limit]': '10',
    });
    
    return response.data.map((location: any) => ({
      iataCode: location.iataCode,
      name: location.name,
      city: location.address.cityName,
      country: location.address.countryName,
      coordinates: {
        latitude: location.geoCode.latitude,
        longitude: location.geoCode.longitude,
      },
    }));
  } catch (error) {
    console.error('Amadeus airport search error:', error);
    return [];
  }
}
```

---

## Vertex AI Imagen

### Trip Image Generation

**File**: `lib/image-generation.ts`

```typescript
import { GoogleAuth } from 'google-auth-library';

export async function generateTripImage(
  tripDescription: string,
  destination: string
): Promise<string> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT!;
  const location = process.env.GOOGLE_CLOUD_LOCATION!;
  const model = process.env.IMAGEN_MODEL || 'imagen-4.0-generate-001';
  
  // Construct prompt
  const prompt = `A beautiful travel destination image of ${destination}. ${tripDescription}. 
  Photorealistic style, vibrant colors, suitable for travel brochure, high quality, professional photography.`;
  
  // Authenticate
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
  // Generate image
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '16:9',
        addWatermark: true,
        enhancePrompt: true,
        safetySetting: 'block_medium_and_above',
        sampleImageSize: '1K',
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Imagen API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (data.predictions?.[0]?.raiFilteredReason) {
    console.warn('Image filtered:', data.predictions[0].raiFilteredReason);
    // Fallback to DALL-E
    return await generateWithDallE(prompt);
  }
  
  if (!data.predictions?.[0]?.bytesBase64Encoded) {
    throw new Error('No image generated');
  }
  
  // Save base64 image
  const imageBuffer = Buffer.from(
    data.predictions[0].bytesBase64Encoded,
    'base64'
  );
  
  return await saveImageToStorage(imageBuffer, `trip-${Date.now()}.png`);
}
```

### Queued Image Generation

**File**: `lib/actions/queue-image-generation.ts`

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { generateTripImage } from '@/lib/image-generation';

export async function queueTripImageGeneration(
  tripId: string,
  prompt: string
) {
  // Create queue entry
  await prisma.imageGenerationQueue.create({
    data: {
      tripId,
      prompt,
      status: 'PENDING',
    },
  });
  
  return { status: 'queued' };
}

export async function processImageQueue() {
  const pending = await prisma.imageGenerationQueue.findMany({
    where: { status: 'PENDING' },
    take: 5, // Process 5 at a time (RPM limit)
    orderBy: { createdAt: 'asc' },
  });
  
  for (const job of pending) {
    try {
      // Update status
      await prisma.imageGenerationQueue.update({
        where: { id: job.id },
        data: { status: 'PROCESSING' },
      });
      
      // Generate image
      const imageUrl = await generateTripImage(job.prompt, '');
      
      // Update trip
      await prisma.trip.update({
        where: { id: job.tripId },
        data: { imageUrl },
      });
      
      // Mark complete
      await prisma.imageGenerationQueue.update({
        where: { id: job.id },
        data: { status: 'COMPLETED', imageUrl },
      });
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 12000)); // 5 RPM
    } catch (error) {
      console.error('Image generation failed:', error);
      await prisma.imageGenerationQueue.update({
        where: { id: job.id },
        data: { 
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}
```

---

## OpenWeatherMap

### Weather Forecast

**File**: `app/api/weather/forecast/route.ts`

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  if (!lat || !lon) {
    return Response.json(
      { error: 'Latitude and longitude required' },
      { status: 400 }
    );
  }
  
  const apiKey = process.env.OPENWEATHER_API_KEY!;
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&cnt=8`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    const forecast = data.list.map((item: any) => ({
      datetime: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
      windSpeed: item.wind.speed,
      precipitation: Math.round(item.pop * 100),
    }));
    
    return Response.json({
      city: data.city.name,
      country: data.city.country,
      forecast,
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    return Response.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}
```

---

## Yelp Fusion API

### Restaurant Search

**File**: `app/api/admin/test/restaurants/route.ts`

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || 'San Francisco, CA';
  const term = searchParams.get('term') || 'restaurants';
  const categories = searchParams.get('categories');
  
  const url = new URL('https://api.yelp.com/v3/businesses/search');
  url.searchParams.set('location', location);
  url.searchParams.set('term', term);
  url.searchParams.set('limit', '20');
  url.searchParams.set('sort_by', 'rating');
  
  if (categories) {
    url.searchParams.set('categories', categories);
  }
  
  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return Response.json({
      restaurants: data.businesses.map((biz: any) => ({
        id: biz.id,
        name: biz.name,
        rating: biz.rating,
        reviewCount: biz.review_count,
        price: biz.price,
        categories: biz.categories.map((c: any) => c.title).join(', '),
        address: biz.location.display_address.join(', '),
        phone: biz.display_phone,
        imageUrl: biz.image_url,
        url: biz.url,
        coordinates: biz.coordinates,
      })),
      total: data.total,
    });
  } catch (error) {
    console.error('Yelp API error:', error);
    return Response.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}
```

---

## Viator Partner API

### Activity Search

**File**: `app/api/admin/test/activities/route.ts`

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { destination, startDate, endDate, tags } = body;
  
  try {
    const response = await fetch(
      'https://api.viator.com/partner/products/search',
      {
        method: 'POST',
        headers: {
          'exp-api-key': process.env.VIATOR_API_KEY!,
          'Accept': 'application/json;version=2.0',
          'Accept-Language': 'en-US',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filtering: {
            destination,
            startDate,
            endDate,
            tags,
          },
          sorting: {
            sort: 'TRAVELER_RATING',
            order: 'DESCENDING',
          },
          pagination: {
            start: 1,
            count: 20,
          },
          currency: 'USD',
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Viator API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return Response.json({
      activities: data.products?.map((product: any) => ({
        code: product.productCode,
        title: product.title,
        description: product.description,
        rating: product.reviews?.combinedAverageRating,
        reviewCount: product.reviews?.totalReviews,
        duration: product.duration?.fixedDurationInMinutes,
        price: product.pricing?.summary?.fromPrice,
        currency: product.pricing?.currency,
        imageUrl: product.images?.[0]?.variants?.[0]?.url,
      })) || [],
      total: data.totalCount,
    });
  } catch (error) {
    console.error('Viator API error:', error);
    return Response.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
```

---

## UploadThing

### FileRouter Configuration

**File**: `app/api/uploadthing/core.ts`

```typescript
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";

const f = createUploadthing();

export const ourFileRouter = {
  tripImageUploader: f({
    image: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
      const session = await auth();
      
      if (!session?.user?.id) {
        throw new UploadThingError("Unauthorized");
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for user:", metadata.userId);
      console.log("File URL:", file.url);
      
      // Could save to database here
      // await prisma.uploadedFile.create({
      //   data: {
      //     userId: metadata.userId,
      //     url: file.url,
      //     key: file.key,
      //   },
      // });
      
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
```

### Client Usage

**File**: `components/image-uploader.tsx` (example)

```typescript
"use client";

import { UploadButton } from "@/lib/upload-thing";

export function TripImageUploader({ tripId, onUploadComplete }: Props) {
  return (
    <UploadButton
      endpoint="tripImageUploader"
      onClientUploadComplete={(res) => {
        if (res?.[0]?.url) {
          onUploadComplete(res[0].url);
        }
      }}
      onUploadError={(error: Error) => {
        console.error("Upload error:", error);
        alert(`Upload failed: ${error.message}`);
      }}
      onUploadBegin={(fileName) => {
        console.log("Uploading:", fileName);
      }}
    />
  );
}
```

---

## NextAuth.js

### Authentication Check in API Route

**File**: `app/api/trips/route.ts` (example)

```typescript
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
    include: { segments: true },
  });
  
  return Response.json({ trips });
}

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  const data = await request.json();
  
  const trip = await prisma.trip.create({
    data: {
      ...data,
      userId: session.user.id,
    },
  });
  
  return Response.json({ trip });
}
```

### Protected Server Component

**File**: `app/profile/page.tsx` (example)

```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session) {
    redirect('/api/auth/signin');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      trips: {
        orderBy: { startDate: 'desc' },
        take: 5,
      },
    },
  });
  
  return (
    <div>
      <h1>Welcome, {user?.name || session.user.email}</h1>
      <div>
        <h2>Your Recent Trips</h2>
        {user?.trips.map(trip => (
          <div key={trip.id}>{trip.name}</div>
        ))}
      </div>
    </div>
  );
}
```

---

## Vercel AI SDK

### Streaming Chat with Tools

**File**: `app/api/chat/route.ts`

```typescript
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';
import { searchGooglePlaces } from '@/lib/actions/google-places-nearby';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: openai('gpt-4o-2024-11-20'),
    messages,
    system: `You are a helpful travel planning assistant. 
    Use the available tools to search for places, weather, and activities.`,
    tools: {
      searchPlaces: tool({
        description: 'Search for places and attractions in a location',
        parameters: z.object({
          location: z.string().describe('City or location name'),
          type: z.string().describe('Type of place: restaurant, hotel, attraction'),
          radius: z.number().optional().describe('Search radius in meters'),
        }),
        execute: async ({ location, type, radius }) => {
          const results = await searchGooglePlaces(location, type, radius);
          return results;
        },
      }),
      getWeather: tool({
        description: 'Get weather forecast for a location',
        parameters: z.object({
          latitude: z.number(),
          longitude: z.number(),
        }),
        execute: async ({ latitude, longitude }) => {
          const response = await fetch(
            `/api/weather/forecast?lat=${latitude}&lon=${longitude}`
          );
          return await response.json();
        },
      }),
    },
    maxSteps: 5,
  });
  
  return result.toDataStreamResponse();
}
```

### Simple Structured Generation

**File**: `app/api/chat/simple/route.ts`

```typescript
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(request: Request) {
  const { prompt } = await request.json();
  
  const { output } = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    output: Output.object({
      schema: z.object({
        suggestions: z.array(z.object({
          name: z.string(),
          description: z.string(),
          category: z.string(),
        })),
      }),
    }),
    prompt: `Generate travel suggestions: ${prompt}`,
  });
  
  return Response.json(output);
}
```

---

## Database (Prisma + Neon)

### Create Trip with Segments

**File**: `lib/actions/create-trip.ts` (example)

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function createTrip(data: {
  name: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  segments?: Array<{
    type: string;
    startTime: Date;
    endTime?: Date;
  }>;
}) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  
  const trip = await prisma.trip.create({
    data: {
      name: data.name,
      destination: data.destination,
      startDate: data.startDate,
      endDate: data.endDate,
      userId: session.user.id,
      segments: data.segments ? {
        create: data.segments.map(seg => ({
          type: seg.type,
          startTime: seg.startTime,
          endTime: seg.endTime,
        })),
      } : undefined,
    },
    include: {
      segments: {
        orderBy: { startTime: 'asc' },
      },
    },
  });
  
  return trip;
}
```

### Complex Query with Relations

**File**: `lib/actions/get-trip-details.ts` (example)

```typescript
'use server';

import { prisma } from '@/lib/prisma';

export async function getTripDetails(tripId: string) {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      segments: {
        orderBy: { startTime: 'asc' },
        include: {
          location: true,
        },
      },
      reservations: {
        include: {
          hotel: true,
        },
      },
    },
  });
  
  if (!trip) {
    return null;
  }
  
  return {
    ...trip,
    durationDays: Math.ceil(
      (trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24)
    ),
    totalSegments: trip.segments.length,
  };
}
```

### Transaction Example

**File**: `lib/actions/update-trip.ts`

```typescript
'use server';

import { prisma } from '@/lib/prisma';

export async function updateTripWithSegments(
  tripId: string,
  tripData: any,
  newSegments: any[]
) {
  return await prisma.$transaction(async (tx) => {
    // Update trip
    const trip = await tx.trip.update({
      where: { id: tripId },
      data: tripData,
    });
    
    // Delete old segments
    await tx.segment.deleteMany({
      where: { tripId },
    });
    
    // Create new segments
    const segments = await tx.segment.createMany({
      data: newSegments.map(seg => ({
        ...seg,
        tripId,
      })),
    });
    
    return { trip, segmentCount: segments.count };
  });
}
```

---

## Combined Example: Complete Trip Planning Flow

**File**: `lib/actions/add-flights-to-trip.ts`

This file demonstrates integration of multiple APIs:

```typescript
'use server';

import { prisma } from '@/lib/prisma';
import amadeus from '@/lib/flights/amadeus-client';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function addFlightsToTrip(
  tripId: string,
  origin: string,
  destination: string,
  departureDate: string
) {
  // 1. Get trip details from database
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
  });
  
  if (!trip) {
    throw new Error('Trip not found');
  }
  
  // 2. Search flights with Amadeus
  const flightResponse = await amadeus.shopping.flightOffersSearch.get({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate,
    adults: '1',
    max: '5',
  });
  
  const flightOffers = flightResponse.data;
  
  // 3. Use AI to recommend best flight
  const { output } = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    output: Output.object({
      schema: z.object({
        recommendedIndex: z.number(),
        reasoning: z.string(),
      }),
    }),
    prompt: `Given these flight options: ${JSON.stringify(flightOffers.slice(0, 3))}
    Which flight would you recommend and why? Return the index (0-2) and reasoning.`,
  });
  
  const recommendedFlight = flightOffers[output.recommendedIndex];
  
  // 4. Create flight segment in database
  const segment = await prisma.segment.create({
    data: {
      tripId,
      type: 'FLIGHT',
      startTime: new Date(recommendedFlight.itineraries[0].segments[0].departure.at),
      endTime: new Date(recommendedFlight.itineraries[0].segments[0].arrival.at),
      data: {
        airline: recommendedFlight.validatingAirlineCodes[0],
        flightNumber: recommendedFlight.itineraries[0].segments[0].number,
        price: parseFloat(recommendedFlight.price.total),
        currency: recommendedFlight.price.currency,
        aiReasoning: output.reasoning,
      },
    },
  });
  
  // 5. Generate trip image with new destination
  // (Queued for background processing)
  await queueTripImageGeneration(
    tripId,
    `Travel from ${origin} to ${destination}, ${trip.name}`
  );
  
  return {
    segment,
    flightDetails: recommendedFlight,
    aiRecommendation: output.reasoning,
  };
}
```

---

## Multi-API Integration Pattern

### Complete Place Suggestion Flow

Combines: OpenAI + Google Maps + Yelp

```typescript
'use server';

import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function getCompletePlaceRecommendations(location: string) {
  // 1. Generate initial suggestions with AI
  const { output: aiSuggestions } = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    output: Output.object({
      schema: z.object({
        places: z.array(z.object({
          name: z.string(),
          type: z.enum(['restaurant', 'attraction', 'hotel']),
          description: z.string(),
        })),
      }),
    }),
    prompt: `Suggest 5 must-visit places in ${location}`,
  });
  
  // 2. Enrich with Google Places data
  const enrichedPlaces = await Promise.all(
    aiSuggestions.places.map(async (place) => {
      const googleResponse = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
          },
          body: JSON.stringify({
            textQuery: `${place.name} ${location}`,
            maxResultCount: 1,
          }),
        }
      );
      
      const googleData = await googleResponse.json();
      const googlePlace = googleData.places?.[0];
      
      return {
        ...place,
        googlePlaceId: googlePlace?.id,
        coordinates: googlePlace?.location,
        formattedAddress: googlePlace?.formattedAddress,
      };
    })
  );
  
  // 3. Add Yelp ratings for restaurants
  const finalPlaces = await Promise.all(
    enrichedPlaces.map(async (place) => {
      if (place.type !== 'restaurant') return place;
      
      const yelpResponse = await fetch(
        `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(place.name)}&location=${encodeURIComponent(location)}&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
          },
        }
      );
      
      const yelpData = await yelpResponse.json();
      const yelpBusiness = yelpData.businesses?.[0];
      
      return {
        ...place,
        rating: yelpBusiness?.rating,
        reviewCount: yelpBusiness?.review_count,
        priceLevel: yelpBusiness?.price,
      };
    })
  );
  
  return finalPlaces;
}
```

---

## Error Handling Pattern

### Unified API Error Handler

```typescript
// lib/api-error-handler.ts
export class APIError extends Error {
  constructor(
    public service: string,
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(`${service} API Error: ${message}`);
    this.name = 'APIError';
  }
}

export async function handleAPICall<T>(
  service: string,
  apiCall: () => Promise<T>
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    if (error instanceof Response) {
      throw new APIError(
        service,
        error.status,
        `HTTP ${error.status}`,
        await error.text()
      );
    }
    
    if (error instanceof Error) {
      throw new APIError(service, 500, error.message);
    }
    
    throw new APIError(service, 500, 'Unknown error');
  }
}

// Usage
const weather = await handleAPICall('OpenWeather', async () => {
  return await fetchWeather(lat, lon);
});
```

---

## Caching Pattern

### Multi-Level Cache

```typescript
// lib/cache.ts
const memoryCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  // Check memory cache
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }
  
  // Fetch fresh data
  const data = await fetcher();
  
  // Update cache
  memoryCache.set(key, {
    data,
    timestamp: Date.now(),
  });
  
  return data;
}

// Usage with weather API
export async function getWeatherCached(lat: number, lon: number) {
  return getCached(
    `weather:${lat},${lon}`,
    () => fetchWeatherFromAPI(lat, lon),
    30 * 60 * 1000 // 30 min TTL
  );
}
```

---

## Rate Limiting Pattern

### Simple Rate Limiter

```typescript
// lib/rate-limit.ts
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = requestCounts.get(key);
  
  if (!record || now > record.resetAt) {
    requestCounts.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }
  
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}

// Usage in API route
export async function GET(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  
  const { allowed, remaining } = checkRateLimit(
    `api:${ip}`,
    60, // 60 requests
    60 * 1000 // per minute
  );
  
  if (!allowed) {
    return Response.json(
      { error: 'Rate limit exceeded' },
      { 
        status: 429,
        headers: { 'X-RateLimit-Remaining': '0' },
      }
    );
  }
  
  // Process request
  return Response.json(data, {
    headers: { 'X-RateLimit-Remaining': remaining.toString() },
  });
}
```

---

## Related Documentation

- [API Reference](./API_REFERENCE.md) - Overview of all APIs
- [Individual API Specs](./api-specs/) - Detailed specifications
