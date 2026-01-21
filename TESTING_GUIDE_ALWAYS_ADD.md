# Testing Guide: Always Show "Add to Itinerary" Button

## Quick Test Checklist

Use this to verify all three user flows work correctly.

## Prerequisites

1. Start dev server: `npm run dev`
2. Have at least one trip in your account (for Flow 1)
3. Be able to log out/in with GitHub

## Flow 1: Logged In with Existing Trip

**Setup:**
- Be logged in
- Know a trip ID from your account

**Steps:**
1. Go to `/test/place-pipeline`
2. Enter your trip ID in "Test Trip ID" field
3. Enter query: "suggest 2 hotels in Paris"
4. Click "Start Pipeline"
5. Wait for all 3 stages to complete
6. In Stage 3, hover over a place link (e.g., "Hôtel Plaza Athénée")
7. Verify hover card shows place details
8. Verify "Add to Itinerary" button is visible
9. Click "Add to Itinerary"
10. Verify SuggestionDetailModal opens
11. Select day, time, cost
12. Click "Add to Itinerary" in modal
13. Verify reservation is created

**Expected Result:**
- Button always shows
- Modal opens with trip context
- Reservation added successfully
- No errors in console

## Flow 2: Logged In without Trip

**Setup:**
- Be logged in
- Don't have any trips, or use invalid trip ID

**Steps:**
1. Go to `/test/place-pipeline`
2. Leave "Test Trip ID" field EMPTY (or enter invalid ID like "test-123")
3. Enter query: "suggest 2 hotels in Paris"
4. Click "Start Pipeline"
5. Wait for completion
6. Hover over a place link
7. Verify "Add to Itinerary" button is visible
8. Click "Add to Itinerary"
9. **NEW:** Quick Trip Modal should appear
10. Verify pre-filled fields:
    - Trip Name: "Trip to Paris" (or similar)
    - Start Date: Today
    - End Date: Today + 7 days
    - Description: "Trip to visit [place name]"
11. Edit if desired
12. Click "Create & Add"
13. Verify trip is created
14. Verify SuggestionDetailModal opens automatically
15. Complete scheduling
16. Verify reservation added to new trip

**Expected Result:**
- Quick trip modal appears
- Smart defaults populated
- Trip created successfully
- Flows directly to scheduling
- Reservation added to new trip

## Flow 3: Not Logged In (Guest User)

**Setup:**
- Log out completely
- Clear cookies if needed

**Steps:**
1. Go to `/test/place-pipeline` (while logged out)
2. Enter query: "suggest 2 hotels in Paris"
3. Click "Start Pipeline"
4. Wait for completion
5. Hover over a place link
6. Verify "Add to Itinerary" button is visible
7. Click "Add to Itinerary"
8. Verify you're redirected to GitHub auth
9. Complete GitHub authorization
10. **NEW:** Should land on `/auth-landing` page
11. Verify you see PlaceSuggestionCard with:
    - Place photo (if available)
    - Place name and address
    - Rating and price level
    - "Add to New Trip" button
    - "Skip for Now" button
12. Click "Add to New Trip"
13. Quick Trip Modal opens
14. Create trip
15. SuggestionDetailModal opens
16. Complete scheduling
17. Verify reservation added

**Expected Result:**
- Suggestion saved to cookie
- Auth redirect works
- Landing page shows saved suggestion
- Complete flow works after auth
- Ends on trip detail page with new reservation

## Edge Case Testing

### Test: Expired Cookie

1. Save a pending suggestion
2. Manually delete the cookie or wait 1 hour
3. Try to access `/auth-landing?suggestion=xyz`
4. Should redirect to `/trips`

### Test: Invalid Suggestion ID

1. Go to `/auth-landing?suggestion=invalid-id`
2. Should redirect to `/trips`

### Test: No Suggestion Data

1. Go to `/auth-landing` without query param
2. Should redirect to `/trips`

### Test: Place Not Found

1. If Stage 2 shows place as "not found"
2. Button should still appear
3. But place data will be minimal in modal

### Test: Rapid Clicking

1. Click "Add to Itinerary" multiple times rapidly
2. Button should disable ("Checking...")
3. Only one action should execute

### Test: Date Validation

1. In Quick Trip Modal, set end date before start date
2. Try to submit
3. Should show error: "End date must be after start date"

## Console Logging

Watch for these logs during testing:

**Successful Quick Trip Creation:**
```
✓ Queued trip image generation: [trip-id]
```

**Pending Suggestion Save:**
```
Cookie saved with ID: sugg_1234567890_abc123
```

**Landing Page Load:**
```
Retrieved pending suggestion for user
```

## Common Issues & Solutions

### Issue: Button Doesn't Show

**Check:**
- Is `suggestion` prop passed to PlaceHoverCard?
- Is place data valid (not `notFound`)?
- Open React DevTools to inspect props

### Issue: Auth Check Hangs

**Check:**
- Is `/api/auth/check` endpoint responding?
- Check network tab for 500 errors
- Verify NextAuth is configured

### Issue: Cookie Not Persisting

**Check:**
- Browser allows cookies
- Cookie settings in `lib/pending-suggestions.ts`
- Check DevTools > Application > Cookies

### Issue: Landing Page Redirects Immediately

**Check:**
- Was suggestion ID in URL?
- Check server logs for cookie retrieval
- Verify cookie not expired

### Issue: Quick Trip Modal Doesn't Open

**Check:**
- Console for errors
- Auth check returned authenticated=true
- tripId is null/undefined

### Issue: Type Conversion Errors

**Check:**
- PlaceSuggestion has all required fields
- Category mapping is correct
- Check console for conversion errors

## API Testing

### Test Auth Check

```bash
curl http://localhost:3000/api/auth/check
```

Expected (logged out):
```json
{"authenticated":false,"userId":null}
```

Expected (logged in):
```json
{"authenticated":true,"userId":"user-id-here"}
```

### Test Save Pending Suggestion

```bash
curl -X POST http://localhost:3000/api/suggestions/pending \
  -H "Content-Type: application/json" \
  -d '{
    "placeName": "Test Hotel",
    "placeData": {...},
    "suggestion": {...},
    "timestamp": 1737489600000
  }'
```

Expected:
```json
{"success":true,"id":"sugg_1234567890_abc123"}
```

## Success Metrics

After testing all flows:

- [ ] Flow 1 works (logged in with trip)
- [ ] Flow 2 works (logged in without trip)
- [ ] Flow 3 works (not logged in)
- [ ] Quick trip modal has smart defaults
- [ ] Auth redirect preserves place data
- [ ] Landing page displays correctly
- [ ] Cookies expire after 1 hour
- [ ] All error cases handled gracefully
- [ ] No console errors
- [ ] Reservation successfully created in all flows

## Next Steps

1. Manual test all three flows
2. Fix any issues discovered
3. Update chat interface to pass tripId
4. Test in production chat context
5. Monitor cookie usage and expiration
6. Consider adding analytics

## Notes

- **Cookie size limit**: ~4KB, plenty for one suggestion
- **Security**: Consider encryption for production
- **Performance**: Auth check adds ~100-200ms latency
- **UX**: Button shows "Checking..." during auth check
- **Cleanup**: Cookies auto-expire after 1 hour

All implementation complete! Ready for comprehensive testing.
