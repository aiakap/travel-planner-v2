# Google Maps Platform APIs Specification

## Overview

Google Maps Platform provides location-based services including maps display, geocoding, places search, autocomplete, and timezone information. This project uses multiple Google Maps APIs for comprehensive location functionality.

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: API Key

**Environment Variables**:
- `GOOGLE_MAPS_API_KEY` - Server-side API key
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Client-side API key (for Maps JavaScript API)

**Note**: For security, use separate keys for server-side and client-side usage, with appropriate restrictions set in Google Cloud Console.

---

## APIs Used

### 1. Places API (New) - v1
### 2. Geocoding API
### 3. Timezone API
### 4. Maps JavaScript API

---

## Places API (New)

**Base URL**: `https://places.googleapis.com/v1`

**API Version**: v1 (Latest - New version)

**Note**: The legacy Places API is deprecated. This project uses Places API (New).

### Key Endpoints

#### 1. Place Autocomplete

**Endpoint**: `POST /v1/places:autocomplete`

**Purpose**: Get place and query predictions based on user input

**Request Format**:
```json
{
  "input": "pizza near",
  "locationBias": {
    "circle": {
      "center": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "radius": 5000.0
    }
  },
  "includedPrimaryTypes": ["restaurant"],
  "languageCode": "en"
}
```

**Response Format**:
```json
{
  "suggestions": [
    {
      "placePrediction": {
        "place": "places/ChIJ...",
        "placeId": "ChIJ...",
        "text": {
          "text": "Tony's Pizza Napoletana",
          "matches": [{"startOffset": 0, "endOffset": 5}]
        },
        "structuredFormat": {
          "mainText": {"text": "Tony's Pizza Napoletana"},
          "secondaryText": {"text": "San Francisco, CA"}
        },
        "types": ["restaurant", "food", "point_of_interest"]
      }
    }
  ]
}
```

**Used In**: `app/api/places/autocomplete/route.ts`

#### 2. Nearby Search

**Endpoint**: `POST /v1/places:searchNearby`

**Purpose**: Find places near a location by type

**Request Format**:
```json
{
  "locationRestriction": {
    "circle": {
      "center": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "radius": 1000.0
    }
  },
  "includedTypes": ["restaurant"],
  "maxResultCount": 20,
  "rankPreference": "DISTANCE"
}
```

**Used In**: `app/api/places/nearby/route.ts`

#### 3. Text Search

**Endpoint**: `POST /v1/places:searchText`

**Purpose**: Search for places using text query

**Request Format**:
```json
{
  "textQuery": "best coffee in San Francisco",
  "locationBias": {
    "circle": {
      "center": {
        "latitude": 37.7749,
        "longitude": -122.4194
      },
      "radius": 5000.0
    }
  }
}
```

**Used In**: Airport and place searches

#### 4. Place Details

**Endpoint**: `GET /v1/places/{PLACE_ID}`

**Purpose**: Get detailed information about a specific place

**Query Parameters**:
- `fields`: Comma-separated field mask (e.g., "displayName,formattedAddress,location")
- `languageCode`: Language for response

**Response Fields Available**:
- `displayName`
- `formattedAddress`
- `location` (lat/lng)
- `types`
- `rating`
- `userRatingCount`
- `priceLevel`
- `businessStatus`
- `openingHours`
- `phoneNumber`
- `websiteUri`

**Used In**: `app/api/places/details/route.ts`

---

## Geocoding API

**Base URL**: `https://maps.googleapis.com/maps/api`

**Endpoint**: `GET /geocode/json`

**Purpose**: Convert addresses to coordinates and vice versa

### Forward Geocoding (Address → Coordinates)

**Request**:
```
GET /geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=YOUR_API_KEY
```

