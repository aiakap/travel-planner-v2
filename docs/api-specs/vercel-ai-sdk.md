# Vercel AI SDK Specification

## Overview

The Vercel AI SDK provides a unified interface for building AI-powered applications with streaming support, structured outputs, and tool calling across multiple AI providers.

**Version**: 6.x (Latest)

**Last Updated**: January 27, 2026

---

## Packages

**Core Packages**:
- `ai` - Core SDK with streaming and generation functions
- `@ai-sdk/openai` - OpenAI provider
- `@ai-sdk/react` - React hooks and utilities

**Installation**:
```bash
npm install ai @ai-sdk/openai @ai-sdk/react
```

---

## Core Concepts

### 1. Providers

Model providers are configured once and reused:

```typescript
import { openai } from '@ai-sdk/openai';

const model = openai('gpt-4o-2024-11-20');
```

### 2. Generation Functions

- `generateText()` - Generate text (awaits completion)
- `streamText()` - Stream text generation
- `generateObject()` - Generate structured data (deprecated, use Output)
- `streamObject()` - Stream structured data (deprecated, use Output)

### 3. Output Types

New unified Output API for structured data:

- `Output.text()` - Plain text
- `Output.object({ schema })` - Structured object
- `Output.array({ element })` - Array of objects
- `Output.choice({ options })` - Enum selection
- `Output.json()` - Unvalidated JSON

---

## Text Generation

### Generate Text (Non-Streaming)

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text, usage } = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  prompt: 'What is the capital of France?',
  temperature: 0.7,
  maxTokens: 100,
});

console.log(text); // "The capital of France is Paris."
console.log(usage); // { promptTokens: 10, completionTokens: 8, totalTokens: 18 }
```

### Stream Text

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const result = streamText({
  model: openai('gpt-4o-2024-11-20'),
  prompt: 'Write a short story about a cat.',
});

// Stream as async iterable
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

// Or convert to response
return result.toDataStreamResponse();
```

---

## Structured Outputs

### Generate Object

```typescript
import { generateText, Output } from 'ai';
import { z } from 'zod';

const { output } = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  output: Output.object({
    schema: z.object({
      name: z.string(),
      age: z.number(),
      email: z.string().email(),
    }),
  }),
  prompt: 'Generate a test user profile',
});

// output is type-safe and validated
console.log(output.name, output.age, output.email);
```

### Stream Object

```typescript
import { streamText, Output } from 'ai';
import { z } from 'zod';

const { partialOutputStream } = streamText({
  model: openai('gpt-4o-2024-11-20'),
  output: Output.object({
    schema: z.object({
      recipe: z.object({
        name: z.string(),
        ingredients: z.array(z.string()),
        steps: z.array(z.string()),
      }),
    }),
  }),
  prompt: 'Generate a lasagna recipe',
});

for await (const partial of partialOutputStream) {
  console.log(partial); // Partial object updates as it streams
}
```

### Generate Array

```typescript
const { output } = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  output: Output.array({
    element: z.object({
      city: z.string(),
      country: z.string(),
      attractions: z.array(z.string()),
    }),
  }),
  prompt: 'List 3 popular tourist cities',
});

// output is an array of validated objects
output.forEach(city => {
  console.log(city.city, city.country);
});
```

### Choice Selection

```typescript
const { output } = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  output: Output.choice({
    options: ['sunny', 'rainy', 'cloudy', 'snowy'],
  }),
  prompt: 'What is the weather like today?',
});

// output is one of the specified options
console.log(output); // "sunny"
```

---

## Tool Calling

### Define Tools

```typescript
import { generateText, tool } from 'ai';
import { z } from 'zod';

const result = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  tools: {
    getWeather: tool({
      description: 'Get weather for a location',
      parameters: z.object({
        location: z.string().describe('City name'),
      }),
      execute: async ({ location }) => {
        const weather = await fetchWeather(location);
        return {
          temperature: weather.temp,
          condition: weather.condition,
        };
      },
    }),
    searchPlaces: tool({
      description: 'Search for places',
      parameters: z.object({
        query: z.string(),
        type: z.enum(['restaurant', 'hotel', 'attraction']),
      }),
      execute: async ({ query, type }) => {
        return await searchPlaces(query, type);
      },
    }),
  },
  prompt: 'What should I pack for San Francisco?',
  maxSteps: 5,
});

console.log(result.text);
console.log(result.toolCalls); // Tools that were called
console.log(result.toolResults); // Results from tools
```

