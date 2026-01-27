# Viator Partner API Specification

## Overview

The Viator Partner API v2.0 provides comprehensive access to tours and activities data, including product search, availability, pricing, and booking functionality.

**Version**: 2.0

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: API Key

**Header**: `exp-api-key`

**Environment Variable**: `VIATOR_API_KEY`

**Header Format**:
```
exp-api-key: YOUR_VIATOR_API_KEY
```

---

## Base URLs

**Production**: `https://api.viator.com/partner`

**Sandbox**: `https://api.sandbox.viator.com/partner`

---

## API Versioning

**Version Specification**: Required via Accept header

```
Accept: application/json;version=2.0
Accept-Language: en-US
```

---

## Key Endpoints

### 1. Product Search

**Endpoint**: `POST /products/search`

**Purpose**: Search for tours and activities

**Request Body**:
```json
{
  "filtering": {
    "destination": "739",
    "startDate": "2026-03-15",
    "endDate": "2026-03-20",
    "tags": [21972],
    "lowestPrice": 10,
    "highestPrice": 500
  },
  "sorting": {
    "sort": "TRAVELER_RATING",
    "order": "DESCENDING"
  },
  "pagination": {
    "start": 1,
    "count": 20
  },
  "currency": "USD"
}
```

**Response**:
```json
{
  "products": [
    {
      "productCode": "12345P1",
      "title": "Edinburgh Castle Tour",
      "description": "Explore the historic Edinburgh Castle...",
      "images": [...],
      "reviews": {
        "totalReviews": 500,
        "combinedAverageRating": 4.8
      },
      "duration": {
        "fixedDurationInMinutes": 120
      },
      "pricing": {
        "summary": {
          "fromPrice": 45.00
        },
        "currency": "USD"
      },
      "destinations": [...],
      "tags": [...]
    }
  ],
  "totalCount": 150
}
```

### 2. Product Details

**Endpoint**: `GET /products/{product-code}`

**Purpose**: Get full details for a specific product

**Headers**:
```
exp-api-key: YOUR_KEY
Accept: application/json;version=2.0
Accept-Language: en-US
```

**Response**: Comprehensive product object with:
- Full description
- Images
- Itinerary
- Pricing
- Cancellation policy
- Booking questions
- Reviews
- Availability

### 3. Availability Check

**Endpoint**: `POST /availability/check`

**Purpose**: Real-time availability and pricing

**Request**:
```json
{
  "productCode": "12345P1",
  "travelDate": "2026-03-15",
  "startTime": "09:00",
  "currency": "USD",
  "paxMix": [
    {"ageBand": "ADULT", "numberOfTravelers": 2},
    {"ageBand": "CHILD", "numberOfTravelers": 1}
  ]
}
```

**Response**:
```json
{
  "currency": "USD",
  "productCode": "12345P1",
  "travelDate": "2026-03-15",
  "bookableItems": [
    {
      "productOptionCode": "DEFAULT",
      "available": true,
      "lineItems": [...],
      "totalPrice": {
        "price": {
          "recommendedRetailPrice": 135.00,
          "partnerNetPrice": 108.00,
          "bookingFee": 6.48,
          "partnerTotalPrice": 114.48
        }
      }
    }
  ]
}
```

### 4. Booking (If merchant partner)

**Endpoint**: `POST /bookings/book`

**Purpose**: Create a booking

**Note**: Requires merchant partner access level

---

## Partner Types & Access

### Access Levels

1. **Basic Affiliate** - Limited product content
2. **Full Affiliate** - All content, no booking
3. **Full + Booking Affiliate** - Content + cart booking
4. **Merchant** - Full access including bookings

**This Project**: Likely using affiliate access for activity search

---

## Usage in Project

### File Locations

**API Routes**:
- `app/api/admin/test/activities/route.ts` - Activity search

**Admin Interface**:
- `app/admin/apis/activities/page.tsx` - Testing UI

### Example Implementation

From `app/api/admin/test/activities/route.ts`:

```typescript
export async function POST(request: Request) {
  const body = await request.json();
  const { destination, startDate, endDate } = body;
  
  try {
    const response = await fetch(
      'https://api.viator.com/partner/products/search',
      {
        method: 'POST',
        headers: {
          'exp-api-key': process.env.VIATOR_API_KEY!,
          'Accept': 'application/json;version=2.0',
          'Accept-Language': 'en-US',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filtering: {
            destination,
            startDate,
            endDate
          },
          sorting: {
            sort: 'TRAVELER_RATING',
            order: 'DESCENDING'
          },
          pagination: {
            start: 1,
            count: 20
          },
          currency: 'USD'
        })
      }
    );
    
    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Viator API error:', error);
    return Response.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}
```

---

## Data Structures

### Product Summary

