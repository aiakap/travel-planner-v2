# Yelp Fusion API Specification

## Overview

The Yelp Fusion API (now called Yelp Places API) provides access to business data including restaurants, ratings, reviews, and location information.

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: Bearer Token (API Key)

**Environment Variables**:
- `YELP_API_KEY` - API key for authentication
- `YELP_CLIENT_ID` - Client identifier

**Header Format**:
```
Authorization: Bearer YOUR_YELP_API_KEY
```

---

## Base URL

```
https://api.yelp.com/v3
```

---

## Key Endpoints

### 1. Business Search

**Endpoint**: `GET /businesses/search`

**Purpose**: Search for businesses by keyword, category, or location

**Returns**: Up to 240 businesses based on search criteria

**Parameters**:
- `term`: Search term (e.g., "pizza", "restaurants")
- `location`: Address or neighborhood (e.g., "San Francisco, CA")
- `latitude`, `longitude`: Coordinates (alternative to location)
- `radius`: Search radius in meters (max: 40000)
- `categories`: Comma-separated category filters
- `locale`: Language/country code (e.g., "en_US")
- `limit`: Number of results (max: 50 per request)
- `offset`: Pagination offset
- `sort_by`: best_match, rating, review_count, distance
- `price`: Comma-separated price levels (1,2,3,4)
- `open_now`: Filter for currently open businesses
- `open_at`: Filter for businesses open at timestamp
- `attributes`: hot_and_new, deals, etc.

**Request Example**:
```
GET https://api.yelp.com/v3/businesses/search?term=restaurants&location=San+Francisco,CA&categories=italian&limit=20&sort_by=rating
```

**Response Format**:
```json
{
  "businesses": [
    {
      "id": "gary-danko-san-francisco",
      "alias": "gary-danko-san-francisco",
      "name": "Gary Danko",
      "image_url": "https://s3-media.yelp.com/...",
      "is_closed": false,
      "url": "https://www.yelp.com/biz/gary-danko-san-francisco",
      "review_count": 5296,
      "categories": [
        {
          "alias": "newamerican",
          "title": "American (New)"
        }
      ],
      "rating": 4.5,
      "coordinates": {
        "latitude": 37.80587,
        "longitude": -122.42058
      },
      "transactions": ["delivery", "pickup"],
      "price": "$$$$",
      "location": {
        "address1": "800 N Point St",
        "address2": "",
        "address3": "",
        "city": "San Francisco",
        "zip_code": "94109",
        "country": "US",
        "state": "CA",
        "display_address": [
          "800 N Point St",
          "San Francisco, CA 94109"
        ]
      },
      "phone": "+14157492060",
      "display_phone": "(415) 749-2060",
      "distance": 1234.56
    }
  ],
  "total": 8228,
  "region": {
    "center": {
      "longitude": -122.4194,
      "latitude": 37.7749
    }
  }
}
```

**Used In**: `app/api/admin/test/restaurants/route.ts`

### 2. Business Details

**Endpoint**: `GET /businesses/{id}`

**Purpose**: Get detailed information for a specific business

**Parameters**:
- `locale`: Language/country code

**Response**: Extended business object with additional fields:
- `hours` - Operating hours
- `photos` - Array of photo URLs
- `special_hours` - Holiday hours
- `messaging` - Contact options

### 3. Phone Search

**Endpoint**: `GET /businesses/search/phone`

**Purpose**: Search for business by phone number

**Parameters**:
- `phone`: Phone number (E.164 format recommended)

### 4. Business Match

**Endpoint**: `POST /businesses/matches`

**Purpose**: Match external business data to Yelp businesses

---

## Usage in Project

### File Locations

**API Routes**:
- `app/api/admin/test/restaurants/route.ts` - Restaurant search

**Admin Interface**:
- `app/admin/apis/restaurants/page.tsx` - Testing interface

### Example Implementation

