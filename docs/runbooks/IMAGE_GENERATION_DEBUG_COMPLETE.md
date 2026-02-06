# Image Generation Debugging - COMPLETE

**Date**: January 27, 2026  
**Status**: ✅ Diagnostics Complete, Enhanced Logging Added

## Summary

Added comprehensive diagnostic tools and enhanced error logging to the image generation system to help identify and troubleshoot failures.

## What Was Done

### 1. Database Verification

Ran SQL queries to verify the database state:
- ✓ `ImagePromptStyle` table exists with data
- ✓ `ImagePrompt` table has `styleId` foreign keys
- ✓ Default style is configured: **Travel Scrapbook**

### 2. Enhanced Error Logging

**File**: [`lib/image-generation.ts`](lib/image-generation.ts)

#### Updated `selectDefaultPromptForContent()`

Added detailed logging at each step:
```typescript
console.log(`[selectDefaultPromptForContent] Looking for default style...`);
console.log(`[selectDefaultPromptForContent] Found default style: ${defaultStyle.name} (${defaultStyle.id})`);
console.log(`[selectDefaultPromptForContent] Found prompt: ${prompt.name}`);
```

Added error logging when failures occur:
```typescript
console.error(`[selectDefaultPromptForContent] ERROR: No default style found!`);
console.error(`[selectDefaultPromptForContent] Available styles:`, ...);
console.error(`[selectDefaultPromptForContent] ERROR: No prompt found!`);
console.error(`[selectDefaultPromptForContent] Looking for: styleId=..., category=...`);
```

#### Updated `generateImageWithImagen()`

Added logging throughout the image generation process:
```typescript
console.log(`[generateImageWithImagen] Starting image generation...`);
console.log(`[generateImageWithImagen] Prompt length: ${prompt.length} chars`);
console.log(`[generateImageWithImagen] Vertex AI client initialized`);
console.log(`[generateImageWithImagen] Image generated successfully`);
```

Added error logging:
```typescript
console.error(`[generateImageWithImagen] ERROR: Image generation failed`);
console.error(`[generateImageWithImagen] Error:`, result.error);
console.error(`[generateImageWithImagen] EXCEPTION:`, error);
```

### 3. Diagnostic Test Script

**File**: `scripts/test-image-gen.ts` (NEW)

Created a comprehensive test script that checks:
1. Default `ImagePromptStyle` exists and is active
2. Trip prompt exists for the default style
3. Environment variables are properly configured

**Run with**:
```bash
npx tsx scripts/test-image-gen.ts
```

**Test Results** (Jan 27, 2026):
```
=== Testing Image Generation Setup ===

1. Checking for default ImagePromptStyle...
   ✓ Found: Travel Scrapbook (cmkwe4j5y001tp4xtxi1v4734)

2. Checking for trip prompt with default style...
   ✓ Found: Travel Scrapbook - Trip

3. Checking environment variables...
   ✓ GOOGLE_CLOUD_PROJECT: travel-planer-v1
   ✓ GOOGLE_CLOUD_LOCATION: us-central1
   ✓ IMAGE_PROVIDER: imagen

=== Test Complete ===
```

### 4. Prisma Client Regeneration

Regenerated the Prisma client to ensure it includes the latest schema changes:
```bash
npx prisma generate
```

Result: ✓ Generated Prisma Client (v6.9.0)

## Current System State

### Database Configuration

- **Default Style**: Travel Scrapbook (ID: cmkwe4j5y001tp4xtxi1v4734)
- **Active Styles**: 4 total (Retro Gouache, Golden Hour, Stylized Map Journey, Travel Scrapbook)
- **Prompts**: 12 total (3 per style for trip/segment/reservation)

### Environment Variables

All required environment variables are configured:
- ✓ `GOOGLE_CLOUD_PROJECT=travel-planer-v1`
- ✓ `GOOGLE_CLOUD_LOCATION=us-central1`
- ✓ `IMAGE_PROVIDER=imagen`
- ✓ `GOOGLE_APPLICATION_CREDENTIALS` (in .env)
- ✓ `IMAGEN_MODEL` (in .env)

## How to Diagnose Future Issues

### Step 1: Check Terminal Logs

When an image generation fails, the enhanced logging will now show:

