# Amadeus Travel API Specification

## Overview

Amadeus Self-Service APIs provide access to flight search, hotel search, airport/location data, and transfer services. The APIs are RESTful, JSON-based, and designed for independent developers and startups.

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: OAuth2 (Client Credentials Flow)

**Environment Variables**:
- `AMADEUS_CLIENT_ID`
- `AMADEUS_CLIENT_SECRET`

**Base URLs**:
- **Production**: `https://api.amadeus.com`
- **Test**: `https://test.api.amadeus.com`

### Obtaining Access Token

**Endpoint**: `POST /v1/security/oauth2/token`

**Request**:
```
POST /v1/security/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET
```

**Response**:
```json
{
  "type": "amadeusOAuth2Token",
  "username": "your_email@example.com",
  "application_name": "your_app_name",
  "client_id": "YOUR_CLIENT_ID",
  "token_type": "Bearer",
  "access_token": "CpjU0sEenniHCgPDrndzOSWFk5mN",
  "expires_in": 1799,
  "state": "approved"
}
```

**Token Lifetime**: 30 minutes (1799 seconds)

**Usage**: Include in Authorization header:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## SDK Integration

This project uses the official `amadeus` npm package (v11.0.0).

### Client Initialization

From `lib/flights/amadeus-client.ts`:

```typescript
import Amadeus from 'amadeus';

const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID!,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET!,
  hostname: 'production' // or 'test'
});

export default amadeus;
```

The SDK handles OAuth token management automatically.

---

## Key Endpoints

### 1. Flight Offers Search

**Endpoint**: `GET /v2/shopping/flight-offers`

**Purpose**: Search for flight offers between two airports

**Parameters**:
- `originLocationCode` (required): IATA code (e.g., "SFO")
- `destinationLocationCode` (required): IATA code (e.g., "LAX")
- `departureDate` (required): YYYY-MM-DD
- `returnDate`: YYYY-MM-DD (for round-trip)
- `adults`: Number of adult passengers (default: 1)
- `children`: Number of children
- `infants`: Number of infants
- `travelClass`: ECONOMY, PREMIUM_ECONOMY, BUSINESS, FIRST
- `currencyCode`: ISO currency code
- `max`: Maximum results (default: 250)

**Request Example**:
```
GET /v2/shopping/flight-offers?originLocationCode=SFO&destinationLocationCode=LAX&departureDate=2026-03-15&adults=1&max=5
```

**Response Format**:
```json
{
  "meta": {
    "count": 5,
    "links": {
      "self": "https://api.amadeus.com/v2/shopping/flight-offers?..."
    }
  },
  "data": [
    {
      "type": "flight-offer",
      "id": "1",
      "source": "GDS",
      "instantTicketingRequired": false,
      "nonHomogeneous": false,
      "oneWay": false,
      "lastTicketingDate": "2026-03-14",
      "numberOfBookableSeats": 9,
      "itineraries": [
        {
          "duration": "PT1H25M",
          "segments": [
            {
              "departure": {
                "iataCode": "SFO",
                "terminal": "2",
                "at": "2026-03-15T08:00:00"
              },
              "arrival": {
                "iataCode": "LAX",
                "terminal": "7",
                "at": "2026-03-15T09:25:00"
              },
              "carrierCode": "UA",
              "number": "1234",
              "aircraft": {
                "code": "738"
              },
              "operating": {
                "carrierCode": "UA"
              },
              "duration": "PT1H25M",
              "numberOfStops": 0
            }
          ]
        }
      ],
      "price": {
        "currency": "USD",
        "total": "150.00",
        "base": "120.00",
        "fees": [
          {
            "amount": "30.00",
            "type": "TICKETING"
          }
        ],
        "grandTotal": "150.00"
      },
      "pricingOptions": {
        "fareType": ["PUBLISHED"],
        "includedCheckedBagsOnly": true
      },
      "validatingAirlineCodes": ["UA"],
      "travelerPricings": [
        {
          "travelerId": "1",
          "fareOption": "STANDARD",
          "travelerType": "ADULT",
          "price": {
            "currency": "USD",
            "total": "150.00",
            "base": "120.00"
          },
          "fareDetailsBySegment": [
            {
              "segmentId": "1",
              "cabin": "ECONOMY",
              "fareBasis": "KH2B0NB9",
              "class": "K",
              "includedCheckedBags": {
                "quantity": 0
              }
            }
          ]
        }
      ]
    }
  ],
  "dictionaries": {
    "locations": {
      "SFO": {
        "cityCode": "SFO",
        "countryCode": "US"
      },
      "LAX": {
        "cityCode": "LAX",
        "countryCode": "US"
      }
    },
    "aircraft": {
      "738": "BOEING 737-800"
    },
    "currencies": {
      "USD": "US DOLLAR"
    },
    "carriers": {
      "UA": "UNITED AIRLINES"
    }
  }
}
```

