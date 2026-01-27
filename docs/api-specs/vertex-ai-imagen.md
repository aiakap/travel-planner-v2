# Google Vertex AI Imagen API Specification

## Overview

Google Vertex AI Imagen provides high-quality AI-powered image generation from text prompts. This project uses Imagen 4.0 as the primary image generation provider for creating trip images.

**Model**: imagen-4.0-generate-001 (Imagen 4.0 GA)

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: Google Cloud Service Account

**Environment Variables**:
- `GOOGLE_CLOUD_PROJECT` - GCP project ID
- `GOOGLE_CLOUD_LOCATION` - Region (e.g., "us-central1")
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON file
- `IMAGEN_MODEL` - Model version (imagen-4.0-generate-001)
- `IMAGE_PROVIDER` - Set to "imagen"
- `IMAGEN_RPM_LIMIT` - Rate limit (default: 5 requests per minute)

**Authentication Setup**:
1. Create service account in Google Cloud Console
2. Grant "Vertex AI User" role
3. Download JSON key file
4. Set path in `GOOGLE_APPLICATION_CREDENTIALS`

---

## Base URL

```
https://{LOCATION}-aiplatform.googleapis.com/v1
```

**Full Endpoint**:
```
POST https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}/publishers/google/models/{MODEL_VERSION}:predict
```

---

## Supported Models

### Imagen 4.0 (GA - General Availability)

**Available Models**:
- `imagen-4.0-generate-001` - Standard generation (current)
- `imagen-4.0-fast-generate-001` - Faster generation
- `imagen-4.0-ultra-generate-001` - Highest quality

**Imagen 3.0** (Still supported):
- `imagen-3.0-generate-002`
- `imagen-3.0-generate-001`
- `imagen-3.0-fast-generate-001`

**Migration Notice**: Imagen 4 preview models were removed November 30, 2025.

---

## Request Format

### REST API Request

**Method**: POST

**Headers**:
```
Authorization: Bearer $(gcloud auth print-access-token)
Content-Type: application/json
```

**Request Body**:
```json
{
  "instances": [
    {
      "prompt": "A serene landscape with mountains and a lake at sunset"
    }
  ],
  "parameters": {
    "sampleCount": 1,
    "aspectRatio": "16:9",
    "addWatermark": true,
    "enhancePrompt": true,
    "personGeneration": "allow_adult",
    "safetySetting": "block_medium_and_above",
    "sampleImageSize": "1K"
  }
}
```

### Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `prompt` | string | Text description (required) | - |
| `sampleCount` | int | Number of images (1-4) | 4 |
| `aspectRatio` | string | 1:1, 3:4, 4:3, 16:9, 9:16 | 1:1 |
| `addWatermark` | boolean | Add SynthID watermark | true |
| `enhancePrompt` | boolean | LLM-based prompt enhancement | true |
| `personGeneration` | string | allow_all, allow_adult, dont_allow | allow_adult |
| `safetySetting` | string | Safety filter level | block_medium_and_above |
| `sampleImageSize` | string | 1K or 2K resolution | 1K |
| `seed` | int | Deterministic generation (1-2147483647) | - |
| `negativePrompt` | string | What to discourage | - |
| `language` | string | Prompt language (auto, en, es, etc.) | auto |
| `storageUri` | string | GCS bucket for output | - |

### Aspect Ratios

- `1:1` - Square (default)
- `3:4` - Ads, social media (portrait)
- `4:3` - TV, photography (landscape)
- `16:9` - Widescreen landscape
- `9:16` - Mobile portrait

### Safety Settings

- `block_low_and_above` - Strictest filtering
- `block_medium_and_above` - Balanced (default)
- `block_only_high` - Minimal filtering
- `block_none` - No filtering (restricted access)

### Person Generation

- `allow_all` - Generate people of all ages
- `allow_adult` - Adults only (default for Imagen 4.0)
- `dont_allow` - No people or faces

---

## Response Format

### Successful Response

```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "iVBORw0KGgoAAAANSUhEUgAA...",
      "mimeType": "image/png"
    }
  ]
}
```

### With Enhanced Prompt

```json
{
  "predictions": [
    {
      "bytesBase64Encoded": "iVBORw0KGgoAAAANSUhEUgAA...",
      "mimeType": "image/png",
      "prompt": "Enhanced version of the original prompt..."
    }
  ]
}
```

### Fields