**Response**:
```json
{
  "results": [{
    "formatted_address": "1600 Amphitheatre Parkway, Mountain View, CA 94043, USA",
    "geometry": {
      "location": {
        "lat": 37.4224764,
        "lng": -122.0842499
      },
      "location_type": "ROOFTOP"
    },
    "place_id": "ChIJ2eUgeAK6j4ARbn5u_wAGqWA",
    "types": ["street_address"]
  }],
  "status": "OK"
}
```

### Reverse Geocoding (Coordinates → Address)

**Request**:
```
GET /geocode/json?latlng=37.4224764,-122.0842499&key=YOUR_API_KEY
```

**Used In**: `app/api/geocode-timezone/route.ts`, `lib/actions/get-location-coordinates.ts`

---

## Timezone API

**Base URL**: `https://maps.googleapis.com/maps/api`

**Endpoint**: `GET /timezone/json`

**Purpose**: Get timezone information for coordinates

**Request**:
```
GET /timezone/json?location=37.4224764,-122.0842499&timestamp=1331161200&key=YOUR_API_KEY
```

**Response**:
```json
{
  "dstOffset": 0,
  "rawOffset": -28800,
  "status": "OK",
  "timeZoneId": "America/Los_Angeles",
  "timeZoneName": "Pacific Standard Time"
}
```

**Parameters**:
- `location`: lat,lng
- `timestamp`: Unix timestamp
- `key`: API key

**Used In**: `app/api/geocode-timezone/route.ts`

---

## Maps JavaScript API

**Purpose**: Client-side map display and interaction

**Library**: `@react-google-maps/api`

**Load Script**:
```typescript
import { LoadScript } from '@react-google-maps/api';

<LoadScript
  googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
  libraries={['places', 'geometry']}
>
  {/* Map components */}
</LoadScript>
```

**Used In**:
- `app/view/components/trip-map-view.tsx` - Trip map display
- Various map visualization components

---

## Usage in Project

### File Locations

**API Routes**:
- `app/api/places/autocomplete/route.ts` - Place autocomplete
- `app/api/places/details/route.ts` - Place details
- `app/api/places/nearby/route.ts` - Nearby search
- `app/api/geocode-timezone/route.ts` - Geocoding + timezone
- `app/api/airports/search-google/route.ts` - Airport search
- `app/api/airports/nearest/route.ts` - Nearest airports

**Actions**:
- `lib/actions/google-places-nearby.ts` - Places search
- `lib/actions/get-location-coordinates.ts` - Geocoding
- `app/trip/new/actions/google-places-autocomplete.ts` - Autocomplete

**Components**:
- `app/view/components/trip-map-view.tsx` - Map display
- `app/trip/new/components/location-manager-modal.tsx` - Location input with autocomplete

### Example: Place Autocomplete

From `app/api/places/autocomplete/route.ts`:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  
  const response = await fetch(
    `https://places.googleapis.com/v1/places:autocomplete`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ['locality', 'airport'],
        languageCode: 'en',
      }),
    }
  );
  
  return Response.json(await response.json());
}
```

### Example: Geocoding

From `lib/actions/get-location-coordinates.ts`:

```typescript
const response = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
);

const data = await response.json();
if (data.results[0]) {
  const { lat, lng } = data.results[0].geometry.location;
  return { latitude: lat, longitude: lng };
}
```

---

## Field Masks

Places API (New) uses field masks to specify which fields to return, reducing response size and cost.

**Common Fields**:
- `displayName` - Place name
- `formattedAddress` - Full address
- `location` - Lat/lng coordinates
- `types` - Place types
- `rating` - User rating
- `priceLevel` - Price level
- `photos` - Place photos
- `businessStatus` - Open/closed status
- `currentOpeningHours` - Opening hours

**Example Field Mask**:
```
fields=displayName,formattedAddress,location,types,rating
```

---

## Error Handling

### Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| OK | Success | Process results |
| ZERO_RESULTS | No results found | Handle gracefully |
| OVER_QUERY_LIMIT | Quota exceeded | Implement backoff |
| REQUEST_DENIED | Invalid API key | Check configuration |
| INVALID_REQUEST | Bad request parameters | Validate inputs |
| UNKNOWN_ERROR | Server error | Retry with backoff |

### Error Response Format

```json
{
  "error": {
    "code": 400,
    "message": "API key not valid",
    "status": "INVALID_ARGUMENT"
  }
}
```

---

## Rate Limits & Quotas

**Default Quotas** (Free tier):
- Geocoding API: 40,000 requests/month
- Places API: Variable by endpoint
- Timezone API: Shared with Geocoding quota

**Monitoring**:
- Google Cloud Console → APIs & Services → Dashboard
- Set up billing alerts
- Monitor quota usage

**Best Practices**:
- Cache geocoding results
- Batch requests when possible
- Use autocomplete session tokens to reduce costs
- Implement client-side caching

---

## Cost Optimization

### 1. Field Masking
Only request fields you need to reduce costs:
```typescript
// Good - specific fields
fields=displayName,location,types

