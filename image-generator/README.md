# AI Image Generator Tool

A portable, self-contained image generation tool powered by Google Vertex AI Imagen. This tool can be easily moved between projects and provides a complete workflow for batch image generation with queue management, logging, and real-time progress tracking.

## Features

- 🤖 **AI-Powered Prompt Parsing**: Uses OpenAI GPT-4 to extract prompts from any text format
- 🎨 **Google Vertex AI Imagen**: High-quality image generation using Imagen 4.0
- 📊 **Queue Management**: Batch processing with status tracking and error handling
- 🔄 **Rate Limiting**: Built-in throttling to respect API limits (5 RPM default)
- 📝 **Comprehensive Logging**: Detailed logs for debugging and monitoring
- 🖼️ **Real-Time Gallery**: See generated images as they complete
- 🚀 **Portable**: Self-contained tool that can be moved between projects

## Directory Structure

```
/image-generator/
├── app/
│   └── page.tsx                    # Main UI page
├── components/
│   ├── prompt-input.tsx            # Textarea for pasting prompts
│   ├── queue-display.tsx           # Real-time queue status
│   ├── image-gallery.tsx           # Generated images display
│   └── progress-indicator.tsx      # Processing progress
├── lib/
│   ├── vertex-ai-client.ts         # Google Vertex AI API client
│   ├── prompt-parser.ts            # AI-powered prompt extraction
│   ├── queue-manager.ts            # Queue processing logic
│   └── file-utils.ts               # File naming and storage
├── api/
│   ├── parse-prompts/route.ts      # Extract prompts from text
│   ├── generate-image/route.ts     # Generate single image
│   ├── queue-status/route.ts       # Get queue status
│   └── process-queue/route.ts      # Process entire queue
├── output/                          # Generated images
├── logs/
│   ├── queue.json                  # Queue status log
│   └── api-calls.jsonl             # API call log
├── .env.example                    # Environment variables template
└── README.md                       # This file
```

## Prerequisites

1. **Google Cloud Project** with Vertex AI enabled
2. **Service Account** with Vertex AI permissions
3. **OpenAI API Key** for prompt parsing
4. **Node.js** 18+ and npm

## Setup Instructions

### 1. Google Cloud Setup

#### Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

#### Enable Vertex AI API

1. Go to **APIs & Services** > **Library**
2. Search for "Vertex AI API"
3. Click **Enable**

#### Create a Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., "imagen-generator")
4. Grant the following roles:
   - **Vertex AI User** (`roles/aiplatform.user`)
   - **Storage Object Admin** (if using Cloud Storage)
5. Click **Done**

#### Generate Service Account Key

1. Click on your service account
2. Go to **Keys** tab
3. Click **Add Key** > **Create New Key**
4. Choose **JSON** format
5. Download the key file
6. Save it securely (e.g., `~/credentials/imagen-service-account.json`)

### 2. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp image-generator/.env.example image-generator/.env
   ```

2. Edit `image-generator/.env` with your credentials:
   ```bash
   # Google Cloud Configuration
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json

   # OpenAI for Prompt Parsing
   OPENAI_API_KEY=sk-...

   # Rate Limiting (optional)
   IMAGEN_RPM_LIMIT=5
   IMAGEN_MAX_CONCURRENT=2

   # Image Configuration (optional)
   IMAGEN_MODEL=imagen-4.0-generate-001
   IMAGEN_ASPECT_RATIO=1:1
   ```

### 3. Install Dependencies

```bash
npm install google-auth-library uuid
npm install --save-dev @types/uuid
```

Or add to your `package.json`:

```json
{
  "dependencies": {
    "google-auth-library": "^9.0.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0"
  }
}
```

### 4. Verify Setup

Test your Google Cloud credentials:

```bash
gcloud auth application-default login
gcloud config set project YOUR_PROJECT_ID
```

## Usage

### 1. Start the Application

```bash
npm run dev
```

### 2. Navigate to the Tool

Open your browser to:
```
http://localhost:3000/image-generator
```

### 3. Generate Images

1. **Paste Your Prompts**: Copy and paste text containing image prompts into the textarea
   - Supports numbered lists, bullet points, plain text, or any format
   - The AI will automatically extract all prompts

2. **Click "Extract & Generate"**: The tool will:
   - Parse prompts using GPT-4
   - Generate logical filenames
   - Add all prompts to the queue
   - Start processing automatically

3. **Monitor Progress**: Watch the real-time status:
   - Queue statistics (pending, processing, completed, errors)
   - Individual prompt status
   - Progress bar

4. **View Generated Images**: Images appear in the gallery as they complete
   - Download individual images
   - Copy prompts to clipboard
   - Images saved to `image-generator/output/`

## Prompt Format Examples

The AI parser is flexible and handles various formats:

### Numbered List
```
1. A futuristic city at sunset with neon lights
2. An astronaut riding a horse in space
3. A mountain landscape with a crystal clear lake
```

### Bullet Points
```
- A serene Japanese garden with cherry blossoms
- A cyberpunk street market at night
- An underwater scene with colorful coral
```

### Plain Text
```
Generate an image of a cozy coffee shop interior.
Create a picture of a dragon flying over mountains.
Show me a vintage car in a desert landscape.
```

### XML Format
```xml
<prompts>
  <prompt>A magical forest with glowing mushrooms</prompt>
  <prompt>A steampunk airship in the clouds</prompt>