- `bytesBase64Encoded`: Base64 image data
- `mimeType`: Image type (image/png or image/jpeg)
- `prompt`: Enhanced prompt if `enhancePrompt: true`
- `raiFilteredReason`: If image was filtered by safety
- `safetyAttributes`: Safety scores if enabled

---

## Usage in Project

### File Locations

**Primary Integration**:
- `lib/image-generation.ts` - Main image generation with Imagen

**Queue Management**:
- `lib/actions/queue-image-generation.ts` - Background queue processing
- `lib/actions/regenerate-trip-image.ts` - Re-generate trip images

**Admin Testing**:
- `app/api/admin/test/imagen-generate/route.ts` - Single image generation
- `app/api/admin/test/imagen-batch/route.ts` - Batch generation

### Example: Image Generation

From `lib/image-generation.ts`:

```typescript
async function generateImageWithImagen(prompt: string): Promise<string> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT!;
  const location = process.env.GOOGLE_CLOUD_LOCATION!;
  const model = process.env.IMAGEN_MODEL || 'imagen-4.0-generate-001';
  
  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predict`;
  
  // Get access token
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
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
        sampleImageSize: '1K'
      }
    })
  });
  
  const data = await response.json();
  const imageBytes = data.predictions[0].bytesBase64Encoded;
  
  // Save to storage or return URL
  return saveImageAndReturnUrl(imageBytes);
}
```

### Example: Batch Generation

From `app/api/admin/test/imagen-batch/route.ts`:

```typescript
const prompts = [
  "Tokyo skyline at night",
  "Paris Eiffel Tower sunset",
  "New York Central Park autumn"
];

const images = await Promise.all(
  prompts.map(prompt => generateImageWithImagen(prompt))
);
```

---

## Rate Limiting

**Default Limit**: 5 requests per minute (RPM)

**Configuration**: Set via `IMAGEN_RPM_LIMIT` environment variable

**Implementation**:
```typescript
// Simple rate limiter
const requestQueue = [];
const RPM_LIMIT = parseInt(process.env.IMAGEN_RPM_LIMIT || '5');

async function rateLimitedGenerate(prompt: string) {
  // Wait if queue is full
  while (requestQueue.length >= RPM_LIMIT) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Clean old requests (> 1 min ago)
    const now = Date.now();
    requestQueue = requestQueue.filter(t => now - t < 60000);
  }
  
  requestQueue.push(Date.now());
  return await generateImageWithImagen(prompt);
}
```

---

## Error Handling

### Common Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | Unauthorized | Check service account permissions |
| 403 | Forbidden | Enable Vertex AI API in GCP |
| 429 | Rate limit exceeded | Implement rate limiting |
| 500 | Server error | Retry with exponential backoff |

### Filtered Content

When content is filtered by safety:

```json
{
  "predictions": [
    {
      "raiFilteredReason": "FILTERED_REASON_PROMPT_SAFETY"
    }
  ]
}
```

**Reasons**:
- `FILTERED_REASON_PROMPT_SAFETY` - Unsafe prompt
- `FILTERED_REASON_IMAGE_SAFETY` - Unsafe generated image

**Handling**:
```typescript
if (prediction.raiFilteredReason) {
  console.error('Image filtered:', prediction.raiFilteredReason);
  // Fall back to DALL-E or retry with modified prompt
  return await generateWithDallE(modifyPromptForSafety(prompt));
}
```

---

## Image Output Options

### Output Formats

**MIME Types**:
- `image/png` (default)
- `image/jpeg`

**Compression** (JPEG only):
```json
{
  "parameters": {
    "outputOptions": {
      "mimeType": "image/jpeg",
      "compressionQuality": 85
    }
  }
}
```

### Storage Options

**Return Base64**:
```json
{
  "parameters": {
    // No storageUri - returns base64 in response
  }
}
```

**Save to Cloud Storage**:
```json
{
  "parameters": {
    "storageUri": "gs://my-bucket/images/"
  }
}
```

---

## Advanced Features

### 1. Prompt Enhancement

Imagen can enhance prompts using LLM:

```json
{
  "parameters": {
    "enhancePrompt": true
  }
}
```

The enhanced prompt is returned in the response.

### 2. Deterministic Generation

Use seed for reproducible results:

```json
{
  "parameters": {
    "seed": 12345,
    "addWatermark": false  // Required when using seed
  }
}
```

### 3. SynthID Watermarking

Invisible watermark for AI-generated image verification:

```json
{
  "parameters": {
    "addWatermark": true  // Default
  }
}
```

Watermarked images can be verified using SynthID tools.

### 4. Multi-Language Prompts

Supported languages:
- `auto` - Automatic detection
- `en` - English
- `es` - Spanish
- `pt` - Portuguese
- `zh`/`zh-CN` - Chinese (simplified)
- `zh-TW` - Chinese (traditional)
- `hi` - Hindi
- `ja` - Japanese
- `ko` - Korean

```json
{
  "instances": [{ "prompt": "美しい風景" }],
  "parameters": {
    "language": "ja"
  }
}
```

---

## Cost Optimization

### Pricing (Approximate)

**Imagen 4.0**:
- Standard: ~$0.04 per image
- Fast: ~$0.02 per image
- Ultra: ~$0.08 per image

**Resolution Impact**:
- 1K (1024×1024): Standard pricing
- 2K (2048×2048): 2-4x standard pricing

### Optimization Strategies

1. **Use Appropriate Model**:
   - `fast-generate` for drafts/previews
   - Standard for production
   - `ultra-generate` only when needed

2. **Cache Generated Images**:
   ```typescript
   // Check if image exists before generating
   const existing = await getExistingTripImage(tripId);
   if (existing) return existing;
   ```

3. **Batch Processing**:
   - Queue non-urgent generations
   - Process during off-peak hours
   - Use background jobs

4. **Resolution Selection**:
   - Use 1K for most use cases
   - 2K only for high-quality requirements

---

## Best Practices

### 1. Prompt Engineering

**Good Prompts**:
- Be specific and descriptive
- Include style, mood, and composition
- Mention key elements explicitly

**Example**:
```
"A vibrant aerial view of Tokyo during cherry blossom season, 
with Mount Fuji in the background, warm sunset lighting, 
photorealistic style, high detail"
```

### 2. Safety Filters

Adjust based on use case:
```typescript
// For user-generated content
safetySetting: 'block_low_and_above'

