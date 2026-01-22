# Quick Start Guide - Image Generator

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+
- Google Cloud account
- OpenAI API key

## Step 1: Install Dependencies (1 min)

```bash
npm install google-auth-library uuid
```

## Step 2: Google Cloud Setup (2 min)

### Enable Vertex AI
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Vertex AI API**

### Create Service Account
1. Go to **IAM & Admin** > **Service Accounts**
2. Create new service account
3. Grant role: **Vertex AI User**
4. Create JSON key and download

## Step 3: Configure Environment (1 min)

```bash
cp image-generator/.env.example .env
```

Edit `.env`:
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
OPENAI_API_KEY=sk-your-key-here
```

## Step 4: Start & Test (1 min)

```bash
npm run dev
```

Navigate to: `http://localhost:3000/image-generator`

Paste this test prompt:
```
1. A futuristic city at sunset
2. An astronaut riding a horse in space
```

Click "Extract & Generate" and watch the magic! ✨

## Troubleshooting

### "Failed to get access token"
- Check `GOOGLE_APPLICATION_CREDENTIALS` path is absolute
- Verify service account has "Vertex AI User" role

### "429 Resource exhausted"
- Default quota is 5 RPM
- Request increase in Google Cloud Console > Quotas

### "No prompts found"
- Ensure prompts are descriptive (10+ characters)
- Try numbered list format

## What's Next?

- Read full [README.md](README.md) for detailed documentation
- Check [logs/queue.json](logs/queue.json) for queue status
- View [logs/api-calls.jsonl](logs/api-calls.jsonl) for API logs
- Customize settings in `.env`

## Support

- Full docs: `image-generator/README.md`
- Implementation details: `IMAGE_GENERATOR_IMPLEMENTATION_COMPLETE.md`
