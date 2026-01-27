# OpenAI API Specification

## Overview

OpenAI provides state-of-the-art AI models for natural language processing, vision, and image generation. This project primarily uses GPT-4o for chat and structured outputs, with DALL-E 3 as a fallback for image generation.

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: API Key via HTTP Bearer authentication

**Header Format**:
```
Authorization: Bearer OPENAI_API_KEY
```

**Environment Variable**: `OPENAI_API_KEY`

**Organization Header** (optional):
```
OpenAI-Organization: YOUR_ORG_ID
OpenAI-Project: YOUR_PROJECT_ID
```

---

## Base URL

```
https://api.openai.com/v1
```

---

## Models Used in This Project

### GPT-4o (gpt-4o-2024-11-20)

**Purpose**: Latest reasoning model for chat, structured outputs, and content generation

**Context Window**: 128,000 tokens

**Capabilities**:
- Text generation and chat
- Vision (image understanding)
- Structured outputs with JSON mode
- Function/tool calling
- Streaming responses

**Pricing** (as of 2026):
- Input: Variable per 1M tokens
- Output: Variable per 1M tokens
- Check [OpenAI Pricing](https://openai.com/pricing) for current rates

**Use Cases in Project**:
- Chat conversations with users
- Place suggestion generation
- Email extraction
- Structured data parsing
- Content generation

### DALL-E 3

**Purpose**: Image generation (fallback when Imagen is unavailable)

**Capabilities**:
- Text-to-image generation
- Sizes: 1024x1024, 1792x1024, 1024x1792
- Styles: vivid (hyper-real), natural
- Quality: standard, hd

**Limitations**:
- Only n=1 images per request (make parallel calls for multiple)
- No edit or variation endpoints yet

**Pricing**:
- Standard: $0.040 per image (1024×1024)
- HD: $0.080 per image (1024×1024)

---

## Key Endpoints

### 1. Chat Completions

**Endpoint**: `POST /chat/completions`

**Purpose**: Generate conversational responses with optional streaming

**Request Format**:
```json
{
  "model": "gpt-4o-2024-11-20",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 2000
}
```

**Response Format** (non-streaming):
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-2024-11-20",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?"
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

**Streaming**: Server-sent events (SSE) with `data:` prefix

**Parameters**:
- `model` (required): Model identifier
- `messages` (required): Array of message objects
- `temperature`: 0-2, controls randomness
- `max_tokens`: Maximum tokens to generate
- `stream`: Boolean for streaming
- `tools`: Array of function definitions
- `response_format`: For JSON mode or structured outputs

### 2. Structured Outputs (JSON Mode)

**Purpose**: Generate structured data that conforms to a schema

**Request Format**:
```json
{
  "model": "gpt-4o-2024-11-20",
  "messages": [
    {"role": "system", "content": "Extract information from the following text."},
    {"role": "user", "content": "John Doe, age 30, lives in New York"}
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "user_info",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "age": {"type": "number"},
          "location": {"type": "string"}
        },
        "required": ["name", "age", "location"],
        "additionalProperties": false
      }
    }
  }
}
```

**Used In**:
- `lib/ai/generate-place-suggestions.ts` - Place suggestions with schema
- `app/api/admin/test/openai-structured/route.ts` - Testing structured outputs

### 3. Image Generation (DALL-E 3)

**Endpoint**: `POST /images/generations`

**Request Format**:
```json
{
  "model": "dall-e-3",
  "prompt": "A serene landscape with mountains",
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid",
  "n": 1,
  "response_format": "url"
}
```

**Response Format**:
```json
{
  "created": 1234567890,
  "data": [{
    "url": "https://...",
    "revised_prompt": "Enhanced prompt used for generation"
  }]
}
```

**Parameters**:
- `prompt`: Text description (max 1000 chars)
- `size`: "1024x1024", "1792x1024", "1024x1792"
- `quality`: "standard" or "hd"
- `style`: "vivid" or "natural"
- `n`: Must be 1 for DALL-E 3
- `response_format`: "url" or "b64_json"

**Used In**:
- `lib/image-generation.ts` - Fallback image generation

### 4. Vision (Image Understanding)

**Endpoint**: `POST /chat/completions` with image content

**Request Format**:
```json
{
  "model": "gpt-4o-2024-11-20",
  "messages": [{
    "role": "user",
    "content": [
      {"type": "text", "text": "What's in this image?"},
      {
        "type": "image_url",
        "image_url": {
          "url": "https://example.com/image.jpg"
        }
      }
    ]
  }]
}
```

**Supported Formats**: PNG, JPEG, WEBP, GIF

**Used In**:
- `app/api/admin/test/openai-vision/route.ts` - Vision testing

### 5. Embeddings

**Endpoint**: `POST /embeddings`

**Purpose**: Convert text to vector embeddings for semantic search

**Request Format**:
```json
{
  "model": "text-embedding-3-small",
  "input": "Your text here"
}
```

**Models Available**:
- `text-embedding-3-small` - Smaller, faster
- `text-embedding-3-large` - More accurate

---

## Error Handling

### Common Error Codes

| Status Code | Error Type | Description |
|------------|------------|-------------|
| 401 | Authentication Error | Invalid API key |
| 429 | Rate Limit Error | Too many requests |
| 500 | Server Error | OpenAI server issue |
| 503 | Service Unavailable | Temporary outage |

### Error Response Format

```json
{
  "error": {
    "message": "Error description",
    "type": "invalid_request_error",
    "param": "parameter_name",
    "code": "error_code"
  }
}
```

### Rate Limit Headers

```
x-ratelimit-limit-requests: 10000
x-ratelimit-limit-tokens: 2000000
x-ratelimit-remaining-requests: 9999
x-ratelimit-remaining-tokens: 1999000
x-ratelimit-reset-requests: 8.64s
x-ratelimit-reset-tokens: 6ms
```

---

## Usage in Project

### File Locations

**Primary Integration**:
- `lib/ai/generate-place-suggestions.ts` - Place suggestions with structured outputs
- `lib/ai/generate-content.ts` - Content generation
- `lib/image-generation.ts` - Image generation (DALL-E fallback)

**API Routes**:
- `app/api/chat/route.ts` - Main chat with streaming
- `app/api/chat/simple/route.ts` - Simple chat endpoint
- `app/api/admin/test/openai-chat/route.ts` - Chat testing
- `app/api/admin/test/openai-structured/route.ts` - Structured output testing
- `app/api/admin/test/openai-vision/route.ts` - Vision testing
- `app/api/admin/test/openai-extraction/route.ts` - Data extraction
- `app/api/admin/test/openai-itinerary/route.ts` - Itinerary generation

**Email Processing**:
- `app/api/admin/email-extract/route.ts` - Email content extraction

### Example: Structured Output Generation

From `lib/ai/generate-place-suggestions.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const result = await generateObject({
  model: openai('gpt-4o-2024-11-20'),
  schema: z.object({
    places: z.array(z.object({
      name: z.string(),
      description: z.string(),
      category: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      })
    }))
  }),
  prompt: `Generate place suggestions for ${location}`
});

return result.object;
```

### Example: Streaming Chat

From `app/api/chat/route.ts`:

```typescript
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

const result = streamText({
  model: openai('gpt-4o-2024-11-20'),
  messages: messages,
  tools: {
    // Tool definitions
  }
});

return result.toDataStreamResponse();
```

---

## Best Practices

### 1. Model Selection
- Use `gpt-4o-2024-11-20` for latest features and performance
- Pin to specific dated versions for production stability
- Use function calling for structured tasks

### 2. Token Management
- Monitor token usage via response `usage` field
- Implement token counting for cost tracking
- Use appropriate `max_tokens` limits

### 3. Error Handling
- Implement exponential backoff for rate limits
- Handle timeout errors gracefully
- Log errors with request IDs for debugging

### 4. Streaming
- Use streaming for better UX in chat interfaces
- Handle stream interruptions
- Implement proper cleanup on connection close

### 5. Security
- Never expose API keys client-side
- Rotate keys periodically
- Use separate keys for dev/staging/prod

---

## Rate Limits & Quotas

**Rate Limits**: Based on your organization's tier

**Tiers**:
- Free: Limited requests
- Tier 1-5: Increasing limits with usage

**Monitor Usage**:
- Via OpenAI dashboard
- Response headers (`x-ratelimit-*`)

**Best Practices**:
- Implement request queuing
- Cache responses when possible
- Use appropriate models for tasks (don't use GPT-4o for simple tasks)

---

## Migration Notes

### Upgrading Models
When upgrading to newer model versions:
1. Test in sandbox environment first
2. Compare outputs for regression
3. Update model string in codebase
4. Monitor token usage changes
5. Update documentation

### Deprecated Features
- Legacy completions endpoint (use chat completions)
- Older embedding models (migrate to text-embedding-3-*)

---

## Testing

### Admin Test Endpoints

The project includes several admin test endpoints for OpenAI:

- `/admin/apis/ai-content` - Content generation testing
- `/api/admin/test/openai-chat` - Chat completion testing
- `/api/admin/test/openai-structured` - Structured output testing
- `/api/admin/test/openai-vision` - Vision testing
- `/api/admin/test/openai-extraction` - Data extraction testing

---

## Troubleshooting

### Common Issues

**1. Authentication Errors**
- Verify `OPENAI_API_KEY` is set correctly
- Check API key hasn't been revoked
- Ensure key has proper permissions

**2. Rate Limit Errors**
- Implement exponential backoff
- Reduce request frequency
- Upgrade to higher tier if needed

**3. Context Length Errors**
- Reduce message history length
- Implement message trimming
- Use appropriate `max_tokens`

**4. Timeout Errors**
- Increase timeout threshold
- Implement retry logic
- Check OpenAI status page

---

## Official Resources

### Documentation
- [API Reference](https://platform.openai.com/docs/api-reference/introduction)
- [Chat Completions Guide](https://platform.openai.com/docs/guides/chat-completions)
- [GPT-4o Models](https://platform.openai.com/docs/models/gpt-4o)
- [DALL-E 3](https://platform.openai.com/docs/models/dall-e-3)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

### Tools & SDKs
- [Official Node.js SDK](https://github.com/openai/openai-node)
- [OpenAPI Specification](https://app.stainless.com/api/spec/documented/openai/openapi.documented.yml)
- [Cookbook (Examples)](https://cookbook.openai.com/)

### Support
- [Platform Status](https://status.openai.com/)
- [Community Forum](https://community.openai.com/)
- [Help Center](https://help.openai.com/)

### Monitoring
- [Usage Dashboard](https://platform.openai.com/usage)
- [API Keys Management](https://platform.openai.com/api-keys)
- [Rate Limits](https://platform.openai.com/account/limits)

---

## Version History

| Date | Model Version | Changes |
|------|---------------|---------|
| 2024-11-20 | gpt-4o-2024-11-20 | Current model in use |
| 2024-08-06 | gpt-4o-2024-08-06 | Previous snapshot |
| 2024-05-13 | gpt-4o-2024-05-13 | Initial GPT-4o release |

**Note**: Model outputs can vary between snapshots. Pin to specific versions for consistent behavior.

---

## SDK Integration

This project uses the Vercel AI SDK (`@ai-sdk/openai`) wrapper for OpenAI integration, which provides:
- Simplified streaming API
- Built-in error handling
- Type-safe structured outputs
- Tool calling abstractions

See [Vercel AI SDK Specification](./vercel-ai-sdk.md) for details on the SDK layer.

---

## Security Considerations

1. **API Key Protection**
   - Store in environment variables only
   - Never commit to version control
   - Rotate keys if exposed

2. **Content Moderation**
   - User inputs are subject to OpenAI's usage policies
   - Implement content filtering where appropriate
   - Monitor for policy violations

3. **Data Privacy**
   - OpenAI may use API data for model improvement (opt-out available)
   - Don't send sensitive/personal data without user consent
   - Review OpenAI's data usage policies

---

## Cost Optimization

1. **Use Appropriate Models**
   - Don't use GPT-4o for simple tasks
   - Consider GPT-4o-mini for lighter workloads
   - Cache responses when possible

2. **Token Management**
   - Trim conversation history
   - Use shorter system prompts
   - Implement smart context windowing

3. **Batch Processing**
   - Use batch API for non-urgent tasks
   - Group similar requests
   - Process during off-peak hours

---

## Related Documentation

- [Vercel AI SDK](./vercel-ai-sdk.md) - SDK wrapper used in project
- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [Admin Testing Guide](../../ACCOUNT_MANAGEMENT_TESTING_GUIDE.md) - Testing procedures