// For curated content
safetySetting: 'block_medium_and_above'
```

### 3. Error Recovery

Implement fallback to DALL-E:
```typescript
try {
  return await generateWithImagen(prompt);
} catch (error) {
  console.warn('Imagen failed, falling back to DALL-E');
  return await generateWithDallE(prompt);
}
```

### 4. Watermarking

Keep watermarking enabled for:
- Generated content attribution
- AI verification
- Content authenticity

---

## Usage in Project

### Primary Implementation

From `lib/image-generation.ts`:

```typescript
import { GoogleAuth } from 'google-auth-library';

export async function generateTripImage(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '9:16' = '16:9'
): Promise<string> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT!;
  const location = process.env.GOOGLE_CLOUD_LOCATION!;
  const model = process.env.IMAGEN_MODEL!;
  
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  
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
        aspectRatio,
        addWatermark: true,
        enhancePrompt: true,
        safetySetting: 'block_medium_and_above',
        personGeneration: 'allow_adult',
        sampleImageSize: '1K',
        outputOptions: {
          mimeType: 'image/png'
        }
      }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Imagen API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.predictions?.[0]?.bytesBase64Encoded) {
    if (data.predictions?.[0]?.raiFilteredReason) {
      throw new Error(`Content filtered: ${data.predictions[0].raiFilteredReason}`);
    }
    throw new Error('No image generated');
  }
  
  // Convert base64 to buffer and save
  const imageBuffer = Buffer.from(
    data.predictions[0].bytesBase64Encoded,
    'base64'
  );
  
  return await uploadToStorage(imageBuffer);
}
```

### Queue Processing

From `lib/actions/queue-image-generation.ts`:

```typescript
export async function processImageQueue() {
  const pending = await getPendingImageJobs();
  const rpmLimit = parseInt(process.env.IMAGEN_RPM_LIMIT || '5');
  
  for (const job of pending.slice(0, rpmLimit)) {
    try {
      const imageUrl = await generateTripImage(job.prompt, '16:9');
      await updateTripImage(job.tripId, imageUrl);
      await markJobComplete(job.id);
    } catch (error) {
      await markJobFailed(job.id, error.message);
    }
    
    // Rate limiting: wait between requests
    await new Promise(resolve => setTimeout(resolve, 12000)); // 12s = 5 RPM
  }
}
```

---

## Python SDK (Alternative)

For Python-based scripts or Jupyter notebooks:

```python
from vertexai.preview.vision_models import ImageGenerationModel

model = ImageGenerationModel.from_pretrained("imagen-4.0-generate-001")