</prompts>
```

## Configuration Options

### Rate Limiting

Adjust the rate limit based on your quota:

```bash
IMAGEN_RPM_LIMIT=5        # Requests per minute
IMAGEN_MAX_CONCURRENT=2   # Concurrent requests
```

### Image Settings

Customize image generation:

```bash
IMAGEN_MODEL=imagen-4.0-generate-001  # Model version
IMAGEN_ASPECT_RATIO=1:1               # 1:1, 16:9, 9:16, 4:3, 3:4
```

### Available Models

- `imagen-4.0-generate-001` (GA, recommended)
- `imagen-4.0-ultra-generate-001` (higher quality)
- `imagen-3.0-generate-001` (alternative)
- `imagen-3.0-fast-generate-001` (faster generation)

## Logs and Debugging

### Queue Log

View queue status at `image-generator/logs/queue.json`:

```json
{
  "prompts": [
    {
      "id": "uuid-1",
      "prompt": "A futuristic city at sunset",
      "filename": "futuristic_city_sunset",
      "status": "completed",
      "createdAt": "2026-01-21T10:00:00Z",
      "completedAt": "2026-01-21T10:00:15Z",
      "outputPath": "/path/to/output/futuristic_city_sunset_1737460815.png"
    }
  ]
}
```

### API Call Log

View detailed API logs at `image-generator/logs/api-calls.jsonl`:

```jsonl
{"id":"call-1","timestamp":"2026-01-21T10:00:00Z","promptId":"uuid-1","model":"imagen-4.0-generate-001","status":"success","duration":3421}
{"id":"call-2","timestamp":"2026-01-21T10:01:00Z","promptId":"uuid-2","model":"imagen-4.0-generate-001","status":"error","duration":1234,"error":{"code":429,"message":"Resource exhausted"}}
```

## Troubleshooting

### Error: "Failed to get access token"

**Cause**: Invalid or missing service account credentials

**Solution**:
1. Verify `GOOGLE_APPLICATION_CREDENTIALS` points to the correct JSON file
2. Check that the service account has Vertex AI User role
3. Ensure the credentials file is readable

### Error: "429 Resource exhausted"

**Cause**: Rate limit exceeded

**Solution**:
1. Reduce `IMAGEN_RPM_LIMIT` in `.env`
2. Request quota increase in Google Cloud Console:
   - Go to **IAM & Admin** > **Quotas**
   - Search for "Vertex AI Imagen"
   - Request increase for your project

### Error: "No prompts found in the text"

**Cause**: Text doesn't contain recognizable prompts

**Solution**:
1. Ensure prompts are descriptive (at least 10 characters)
2. Use clear formatting (numbered lists work best)
3. Check OpenAI API key is valid

### Images Not Displaying

**Cause**: Path configuration issue

**Solution**:
1. Check that images are in `image-generator/output/`
2. Verify Next.js is serving static files correctly
3. Check browser console for 404 errors

## Portability

### Moving to Another Project

1. **Copy the folder**:
   ```bash
   cp -r image-generator /path/to/new-project/
   ```

2. **Install dependencies** in the new project:
   ```bash
   npm install google-auth-library uuid
   ```

3. **Configure environment**:
   ```bash
   cp image-generator/.env.example image-generator/.env
   # Edit .env with new project credentials
   ```

4. **Update Next.js config** if needed (routes should work automatically)

### Standalone Usage

This tool is designed to be self-contained and can run independently of the parent project structure.

## API Reference

### POST `/image-generator/api/parse-prompts`

Parse text and extract prompts.

**Request**:
```json
{
  "text": "1. A futuristic city\n2. An astronaut in space"
}
```

**Response**:
```json
{
  "success": true,
  "prompts": [
    {
      "id": "uuid-1",
      "prompt": "A futuristic city",
      "filename": "futuristic_city"
    }
  ],
  "count": 2
}
```

### POST `/image-generator/api/generate-image`

Generate a single image.

**Request**:
```json
{
  "promptId": "uuid-1"
}
```

**Response**:
```json
{
  "success": true,
  "promptId": "uuid-1",
  "imagePath": "/path/to/output/image.png",
  "duration": 3421
}
```

### GET `/image-generator/api/queue-status`

Get current queue status.

**Response**:
```json
{
  "queue": [...],
  "stats": {
    "total": 10,
    "pending": 2,
    "processing": 1,
    "completed": 7,
    "error": 0
  }
}
```

### POST `/image-generator/api/process-queue`

Process all pending items in the queue.

**Response**:
```json
{
  "success": true,
  "message": "Queue processed"
}
```

## Cost Estimation

### Vertex AI Imagen Pricing (as of 2026)

- **Standard Quality**: ~$0.020 per image
- **HD Quality**: ~$0.040 per image

### OpenAI GPT-4 Pricing

- **Prompt Parsing**: ~$0.001-0.005 per batch (depending on text length)

### Example Costs

- **10 images**: ~$0.20 (Imagen) + $0.005 (GPT-4) = ~$0.205
- **100 images**: ~$2.00 (Imagen) + $0.05 (GPT-4) = ~$2.05

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review logs in `image-generator/logs/`
3. Verify Google Cloud and OpenAI credentials
4. Check API quotas and limits

## License

This tool is provided as-is for use in your projects. Modify and distribute as needed.

## Credits

- **Google Vertex AI Imagen**: Image generation
- **OpenAI GPT-4**: Prompt parsing
- **Next.js**: Web framework
- **Tailwind CSS**: Styling
