# Extraction API Fixed - Detection Type Now Passed Through

## Problem

After fixing the detection API Prisma error, a new issue emerged:

```
❌ Failed to build extraction prompt: No extraction plugin matched the email content. 
Unable to determine reservation type.
```

The extraction API (`/api/admin/email-extract`) was returning a 400 error because it couldn't detect the reservation type from the transfer email.

## Root Cause

We had **two separate detection systems** working independently:

### System 1: New Semantic Detection (✅ Working)
- **API**: `/api/chat/detect-paste`
- **Technology**: Multi-layer semantic analysis with company names, domains, phrases
- **Database-driven**: Loads 33 reservation types dynamically
- **Result**: Successfully detected "Private Driver" with 99% confidence

### System 2: Old Keyword Matching (❌ Broken)
- **Function**: `buildExtractionPrompt()` in `lib/email-extraction/build-extraction-prompt.ts`
- **Technology**: Simple keyword counting
- **Hardcoded**: Only looks for specific keywords like "car rental", "rent a car"
- **Problem**: Transfer emails use different vocabulary ("transfer service", "driver waiting")
- **Result**: No keywords matched, extraction failed

## The Fix

Instead of running detection twice, we now **pass the detected type** from the detection API to the extraction API, allowing it to bypass the old keyword matching system.

### 1. Client Passes Detected Type

Updated `app/exp/client.tsx` (lines 508-535):

```typescript
// Map detected type to extraction type
const typeMapping: Record<string, string> = {
  'Flight': 'flight',
  'Hotel': 'hotel',
  'Car Rental': 'car-rental',
  'Private Driver': 'car-rental', // Transfers use car-rental schema
  'Ride Share': 'car-rental',
  'Taxi': 'car-rental',
  'Train': 'train',
  'Restaurant': 'restaurant',
  'Event': 'event',
  'Activity': 'event',
  'Cruise': 'cruise'
};

const extractionType = detectedType ? typeMapping[detectedType] || 'generic' : undefined;

const extractionResponse = await fetch('/api/admin/email-extract', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    emailText: text,
    detectedType: extractionType // Pass the type to skip pattern matching
  })
});
```

### 2. Extraction API Uses Detected Type

Updated `app/api/admin/email-extract/route.ts` (lines 35-93):

```typescript
const { emailText, detectedType } = await request.json();

if (detectedType) {
  console.log(`✅ Using pre-detected type: ${detectedType}, skipping pattern matching`);
  
  // Load the correct plugin based on detected type
  const registry = createExtractionRegistry();
  const pluginId = typeToPluginId[detectedType];
  const plugin = registry.get(pluginId);
  
  // Build extraction result directly from plugin
  extractionResult = {
    prompt: `${BASE_EXTRACTION_PROMPT}\n\n---\n\n${plugin.content}`,
    schema: plugin.schema,
    extractionType: plugin.id,
    // ...
  };
} else {
  // Original behavior: use pattern matching
  extractionResult = buildExtractionPrompt({ emailText, ... });
}
```

## How It Works Now

### 1. Detection Phase (Fast)
```
POST /api/chat/detect-paste
↓
Semantic analysis runs
↓
Returns: { detectedType: "Private Driver", suggestedAction: "extract" }
```

### 2. Client Triggers Extraction
```
detectedType: "Private Driver"
↓
Maps to: "car-rental"
↓
POST /api/admin/email-extract with { emailText, detectedType: "car-rental" }
```

### 3. Extraction Phase (AI)
```
Receives detectedType: "car-rental"
↓
Loads car-rental plugin directly (skips pattern matching)
↓
Uses car-rental schema for structured extraction
↓
AI extracts pickup/dropoff locations, times, company, cost
```

### 4. Creation Phase
```
Extracted data → addCarRentalToTrip()
↓
Creates reservation in database
↓
Success message with reservation card
```

## Type Mapping

The client maps user-friendly detection types to extraction plugin IDs:

| Detected Type | Extraction Type | Schema Used |
|---------------|-----------------|-------------|
| Flight | flight | flight-extraction |
| Hotel | hotel | hotel-extraction |
| Car Rental | car-rental | car-rental-extraction |
| **Private Driver** | **car-rental** | car-rental-extraction |
| **Ride Share** | **car-rental** | car-rental-extraction |
| **Taxi** | **car-rental** | car-rental-extraction |
| Train | train | train-extraction |
| Restaurant | restaurant | restaurant-extraction |
| Event | event | event-extraction |
| Activity | event | event-extraction |
| Cruise | cruise | cruise-extraction |

**Key insight**: Transfers, ride shares, and taxis all use the **car-rental schema** because they share the same data structure (pickup/dropoff locations, times, vehicle info).

## Benefits

1. **Single Source of Truth**: Detection happens once, in the semantic detection API
2. **More Accurate**: Semantic detection is far superior to keyword matching
3. **Extensible**: New reservation types only need to be added to the detection API
4. **Backwards Compatible**: If no `detectedType` is provided, falls back to old pattern matching
5. **Cleaner Logs**: No more "no plugin matched" errors for valid reservations

## Expected Server Logs Now

When you paste the transfer email:

```
[DetectPaste] ✅ Loaded 33 reservation types from database
[DetectPaste] Detected: YES, Type: Private Driver, Confidence: 0.99, Action: extract
 POST /api/chat/detect-paste 200 in 23ms

📧 Email extraction request received, text length: 514
📋 Pre-detected type provided: car-rental
✅ Using pre-detected type: car-rental, skipping pattern matching
📋 Detected reservation type: car-rental
🔌 Active plugins: Base Prompt, Car Rental Extraction
🤖 Starting AI extraction with car-rental schema...
⏱️ AI extraction completed in 3500ms
✅ Successfully extracted car rental booking in 3500ms
 POST /api/admin/email-extract 200 in 3508ms
```

## Files Modified

1. `app/exp/client.tsx` - Added type mapping and pass `detectedType` to extraction API
2. `app/api/admin/email-extract/route.ts` - Accept `detectedType` and bypass pattern matching

## Testing

**Please hard refresh (Cmd+Shift+R) and paste the transfer email again.**

Expected result:
1. Detection: 200 OK, Private Driver, 0.99 confidence
2. Extraction: 200 OK, uses car-rental schema
3. Reservation created successfully
4. No more "extraction failed" errors

---

**Status**: READY TO TEST

The extraction pipeline is now fully integrated with the semantic detection system!
