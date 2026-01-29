# Hybrid Extraction Pipeline - Quick Start

## See It In Action! 🚀

### Step 1: Start the Extruct Service

Open a terminal and run:

```bash
cd "/Users/alexkaplinsky/Desktop/Dev site/travel-planner-v2"

# Start the extruct service with Docker Compose
docker-compose up extruct-service
```

You should see:
```
✓ Container travel-planner-extruct  Created
✓ Container travel-planner-extruct  Started
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

**Alternative (without Docker):**
```bash
# Install dependencies
cd services/extruct-service
pip install -r requirements.txt

# Run directly
python main.py
```

### Step 2: Verify Service is Running

In another terminal:
```bash
curl http://localhost:8001/health
```

Should return:
```json
{"status":"healthy","service":"extruct-service"}
```

### Step 3: Test with a Sample HTML Confirmation

**Option A: Use the Quick Add UI**

1. Start your Next.js app (if not already running):
   ```bash
   npm run dev
   ```

2. Navigate to a trip: `http://localhost:3000/view1/[tripId]`

3. Click the **+ (Plus)** button in the Journey tab

4. Select a reservation type (e.g., "Flight")

5. Paste HTML confirmation email (see sample below)

6. Click "Extract Details"

7. **Watch the browser console** and **terminal logs**!

**Option B: Test the API Directly**

```bash
curl -X POST http://localhost:3000/api/quick-add/extract \
  -H "Content-Type: application/json" \
  -d '{
    "type": "flight",
    "text": "<html><script type=\"application/ld+json\">{\"@type\":\"FlightReservation\",\"reservationNumber\":\"TEST123\",\"underName\":{\"name\":\"John Smith\"},\"reservationFor\":{\"@type\":\"Flight\",\"flightNumber\":\"UA1234\",\"airline\":{\"name\":\"United Airlines\",\"iataCode\":\"UA\"},\"departureAirport\":{\"iataCode\":\"SFO\",\"name\":\"San Francisco\"},\"departureTime\":\"2026-02-15T10:00:00-08:00\",\"arrivalAirport\":{\"iataCode\":\"LAX\",\"name\":\"Los Angeles\"},\"arrivalTime\":\"2026-02-15T12:00:00-08:00\"}}</script></html>"
  }'
```

### Step 4: What to Look For

#### ✅ Structured Data Extraction (Fast!)

**In your Next.js terminal:**
```
[Extract] HTML detected, trying structured data extraction...
[Extract] ✅ Structured data extraction successful (json-ld, 120ms)
[Extract] Completeness: 0.95
```

**In the extruct service terminal:**
```
INFO: Extracting flight from HTML (length: 523)
INFO: Extruct found: 1 JSON-LD, 0 microdata
INFO: Found flightreservation structured data, extracting...
INFO: Completeness score: 7/7 fields = 100%
INFO: Structured extraction successful (json-ld)
```

**Response includes:**
```json
{
  "type": "flight",
  "data": { ... },
  "method": "structured",
  "duration": 120
}
```

#### 🤖 AI Fallback (When Needed)

**If no structured data found:**
```
[Extract] No structured data found, using AI
[Extract] ✅ AI extraction successful (2340ms)
```

**Response includes:**
```json
{
  "type": "flight",
  "data": { ... },
  "method": "ai",
  "duration": 2340
}
```

### Step 5: Compare Performance

**Try both types:**

1. **With HTML/structured data:**
   - Paste a real confirmation email with HTML
   - Watch for "Structured data extraction successful"
   - Notice speed: ~100-200ms

2. **Without HTML (plain text):**
   - Paste just the text content
   - Watch for "AI extraction"
   - Notice speed: ~2-4 seconds

**Performance difference: 20-40x faster with structured data!**

## Sample HTML Confirmations to Test

### United Airlines Flight (with JSON-LD)

```html
<html>
<head>
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "FlightReservation",
  "reservationNumber": "ABC123",
  "reservationStatus": "http://schema.org/Confirmed",
  "underName": {
    "@type": "Person",
    "name": "John Smith"
  },
  "reservationFor": {
    "@type": "Flight",
    "flightNumber": "UA1234",
    "airline": {
      "@type": "Airline",
      "name": "United Airlines",
      "iataCode": "UA"
    },
    "departureAirport": {
      "@type": "Airport",
      "name": "San Francisco International Airport",
      "iataCode": "SFO"
    },
    "departureTime": "2026-02-15T10:00:00-08:00",
    "arrivalAirport": {
      "@type": "Airport",
      "name": "Los Angeles International Airport",
      "iataCode": "LAX"
    },
    "arrivalTime": "2026-02-15T12:00:00-08:00"
  },
  "bookingTime": "2026-01-15T09:00:00-08:00"
}
</script>
</head>
<body>
<h1>Flight Confirmation</h1>
<p>Confirmation Number: ABC123</p>
<p>Passenger: John Smith</p>
<p>Flight: UA1234</p>
<p>SFO → LAX</p>
<p>February 15, 2026</p>
<p>Departure: 10:00 AM</p>
<p>Arrival: 12:00 PM</p>
</body>
</html>
```