**Used In**: `app/api/flights/search/route.ts`

### 2. Hotel Search

**Endpoint**: `GET /v3/shopping/hotel-offers`

**Purpose**: Search for hotel offers in a city

**Parameters**:
- `cityCode`: IATA city code (e.g., "PAR")
- `checkInDate`: YYYY-MM-DD
- `checkOutDate`: YYYY-MM-DD
- `adults`: Number of adults
- `roomQuantity`: Number of rooms
- `currency`: ISO currency code
- `priceRange`: Min-max price range
- `ratings`: Hotel star ratings (1-5)

**Used In**: `lib/flights/amadeus-client.ts`

### 3. Airport & City Search

**Endpoint**: `GET /v1/reference-data/locations`

**Purpose**: Search for airports, cities, or points of interest

**Parameters**:
- `keyword` (required): Search term
- `subType` (required): AIRPORT, CITY, or comma-separated
- `countryCode`: ISO country code filter
- `page[limit]`: Results per page (max 10)
- `page[offset]`: Pagination offset

**Request Example**:
```
GET /v1/reference-data/locations?keyword=San&subType=AIRPORT,CITY&page[limit]=5
```

**Response Format**:
```json
{
  "meta": {
    "count": 5,
    "links": {
      "self": "https://api.amadeus.com/v1/reference-data/locations?..."
    }
  },
  "data": [
    {
      "type": "location",
      "subType": "AIRPORT",
      "name": "SAN FRANCISCO INTL",
      "detailedName": "SAN FRANCISCO/CA/US:SAN FRANCISCO INTL",
      "id": "CSFO",
      "iataCode": "SFO",
      "address": {
        "cityName": "SAN FRANCISCO",
        "cityCode": "SFO",
        "countryName": "UNITED STATES OF AMERICA",
        "countryCode": "US",
        "stateCode": "CA",
        "regionCode": "NAMER"
      },
      "geoCode": {
        "latitude": 37.61900,
        "longitude": -122.37484
      }
    }
  ]
}
```

**Used In**: `lib/amadeus/locations.ts`

### 4. Transfer Search

**Endpoint**: `GET /v1/shopping/transfer-offers`

**Purpose**: Search for transfer (car/shuttle) services

**Parameters**:
- `startLocationCode`: IATA airport code
- `endLocationCode`: IATA airport code or coordinates
- `startDateTime`: ISO 8601 datetime
- `passengers`: Number of passengers
- `transferType`: PRIVATE, SHARED, TAXI

**Used In**: `lib/flights/amadeus-client.ts`

---

## SDK Methods

### Flight Search

```typescript
import amadeus from '@/lib/flights/amadeus-client';

const response = await amadeus.shopping.flightOffersSearch.get({
  originLocationCode: 'SFO',
  destinationLocationCode: 'LAX',
  departureDate: '2026-03-15',
  adults: '1',
  max: '10'
});

const offers = response.data;
```

### Location Search

```typescript
const response = await amadeus.referenceData.locations.get({
  keyword: 'San Francisco',
  subType: 'AIRPORT,CITY'
});

const locations = response.data;
```

### Hotel Search

```typescript
const response = await amadeus.shopping.hotelOffers.get({
  cityCode: 'PAR',
  checkInDate: '2026-05-01',
  checkOutDate: '2026-05-05',
  adults: '2',
  roomQuantity: '1'
});

const hotels = response.data;
```

---

## Error Handling

### HTTP Status Codes

| Status | Type | Description |
|--------|------|-------------|
| 200 | Success | Request succeeded |
| 400 | Client Error | Invalid request parameters |
| 401 | Unauthorized | Invalid or expired access token |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Amadeus server error |

### Error Response Format

```json
{
  "errors": [
    {
      "status": 400,
      "code": 477,
      "title": "INVALID FORMAT",
      "detail": "Invalid date format - Date should be in the past or up to 365 days in the future",
      "source": {
        "parameter": "departureDate",
        "example": "2026-03-15"
      }
    }
  ]
}
```

### SDK Error Handling

```typescript
try {
  const response = await amadeus.shopping.flightOffersSearch.get(params);
  return response.data;
} catch (error) {
  if (error.response) {
    console.error('Status:', error.response.statusCode);
    console.error('Errors:', error.response.result.errors);
  }
  throw error;
}
```

---

## Rate Limits

**Free Tier**:
- 2,000 calls per month
- Pay-as-you-go after limit

**Rate Limit Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

**Best Practices**:
- Cache frequently requested data (airports, cities)
- Implement request throttling
- Monitor usage via Amadeus dashboard

---

## Data Dictionaries

