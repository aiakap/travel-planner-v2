# Auto-Extract Paste Reservations - Testing Guide

## Implementation Complete

The auto-extraction feature has been successfully implemented in the `/exp` chat interface. Users can now paste booking confirmations directly into the chat, and the system will automatically detect, extract, and add them to their trip.

## How to Test

### Prerequisites

1. Start the development server: `npm run dev`
2. Navigate to `/exp` in your browser
3. Create or select a trip (required for adding reservations)
4. Ensure you have API keys configured:
   - `OPENAI_API_KEY` - for extraction
   - `GOOGLE_MAPS_API_KEY` - for geocoding

### Test Cases

#### 1. Hotel Confirmation (Booking.com, Hotels.com, Airbnb)

**Test Data:** Paste a hotel confirmation email containing:
- Hotel name
- Check-in/check-out dates
- Confirmation number
- Address
- Guest details
- Cost information

**Expected Behavior:**
1. System detects it's a reservation (confidence > 0.7)
2. Shows progress: "Analyzing your booking confirmation..."
3. Extracts hotel data using AI
4. Progress updates: "Found a hotel booking! Adding to your trip..."
5. Auto-matches to existing segment or creates new "Stay" segment
6. Geocodes the hotel address
7. Creates reservation in database
8. Shows success message
9. Automatically starts a conversation about the hotel
10. Displays context card with hotel details
11. Hotel appears in itinerary panel on the right

**Sample Test Email:**
```
Your Booking Confirmation

Confirmation Number: 123456789

Hotel: Grand Plaza Hotel
Address: 123 Main Street, New York, NY 10001

Check-in: March 15, 2024 at 3:00 PM
Check-out: March 18, 2024 at 11:00 AM

Guests: 2 Adults
Rooms: 1 Room
Room Type: Deluxe King

Total Cost: $450.00

Thank you for your booking!
```

#### 2. Flight Confirmation (United, Delta, Southwest)

**Test Data:** Paste a flight confirmation email containing:
- Airline name
- Flight numbers
- Departure/arrival airports
- Departure/arrival times
- Confirmation code
- Passenger names

**Expected Behavior:**
1. Detects flight reservation
2. Extracts all flight segments (outbound, return, connections)
3. Creates individual reservations for each flight
4. Groups flights into clusters (outbound/return)
5. Auto-matches to existing segments or creates "Flight" segments
6. Shows all flights in timeline view

**Sample Test Email:**
```
Your Flight Confirmation

Confirmation Code: ABC123

Passenger: John Doe

Outbound Flight:
Flight UA 123
March 15, 2024
Depart: New York (JFK) at 8:00 AM
Arrive: Los Angeles (LAX) at 11:30 AM

Return Flight:
Flight UA 456
March 20, 2024
Depart: Los Angeles (LAX) at 2:00 PM
Arrive: New York (JFK) at 10:30 PM

Total: $450.00
```

#### 3. Car Rental (Hertz, Enterprise, Avis)

**Test Data:** Paste a car rental confirmation containing:
- Rental company
- Pick-up/drop-off locations
- Pick-up/drop-off dates and times
- Vehicle type
- Confirmation number

**Expected Behavior:**
1. Detects car rental
2. Extracts rental details
3. Creates reservation
4. Auto-matches to segment based on dates/location

**Sample Test Email:**
```
Car Rental Confirmation

Confirmation Number: RNT789456

Company: Hertz

Pick-up:
Location: Los Angeles Airport (LAX)
Date: March 15, 2024 at 12:00 PM

Drop-off:
Location: Los Angeles Airport (LAX)
Date: March 20, 2024 at 11:00 AM

Vehicle: Toyota Camry or similar
Total: $250.00
```

#### 4. Restaurant Reservation (OpenTable, Resy)

**Test Data:** Paste a restaurant reservation containing:
- Restaurant name
- Date and time
- Party size
- Confirmation number

**Expected Behavior:**
1. Detects restaurant reservation
2. Extracts details
3. Creates reservation
4. Auto-matches to segment based on date

**Sample Test Email:**
```
Restaurant Reservation Confirmed

Confirmation: 12345

Restaurant: The French Bistro
Address: 456 Park Ave, New York, NY

Date: March 16, 2024
Time: 7:00 PM
Party Size: 4 people

We look forward to serving you!
```

#### 5. Event Ticket (Ticketmaster, Eventbrite)

**Test Data:** Paste an event ticket confirmation containing:
- Event name
- Venue
- Date and time
- Ticket quantity
- Seat information

**Expected Behavior:**
1. Detects event ticket
2. Extracts event details
3. Creates reservation
4. Auto-matches to segment

**Sample Test Email:**
```
Your Event Tickets

Order #: EVT123456

Event: Broadway Show - Hamilton
Venue: Richard Rodgers Theatre
Address: 226 W 46th St, New York, NY

Date: March 17, 2024
Time: 8:00 PM

Tickets: 2
Section: Orchestra, Row K, Seats 15-16

Total: $300.00
```

### Error Scenarios to Test

#### 1. No Trip Selected

**Test:**
1. Go to `/exp` without selecting a trip
2. Paste a booking confirmation

**Expected:**
- Error message: "I detected a booking confirmation, but you need to select or create a trip first..."

#### 2. Invalid/Unrecognizable Email