// Bad - all fields
fields=*
```

### 2. Autocomplete Sessions
Use session tokens to group autocomplete requests:
```typescript
const sessionToken = new google.maps.places.AutocompleteSessionToken();
```

### 3. Caching
Cache geocoding results and place details:
```typescript
// Cache location coordinates to avoid repeated geocoding
const cached = await getCachedCoordinates(address);
if (cached) return cached;
```

### 4. Request Optimization
- Combine geocoding + timezone in single route
- Use appropriate result limits
- Implement request debouncing for autocomplete

---

## API Restrictions

Configure API key restrictions in Google Cloud Console:

**Application Restrictions**:
- HTTP referrers for client-side keys
- IP addresses for server-side keys

**API Restrictions**:
- Limit to only required APIs
- Server key: Places, Geocoding, Timezone
- Client key: Maps JavaScript API, Places API

---

## Migration Notes

### Legacy → New Places API

The project uses Places API (New). Key differences:

**Old (Legacy)**:
- `GET /maps/api/place/autocomplete/json`
- `GET /maps/api/place/nearbysearch/json`

**New**:
- `POST /v1/places:autocomplete`
- `POST /v1/places:searchNearby`

**Benefits of New API**:
- More accurate results
- Better performance
- Field masking for cost control
- Structured response format

---

## Testing

### Admin Test Endpoints

Test Google Maps integration via admin panel:
- `/admin/apis` - API testing dashboard
- Airport search testing
- Place autocomplete testing

### Manual Testing

```bash
# Test geocoding
curl "https://maps.googleapis.com/maps/api/geocode/json?address=San+Francisco&key=YOUR_KEY"

# Test place autocomplete (requires POST)
curl -X POST "https://places.googleapis.com/v1/places:autocomplete" \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: YOUR_KEY" \
  -d '{"input":"pizza"}'
```

---

## Troubleshooting

### Common Issues

**1. API Key Errors**
- Verify key is enabled in Google Cloud Console
- Check API restrictions match your usage
- Ensure billing is enabled

**2. CORS Errors (Client-side)**
- Add your domain to HTTP referrer restrictions
- Use `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for client-side
- Check browser console for specific errors

**3. Quota Exceeded**
- Monitor usage in Google Cloud Console
- Implement caching
- Consider upgrading quota limits

**4. ZERO_RESULTS**
- Verify input formatting
- Check location bias settings
- Ensure place types are correct

---

## Place Types

**Common Types Used in Project**:
- `locality` - Cities
- `airport` - Airports
- `restaurant` - Restaurants
- `lodging` - Hotels
- `tourist_attraction` - Tourist spots
- `point_of_interest` - General POIs