From `app/api/admin/test/restaurants/route.ts`:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get('location') || 'San Francisco, CA';
  const term = searchParams.get('term') || 'restaurants';
  
  try {
    const response = await fetch(
      `https://api.yelp.com/v3/businesses/search?` +
      `location=${encodeURIComponent(location)}&` +
      `term=${encodeURIComponent(term)}&` +
      `limit=20&sort_by=rating`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.YELP_API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Yelp API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    return Response.json({
      restaurants: data.businesses.map((biz: any) => ({
        id: biz.id,
        name: biz.name,
        rating: biz.rating,
        reviewCount: biz.review_count,
        price: biz.price,
        categories: biz.categories.map((c: any) => c.title),
        address: biz.location.display_address.join(', '),
        phone: biz.display_phone,
        imageUrl: biz.image_url,
        yelpUrl: biz.url
      })),
      total: data.total
    });
  } catch (error) {
    console.error('Yelp API error:', error);
    return Response.json(
      { error: 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}
```

---

## Categories

**Common Restaurant Categories**:
- `italian` - Italian
- `mexican` - Mexican
- `chinese` - Chinese
- `japanese` - Japanese
- `indian` - Indian
- `thai` - Thai
- `pizza` - Pizza
- `seafood` - Seafood
- `steak` - Steakhouses
- `vegetarian` - Vegetarian
- `vegan` - Vegan
- `breakfast_brunch` - Breakfast & Brunch
- `cafes` - Cafes
- `bars` - Bars

**Full List**: [Yelp Categories](https://www.yelp.com/developers/documentation/v3/all_category_list)

---

## Price Levels

| Symbol | Description |
|--------|-------------|
| $ | Under $10 |
| $$ | $11-$30 |
| $$$ | $31-$60 |
| $$$$ | Above $61 |

---

## Sorting Options

- `best_match` - Best match (default, Yelp's algorithm)
- `rating` - Highest rated
- `review_count` - Most reviewed
- `distance` - Nearest first

---

## Pagination

**Maximum Results**: 240 total (Yelp limitation)

**Per Request**: Max 50 businesses

**Implementation**:
```typescript
// Page 1
GET /businesses/search?location=SF&limit=50&offset=0

// Page 2
GET /businesses/search?location=SF&limit=50&offset=50

// Page 3
GET /businesses/search?location=SF&limit=50&offset=100
```

---

## Error Handling

### Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid API key |
| 403 | Forbidden - Exceeded quota |
| 404 | Not Found - Business doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "description": "Please specify a location or a latitude and longitude",
    "field": "location",
    "instance": "123"
  }
}
```

---

## Rate Limits

**Limits**: Vary by pricing plan

**Monitoring**: Check response headers and dashboard

**Best Practices**:
- Cache search results
- Implement request throttling
- Batch similar requests

---

## Best Practices

### 1. Location Specificity

Use coordinates for precision:
```typescript
// Better - precise coordinates
?latitude=37.7749&longitude=-122.4194

// Good - specific address
?location=Union+Square,+San+Francisco,+CA

// Avoid - too broad
?location=California
```

### 2. Combine Filters

```typescript
const params = new URLSearchParams({
  term: 'dinner',
  location: 'San Francisco, CA',
  categories: 'italian,seafood',
  price: '2,3',
  open_now: 'true',
  sort_by: 'rating',
  limit: '20'
});
```

### 3. Handle "No Reviews" Cases

API doesn't return businesses without reviews:
```typescript
if (data.businesses.length === 0) {
  // No results or all businesses filtered out
  return getAlternativeRecommendations();
}
```

---

## Testing

### Test Queries

```bash
# Search restaurants
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://api.yelp.com/v3/businesses/search?location=San%20Francisco&term=pizza"

# Get business details
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://api.yelp.com/v3/businesses/gary-danko-san-francisco"
```

### Admin Testing

- `/api/admin/test/restaurants` - Test endpoint
- `/admin/apis/restaurants` - Admin interface

---

## Limitations

1. **No Businesses Without Reviews**: API excludes businesses with zero reviews
2. **240 Result Limit**: Cannot access beyond 240 results
3. **No Real-time Reservations**: Yelp doesn't provide booking API
4. **Rate Limits**: Dependent on pricing tier
5. **Geographic Coverage**: Best coverage in US, Canada, some international

---

## Official Resources

### Documentation
- [Business Search API](https://docs.developer.yelp.com/reference/v3_business_search)
- [Getting Started](https://docs.developer.yelp.com/docs/getting-started)
- [Fusion Intro](https://docs.developer.yelp.com/docs/fusion-intro)

### Tools
- [API Dashboard](https://www.yelp.com/developers/v3/manage_app)
- [GitHub Examples](https://github.com/Yelp/yelp-fusion)

### Support
- [Developer Support](https://www.yelp.com/developers/support)
- [Pricing Plans](https://business.yelp.com/data/products/fusion/)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [Google Maps API](./google-maps.md) - Alternative place search