images = model.generate_images(
    prompt="A beautiful sunset over mountains",
    number_of_images=1,
    aspect_ratio="16:9",
    add_watermark=True,
    safety_filter_level="block_medium_and_above"
)

images[0].save(location="output.png")
```

---

## Responsible AI Features

### 1. Safety Filters

Imagen filters prompts and outputs for:
- Violence
- Hate speech
- Adult content
- Harmful content

### 2. SynthID Watermarking

Invisible watermark embedded in pixels:
- Imperceptible to humans
- Survives compression and editing
- Verifiable with SynthID detector

### 3. Content Attribution

Generated images should be attributed as AI-generated per Google's terms.

---

## Troubleshooting

### Common Issues

**1. Authentication Errors**
```
Error: Could not load the default credentials
```
**Solution**: 
- Verify `GOOGLE_APPLICATION_CREDENTIALS` path
- Check service account has Vertex AI User role
- Ensure service account JSON is valid

**2. API Not Enabled**
```
Error: Vertex AI API has not been used in project
```
**Solution**:
- Enable Vertex AI API in Google Cloud Console
- Enable AI Platform Training & Prediction API

**3. Content Filtered**
```
raiFilteredReason: "FILTERED_REASON_PROMPT_SAFETY"
```
**Solution**:
- Modify prompt to remove potentially unsafe content
- Review safety filter settings
- Implement retry with adjusted prompt

**4. Rate Limit Exceeded**
```
Error: 429 Resource exhausted
```
**Solution**:
- Implement proper rate limiting
- Reduce `IMAGEN_RPM_LIMIT`
- Use queue-based generation

**5. Invalid Aspect Ratio**
```
Error: Invalid aspect ratio for model
```
**Solution**:
- Use supported ratios: 1:1, 3:4, 4:3, 16:9, 9:16
- Check model documentation for supported ratios

---

## Testing

### Admin Test Endpoints

- `/api/admin/test/imagen-generate` - Single image generation
- `/api/admin/test/imagen-batch` - Batch image generation
- `/admin` - Admin panel for testing

### Manual Testing (cURL)

```bash
# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Generate image
curl -X POST \
  "https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/publishers/google/models/imagen-4.0-generate-001:predict" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instances": [{"prompt": "A beautiful sunset"}],
    "parameters": {"sampleCount": 1}
  }'
```

---

## Performance Optimization

### 1. Async Generation

Use background jobs for non-blocking generation:
```typescript
// Queue for background processing
await queueImageGeneration(tripId, prompt);

// Continue with other operations
return { status: 'queued' };
```

### 2. Caching

Cache generated images by prompt hash:
```typescript
const promptHash = hashPrompt(prompt);
const cached = await getCachedImage(promptHash);
if (cached) return cached;
```

### 3. Parallel Requests

Generate multiple images concurrently (respecting rate limits):
```typescript
const promises = prompts.map((prompt, i) => 
  delay(i * 12000).then(() => generateImageWithImagen(prompt))
);
const images = await Promise.all(promises);
```

---

## Migration from Imagen 3 to 4

### Key Changes

1. **Model Name**: 
   - Old: `imagen-3.0-generate-002`
   - New: `imagen-4.0-generate-001`

2. **Negative Prompt**: Not supported in Imagen 4.0+

3. **Default Person Generation**: Changed from `allow_adult` to `allow_all`

4. **Performance**: Imagen 4.0 is faster and higher quality

### Migration Checklist

- [ ] Update `IMAGEN_MODEL` environment variable
- [ ] Remove `negativePrompt` parameter usage
- [ ] Test prompts with new model
- [ ] Verify safety filter behavior
- [ ] Monitor cost changes

---

## Official Resources

### Documentation
- [Image Generation API Reference](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/imagen-api)
- [Generate Images Guide](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/image/generate-images)
- [Imagen 4.0 Model Card](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/imagen/4-0-generate)
- [Responsible AI](https://cloud.google.com/vertex-ai/generative-ai/docs/image/responsible-ai-imagen)

### Tools
- [Vertex AI Studio](https://console.cloud.google.com/vertex-ai/generative/vision) - Test in browser
- [Python SDK](https://cloud.google.com/python/docs/reference/aiplatform/latest)
- [SynthID](https://deepmind.google/technologies/synthid/) - Watermark verification

### Support
- [Google Cloud Support](https://cloud.google.com/support)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Issue Tracker](https://issuetracker.google.com/issues?q=componentid:190865)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [OpenAI API](./openai.md) - DALL-E 3 fallback option
