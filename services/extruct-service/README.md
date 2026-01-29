# Extruct Service

FastAPI microservice for extracting structured data (JSON-LD, microdata) from HTML confirmation emails.

## Purpose

This service provides Tier 1 extraction before falling back to AI:
- **20-40x faster** than AI extraction (~100ms vs 2-4s)
- **Zero cost** (no API calls)
- **High accuracy** (provider-supplied structured data)
- Works with major airlines, hotels, booking platforms that include schema.org markup

## Usage

### Start the service

```bash
# With Docker Compose (recommended)
docker-compose up extruct-service

# Or directly with Python
cd services/extruct-service
pip install -r requirements.txt
python main.py
```

The service will be available at `http://localhost:8001`

### API Endpoints

**POST /extract**
```json
{
  "html": "<html>..confirmation email HTML...</html>",
  "type": "flight" | "hotel" | "car-rental" | "train" | "restaurant" | "event"
}
```

Response (success):
```json
{
  "success": true,
  "method": "json-ld",
  "data": { ...normalized reservation data... },
  "completeness": 0.95,
  "confidence": "high"
}
```

Response (no structured data):
```json
{
  "success": false,
  "method": "not-found",
  "completeness": 0.0,
  "confidence": "low"
}
```

**GET /health**

Health check endpoint for monitoring.

## Supported Providers

### High Coverage (>80% include structured data)
- **Airlines:** United, American, Delta, Alaska
- **Hotels:** Marriott, Hilton, Hyatt, IHG
- **Booking Platforms:** Booking.com, Expedia, Hotels.com

### Medium Coverage (20-80%)
- International airlines
- Mid-size hotel chains
- Car rental companies (varies)

### Low Coverage (<20%)
- Budget airlines (Ryanair, Spirit, Frontier)
- Small independent hotels
- Restaurants
- Most events

## Completeness Scoring

The service calculates a completeness score (0-1) based on required fields:

- **>= 0.8** - Use structured data (high confidence)
- **< 0.8** - Fall back to AI

Required fields by type:
- **Flight:** flightNumber, airports, dates, times
- **Hotel:** hotelName, check-in date, check-out date
- **Car Rental:** company, pickup/return locations and dates
- **Train:** trainNumber, stations, dates, times
- **Restaurant:** restaurantName, reservationDate, reservationTime
- **Event:** eventName, venueName, eventDate

## Architecture

```
┌─────────────────┐
│  Quick Add API  │
└────────┬────────┘
         │
         ├─ HTML detected?
         │
         ├─ YES → POST /extract
         │         │
         │         ├─ Parse with extruct
         │         ├─ Normalize to our schema
         │         ├─ Calculate completeness
         │         │
         │         └─ >= 0.8? → Return data
         │              └─ < 0.8? → Return not-found
         │
         └─ NO or not-found → AI extraction (Tier 3)
```

## Development

### Adding a new extractor

1. Create `extractors/{type}_extractor.py`
2. Implement `extract_{type}_reservation(json_ld: dict) -> dict`
3. Import in `main.py`
4. Add to the switch statement in `_process_structured_data()`
5. Add required fields to `validators.py`

### Testing

```bash
# Run tests
python -m pytest tests/

# Test a single extractor
python -c "from extractors.flight_extractor import *; ..."
```

## Deployment

The service is containerized and runs independently:

```yaml
# docker-compose.yml
services:
  extruct-service:
    build: ./services/extruct-service
    ports:
      - "8001:8001"
```

Set `EXTRUCT_SERVICE_URL` in your Next.js app's environment:

```bash
EXTRUCT_SERVICE_URL=http://localhost:8001  # Development
EXTRUCT_SERVICE_URL=http://extruct-service:8001  # Docker Compose
```

## Performance

Expected metrics:
- **Response time:** ~50-150ms (parsing only)
- **Success rate:** 40-60% of confirmation emails
- **Cost:** $0 (no API calls)
- **Fallback:** AI extraction always available

## Troubleshooting

**Service not starting:**
```bash
# Check if port 8001 is in use
lsof -i :8001

# View logs
docker-compose logs extruct-service
```

**Service unavailable:**
- Quick Add API automatically falls back to AI
- Check health endpoint: `curl http://localhost:8001/health`

**Low extraction rate:**
- Some providers don't include structured data
- AI fallback ensures 100% coverage
- Monitor completeness scores in logs

## Future Enhancements

- [ ] Regex patterns for providers without structured data
- [ ] Hybrid mode (combine structured data + AI for partial matches)
- [ ] Provider detection and routing
- [ ] Caching of parsed results
- [ ] Batch extraction support
