# OpenWeatherMap API Specification

## Overview

OpenWeatherMap provides weather data including current conditions, forecasts, and historical data. This project uses the API to display weather information for trip destinations.

**Last Updated**: January 27, 2026

---

## Authentication

**Method**: API Key (query parameter)

**Environment Variable**: `OPENWEATHER_API_KEY`

**Base URL**: `https://api.openweathermap.org/data/2.5`

**Key in Request**: Append `?appid=YOUR_API_KEY` or `&appid=YOUR_API_KEY`

---

## Endpoints Used

### 1. 5-Day Weather Forecast

**Endpoint**: `GET /forecast`

**Purpose**: Get 5-day forecast with 3-hour intervals

**Parameters**:
- `lat`: Latitude
- `lon`: Longitude
- `appid`: API key (required)
- `units`: metric, imperial, standard (default: standard)
- `cnt`: Number of timestamps to return
- `lang`: Language code (en, es, fr, etc.)

**Request Example**:
```
GET https://api.openweathermap.org/data/2.5/forecast?lat=37.7749&lon=-122.4194&appid=YOUR_API_KEY&units=metric
```

**Response Format**:
```json
{
  "cod": "200",
  "message": 0,
  "cnt": 40,
  "list": [
    {
      "dt": 1234567890,
      "main": {
        "temp": 18.5,
        "feels_like": 17.2,
        "temp_min": 16.8,
        "temp_max": 20.1,
        "pressure": 1013,
        "humidity": 65
      },
      "weather": [
        {
          "id": 800,
          "main": "Clear",
          "description": "clear sky",
          "icon": "01d"
        }
      ],
      "clouds": {
        "all": 0
      },
      "wind": {
        "speed": 3.5,
        "deg": 180,
        "gust": 5.2
      },
      "visibility": 10000,
      "pop": 0,
      "sys": {
        "pod": "d"
      },
      "dt_txt": "2026-03-15 12:00:00"
    }
  ],
  "city": {
    "id": 5391959,
    "name": "San Francisco",
    "coord": {
      "lat": 37.7749,
      "lon": -122.4194
    },
    "country": "US",
    "timezone": -28800,
    "sunrise": 1234567890,
    "sunset": 1234598890
  }
}
```

**Used In**: `app/api/weather/forecast/route.ts`

### 2. Current Weather

**Endpoint**: `GET /weather`

**Purpose**: Get current weather conditions

**Parameters**: Same as forecast

**Response Format**: Similar to forecast but single data point

---

## One Call API 3.0 (Recommended)

**Endpoint**: `https://api.openweathermap.org/data/3.0/onecall`

**Features**:
- Current weather
- Minute forecast (1 hour)
- Hourly forecast (48 hours)
- Daily forecast (8 days)
- Weather alerts
- Historical data (47+ years)

**Free Tier**: 1,000 calls per day

**Parameters**:
- `lat`, `lon`: Coordinates (required)
- `appid`: API key (required)
- `exclude`: Comma-separated list to exclude (current, minutely, hourly, daily, alerts)
- `units`: metric, imperial, standard
- `lang`: Language code

**Response Sections**:
```json
{
  "lat": 37.7749,
  "lon": -122.4194,
  "timezone": "America/Los_Angeles",
  "timezone_offset": -28800,
  "current": { /* Current weather */ },
  "minutely": [ /* 60 entries */ ],
  "hourly": [ /* 48 entries */ ],
  "daily": [ /* 8 entries */ ],
  "alerts": [ /* Weather alerts */ ]
}
```

---

## Weather Condition Codes

Common weather condition IDs:

| ID Range | Condition | Icon |
|----------|-----------|------|
| 200-232 | Thunderstorm | 11d |
| 300-321 | Drizzle | 09d |
| 500-531 | Rain | 10d |
| 600-622 | Snow | 13d |
| 701-781 | Atmosphere (fog, mist, etc.) | 50d |
| 800 | Clear sky | 01d |
| 801-804 | Clouds | 02d-04d |

**Icon URLs**:
```
https://openweathermap.org/img/wn/{icon}@2x.png
```

Example: `https://openweathermap.org/img/wn/01d@2x.png`

---

## Units

### Temperature

| Unit | Format | Example |
|------|--------|---------|
| standard | Kelvin | 293.15 K |
| metric | Celsius | 20°C |
| imperial | Fahrenheit | 68°F |

### Wind Speed

| Unit | Format |
|------|--------|
| standard | meter/sec |
| metric | meter/sec |
| imperial | miles/hour |

---

## Usage in Project

### File Locations

**API Routes**:
- `app/api/weather/forecast/route.ts` - Weather forecast endpoint
- `app/api/admin/test/weather/route.ts` - Admin testing

**Components**:
- `app/view/components/weather-section.tsx` - Weather display

### Example Implementation

