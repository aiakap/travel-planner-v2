# Amadeus API Test Report

**Generated:** 2026-01-27T22:48:58.297Z

## Executive Summary

- **Total APIs Tested:** 21
- **Passed:** 14 (66.7%)
- **Failed:** 7 (33.3%)
- **No Data:** 1
- **Errors:** 7
- **Total Time:** 44.31s

## Results by Category

### Flight
- Total: 7
- Passed: 3
- Failed: 4
- Pass Rate: 42.9%

### Hotel
- Total: 6
- Passed: 4
- Failed: 2
- Pass Rate: 66.7%

### Airport
- Total: 6
- Passed: 5
- Failed: 1
- Pass Rate: 83.3%

### Activity
- Total: 2
- Passed: 2
- Failed: 0
- Pass Rate: 100.0%

### Transfer
- Total: 0
- Passed: 0
- Failed: 0
- Pass Rate: 0.0%

## Detailed Test Results

### Flight APIs

#### 1. Flight Offers Search (JFK→LAX) ✅ PASS

- **API Type:** `flight-search`
- **SDK Method:** `amadeus.shopping.flightOffersSearch.get()`
- **Response Time:** 7533ms
- **HTTP Status:** 200
- **Results Count:** 5

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search

**Notes:** Core flight search - should always work

#### 2. Flight Inspiration Search ❌ FAIL

- **API Type:** `flight-inspiration`
- **SDK Method:** `amadeus.shopping.flightDestinations.get()`
- **Response Time:** 2496ms
- **HTTP Status:** 500
- **Results Count:** 0

**Error Details:**
- Message: The Amadeus API is experiencing issues. Please try again later.
- Code: SERVER_ERROR
- Details: [object Object]

**Recommendation:** Amadeus server error - API may be temporarily unavailable

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-inspiration-search

**Notes:** May be deprecated or have limited test data

#### 3. Flight Cheapest Date Search ❌ FAIL

- **API Type:** `flight-cheapest-dates`
- **SDK Method:** `amadeus.shopping.flightDates.get()`
- **Response Time:** 541ms
- **HTTP Status:** 500
- **Results Count:** 0

**Error Details:**
- Message: The Amadeus API is experiencing issues. Please try again later.
- Code: SERVER_ERROR
- Details: [object Object]

**Recommendation:** Amadeus server error - API may be temporarily unavailable

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-cheapest-date-search

**Notes:** May be deprecated

#### 4. Flight Price Analysis ❌ FAIL

- **API Type:** `flight-price-analysis`
- **SDK Method:** `amadeus.analytics.itineraryPriceMetrics.get()`
- **Response Time:** 229ms
- **HTTP Status:** 400
- **Results Count:** 0

**Error Details:**
- Message: Validation failed: API is decommissioned and resource can not be accessible anymore
- Code: VALIDATION_ERROR
- Details: [object Object]

**Recommendation:** Check API documentation at https://developers.amadeus.com/self-service/category/flights/api-doc/flight-price-analysis

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-price-analysis

**Notes:** Requires historical data - may have limited routes

#### 5. Flight Delay Prediction ❌ FAIL

- **API Type:** `flight-delay-prediction`
- **SDK Method:** `amadeus.travel.predictions.flightDelay.get()`
- **Response Time:** 215ms
- **HTTP Status:** 400
- **Results Count:** 0

**Error Details:**
- Message: Validation failed: API is decommissioned and resource can not be accessible anymore
- Code: VALIDATION_ERROR
- Details: [object Object]

**Recommendation:** Check API documentation at https://developers.amadeus.com/self-service/category/flights/api-doc/flight-delay-prediction

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-delay-prediction

**Notes:** Complex parameters - likely to fail

#### 6. Flight Check-in Links ✅ PASS

- **API Type:** `flight-checkin-links`
- **SDK Method:** `amadeus.referenceData.urls.checkinLinks.get()`
- **Response Time:** 391ms
- **HTTP Status:** 200
- **Results Count:** 3

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-check-in-links

**Notes:** CONFIRMED WORKING - Returns check-in URLs for airlines

#### 7. On-Demand Flight Status ✅ PASS

