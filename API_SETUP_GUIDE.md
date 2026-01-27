# API Setup Guide for Admin Travel Tools

This guide will help you set up the required API accounts and obtain API keys for the new travel integrations.

## Required APIs

### 1. OpenWeatherMap (Weather Data)

**Sign up:** https://openweathermap.org/api

**Steps:**
1. Create a free account at https://home.openweathermap.org/users/sign_up
2. Verify your email
3. Go to API Keys section: https://home.openweathermap.org/api_keys
4. Copy your default API key (or create a new one)
5. Add to `.env`: `OPENWEATHER_API_KEY=your_key_here`

**Free Tier:**
- 1,000 calls/day
- 60 calls/minute
- Current weather, 5-day forecast, weather alerts

**Documentation:** https://openweathermap.org/api

### 2. Yelp Fusion API (Restaurants & Businesses)

**Sign up:** https://www.yelp.com/developers

**Steps:**
1. Create a Yelp account or sign in
2. Go to https://www.yelp.com/developers/v3/manage_app
3. Click "Create New App"
4. Fill in app details (name, description, etc.)
5. Accept terms and create app
6. Copy your API Key from the app page
7. Add to `.env`: `YELP_API_KEY=your_key_here`

**Free Tier:**
- 500 calls/day
- Business search, details, reviews, photos
- US, Canada, and international coverage

**Documentation:** https://docs.developer.yelp.com/

### 3. GetYourGuide API (Activities & Tours)

**Sign up:** https://api.getyourguide.com/

**Steps:**
1. Go to https://api.getyourguide.com/
2. Click "Request API Access"
3. Fill out the partner application form
4. Wait for approval (usually 1-2 business days)
5. Once approved, you'll receive API credentials
6. Add to `.env`: `GETYOURGUIDE_API_KEY=your_key_here`

**Alternative: Viator API**
- More comprehensive but requires partner application
- Apply at: https://www.viator.com/partners/
- May take longer to get approved

**Note:** For initial testing, you can use mock data until API access is approved.

**Documentation:** https://api.getyourguide.com/docs/

## Environment Variables

Add these to your `.env` file:

```bash
# Weather API
OPENWEATHER_API_KEY=your_openweather_key_here

# Restaurant API
YELP_API_KEY=your_yelp_key_here

# Activities API (choose one)
GETYOURGUIDE_API_KEY=your_getyourguide_key_here
# OR
VIATOR_API_KEY=your_viator_key_here
```

## Testing Your API Keys

After adding the keys, you can test them:

### Test OpenWeatherMap
```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
```

### Test Yelp
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" "https://api.yelp.com/v3/businesses/search?location=San+Francisco"
```

### Test GetYourGuide
```bash
curl -H "X-ACCESS-TOKEN: YOUR_API_KEY" "https://api.getyourguide.com/1/activities?city_id=189"
```

## Rate Limits & Best Practices

### OpenWeatherMap
- **Limit:** 60 calls/minute, 1,000 calls/day
- **Best Practice:** Cache weather data for 10-15 minutes
- **Cost:** Free tier sufficient for testing

### Yelp Fusion
- **Limit:** 500 calls/day
- **Best Practice:** Cache business data for 24 hours
- **Cost:** Free tier sufficient for testing

### GetYourGuide
- **Limit:** Varies by plan (check your agreement)
- **Best Practice:** Cache activity data for 1 hour
- **Cost:** Usually free for partners

## Fallback Strategy

If you don't have API keys yet, the admin demos will:
1. Show a warning message about missing API keys
2. Display mock/demo data for testing UI
3. Allow you to explore features without making real API calls

## Next Steps

Once you have your API keys:
1. Add them to `.env` file
2. Restart your development server
3. Navigate to `/admin/apis` to test the integrations
4. Check the health status on the dashboard

## Troubleshooting

**"Invalid API Key" errors:**
- Double-check the key is copied correctly (no extra spaces)
- Verify the key is active in your API dashboard
- Check if you need to activate the key (some APIs require this)

**Rate limit errors:**
- Implement caching to reduce API calls
- Use the built-in cache system in the admin demos
- Upgrade to paid tier if needed

**CORS errors:**
- All API calls should go through Next.js API routes (not directly from client)
- Check that API routes are in `/app/api/admin/test/` directory

## Support

- **OpenWeatherMap:** https://openweathermap.org/faq
- **Yelp:** https://www.yelp.com/developers/support
- **GetYourGuide:** Contact your partner manager

## Security Notes

- Never commit API keys to git
- Keep `.env` in `.gitignore`
- Use environment variables for all API keys
- Rotate keys periodically
- Monitor usage in API dashboards