---

## Usage in Project

### File Locations

**Chat Interfaces**:
- `app/api/chat/route.ts` - Main streaming chat with tools
- `app/api/chat/simple/route.ts` - Simple chat without tools

**AI Generation**:
- `lib/ai/generate-place-suggestions.ts` - Structured place data
- `lib/ai/generate-content.ts` - Content generation

**Admin Testing**:
- `app/api/admin/test/openai-structured/route.ts` - Structured outputs
- `app/api/admin/test/openai-itinerary/route.ts` - Itinerary generation

### Example: Streaming Chat with Tools

From `app/api/chat/route.ts`:

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: Request) {
  const { messages } = await request.json();
  
  const result = streamText({
    model: openai('gpt-4o-2024-11-20'),
    messages,
    tools: {
      searchPlaces: tool({
        description: 'Search for places and attractions',
        parameters: z.object({
          location: z.string(),
          type: z.string(),
        }),
        execute: async ({ location, type }) => {
          // Call Google Places API
          return await searchGooglePlaces(location, type);
        },
      }),
      getFlights: tool({
        description: 'Search for flights',
        parameters: z.object({
          from: z.string(),
          to: z.string(),
          date: z.string(),
        }),
        execute: async ({ from, to, date }) => {
          // Call Amadeus API
          return await searchFlights(from, to, date);
        },
      }),
    },
    maxSteps: 5,
  });
  
  return result.toDataStreamResponse();
}
```

### Example: Structured Data Generation

From `lib/ai/generate-place-suggestions.ts`:

```typescript
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function generatePlaceSuggestions(
  location: string,
  category: string
) {
  const { output } = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    output: Output.object({
      schema: z.object({
        suggestions: z.array(z.object({
          name: z.string(),
          description: z.string(),
          category: z.string(),
          estimatedDuration: z.string(),
          bestTimeToVisit: z.string(),
          priceRange: z.enum(['$', '$$', '$$$', '$$$$']),
        })),
      }),
    }),
    prompt: `Generate 5 ${category} suggestions for ${location}`,
  });
  
  return output.suggestions;
}
```

---

## React Hooks

### useChat

For chat interfaces:

```typescript
"use client";

import { useChat } from '@ai-sdk/react';