- **API Type:** `flight-status`
- **SDK Method:** `amadeus.schedule.flights.get()`
- **Response Time:** 448ms
- **HTTP Status:** 200
- **Results Count:** 0

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/on-demand-flight-status

**Notes:** CONFIRMED WORKING - Returns empty for future dates (use recent dates for real data)

### Hotel APIs

#### 1. Hotel Search (NYC) ❌ FAIL

- **API Type:** `hotel-search`
- **SDK Method:** `amadeus.shopping.hotelOffersSearch.get()`
- **Response Time:** 2999ms
- **HTTP Status:** 400
- **Results Count:** 0

**Error Details:**
- Message: Cannot read properties of undefined (reading 'map')
- Code: UNKNOWN_ERROR
- Details: [object Object]

**Recommendation:** SDK method amadeus.shopping.hotelOffersSearch.get() may not exist in Amadeus SDK v11.0.0 - verify method name or update SDK

**Documentation:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-search

**Notes:** Two-step: hotel list → offers

#### 2. Hotel List by City ✅ PASS

- **API Type:** `hotel-list-city`
- **SDK Method:** `amadeus.referenceData.locations.hotels.byCity.get()`
- **Response Time:** 712ms
- **HTTP Status:** 200
- **Results Count:** 988

**Documentation:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-list

**Notes:** Hotel list API - should work

#### 3. Hotel List by Geocode ✅ PASS

- **API Type:** `hotel-list-geocode`
- **SDK Method:** `amadeus.referenceData.locations.hotels.byGeocode.get()`
- **Response Time:** 782ms
- **HTTP Status:** 200
- **Results Count:** 978

**Documentation:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-list

**Notes:** Paris coordinates

#### 4. Hotel List by IDs ❌ FAIL

- **API Type:** `hotel-list-ids`
- **SDK Method:** `amadeus.referenceData.locations.hotels.byHotels.get()`
- **Response Time:** 379ms
- **HTTP Status:** 400
- **Results Count:** 0

**Error Details:**
- Message: Validation failed: Property codes not found in system
- Code: VALIDATION_ERROR
- Details: [object Object]

**Recommendation:** Check API documentation at https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-list

**Documentation:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-list

**Notes:** Test hotel IDs may not exist

#### 5. Hotel Name Autocomplete ✅ PASS

- **API Type:** `hotel-autocomplete`
- **SDK Method:** `amadeus.referenceData.locations.hotel.get()`
- **Response Time:** 548ms
- **HTTP Status:** 200
- **Results Count:** 20

**Documentation:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-name-autocomplete

**Notes:** Autocomplete should work

#### 6. Hotel Ratings ✅ PASS

- **API Type:** `hotel-ratings`
- **SDK Method:** `amadeus.eReputation.hotelSentiments.get()`
- **Response Time:** 377ms
- **HTTP Status:** 200
- **Results Count:** 2

**Documentation:** https://developers.amadeus.com/self-service/category/hotels/api-doc/hotel-ratings

**Notes:** CONFIRMED WORKING - Returns hotel sentiment ratings

### Airport APIs

#### 1. Airport Search (New York) ✅ PASS

- **API Type:** `airport-search`
- **SDK Method:** `amadeus.referenceData.locations.get()`
- **Response Time:** 904ms
- **HTTP Status:** 200
- **Results Count:** 1

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/airport-and-city-search

**Notes:** Has fallback to static data

#### 2. Airport Routes ✅ PASS

- **API Type:** `airport-routes`
- **SDK Method:** `amadeus.airport.directDestinations.get()`
- **Response Time:** 344ms
- **HTTP Status:** 200
- **Results Count:** 20

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/airport-routes

**Notes:** Should return list of destinations

#### 3. Airport Nearest Relevant ✅ PASS

- **API Type:** `airport-nearby`
- **SDK Method:** `amadeus.referenceData.locations.airports.get()`
- **Response Time:** 273ms
- **HTTP Status:** 200
- **Results Count:** 10

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/airport-nearest-relevant

**Notes:** Madrid coordinates - should find MAD

#### 4. Airport On-Time Performance ❌ FAIL