**Test:**
1. Paste random text or a non-booking email
2. Should be sent as normal chat message (not trigger extraction)

**Expected:**
- Text length < 200 chars OR confidence < 0.7
- Processes as normal chat message
- AI responds normally

#### 3. Extraction Failure

**Test:**
1. Paste a booking email with missing critical information
2. Or paste corrupted/partial email

**Expected:**
- Shows progress up to extraction step
- Displays error: "I had trouble extracting that booking. Could you try pasting it again..."
- User can retry or describe manually

#### 4. API Key Missing

**Test:**
1. Remove `OPENAI_API_KEY` from environment
2. Paste booking confirmation

**Expected:**
- Extraction API returns 500 error
- Shows error message to user

#### 5. Geocoding Failure

**Test:**
1. Paste booking with invalid/unknown address

**Expected:**
- Reservation still created
- Coordinates set to (0, 0) as fallback
- No map display but other details work

### Performance Testing

**Metrics to Monitor:**

1. **Detection Speed:** < 200ms
   - Lightweight keyword matching
   - Should not block UI

2. **Extraction Speed:** 2-5 seconds
   - AI processing time
   - Depends on OpenAI API response

3. **Total Time:** 5-10 seconds
   - Detection + Extraction + Geocoding + DB write
   - Progress bar keeps user engaged

**Test:**
1. Paste a hotel confirmation
2. Monitor browser console for timing logs
3. Verify progress updates appear smoothly

### UI/UX Testing

**Check:**

1. **Progress Animation**
   - Blue progress bar appears
   - Step counter updates (1/7, 2/7, etc.)
   - Messages update at each step

2. **Message Flow**
   - User's pasted text doesn't appear as message
   - Only progress and success messages shown
   - Context card appears after completion

3. **Itinerary Update**
   - New reservation appears in right panel
   - Timeline view updates immediately
   - Can click reservation to edit

4. **Conversation Creation**
   - New conversation created for reservation
   - Context card shows reservation details
   - Quick actions available
   - Can chat about the reservation

### Browser Console Logs

**Look for these logs during testing:**

```
[DetectPaste] Detected: YES, Type: hotel, Confidence: 0.85, Action: extract
[sendMessage] Detected reservation paste: hotel, confidence: 0.85
[handleReservationPaste] Extracted hotel: {...}
[createNewReservationChat] Creating conversation for reservation: xxx
[createNewReservationChat] Conversation created: yyy
```

### Known Limitations

1. **No Google Places Images:** Reservations are created without images initially. Images can be added manually or via future enhancement.

2. **Single Reservation Per Paste:** Currently processes one booking at a time. Pasting multiple confirmations requires multiple pastes.

3. **English Only:** Extraction optimized for English-language confirmations.

4. **Detection Threshold:** Confidence must be > 0.7 to auto-extract. Lower confidence (0.4-0.7) could show a confirmation dialog (future enhancement).

## Debugging Tips

### If Detection Doesn't Trigger

1. Check text length (must be > 200 chars)
2. Check keyword presence (use browser console)
3. Verify detection API is responding
4. Check confidence score in logs

### If Extraction Fails

1. Check OpenAI API key is configured
2. Check API logs for errors
3. Verify email format is recognizable
4. Try with sample test data first

### If Reservation Not Created

1. Check trip is selected
2. Verify segment matching logic
3. Check database connection
4. Review server logs for errors

### If Conversation Not Started

1. Check reservation was created (check database)
2. Verify `createNewReservationChat` is called
3. Check for errors in browser console
4. Ensure trip data is refreshed

## Success Criteria

✅ **Detection works:** Correctly identifies booking confirmations
✅ **Extraction works:** AI extracts structured data accurately
✅ **Reservation created:** Data saved to database correctly
✅ **Auto-matching works:** Finds or creates appropriate segment
✅ **Geocoding works:** Locations have coordinates
✅ **Conversation created:** Can chat about the reservation
✅ **UI updates:** Itinerary panel shows new reservation
✅ **Error handling:** Graceful failures with helpful messages

## Next Steps

After successful testing:

1. **Add Google Places Images:** Enhance add*ToTrip actions to fetch images
2. **Batch Processing:** Support multiple confirmations in one paste
3. **Confirmation Dialog:** For medium-confidence detections (0.4-0.7)
4. **Email Forwarding:** Allow users to forward emails to special address
5. **Screenshot OCR:** Extract from pasted images
6. **Multi-language Support:** Support non-English confirmations

## Files Changed

### New Files
- `app/api/chat/detect-paste/route.ts` - Detection API
- `app/exp/components/extraction-loading-animation.tsx` - Progress UI
- `AUTO_EXTRACT_PASTE_TESTING_GUIDE.md` - This file

### Modified Files
- `app/exp/client.tsx` - Added detection and extraction logic
- `app/exp/components/message-segments-renderer.tsx` - Added extraction_progress segment
- `lib/types/place-pipeline.ts` - Added extraction_progress type

### Reused Files (No Changes)
- `app/api/admin/email-extract/route.ts` - Extraction API
- `lib/email-extraction/build-extraction-prompt.ts` - Plugin system
- `lib/actions/add-hotels-to-trip.ts` - Hotel creation
- `lib/actions/add-flights-to-trip.ts` - Flight creation
- `lib/actions/add-car-rentals-to-trip.ts` - Car rental creation
- All extraction schemas and plugins