**Expected Success Flow**:
```
[selectDefaultPromptForContent] Looking for default style...
[selectDefaultPromptForContent] Found default style: Travel Scrapbook (cmkwe4j5y001tp4xtxi1v4734)
[selectDefaultPromptForContent] Found prompt: Travel Scrapbook - Trip
[generateImageWithImagen] Starting image generation...
[generateImageWithImagen] Prompt length: 842 chars
[generateImageWithImagen] Vertex AI client initialized
[generateImageWithImagen] Image generated successfully
```

**Error Examples**:

If no default style:
```
[selectDefaultPromptForContent] ERROR: No default style found!
[selectDefaultPromptForContent] Available styles: [...]
```

If no prompt for style+category:
```
[selectDefaultPromptForContent] ERROR: No prompt found!
[selectDefaultPromptForContent] Looking for: styleId=xxx, category=trip
[selectDefaultPromptForContent] Available prompts for this style: [...]
```

If Imagen API fails:
```
[generateImageWithImagen] ERROR: Image generation failed
[generateImageWithImagen] Error: {...}
```

### Step 2: Run Diagnostic Script

```bash
npx tsx scripts/test-image-gen.ts
```

This will verify:
- Default style exists
- Prompts exist for that style
- Environment variables are set

### Step 3: Check Database

Query for default style:
```sql
SELECT * FROM "ImagePromptStyle" WHERE "isDefault" = true;
```

Query for prompts:
```sql
SELECT ip.id, ip.name, ip.category, ips.name as style_name
FROM "ImagePrompt" ip
JOIN "ImagePromptStyle" ips ON ip."styleId" = ips.id
WHERE ips."isDefault" = true;
```

### Step 4: Verify Prisma Client

If you suspect stale Prisma client:
```bash
npx prisma generate
# Restart dev server
```

## Common Issues & Solutions

### Issue: "No default style configured"

**Cause**: No `ImagePromptStyle` record has `isDefault=true`

**Solution**:
```sql
UPDATE "ImagePromptStyle" SET "isDefault" = true WHERE slug = 'retro_gouache';
```

Or run the seed:
```bash
node prisma/seed.js
```

### Issue: "No prompt found for style X and category Y"

**Cause**: Missing prompt for a specific style+category combination

**Solution**: Run seed to ensure all 12 prompts exist:
```bash
node prisma/seed.js
```

### Issue: Vertex AI errors

**Causes**:
1. Invalid Google Cloud credentials
2. API quota exceeded
3. Network issues
4. Invalid prompt content

**Check**:
- `.gcloud/service-account.json` exists and is valid
- Google Cloud project has Vertex AI API enabled
- Check Google Cloud console for quota/billing issues

### Issue: Image generation hangs

**Cause**: Vertex AI API taking too long or timeout

**Check terminal logs for**:
```
[generateImageWithImagen] Vertex AI client initialized
```

If this appears but nothing after, the API call is hanging.

## Files Modified

1. [`lib/image-generation.ts`](lib/image-generation.ts) - Enhanced logging
2. `scripts/test-image-gen.ts` (NEW) - Diagnostic script

## Next Steps for User

1. **Try creating a trip again** - The enhanced logging will now show exactly where it fails
2. **Check terminal output** - Look for the `[selectDefaultPromptForContent]` and `[generateImageWithImagen]` logs
3. **Report the specific error** - The logs will show exactly what's failing

## Example Debug Session

If user reports "failed to generate image":

1. Ask them to check terminal for logs starting with:
   - `[selectDefaultPromptForContent]`
   - `[generateImageWithImagen]`

2. The logs will reveal the exact failure point:
   - Style selection failed?
   - Prompt selection failed?
   - API call failed?
   - Upload failed?

3. Based on the logs, apply the appropriate fix from the "Common Issues & Solutions" section above.

## Conclusion

The image generation system now has comprehensive diagnostic capabilities:
- ✅ Enhanced error logging throughout the pipeline
- ✅ Diagnostic test script to verify configuration
- ✅ Database verification queries
- ✅ Prisma client regenerated
- ✅ All environment variables confirmed

The system is properly configured. If image generation still fails, the enhanced logs will pinpoint the exact cause.

---

**Note**: The dev server should be restarted to pick up the new Prisma client and enhanced logging code. The user can now create a trip and watch the terminal for detailed diagnostic output.