### Marriott Hotel (with JSON-LD)

```html
<html>
<head>
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "LodgingReservation",
  "reservationNumber": "HTL456",
  "underName": {
    "@type": "Person",
    "name": "Jane Doe"
  },
  "reservationFor": {
    "@type": "Hotel",
    "name": "Marriott Downtown",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "123 Main St",
      "addressLocality": "San Francisco",
      "addressRegion": "CA",
      "postalCode": "94102"
    }
  },
  "checkinTime": "2026-02-15T15:00:00",
  "checkoutTime": "2026-02-17T11:00:00"
}
</script>
</head>
<body>
<h1>Hotel Confirmation</h1>
<p>Reservation: HTL456</p>
<p>Guest: Jane Doe</p>
<p>Hotel: Marriott Downtown</p>
<p>Check-in: February 15, 2026 at 3:00 PM</p>
<p>Check-out: February 17, 2026 at 11:00 AM</p>
</body>
</html>
```

### Plain Text (No Structured Data - AI Fallback)

```
United Airlines - Flight Confirmation

Confirmation Number: ABC123
Passenger: John Smith

Flight Details:
Flight: UA1234
From: San Francisco (SFO)
To: Los Angeles (LAX)
Date: February 15, 2026
Departure: 10:00 AM
Arrival: 12:00 PM

Thank you for flying with United!
```

## What You'll Notice

### ⚡ Structured Data Extraction
- **Speed:** ~100-200ms (instant!)
- **Method:** "structured" in response
- **Logs:** "Structured data extraction successful"
- **No AI cost:** $0

### 🤖 AI Fallback
- **Speed:** ~2-4 seconds (slower)
- **Method:** "ai" in response
- **Logs:** "AI extraction successful"
- **Cost:** ~$0.001-0.003

### 🎯 Key Insights
- Major airlines/hotels often have structured data
- Budget airlines/small providers usually don't
- Plain text always uses AI
- Both methods work perfectly!

## Troubleshooting

### Extruct Service Not Starting

```bash
# Check if port 8001 is in use
lsof -i :8001

# Kill the process if needed
kill -9 <PID>

# Try again
docker-compose up extruct-service
```

### Service Running But Not Being Called

Check your `.env.local`:
```bash
# Should have this line:
EXTRUCT_SERVICE_URL=http://localhost:8001
```

Restart your Next.js app:
```bash
npm run dev
```

### No Logs Appearing

Make sure you're watching the right terminals:
1. **Extruct service logs:** Terminal running docker-compose
2. **Next.js logs:** Terminal running npm run dev
3. **Browser console:** F12 → Console tab

### "Extruct service unavailable"

This is OKAY! The system automatically falls back to AI. Check:
1. Is docker-compose running?
2. Is the health endpoint responding? `curl http://localhost:8001/health`
3. Is EXTRUCT_SERVICE_URL set correctly?

## Monitoring in Production

### View Extraction Metrics

Watch your logs for patterns:
```bash
# Count structured vs AI extractions
grep "Structured data extraction successful" logs | wc -l
grep "AI extraction successful" logs | wc -l

# Calculate percentage using structured data
```

### Track Performance

```bash
# Average structured extraction time
grep "Structured data extraction successful" logs | \
  grep -oP '\d+ms' | \
  grep -oP '\d+' | \
  awk '{sum+=$1; count++} END {print sum/count "ms"}'

# Average AI extraction time
grep "AI extraction successful" logs | \
  grep -oP '\d+ms' | \
  grep -oP '\d+' | \
  awk '{sum+=$1; count++} END {print sum/count "ms"}'
```

## Testing Different Providers

Try these real-world scenarios:

1. **Major Airline** (United, American, Delta)
   - Usually has structured data ✅
   - Expect: ~100ms, method: "structured"

2. **Budget Airline** (Ryanair, Spirit)
   - Usually no structured data ❌
   - Expect: ~2-4s, method: "ai"

3. **Hotel Chain** (Marriott, Hilton)
   - Often has structured data ✅
   - Expect: ~150ms, method: "structured"

4. **Booking Platform** (Booking.com, Expedia)
   - Usually has structured data ✅
   - Expect: ~120ms, method: "structured"

5. **Plain Text** (copy-paste without HTML)
   - No structured data ❌
   - Expect: ~3s, method: "ai"

## Success!

You should now see:
- ⚡ Instant extraction for providers with structured data
- 🤖 Reliable AI fallback for everyone else
- 📊 Clear logging showing which method was used
- 💰 Cost savings from avoiding AI calls when possible

**The best part?** Users don't need to do anything different - it just works!

## Next Steps

1. Monitor your logs to see actual coverage rates
2. Track cost savings vs AI-only approach
3. Consider adding more extractors (cruise, private-driver)
4. Implement UI indicator showing extraction method

Enjoy your 20-40x faster extractions! 🚀
