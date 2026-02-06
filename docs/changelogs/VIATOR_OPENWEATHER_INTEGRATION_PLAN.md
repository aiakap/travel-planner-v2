# Viator + OpenWeather API Integration Plan

## Overview
Integrate Viator (tours & activities) and OpenWeather APIs to enhance the travel planner with bookable experiences and weather-based recommendations, following the same demo structure as the Amadeus integration.

---

## Phase 1: API Setup & Configuration

### 1.1 Viator API Setup
- **Sign up**: [Viator Affiliate API](https://www.viator.com/affiliates) or [TripAdvisor Experiences API](https://www.tripadvisor.com/developers)
- **Alternative**: Use GetYourGuide API (easier approval process)
- **Get API credentials**: API key and affiliate ID
- **Review documentation**: Endpoints, rate limits, response formats
- **Test in Postman/Thunder Client**: Validate access

**Key Endpoints to Use**:
```
- Search Activities: /search/products
- Product Details: /products/{productCode}
- Product Reviews: /products/{productCode}/reviews
- Product Availability: /products/{productCode}/availability
- Booking: /bookings (if full API access)
- Categories: /taxonomy/categories
- Destinations: /taxonomy/destinations
```

### 1.2 OpenWeather API Setup
- **Sign up**: [OpenWeatherMap.org](https://openweathermap.org/api)
- **Plan**: Free tier (60 calls/min, 1M calls/month)
- **Get API key**: From account dashboard
- **Review documentation**: Current weather, forecasts, historical data

**Key Endpoints to Use**:
```
- Current Weather: /weather
- 5-day Forecast: /forecast
- 8-day Daily Forecast: /forecast/daily (paid)
- Historical Weather: /onecall/timemachine
- Weather Alerts: /onecall (includes alerts)
- Air Quality: /air_pollution
```

### 1.3 Environment Variables
Add to `.env.local`:
```bash
# Viator/GetYourGuide API
VIATOR_API_KEY=your_viator_api_key_here
VIATOR_AFFILIATE_ID=your_affiliate_id_here
VIATOR_API_BASE_URL=https://api.viator.com/partner

# OpenWeather API
OPENWEATHER_API_KEY=your_openweather_api_key_here
OPENWEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5
```

---

## Phase 2: Create Utility Libraries

### 2.1 Viator Client Library
**File**: `lib/viator-client.ts`

```typescript
import { z } from 'zod';

// Zod schemas for type safety
export const viatorActivitySchema = z.object({
  productCode: z.string(),
  title: z.string(),
  description: z.string(),
  images: z.array(z.string()),
  price: z.object({
    amount: z.number(),
    currency: z.string(),
  }),
  duration: z.string(),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  category: z.string(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }),
  cancellationPolicy: z.string().optional(),
});

export type ViatorActivity = z.infer<typeof viatorActivitySchema>;

// Client functions
export async function searchActivities(params: {
  destination: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  maxResults?: number;
}): Promise<ViatorActivity[]> {
  // Implementation
}

export async function getActivityDetails(productCode: string): Promise<ViatorActivity> {
  // Implementation
}

export async function getActivityAvailability(
  productCode: string,
  date: string
): Promise<any> {
  // Implementation
}

export async function getActivityReviews(productCode: string): Promise<any[]> {
  // Implementation
}
```

### 2.2 OpenWeather Client Library
**File**: `lib/openweather-client.ts`

```typescript
import { z } from 'zod';

// Zod schemas
export const weatherSchema = z.object({
  temp: z.number(),
  feels_like: z.number(),
  temp_min: z.number(),
  temp_max: z.number(),
  pressure: z.number(),
  humidity: z.number(),
});

export const forecastDaySchema = z.object({
  dt: z.number(),
  date: z.string(),
  temp: z.object({
    day: z.number(),
    min: z.number(),
    max: z.number(),
    night: z.number(),
    eve: z.number(),
    morn: z.number(),
  }),
  weather: z.array(z.object({
    id: z.number(),
    main: z.string(),
    description: z.string(),
    icon: z.string(),
  })),
  humidity: z.number(),
  wind_speed: z.number(),
  pop: z.number(), // probability of precipitation
  uvi: z.number(), // UV index
});

export type Weather = z.infer<typeof weatherSchema>;
export type ForecastDay = z.infer<typeof forecastDaySchema>;

// Client functions
export async function getCurrentWeather(
  lat: number,
  lon: number
): Promise<Weather> {
  // Implementation
}

export async function get5DayForecast(
  lat: number,
  lon: number
): Promise<ForecastDay[]> {
  // Implementation
}

export async function getWeatherAlerts(
  lat: number,
  lon: number
): Promise<any[]> {
  // Implementation
}

export async function getAirQuality(
  lat: number,
  lon: number
): Promise<any> {
  // Implementation
}

export async function getHistoricalWeather(
  lat: number,
  lon: number,
  date: Date
): Promise<Weather> {
  // Implementation
}
```

### 2.3 Demo Data Libraries
**File**: `lib/viator-demo-data.ts`
- Mock activities for different destinations
- Sample reviews and ratings
- Availability calendars

**File**: `lib/openweather-demo-data.ts`
- Mock weather data for testing
- Sample forecasts
- Weather alerts examples

---

## Phase 3: Create API Routes

### 3.1 Viator API Routes

**File**: `app/api/viator/search/route.ts`
```typescript
export async function GET(request: Request) {
  // Search activities by destination, dates, category
  // Return paginated results
}
```

**File**: `app/api/viator/product/[productCode]/route.ts`
```typescript
export async function GET(
  request: Request,
  { params }: { params: { productCode: string } }
) {
  // Get detailed product information
}
```

**File**: `app/api/viator/availability/route.ts`
```typescript
export async function POST(request: Request) {
  // Check availability for specific dates
}
```

**File**: `app/api/viator/reviews/[productCode]/route.ts`
```typescript
export async function GET(
  request: Request,
  { params }: { params: { productCode: string } }
) {
  // Get product reviews
}
```

### 3.2 OpenWeather API Routes

**File**: `app/api/weather/current/route.ts`
```typescript
export async function GET(request: Request) {
  // Get current weather by lat/lon or city name
}
```

**File**: `app/api/weather/forecast/route.ts`
```typescript
export async function GET(request: Request) {
  // Get 5-day/3-hour forecast
}
```

**File**: `app/api/weather/daily/route.ts`
```typescript
export async function GET(request: Request) {
  // Get 8-day daily forecast (requires paid plan)
}
```

**File**: `app/api/weather/alerts/route.ts`
```typescript
export async function GET(request: Request) {
  // Get weather alerts for location
}
```

**File**: `app/api/weather/air-quality/route.ts`
```typescript
export async function GET(request: Request) {
  // Get air quality index
}
```

---

## Phase 4: Create Demo Pages

### 4.1 Demo Navigation Component
**File**: `app/demo/viator-weather/nav.tsx`

Similar to Amadeus nav, with sections:
- **Viator Activities** (5 demos)
- **OpenWeather** (5 demos)
- **Combined Features** (3 demos)

### 4.2 Viator Demo Pages

#### Demo 1: Activity Search
**File**: `app/demo/viator-weather/activity-search/page.tsx`

Features:
- Search by destination (autocomplete)
- Filter by category (tours, food, adventure, culture, etc.)
- Date range picker
- Price range slider
- Duration filter
- Grid/list view toggle
- Results with images, pricing, ratings
- "View Details" button for each activity

#### Demo 2: Activity Details
**File**: `app/demo/viator-weather/activity-details/page.tsx`

Features:
- Full activity description
- Image gallery/carousel
- Pricing breakdown
- Duration and schedule
- Meeting point on map
- Cancellation policy
- Customer reviews section
- "Check Availability" button
- Related activities

#### Demo 3: Activity Categories
**File**: `app/demo/viator-weather/categories/page.tsx`

Features:
- Browse by category (grid of cards)
- Category icons and counts
- Popular categories highlighted
- Click to filter activities
- Visual category explorer

#### Demo 4: Activity Calendar
**File**: `app/demo/viator-weather/availability/page.tsx`

Features:
- Calendar view with availability
- Price variations by date
- Time slot selection
- Participant count selector
- Real-time availability check
- "Book Now" flow preview

#### Demo 5: Activity Reviews
**File**: `app/demo/viator-weather/reviews/page.tsx`

Features:
- Review listing with ratings
- Filter by rating
- Sort by date/helpfulness
- Review photos
- Verified traveler badges
- Response from tour operator
- Rating breakdown (5 stars distribution)

### 4.3 OpenWeather Demo Pages

#### Demo 6: Current Weather
**File**: `app/demo/viator-weather/current-weather/page.tsx`

Features:
- Search by city or use current location
- Current temperature (with feels like)
- Weather condition with icon
- Humidity, pressure, wind speed
- Sunrise/sunset times
- Weather map overlay
- Multiple unit systems (C/F, mph/kph)
- Beautiful weather cards

#### Demo 7: Weather Forecast
**File**: `app/demo/viator-weather/forecast/page.tsx`

Features:
- 5-day forecast view
- Hourly breakdown (expandable)
- Temperature graphs
- Precipitation probability
- Wind direction compass
- UV index indicators
- Day/night temperatures
- Timeline visualization

#### Demo 8: Weather Alerts
**File**: `app/demo/viator-weather/weather-alerts/page.tsx`

Features:
- Active weather alerts by location
- Severity indicators (color-coded)
- Alert details and timing
- Affected areas on map
- Alert history
- Push notification preview
- Travel advisory recommendations

#### Demo 9: Best Time to Visit
**File**: `app/demo/viator-weather/best-time/page.tsx`

Features:
- Historical weather analysis
- Monthly temperature averages
- Rainfall patterns
- Peak season indicators
- Tourist crowd levels
- Price trends by season
- Interactive charts
- Recommendation engine

#### Demo 10: Air Quality Index
**File**: `app/demo/viator-weather/air-quality/page.tsx`

Features:
- Current AQI with color coding
- Pollutant breakdown (PM2.5, PM10, O3, etc.)
- Health recommendations
- 5-day AQI forecast
- Map view with AQI layers
- Historical trends
- Comparison with other cities

### 4.4 Combined Feature Demos

#### Demo 11: Weather-Based Activity Recommendations
**File**: `app/demo/viator-weather/smart-suggestions/page.tsx`

Features:
- Input: destination + dates
- Fetch weather forecast
- Filter activities based on weather
  - Rainy day → Indoor activities
  - Sunny day → Outdoor adventures
  - Hot weather → Water activities
- Show weather alongside activities
- "Perfect weather for this activity" badges
- Smart itinerary builder

#### Demo 12: Trip Planner with Weather
**File**: `app/demo/viator-weather/trip-planner/page.tsx`

Features:
- Multi-day itinerary builder
- Drag-and-drop activities to days
- Weather forecast for each day
- Activity recommendations by weather
- Time blocking (morning/afternoon/evening)
- Map view of planned activities
- Export itinerary
- Share trip plan

#### Demo 13: Destination Explorer
**File**: `app/demo/viator-weather/explorer/page.tsx`

Features:
- Destination search/autocomplete
- Current weather snapshot
- Top activities in the area
- Weather trends (next 7 days)
- Seasonal highlights
- Local events calendar
- Photo gallery
- Quick stats (avg temp, rainfall, etc.)

### 4.5 Main Demo Dashboard
**File**: `app/demo/viator-weather/page.tsx`

Features:
- Hero section with description
- Quick links to all 13 demos
- Category cards (Viator, Weather, Combined)
- Featured demo spotlight
- API status indicators
- Statistics (total activities, cities, etc.)
- Getting started guide

---

## Phase 5: Create Reusable Components

### 5.1 Viator Components

**File**: `components/viator/activity-card.tsx`
- Compact activity display
- Image, title, price, rating
- Quick action buttons

**File**: `components/viator/activity-grid.tsx`
- Responsive grid layout
- Loading skeletons
- Empty state

**File**: `components/viator/activity-filters.tsx`
- Category checkboxes
- Price range slider
- Duration filter
- Date picker

**File**: `components/viator/review-card.tsx`
- Reviewer info
- Star rating
- Review text
- Photos
- Helpful votes

**File**: `components/viator/availability-calendar.tsx`
- Calendar with availability dots
- Price indicators
- Date selection

### 5.2 Weather Components

**File**: `components/weather/weather-card.tsx`
- Current conditions display
- Icon + temperature
- Additional metrics

**File**: `components/weather/forecast-timeline.tsx`
- Horizontal scroll timeline
- Hourly/daily toggle
- Temperature graph

**File**: `components/weather/weather-icon.tsx`
- Dynamic weather icons
- Animated versions
- Day/night variations

**File**: `components/weather/temperature-graph.tsx`
- Line chart for temperatures
- Min/max indicators
- Interactive tooltips

**File**: `components/weather/alert-banner.tsx`
- Urgent weather alerts
- Severity styling
- Dismissible

**File**: `components/weather/aqi-indicator.tsx`
- Color-coded AQI badge
- Health recommendations
- Pollutant details

### 5.3 Combined Components

**File**: `components/demo/weather-activity-matcher.tsx`
- Match activities to weather
- Smart recommendations
- Visual pairing

**File**: `components/demo/itinerary-day-card.tsx`
- Day overview with weather
- Activity list
- Timeline view

---

## Phase 6: Styling & UI Polish

### 6.1 Design System Extensions
- Weather-specific color palette (sunny yellow, rainy blue, etc.)
- Activity category colors
- Rating star components
- Calendar styling
- Chart themes

### 6.2 Animations
- Weather transitions (clouds, rain, sun)
- Loading states for API calls
- Smooth card flips
- Map zoom animations

### 6.3 Responsive Design
- Mobile-first approach
- Touch-friendly controls
- Swipeable carousels
- Collapsible filters

---

## Phase 7: Integration with Main App

### 7.1 Add to Main Trip Planner
- Activities tab in trip builder
- Weather forecast in trip view
- Activity recommendations in suggestions
- Weather-based smart sorting

### 7.2 Database Schema Updates
```prisma
model Activity {
  id            String   @id @default(cuid())
  tripId        String
  trip          Trip     @relation(fields: [tripId], references: [id])
  
  productCode   String   // Viator product code
  title         String
  description   String
  category      String
  price         Float
  currency      String
  duration      String
  
  date          DateTime
  startTime     String?
  endTime       String?
  
  location      Json     // {lat, lon, address}
  imageUrl      String?
  bookingUrl    String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model WeatherSnapshot {
  id            String   @id @default(cuid())
  tripId        String
  trip          Trip     @relation(fields: [tripId], references: [id])
  
  date          DateTime
  location      Json     // {lat, lon, city}
  
  tempMin       Float
  tempMax       Float
  conditions    String
  description   String
  icon          String
  
  precipitation Float
  humidity      Int
  windSpeed     Float
  
  createdAt     DateTime @default(now())
}
```

### 7.3 User Settings
- Preferred temperature unit (C/F)
- Weather alert preferences
- Activity category preferences
- Budget ranges for activities

---

## Phase 8: Testing & Documentation

### 8.1 Testing
- API client unit tests
- Component tests
- Integration tests
- Error handling tests
- Rate limit handling

### 8.2 Documentation Files
- `VIATOR_INTEGRATION_COMPLETE.md`
- `OPENWEATHER_INTEGRATION_COMPLETE.md`
- `WEATHER_ACTIVITIES_DEMO_GUIDE.md`
- API usage examples
- Troubleshooting guide

---

## Phase 9: Deployment & Optimization

### 9.1 Performance
- Cache weather data (60min TTL)
- Cache activity searches (30min TTL)
- Implement request deduplication
- Lazy load images
- Optimize bundle size

### 9.2 Rate Limit Management
- Implement exponential backoff
- Queue system for API calls
- User-friendly error messages
- Fallback to cached data

### 9.3 Monitoring
- Track API usage
- Monitor error rates
- Log slow requests
- User engagement metrics

---

## Implementation Timeline

### Week 1: Foundation
- [ ] Sign up for APIs and get credentials
- [ ] Create client libraries (`viator-client.ts`, `openweather-client.ts`)
- [ ] Create demo data files
- [ ] Set up API routes
- [ ] Create navigation component

### Week 2: Viator Demos (Days 1-7)
- [ ] Day 1-2: Activity Search page
- [ ] Day 3: Activity Details page
- [ ] Day 4: Categories page
- [ ] Day 5: Availability Calendar page
- [ ] Day 6-7: Reviews page

### Week 3: Weather Demos (Days 8-14)
- [ ] Day 8-9: Current Weather page
- [ ] Day 10: Forecast page
- [ ] Day 11: Weather Alerts page
- [ ] Day 12: Best Time to Visit page
- [ ] Day 13-14: Air Quality page

### Week 4: Combined Features (Days 15-21)
- [ ] Day 15-16: Smart Suggestions page
- [ ] Day 17-18: Trip Planner page
- [ ] Day 19: Explorer page
- [ ] Day 20: Main Dashboard page
- [ ] Day 21: Polish and testing

### Week 5: Integration & Testing
- [ ] Integrate with main app
- [ ] Database migrations
- [ ] User settings
- [ ] End-to-end testing
- [ ] Documentation
- [ ] Deploy

---

## Success Metrics

### Technical
- ✅ All 13 demo pages functional
- ✅ API error rate < 1%
- ✅ Page load times < 2s
- ✅ Mobile responsive on all pages
- ✅ Zero console errors

### User Experience
- ✅ Intuitive navigation
- ✅ Beautiful UI matching Amadeus demos
- ✅ Smooth animations
- ✅ Helpful error messages
- ✅ Loading states on all async operations

### Business
- ✅ Viator affiliate links working
- ✅ Activity conversion tracking
- ✅ Weather data enhancing trip planning
- ✅ User engagement metrics collected

---

## Alternative APIs (If Needed)

### Viator Alternatives:
1. **GetYourGuide API** - Easier approval, similar features
2. **Musement API** - European focus, good coverage
3. **Klook API** - Strong in Asia-Pacific region
4. **Tiqets API** - Museum and attraction tickets

### OpenWeather Alternatives:
1. **WeatherAPI.com** - Free tier, good documentation
2. **Weatherstack** - Simple REST API
3. **Visual Crossing** - Historical data focus
4. **Tomorrow.io** - Advanced forecasting

---

## Notes & Considerations

### Cost Management
- OpenWeather: Free tier sufficient for demos (60 calls/min)
- Viator: Affiliate model (commission-based, no API fees)
- Consider caching to minimize API calls
- Implement usage alerts

### Legal & Compliance
- Review Viator terms of service
- Display proper attribution for weather data
- Handle user booking data securely (if implementing booking)
- GDPR considerations for location data

### Future Enhancements
- Real booking integration (not just affiliate links)
- Weather-based push notifications
- Activity recommendations AI (using user preferences)
- Social features (share itineraries)
- Offline mode with cached weather
- Multi-language support

---

## Quick Start Commands

```bash
# Install any new dependencies
npm install axios date-fns recharts

# Create directory structure
mkdir -p app/demo/viator-weather/{activity-search,activity-details,categories,availability,reviews,current-weather,forecast,weather-alerts,best-time,air-quality,smart-suggestions,trip-planner,explorer}

# Create lib files
touch lib/viator-client.ts
touch lib/openweather-client.ts
touch lib/viator-demo-data.ts
touch lib/openweather-demo-data.ts

# Create API routes
mkdir -p app/api/viator/{search,product,availability,reviews}
mkdir -p app/api/weather/{current,forecast,daily,alerts,air-quality}

# Create component directories
mkdir -p components/viator
mkdir -p components/weather

# Run development server
npm run dev
```

---

## Getting Help

- **Viator API Docs**: https://docs.viator.com/partner-api/
- **OpenWeather API Docs**: https://openweathermap.org/api
- **GetYourGuide API** (alternative): https://api.getyourguide.com/
- **WeatherAPI.com** (alternative): https://www.weatherapi.com/docs/

---

**Ready to start? Let's build amazing weather-aware activity recommendations!** 🌤️🎫