export function ChatComponent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });
  
  return (
    <div>
      <div>
        {messages.map(m => (
          <div key={m.id}>
            <strong>{m.role}:</strong> {m.content}
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### useCompletion

For text completion:

```typescript
"use client";

import { useCompletion } from '@ai-sdk/react';

export function CompletionComponent() {
  const { completion, input, handleInputChange, handleSubmit } = useCompletion({
    api: '/api/completion',
  });
  
  return (
    <div>
      <div>{completion}</div>
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} />
        <button type="submit">Complete</button>
      </form>
    </div>
  );
}
```

### useObject

For streaming objects:

```typescript
"use client";

import { useObject } from '@ai-sdk/react';

export function ObjectComponent() {
  const { object, submit, isLoading } = useObject({
    api: '/api/generate-recipe',
    schema: recipeSchema,
  });
  
  return (
    <div>
      {object && (
        <div>
          <h2>{object.recipe.name}</h2>
          <ul>
            {object.recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>
      )}
      <button onClick={() => submit('lasagna')} disabled={isLoading}>
        Generate Recipe
      </button>
    </div>
  );
}
```

---

## Server-Side Streaming

### Route Handler

```typescript
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(request: Request) {
  const { prompt } = await request.json();
  
  const result = streamText({
    model: openai('gpt-4o-2024-11-20'),
    prompt,
  });
  
  // Returns a streaming response
  return result.toDataStreamResponse();
}
```

### Custom Stream Processing

```typescript
const result = streamText({
  model: openai('gpt-4o-2024-11-20'),
  prompt: 'Write a story',
});

// Process stream manually
for await (const chunk of result.textStream) {
  // Custom processing
  await processChunk(chunk);
}

// Or get full text when complete
const fullText = await result.text;
```

---

## Error Handling

### Client-Side

```typescript
const { messages, error } = useChat({
  api: '/api/chat',
  onError: (error) => {
    console.error('Chat error:', error);
    toast.error('Failed to send message');
  },
});

if (error) {
  return <div>Error: {error.message}</div>;
}
```

### Server-Side

```typescript
import { generateText } from 'ai';
import { NoObjectGeneratedError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    output: Output.object({ schema }),
    prompt,
  });
  
  return result.output;
} catch (error) {
  if (NoObjectGeneratedError.isInstance(error)) {
    console.error('Failed to generate object:', error.text);
    console.error('Cause:', error.cause);
  }
  throw error;
}
```

---

## Advanced Features

### Multi-Step Execution

```typescript
import { generateText, stepCountIs } from 'ai';

const result = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  tools: { /* tool definitions */ },
  prompt: 'Plan a trip to Paris',
  maxSteps: 10,
  stopWhen: stepCountIs(5), // Stop after 5 steps
});
```

### Middleware

Add middleware to generation:

```typescript
import { generateText } from 'ai';

const result = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  experimental_telemetry: {
    isEnabled: true,
    functionId: 'my-function',
    metadata: {
      userId: 'user-123',
      requestId: 'req-456',
    },
  },
  prompt: 'Hello',
});
```

### Provider Management

```typescript
import { experimental_createProviderRegistry as createProviderRegistry } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

const registry = createProviderRegistry({
  openai,
  anthropic,
});

// Use with model string
const result = await generateText({
  model: registry.languageModel('openai:gpt-4o'),
  prompt: 'Hello',
});
```

---

## Usage in Project

### Streaming Chat

From `app/api/chat/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: openai('gpt-4o-2024-11-20'),
    messages,
    system: 'You are a helpful travel assistant.',
    temperature: 0.7,
    maxTokens: 2000,
  });
  
  return result.toDataStreamResponse();
}
```

### Structured Data Generation

From `lib/ai/generate-place-suggestions.ts`:

```typescript
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

const placeSchema = z.object({
  places: z.array(z.object({
    name: z.string().describe('Place name'),
    description: z.string().describe('Brief description'),
    category: z.string().describe('Place category'),
    tags: z.array(z.string()).describe('Relevant tags'),
  })),
});

export async function generatePlaces(location: string) {
  const { output } = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    output: Output.object({
      name: 'PlaceSuggestions',
      description: 'List of place suggestions',
      schema: placeSchema,
    }),
    prompt: `Generate 5 interesting places to visit in ${location}`,
  });
  
  return output.places;
}
```

---

## Schema Validation

### Zod Integration

The SDK integrates with Zod for schema validation:

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  age: z.number().min(0).max(150),
  email: z.string().email(),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
});

const { output } = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  output: Output.object({ schema: userSchema }),
  prompt: 'Generate a user profile',
});

// output is fully typed based on schema
const theme = output.preferences.theme; // 'light' | 'dark'
```

### Property Descriptions

Help the model with schema descriptions:

```typescript
const schema = z.object({
  name: z.string().describe('Full name of the person'),
  age: z.number().describe('Age in years'),
  location: z.string().describe('City and country'),
  interests: z.array(z.string()).describe('List of hobbies and interests'),
});
```

---

## Response Streaming

### Data Stream Response

```typescript
const result = streamText({
  model: openai('gpt-4o-2024-11-20'),
  prompt: 'Hello',
});

// Returns Response with proper headers for streaming
return result.toDataStreamResponse();
```

### Custom Stream Data

Add custom data to stream:

```typescript
import { createDataStreamResponse } from 'ai';

const result = streamText({
  model: openai('gpt-4o-2024-11-20'),
  prompt: 'Tell me a story',
  onFinish: async ({ text }) => {
    // Save to database
    await saveStory(text);
  },
});

return result.toDataStreamResponse({
  getAdditionalResponseHeaders: () => ({
    'X-Custom-Header': 'value',
  }),
});
```

---

## Error Handling

### Generation Errors

```typescript
import { generateText, APICallError } from 'ai';

try {
  const result = await generateText({
    model: openai('gpt-4o-2024-11-20'),
    prompt: 'Hello',
  });
} catch (error) {
  if (APICallError.isInstance(error)) {
    console.error('API Error:', error.message);
    console.error('Status:', error.statusCode);
    console.error('Response:', error.responseBody);
  }
}
```

### Stream Errors

```typescript
const result = streamText({
  model: openai('gpt-4o-2024-11-20'),
  prompt: 'Hello',
  onError: ({ error }) => {
    console.error('Stream error:', error);
    // Log to error tracking service
  },
});
```

---

## Best Practices

### 1. Use Output API

Prefer new Output API over deprecated `generateObject`:

```typescript
// Good - New Output API
const { output } = await generateText({
  model: openai('gpt-4o-2024-11-20'),
  output: Output.object({ schema }),
  prompt: 'Generate data',
});

