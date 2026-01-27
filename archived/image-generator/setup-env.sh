#!/bin/bash

echo "🔧 Image Generator Environment Setup"
echo "===================================="
echo ""

# Check if .env exists in parent directory
if [ ! -f ../.env ]; then
    echo "❌ No .env file found in project root"
    exit 1
fi

echo "✓ Found .env file in project root"
echo ""

# Check for required keys
echo "Checking existing API keys..."
echo ""

if grep -q "^OPENAI_API_KEY=" ../.env; then
    echo "✅ OPENAI_API_KEY found"
else
    echo "❌ OPENAI_API_KEY missing"
fi

if grep -q "^GOOGLE_MAPS_API_KEY=" ../.env; then
    echo "✅ GOOGLE_MAPS_API_KEY found"
else
    echo "❌ GOOGLE_MAPS_API_KEY missing"
fi

echo ""
echo "Checking Google Cloud/Vertex AI credentials..."
echo ""

MISSING_KEYS=()

if ! grep -q "^GOOGLE_CLOUD_PROJECT=" ../.env; then
    echo "❌ GOOGLE_CLOUD_PROJECT missing"
    MISSING_KEYS+=("GOOGLE_CLOUD_PROJECT")
else
    echo "✅ GOOGLE_CLOUD_PROJECT found"
fi

if ! grep -q "^GOOGLE_CLOUD_LOCATION=" ../.env; then
    echo "⚠️  GOOGLE_CLOUD_LOCATION missing (will default to us-central1)"
    MISSING_KEYS+=("GOOGLE_CLOUD_LOCATION")
else
    echo "✅ GOOGLE_CLOUD_LOCATION found"
fi

if ! grep -q "^GOOGLE_APPLICATION_CREDENTIALS=" ../.env; then
    echo "❌ GOOGLE_APPLICATION_CREDENTIALS missing"
    MISSING_KEYS+=("GOOGLE_APPLICATION_CREDENTIALS")
else
    echo "✅ GOOGLE_APPLICATION_CREDENTIALS found"
fi

echo ""
echo "===================================="
echo ""

if [ ${#MISSING_KEYS[@]} -gt 0 ]; then
    echo "⚠️  Missing required keys for image generation:"
    for key in "${MISSING_KEYS[@]}"; do
        echo "   - $key"
    done
    echo ""
    echo "To add these keys, append to your .env file:"
    echo ""
    echo "# Google Vertex AI Configuration (for image-generator)"
    echo "GOOGLE_CLOUD_PROJECT=your-project-id"
    echo "GOOGLE_CLOUD_LOCATION=us-central1"
    echo "GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json"
    echo ""
    echo "📚 See image-generator/README.md for setup instructions"
else
    echo "✅ All required keys are configured!"
    echo ""
    echo "You can now use the image generator at:"
    echo "http://localhost:3000/image-generator"
fi