Amadeus responses include dictionaries for:

**Locations**: Airport and city codes
```json
"locations": {
  "SFO": {"cityCode": "SFO", "countryCode": "US"}
}
```

**Aircraft**: Aircraft type codes
```json
"aircraft": {
  "738": "BOEING 737-800"
}
```

**Carriers**: Airline codes
```json
"carriers": {
  "UA": "UNITED AIRLINES"
}
```

**Currencies**: Currency information
```json
"currencies": {
  "USD": "US DOLLAR"
}
```

---

## Common Use Cases

### 1. One-Way Flight Search

```typescript
const flights = await amadeus.shopping.flightOffersSearch.get({
  originLocationCode: 'NYC',
  destinationLocationCode: 'LAX',
  departureDate: '2026-06-01',
  adults: '2',
  max: '50'
});
```

### 2. Round-Trip Flight Search

```typescript
const flights = await amadeus.shopping.flightOffersSearch.get({
  originLocationCode: 'NYC',
  destinationLocationCode: 'LAX',
  departureDate: '2026-06-01',
  returnDate: '2026-06-08',
  adults: '2',
  max: '50'
});
```

### 3. Multi-City Search

Use multiple one-way searches and combine results.

### 4. Airport Lookup

```typescript
const airports = await amadeus.referenceData.locations.get({
  keyword: 'San Francisco',
  subType: 'AIRPORT'
});
```

---

## Usage in Project

### File Locations

**Client Setup**:
- `lib/flights/amadeus-client.ts` - Amadeus client initialization

**Location Services**:
- `lib/amadeus/locations.ts` - Airport and city search

**API Routes**:
- `app/api/flights/search/route.ts` - Flight search endpoint
- `app/api/amadeus-test/route.ts` - Test endpoint for flights/hotels

**Actions**:
- `lib/actions/add-flights-to-trip.ts` - Add flights to trip itinerary

### Example: Flight Search Implementation

From `app/api/flights/search/route.ts`:

```typescript
import amadeus from '@/lib/flights/amadeus-client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  try {
    const response = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: searchParams.get('origin'),
      destinationLocationCode: searchParams.get('destination'),
      departureDate: searchParams.get('departureDate'),
      adults: searchParams.get('adults') || '1',
      max: searchParams.get('max') || '10'
    });
    
    return Response.json(response.data);
  } catch (error) {
    console.error('Amadeus API Error:', error);
    return Response.json(
      { error: 'Failed to search flights' },
      { status: 500 }
    );
  }
}
```

### Example: Airport Search

From `lib/amadeus/locations.ts`:

```typescript
export async function searchAirports(keyword: string) {
  try {
    const response = await amadeus.referenceData.locations.get({
      keyword,
      subType: 'AIRPORT',
      'page[limit]': '10'
    });
    
    return response.data.map((airport: any) => ({
      code: airport.iataCode,
      name: airport.name,
      city: airport.address.cityName,
      country: airport.address.countryName,
      coordinates: {
        latitude: airport.geoCode.latitude,
        longitude: airport.geoCode.longitude
      }
    }));
  } catch (error) {
    console.error('Airport search error:', error);
    return [];
  }
}
```

---

## Response Data Structures

### Flight Offer Object

Key fields in flight offer response:

```typescript
interface FlightOffer {
  type: 'flight-offer';
  id: string;
  source: 'GDS';
  lastTicketingDate: string;
  numberOfBookableSeats: number;
  itineraries: Itinerary[];
  price: Price;
  pricingOptions: PricingOptions;
  validatingAirlineCodes: string[];
  travelerPricings: TravelerPricing[];
}

interface Itinerary {
  duration: string; // ISO 8601 duration (e.g., "PT2H30M")
  segments: Segment[];
}

interface Segment {
  departure: {
    iataCode: string;
    terminal?: string;
    at: string; // ISO 8601 datetime
  };
  arrival: {
    iataCode: string;
    terminal?: string;
    at: string;
  };
  carrierCode: string;
  number: string;
  aircraft: {
    code: string;
  };
  duration: string;
  numberOfStops: number;
}

interface Price {
  currency: string;
  total: string;
  base: string;
  fees: Fee[];
  grandTotal: string;
}
```

### Location Object

```typescript
interface Location {
  type: 'location';
  subType: 'AIRPORT' | 'CITY';
  name: string;
  detailedName: string;
  iataCode: string;
  address: {
    cityName: string;
    cityCode: string;
    countryName: string;
    countryCode: string;
    stateCode?: string;
    regionCode: string;
  };
  geoCode: {
    latitude: number;
    longitude: number;
  };
}
```

---

## Best Practices