**Full List**: [Place Types Documentation](https://developers.google.com/maps/documentation/places/web-service/place-types)

---

## Response Fields

### Place Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `displayName` | object | Place name with language |
| `formattedAddress` | string | Full formatted address |
| `location` | object | Lat/lng coordinates |
| `types` | array | Place type classifications |
| `rating` | number | Average rating (0-5) |
| `userRatingCount` | number | Number of ratings |
| `priceLevel` | string | PRICE_LEVEL_* enum |
| `businessStatus` | string | OPERATIONAL, CLOSED_* |
| `currentOpeningHours` | object | Current hours |
| `internationalPhoneNumber` | string | Phone number |
| `websiteUri` | string | Website URL |
| `photos` | array | Photo references |

---

## Usage Examples

### Airport Search

From `app/api/airports/search-google/route.ts`:

```typescript
const response = await fetch(
  'https://places.googleapis.com/v1/places:searchText',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY!,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.types',
    },
    body: JSON.stringify({
      textQuery: `${query} airport`,
      includedType: 'airport',
      maxResultCount: 10,
    }),
  }
);
```

### Geocoding + Timezone

From `app/api/geocode-timezone/route.ts`:

```typescript
// First geocode the address
const geocodeResponse = await fetch(
  `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
);
const geocodeData = await geocodeResponse.json();

if (geocodeData.results[0]) {
  const { lat, lng } = geocodeData.results[0].geometry.location;
  
  // Then get timezone
  const timezoneResponse = await fetch(
    `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lng}&timestamp=${Math.floor(Date.now() / 1000)}&key=${apiKey}`
  );
  const timezoneData = await timezoneResponse.json();
  
  return {
    coordinates: { latitude: lat, longitude: lng },
    timezone: timezoneData.timeZoneId,
    address: geocodeData.results[0].formatted_address
  };
}
```

---

## API Limits

### Quotas (May vary by account)

| API | Default Limit | Cost Per Request |
|-----|---------------|------------------|
| Places Autocomplete | 1,000/day (free) | $2.83-$17.00 per 1000 |
| Places Details | 100,000/month | $17.00 per 1000 |
| Nearby Search | Variable | $32.00 per 1000 |
| Text Search | Variable | $32.00 per 1000 |
| Geocoding | 40,000/month (free) | $5.00 per 1000 |
| Timezone | Shared with Geocoding | $5.00 per 1000 |

**Note**: Prices are approximate and subject to change. Check [Google Maps Pricing](https://mapsplatform.google.com/pricing/) for current rates.

---

## Security Best Practices

### 1. API Key Restrictions

**Server-side key** (`GOOGLE_MAPS_API_KEY`):
- Restrict by IP address (your server IPs)
- Enable only: Places API, Geocoding API, Timezone API

**Client-side key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`):
- Restrict by HTTP referrer (your domain)
- Enable only: Maps JavaScript API

### 2. Request Validation
- Validate user input before API calls
- Sanitize location data
- Implement rate limiting on your endpoints

### 3. Monitoring
- Set up billing alerts
- Monitor unusual usage patterns
- Review Cloud Console logs regularly

---

## EEA Compliance Notice

**Effective**: July 8, 2025

Developers with billing addresses in the European Economic Area (EEA) are subject to the [Google Maps Platform EEA Terms of Service](https://cloud.google.com/terms/maps-platform/eea).

Functionality may vary by region. [Learn more](https://developers.google.com/maps/comms/eea/faq).

---

## Official Resources

### Documentation
- [Places API (New) Overview](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Place Autocomplete](https://developers.google.com/maps/documentation/places/web-service/place-autocomplete)
- [Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search)
- [Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview)
- [Timezone API](https://developers.google.com/maps/documentation/timezone/overview)
- [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)

### Tools & Libraries
- [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) - React wrapper
- [@googlemaps/js-api-loader](https://www.npmjs.com/package/@googlemaps/js-api-loader) - Dynamic loading
- [@googlemaps/markerclusterer](https://www.npmjs.com/package/@googlemaps/markerclusterer) - Marker clustering

### Support
- [Google Cloud Console](https://console.cloud.google.com/)
- [Support Center](https://cloud.google.com/support)
- [Issue Tracker](https://issuetracker.google.com/issues?q=componentid:187143)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [Amadeus API](./amadeus.md) - Airport data alternative