// Deprecated - Old API
const { object } = await generateObject({
  model: openai('gpt-4o-2024-11-20'),
  schema,
  prompt: 'Generate data',
});
```

### 2. Type Safety

Always export and reuse schemas:

```typescript
// schemas/place.ts
export const placeSchema = z.object({
  name: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
});

export type Place = z.infer<typeof placeSchema>;

// Usage
const { output } = await generateText({
  output: Output.object({ schema: placeSchema }),
  // ...
});

// output is typed as Place
```

### 3. Stream for UX

Use streaming for better perceived performance:

```typescript
// Good - Streams for better UX
return streamText({...}).toDataStreamResponse();

// Only use generateText for server-side processing
const result = await generateText({...});
```

### 4. Tool Descriptions

Provide clear tool descriptions:

```typescript
tools: {
  searchFlights: tool({
    description: 'Search for available flights between two airports on a specific date. Returns flight options with prices and schedules.',
    parameters: z.object({
      origin: z.string().describe('Origin airport IATA code (e.g., SFO)'),
      destination: z.string().describe('Destination airport IATA code (e.g., LAX)'),
      date: z.string().describe('Departure date in YYYY-MM-DD format'),
    }),
    // ...
  }),
}
```

---

## Performance Optimization

### 1. Caching

Cache generation results:

```typescript
const cache = new Map();

async function getCachedGeneration(prompt: string) {
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }
  
  const result = await generateText({ prompt });
  cache.set(prompt, result.text);
  return result.text;
}
```

### 2. Parallel Generation

Generate multiple outputs in parallel:

```typescript
const [places, weather, events] = await Promise.all([
  generatePlaces(location),
  generateWeather(location),
  generateEvents(location),
]);
```

### 3. Abort Control

Cancel generation when needed:

```typescript
const abortController = new AbortController();

const result = streamText({
  model: openai('gpt-4o-2024-11-20'),
  prompt: 'Long generation...',
  abortSignal: abortController.signal,
});

// Cancel if needed
setTimeout(() => abortController.abort(), 5000);
```

---

## Testing

### Unit Tests

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

describe('AI Generation', () => {
  it('generates place suggestions', async () => {
    const { output } = await generateText({
      model: openai('gpt-4o-2024-11-20'),
      output: Output.object({ schema: placeSchema }),
      prompt: 'Suggest places in Paris',
    });
    
    expect(output.places).toHaveLength(5);
    expect(output.places[0]).toHaveProperty('name');
  });
});
```

### Mock Responses

```typescript
import { generateText } from 'ai';

jest.mock('ai', () => ({
  generateText: jest.fn().mockResolvedValue({
    text: 'Mock response',
    usage: { totalTokens: 10 },
  }),
}));
```

---

## Migration from v5 to v6

### Key Changes in v6

1. **New Output API**: Replaces `generateObject` and `streamObject`
2. **Unified Interface**: Consistent API across providers
3. **Better TypeScript**: Improved type inference
4. **Performance**: Faster streaming

### Migration Steps

```typescript
// v5
import { generateObject } from 'ai';
const { object } = await generateObject({ schema, prompt });

// v6
import { generateText, Output } from 'ai';
const { output } = await generateText({
  output: Output.object({ schema }),
  prompt,
});
```

---

## Official Resources

### Documentation
- [AI SDK Documentation](https://sdk.vercel.ai/)
- [Generating Structured Data](https://sdk.vercel.ai/docs/ai-sdk-core/generating-structured-data)
- [Streaming](https://sdk.vercel.ai/docs/foundations/streaming)
- [Tools](https://sdk.vercel.ai/docs/foundations/tools)
- [React Hooks](https://sdk.vercel.ai/docs/reference/ai-sdk-ui)

### Examples
- [Next.js Examples](https://sdk.vercel.ai/examples)
- [GitHub Repository](https://github.com/vercel/ai)

### Support
- [GitHub Discussions](https://github.com/vercel/ai/discussions)
- [Discord](https://discord.gg/vercel)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [OpenAI API](./openai.md) - Primary model provider