From `app/api/weather/forecast/route.ts`:

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  
  if (!lat || !lon) {
    return Response.json(
      { error: 'Latitude and longitude required' },
      { status: 400 }
    );
  }
  
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const units = 'metric';
  
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${units}`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Process and format forecast data
    const forecast = data.list.slice(0, 8).map((item: any) => ({
      datetime: new Date(item.dt * 1000),
      temperature: Math.round(item.main.temp),
      feelsLike: Math.round(item.main.feels_like),
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      windSpeed: item.wind.speed,
      precipitation: item.pop * 100 // Probability of precipitation
    }));
    
    return Response.json({
      city: data.city.name,
      country: data.city.country,
      forecast
    });
  } catch (error) {
    console.error('Weather fetch error:', error);
    return Response.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}
```

---

## Rate Limits

**Free Tier**:
- 60 calls per minute
- 1,000,000 calls per month

**Paid Plans**: Higher limits available

**Headers** (not always present):
```
X-Cache-Key: /data/2.5/forecast?lat=37.77&lon=-122.41
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
```

**Best Practices**:
- Cache weather data (update every 10-30 minutes)
- Don't call on every page load
- Implement client-side caching

---

## Error Handling

### HTTP Status Codes

| Status | Message | Cause |
|--------|---------|-------|
| 200 | OK | Success |
| 401 | Unauthorized | Invalid API key |
| 404 | Not Found | Location not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | OpenWeather issue |

### Error Response

```json
{
  "cod": "401",
  "message": "Invalid API key. Please see https://openweathermap.org/faq#error401 for more info."
}
```

---

## Data Freshness

**Current Weather**: Updated every 10 minutes

**Forecast**: Updated every 3 hours

**Alerts**: Updated as issued by meteorological agencies

---

## Localization

**Supported Languages**: 40+ languages

**Set Language**:
```
GET /forecast?lat=37.77&lon=-122.41&appid=KEY&lang=es
```

**Common Codes**:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `ja` - Japanese
- `zh_cn` - Chinese Simplified

---

## Best Practices

### 1. Caching Strategy

```typescript
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const weatherCache = new Map();

async function getWeatherWithCache(lat: number, lon: number) {
  const key = `${lat},${lon}`;
  const cached = weatherCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const data = await fetchWeather(lat, lon);
  weatherCache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

### 2. Error Recovery

```typescript
try {
  return await getWeather(lat, lon);
} catch (error) {
  // Return cached data if API fails
  return getCachedWeather(lat, lon) || getDefaultWeather();
}
```

### 3. Coordinate Validation

```typescript
function validateCoordinates(lat: number, lon: number): boolean {
  return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}
```

---

## Pricing

**Free Tier**: 
- 60 calls/minute
- 1M calls/month
- $0 cost

**Paid Plans**:
- Startup: $40/month
- Developer: $125/month  
- Professional: $600/month
- Enterprise: Custom pricing

**Current Project**: Using free tier

---

## Testing

### Manual Testing

```bash
# Current weather
curl "https://api.openweathermap.org/data/2.5/weather?lat=37.7749&lon=-122.4194&appid=YOUR_KEY&units=metric"

# 5-day forecast
curl "https://api.openweathermap.org/data/2.5/forecast?lat=37.7749&lon=-122.4194&appid=YOUR_KEY&units=metric"
```

### Admin Test Endpoint

- `/api/admin/test/weather` - Test weather API
- `/admin` - Admin panel

---

## Troubleshooting

### Common Issues

**1. 401 Unauthorized**
- Check `OPENWEATHER_API_KEY` is set
- Verify key is active (check dashboard)
- Ensure key isn't revoked

**2. 404 Not Found**
- Verify coordinates are valid
- Check location exists in OpenWeather database
- Use geocoding to get correct coordinates

**3. 429 Rate Limit**
- Implement caching
- Reduce request frequency
- Upgrade to paid plan if needed

**4. Stale Data**
- Weather updates every 10 min (current)
- Forecast updates every 3 hours
- Don't cache longer than update frequency

---

## Official Resources

### Documentation
- [API Documentation](https://openweathermap.org/api)
- [One Call API 3.0](https://openweathermap.org/api/one-call-3)
- [5-Day Forecast](https://openweathermap.org/forecast5)
- [Current Weather](https://openweathermap.org/current)
- [Weather Conditions](https://openweathermap.org/weather-conditions)

### Tools
- [API Dashboard](https://home.openweathermap.org/)
- [Weather Icons](https://openweathermap.org/weather-conditions#How-to-get-icon-URL)
- [FAQ](https://openweathermap.org/faq)

### Support
- [Support Center](https://home.openweathermap.org/questions)
- [API Status](https://status.openweathermap.org/)

---

## Related Documentation

- [API Reference](../API_REFERENCE.md) - Overview of all APIs