Key fields in search results:
- `productCode`: Unique identifier
- `title`: Product name
- `description`: Short description
- `images`: Array of image objects with variants
- `duration`: Time duration
- `pricing`: Price information
- `confirmationType`: INSTANT or MANUAL
- `destinations`: Destination references
- `tags`: Category tags
- `flags`: FREE_CANCELLATION, LIKELY_TO_SELL_OUT, etc.

### Pricing

- `recommendedRetailPrice`: Suggested selling price
- `partnerNetPrice`: Cost to partner
- `bookingFee`: Viator booking fee
- `partnerTotalPrice`: Total partner pays

---

## Cancellation Policies

### Types

1. **STANDARD**: Full refund if cancelled 24+ hours before
2. **CUSTOM**: Variable refund based on timing
3. **ALL_SALES_FINAL**: No refunds

### Policy Structure

```json
{
  "type": "STANDARD",
  "description": "For a full refund, cancel at least 24 hours before...",
  "cancelIfBadWeather": false,
  "cancelIfInsufficientTravelers": false,
  "refundEligibility": [
    {
      "dayRangeMin": 1,
      "percentageRefundable": 100
    },
    {
      "dayRangeMin": 0,
      "dayRangeMax": 1,
      "percentageRefundable": 0
    }
  ]
}
```

---

## Localization

**Supported Languages** (Affiliates):
- English (en, en-US, en-AU, en-CA, en-GB, etc.)
- Spanish (es, es-AR, es-CL, es-CO, es-MX, es-PE, es-VE)
- French (fr, fr-BE, fr-CA, fr-CH)
- German (de, de-DE)
- Italian (it, it-CH)
- Portuguese (pt, pt-BR)
- Japanese (ja)
- And more...

**Set via Header**:
```
Accept-Language: en-US
```

---

## Rate Limiting

**Policy**: Per-endpoint, per-partner limits

**Recommendation**: Poll no more than every 15-30 minutes for updates

**Headers** (on 429 response):
```
RateLimit-Limit: 16
RateLimit-Remaining: 0
RateLimit-Reset: 10
Retry-After: 10
```

---

## Error Handling

### Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Error Response

```json
{
  "code": "INVALID_HEADER_VALUE",
  "message": "Accept header is missing or has invalid version",
  "timestamp": "2026-01-27T12:00:00.000Z",
  "trackingId": "ABC123"
}
```

---

## Best Practices

### 1. Use Appropriate Endpoints

- Product search for browsing
- Availability check for real-time pricing
- Don't use product details for bulk ingestion

### 2. Cache Product Data

```typescript
// Cache product details
const productCache = new Map();

async function getProduct(code: string) {
  if (!productCache.has(code)) {
    const product = await fetchProduct(code);
    productCache.set(code, product);
  }
  return productCache.get(code);
}
```

### 3. Handle Pagination

```typescript
async function getAllProducts(destination: string) {
  const allProducts = [];
  let start = 1;
  const count = 20;
  let hasMore = true;
  
  while (hasMore) {
    const response = await searchProducts({
      filtering: { destination },
      pagination: { start, count }
    });
    
    allProducts.push(...response.products);
    hasMore = allProducts.length < response.totalCount;
    start += count;
  }
  
  return allProducts;
}
```

---

## Testing

### Sandbox Environment

Use `api.sandbox.viator.com` for testing

**Test Data**:
- Use test product codes from documentation
- Sandbox has sample products
- Bookings won't charge in sandbox

### Postman Collections

Viator provides Postman collections:
- [Viator Affiliate API Collection](https://docs.viator.com/partner-api/technical/#section/Testing/Postman-collections-for-testing)

---

## Common Use Cases

### Search Activities in City

```typescript
const activities = await searchViatorProducts({
  filtering: {
    destination: '739', // Edinburgh
    tags: [21972], // Tours tag
    startDate: '2026-05-01',
    endDate: '2026-05-07'
  },
  currency: 'USD'
});
```

### Check Availability

```typescript
const availability = await checkAvailability({
  productCode: '12345P1',
  travelDate: '2026-05-03',
  paxMix: [{ ageBand: 'ADULT', numberOfTravelers: 2 }],
  currency: 'USD'
});
```

---

## Official Resources

### Documentation
- [Technical Documentation](https://docs.viator.com/partner-api/technical/)
- [Partner Resources](https://partnerresources.viator.com/)
- [Implementation Guides](https://partnerresources.viator.com/travel-commerce/implementation/)

### Tools
- [Postman Collection](https://docs.viator.com/partner-api/technical/#section/Testing)
- [Partner Portal](https://viator.com/partners)

### Support
- Email: affiliateapi@tripadvisor.com
- [Partner Help Center](https://partnerhelp.viator.com/)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
