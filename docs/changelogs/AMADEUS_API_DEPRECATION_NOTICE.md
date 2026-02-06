# Amadeus API Deprecation Notice

**Date:** January 27, 2026  
**Test Run:** Automated test harness with dev server running

## Deprecated APIs

The following Amadeus Self-Service APIs have been officially decommissioned and are no longer accessible:

### 1. Flight Price Analysis API

**Status:** 410 Gone  
**Error Code:** 41254  
**Error Message:** "API is decommissioned and resource can not be accessible anymore"

**Details:**
- **SDK Method:** `amadeus.analytics.itineraryPriceMetrics.get()`
- **Purpose:** Compare current flight prices to historical data
- **Test Result:** Returns validation error with status 410
- **Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-price-analysis

**Alternative:** None currently available. Historical price comparison features have been removed from Amadeus Self-Service APIs.

**Actions Taken:**
- Removed from admin UI (Intelligence tab)
- Removed from API route handlers
- Commented out in `lib/flights/amadeus-client.ts`
- Marked as deprecated in test cases

---

### 2. Flight Delay Prediction API

**Status:** 410 Gone  
**Error Code:** 41254  
**Error Message:** "API is decommissioned and resource can not be accessible anymore"

**Details:**
- **SDK Method:** `amadeus.travel.predictions.flightDelay.get()`
- **Purpose:** AI-powered flight delay probability predictions
- **Test Result:** Returns validation error with status 410
- **Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-delay-prediction

**Alternative:** None currently available. Flight delay prediction features have been removed from Amadeus Self-Service APIs.

**Actions Taken:**
- Removed from admin UI (Intelligence tab)
- Removed from API route handlers
- Commented out in `lib/flights/amadeus-client.ts`
- Marked as deprecated in test cases

---

### 3. Airport On-Time Performance API

**Status:** 410 Gone  
**Error Code:** 41254  
**Error Message:** "API is decommissioned and resource can not be accessible anymore"

**Details:**
- **SDK Method:** `amadeus.airport.predictions.onTime.get()`
- **Purpose:** Daily airport delay predictions
- **Test Result:** Returns validation error with status 410
- **Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/airport-on-time-performance

**Alternative:** None currently available. Airport on-time performance predictions have been removed from Amadeus Self-Service APIs.

**Actions Taken:**
- Removed from admin UI (Airport Data tab)
- Removed from API route handlers
- Commented out in `lib/flights/amadeus-client.ts`
- Marked as deprecated in test cases

---

## APIs Under Investigation (500 Errors)

The following APIs returned server errors during testing and may also be deprecated or experiencing issues:

### 4. Flight Inspiration Search

**Status:** 500 Server Error  
**Error Code:** 141  
**Error Message:** "SYSTEM ERROR HAS OCCURRED - An system error occurred while trying to retrieve the details"

**Details:**
- **SDK Method:** `amadeus.shopping.flightDestinations.get()`
- **Purpose:** Find inspiring destinations from an origin
- **Test Result:** Returns 500 error
- **Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-inspiration-search

**Possible Causes:**
1. API may be in the process of being deprecated
2. Test environment may have data issues
3. Temporary server problem

**Recommendation:** Monitor for consistent failures. If persistent, consider removing from UI.

---

### 5. Flight Cheapest Date Search

**Status:** 500 Server Error  
**Error Code:** 141  
**Error Message:** "SYSTEM ERROR HAS OCCURRED - An system error occurred while trying to retrieve the details"

**Details:**
- **SDK Method:** `amadeus.shopping.flightDates.get()`
- **Purpose:** Find cheapest dates to fly between two cities
- **Test Result:** Returns 500 error
- **Documentation:** https://developers.amadeus.com/self-service/category/flights/api-doc/flight-cheapest-date-search

**Possible Causes:**
1. API may be in the process of being deprecated
2. Test environment may have data issues
3. Temporary server problem

**Recommendation:** Monitor for consistent failures. If persistent, consider removing from UI.

---

## Working APIs (14 Confirmed)

These APIs passed all tests and are functioning correctly:

### Flight APIs (3)
1. ✅ Flight Offers Search - 5 results in 7.5s
2. ✅ Flight Check-in Links - 3 results in 0.4s
3. ✅ On-Demand Flight Status - Works (0 results for future dates)

### Hotel APIs (4)
4. ✅ Hotel List by City - 988 results in 0.7s
5. ✅ Hotel List by Geocode - 978 results in 0.8s
6. ✅ Hotel Name Autocomplete - 20 results in 0.5s
7. ✅ Hotel Ratings - 2 results in 0.4s

### Airport APIs (5)
8. ✅ Airport Search - 1 result in 0.9s
9. ✅ Airport Routes - 20 results in 0.3s
10. ✅ Airport Nearest Relevant - 10 results in 0.3s
11. ✅ Airline Code Lookup - 1 result in 0.6s
12. ✅ Airline Routes - 20 results in 0.4s

### Activity APIs (2)
13. ✅ Tours & Activities by Radius - 117 results in 1.5s
14. ✅ Tours & Activities by Square - 27 results in 1.1s

---

## Migration Guide

### For Developers

If you were using the deprecated APIs:

**Flight Price Analysis:**
- No direct replacement available
- Consider using Flight Offers Search and implementing your own price tracking
- Historical data must be collected and stored locally

**Flight Delay Prediction:**
- No direct replacement available
- Consider using third-party flight delay prediction services
- Or implement ML model using publicly available flight data

**Airport On-Time Performance:**
- No direct replacement available
- Consider using third-party airport performance data
- Or use Flight Status API for individual flight tracking

### For Users

The admin panel has been updated to:
- Remove deprecated API testing interfaces
- Show deprecation notices where APIs were removed
- Display accurate API coverage status (14 working APIs)
- Provide clear indicators for API health

---

## Timeline

- **Detected:** January 27, 2026 (automated test harness)
- **Confirmed:** January 27, 2026 (error code 41254, status 410)
- **Removed from UI:** January 27, 2026
- **Commented out in code:** January 27, 2026

---

## Impact Assessment

### Low Impact

The deprecated APIs were:
- Recently added to admin panel (not in production use)
- Used only for testing/demonstration
- Not integrated into main application features
- No user-facing features depend on them

### No Action Required for Main Application

The main travel planner application does not use these deprecated APIs. Only the admin testing panel was affected.

---

## References

- Test Report: `AMADEUS_API_TEST_REPORT.md`
- Fix Recommendations: `AMADEUS_API_FIX_RECOMMENDATIONS.md`
- Test Harness: `scripts/test-amadeus-apis.ts`
- Test Cases: `scripts/amadeus-test-cases.ts`

---

## Contact

For questions about Amadeus API deprecations:
- Amadeus for Developers: https://developers.amadeus.com
- Support: https://developers.amadeus.com/support
- Migration Guides: https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/migration-guides/