### 1. Caching
Cache location data (airports, cities) as it changes infrequently:
```typescript
const cachedAirports = new Map();

async function getAirport(code: string) {
  if (cachedAirports.has(code)) {
    return cachedAirports.get(code);
  }
  const airport = await fetchAirport(code);
  cachedAirports.set(code, airport);
  return airport;
}
```

### 2. Error Recovery
Implement fallback strategies:
```typescript
try {
  return await amadeus.shopping.flightOffersSearch.get(params);
} catch (error) {
  // Try alternative search with relaxed parameters
  return await searchWithFlexibleDates(params);
}
```

### 3. Request Optimization
- Use appropriate `max` parameter (don't request more than needed)
- Filter results server-side before sending to client
- Implement pagination for large result sets

### 4. Token Management
- SDK handles token refresh automatically
- Monitor for authentication errors
- Keep credentials secure

---

## Pricing

**Model**: Pay-as-you-go

**Free Tier**: 2,000 transactions/month

**Rates** (approximate):
- Flight Offers Search: ~$0.25 per 1000 requests
- Hotel Offers: ~$0.25 per 1000 requests
- Location Search: ~$0.05 per 1000 requests

**Monitor Usage**: [Amadeus Dashboard](https://developers.amadeus.com/my-apps)

---

## Testing

### Test Environment

Use `hostname: 'test'` in SDK initialization for testing:

```typescript
const amadeusTest = new Amadeus({
  clientId: process.env.AMADEUS_CLIENT_ID,
  clientSecret: process.env.AMADEUS_CLIENT_SECRET,
  hostname: 'test'
});
```

**Test Data**:
- Use common IATA codes (SFO, LAX, JFK, etc.)
- Test dates should be in the future
- Test environment has sample data, not real-time

### Admin Test Endpoint

- `/api/amadeus-test` - Test flights and hotels search
- `/admin/apis` - Admin panel for API testing

---

## Common IATA Codes

**Major US Airports**:
- SFO - San Francisco International
- LAX - Los Angeles International
- JFK - New York JFK
- ORD - Chicago O'Hare
- MIA - Miami International
- DFW - Dallas/Fort Worth

**Major International**:
- LHR - London Heathrow
- CDG - Paris Charles de Gaulle
- FRA - Frankfurt
- NRT - Tokyo Narita
- SYD - Sydney
- DXB - Dubai

---

## Limitations

### Flight Search
- Maximum 250 results per request
- Search up to 365 days in advance
- No real-time seat availability (use pricing API for confirmation)

### Location Search
- Maximum 10 results per page
- Keyword must be at least 1 character
- Results may include approximate matches

### Hotel Search
- Limited to specific cities with IATA codes
- Prices may not include all taxes/fees
- Availability not guaranteed until booking

---

## Advanced Features

### 1. Flight Price Analysis
Use AI-powered price predictions:
```
GET /v1/analytics/itinerary-price-metrics
```

### 2. Branded Fares
Get fare family information for upselling.

### 3. Seatmaps
Display seat layouts for seat selection:
```
POST /v1/shopping/seatmaps
```

### 4. Flight Status
Real-time flight information:
```
GET /v2/schedule/flights
```

---

## Troubleshooting

### Common Issues

**1. Authentication Failures**
- Check client ID and secret
- Ensure test/production hostname matches credentials
- Verify token hasn't expired (30 min lifetime)

**2. No Results Found**
- Verify IATA codes are valid
- Check date is in valid range (future, not > 365 days)
- Try broader search parameters

**3. Invalid Parameters**
- Date format must be YYYY-MM-DD
- IATA codes must be 3 characters
- Numeric parameters should be strings

**4. Rate Limit Exceeded**
- Implement exponential backoff
- Cache results
- Upgrade plan if needed

---

## Migration & Updates

### API Versioning
Amadeus uses versioned endpoints (v1, v2, v3). Always use the latest stable version for new features.

### Deprecation Policy
- 12 months notice for breaking changes
- Backward-compatible changes don't trigger version bump
- Monitor [API Status](https://developers.amadeus.com/status) for updates

---

## Official Resources

### Documentation
- [Developer Portal](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/)
- [API Catalog](https://developers.amadeus.com/self-service)
- [Flight APIs Tutorial](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/flights/)
- [Hotel APIs Tutorial](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/hotels/)

### Tools & SDKs
- [Node.js SDK](https://github.com/amadeus4dev/amadeus-node)
- [Postman Collection](https://www.postman.com/amadeus4dev)
- [Code Examples](https://github.com/amadeus4dev/)
- [OpenAPI Specification](https://github.com/amadeus4dev/amadeus-open-api-specification)

### Support
- [Support Portal](https://developers.amadeus.com/support)
- [API Status](https://developers.amadeus.com/status)
- [Community Forum](https://developers.amadeus.com/support/forum)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
- [Google Maps API](./google-maps.md) - Location services alternative
