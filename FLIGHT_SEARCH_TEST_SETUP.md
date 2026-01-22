# Flight Search Test Page - Setup Instructions

## ✅ Implementation Complete!

All code files have been created. You now need to complete the Amadeus API setup to test the functionality.

## Files Created

1. ✅ `lib/flights/amadeus-client.ts` - Amadeus SDK wrapper
2. ✅ `app/api/flights/search/route.ts` - API route handler
3. ✅ `app/test/flight-search/page.tsx` - Test page UI
4. ✅ `package.json` - amadeus package installed

## Next Steps: Amadeus API Setup

### 1. Sign Up for Amadeus API

1. Go to https://developers.amadeus.com/
2. Click "Register" or "Sign In"
3. Create a free account

### 2. Create an App

1. Once logged in, go to "My Self-Service Workspace"
2. Click "Create New App"
3. Fill in the details:
   - **App Name**: Travel Planner Test
   - **Description**: Testing flight search integration
4. Click "Create"

### 3. Get Your API Credentials

1. After creating the app, you'll see:
   - **API Key** (Client ID)
   - **API Secret** (Client Secret)
2. Copy both values

### 4. Add Credentials to .env.local

Add these lines to your `.env.local` file:

```bash
# Amadeus API Credentials
AMADEUS_CLIENT_ID=your_api_key_here
AMADEUS_CLIENT_SECRET=your_api_secret_here
```

Replace `your_api_key_here` and `your_api_secret_here` with your actual credentials.

### 5. Restart the Dev Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### 6. Test the Page

1. Navigate to: http://localhost:3000/test/flight-search
2. The form should be pre-filled with:
   - Origin: JFK
   - Destination: LAX
   - Departure: Next week
   - Return: 2 weeks from now
   - Passengers: 1
   - Class: Economy
3. Click "Search Flights"
4. You should see real flight results with prices!

## What to Expect

### Success Response
- List of 10 flights
- Each showing:
  - Route (JFK → LAX)
  - Duration (e.g., "5h 30m")
  - Number of stops
  - Airline codes
  - **Real price** in USD

### Possible Errors

**"Failed to search flights"**
- Check that API credentials are correct in `.env.local`
- Verify you restarted the dev server after adding credentials
- Check browser console for detailed error messages

**"No flights found"**
- Try different dates (must be future dates)
- Try different routes (some routes may not have availability)
- Check that IATA codes are valid (3-letter airport codes)

## API Limits

- **Free Tier**: 1,000 API calls per month
- **Test Usage**: Each search = 1 API call
- More than enough for testing!

## Testing Checklist

- [ ] Sign up for Amadeus API
- [ ] Create app and get credentials
- [ ] Add credentials to `.env.local`
- [ ] Restart dev server
- [ ] Navigate to `/test/flight-search`
- [ ] Test default search (JFK → LAX)
- [ ] Verify real flight prices display
- [ ] Test different routes (e.g., SFO → NYC)
- [ ] Test different cabin classes
- [ ] Test one-way (clear return date)
- [ ] Test error handling (invalid IATA code like "XXX")

## Troubleshooting

### Dev Server Won't Start
- Check for TypeScript errors: `npm run build`
- Check that all imports are correct

### API Returns 401 Unauthorized
- Double-check API credentials in `.env.local`
- Make sure there are no extra spaces in the credentials
- Verify credentials are from the correct app in Amadeus dashboard

### No Results Returned
- Check browser console (F12) for errors
- Check terminal logs for API error messages
- Verify dates are in the future
- Try a more popular route (JFK-LAX, SFO-NYC, etc.)

## Next Steps After Testing

Once the test page works successfully:

1. **Evaluate Results**
   - Are prices accurate?
   - Is response time acceptable?
   - Is the data quality good?

2. **Plan Phase 2**
   - Integrate flight search into trip suggestions
   - Add flight data to trip cards
   - Store flight preferences in database

3. **Consider Enhancements**
   - Add IATA code autocomplete
   - Show more flight details (departure times, layover info)
   - Add sorting/filtering options
   - Display airline logos

## Support

If you encounter issues:
1. Check Amadeus API documentation: https://developers.amadeus.com/self-service
2. Review API status: https://developers.amadeus.com/status
3. Check the browser console and terminal for error messages

## Success!

Once you see real flight prices on the test page, you've successfully integrated the Amadeus API! 🎉

The test page proves the concept works, and you can now proceed with Phase 2 to integrate flights into your main trip suggestion flow.