- **API Type:** `airport-ontime`
- **SDK Method:** `amadeus.airport.predictions.onTime.get()`
- **Response Time:** 431ms
- **HTTP Status:** 400
- **Results Count:** 0

**Error Details:**
- Message: Validation failed: API is decommissioned and resource can not be accessible anymore
- Code: VALIDATION_ERROR
- Details: [object Object]

**Recommendation:** Check API documentation at https://developers.amadeus.com/self-service/category/flights/api-doc/airport-on-time-performance

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/airport-on-time-performance

**Notes:** May require specific date format

#### 5. Airline Code Lookup ✅ PASS

- **API Type:** `airline-lookup`
- **SDK Method:** `amadeus.referenceData.airlines.get()`
- **Response Time:** 616ms
- **HTTP Status:** 200
- **Results Count:** 1

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/airline-code-lookup

**Notes:** Reference data - should work

#### 6. Airline Routes ✅ PASS

- **API Type:** `airline-routes`
- **SDK Method:** `amadeus.airline.destinations.get()`
- **Response Time:** 412ms
- **HTTP Status:** 200
- **Results Count:** 20

**Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/airline-routes

**Notes:** Should return BA destinations

### Activity APIs

#### 1. Tours & Activities by Radius ✅ PASS

- **API Type:** `tours-activities`
- **SDK Method:** `amadeus.shopping.activities.get()`
- **Response Time:** 1495ms
- **HTTP Status:** 200
- **Results Count:** 117

**Documentation:** https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/tours-and-activities

**Notes:** CONFIRMED WORKING - Madrid has excellent test data (117+ activities)

#### 2. Tours & Activities by Square ✅ PASS

- **API Type:** `tours-activities-square`
- **SDK Method:** `amadeus.shopping.activities.bySquare.get()`
- **Response Time:** 1133ms
- **HTTP Status:** 200
- **Results Count:** 27

**Documentation:** https://developers.amadeus.com/self-service/category/destination-experiences/api-doc/tours-and-activities

**Notes:** Barcelona bounds - increased timeout to 15s (previously timed out)

## Failed APIs Summary

| API | Error Code | Message | Recommendation |
|-----|-----------|---------|----------------|
| Hotel Search (NYC) | UNKNOWN_ERROR | Cannot read properties of undefined (reading 'map' | SDK method amadeus.shopping.hotelOffersSearch.get() may not  |
| Flight Inspiration Search | SERVER_ERROR | The Amadeus API is experiencing issues. Please try | Amadeus server error - API may be temporarily unavailable |
| Flight Cheapest Date Search | SERVER_ERROR | The Amadeus API is experiencing issues. Please try | Amadeus server error - API may be temporarily unavailable |
| Flight Price Analysis | VALIDATION_ERROR | Validation failed: API is decommissioned and resou | Check API documentation at https://developers.amadeus.com/se |
| Flight Delay Prediction | VALIDATION_ERROR | Validation failed: API is decommissioned and resou | Check API documentation at https://developers.amadeus.com/se |
| Airport On-Time Performance | VALIDATION_ERROR | Validation failed: API is decommissioned and resou | Check API documentation at https://developers.amadeus.com/se |
| Hotel List by IDs | VALIDATION_ERROR | Validation failed: Property codes not found in sys | Check API documentation at https://developers.amadeus.com/se |

## APIs Returning No Data

These APIs work but returned empty results in the test environment:

- **On-Demand Flight Status** - CONFIRMED WORKING - Returns empty for future dates (use recent dates for real data)

## Overall Recommendations

### SDK/Method Issues
Some APIs failed due to SDK method errors. Recommendations:
- Verify Amadeus SDK version (currently 11.0.0)
- Check if methods exist in SDK documentation
- Consider updating to latest SDK version

### Limited Test Data
1 APIs returned no results. This is common in test environments.
These APIs may work fine in production with real data.

## Next Steps

1. **Fix Critical Issues** - Address authentication and SDK method errors first
2. **Verify Deprecated APIs** - Check Amadeus documentation for deprecated endpoints
3. **Update SDK** - Consider upgrading to latest Amadeus SDK version
4. **Test with Production** - Some APIs may work better with production data
5. **Update Admin UI** - Disable or hide non-working APIs in admin panel
