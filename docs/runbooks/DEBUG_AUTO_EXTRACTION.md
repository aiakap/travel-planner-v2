# Debug Auto-Extraction - Testing Instructions

## Overview

Comprehensive logging has been added to debug why transfer booking auto-extraction isn't working. Follow these steps to identify the issue.

## Changes Made

### 1. Enhanced Detection Logging (`app/exp/client.tsx` lines 218-266)

Added detailed console logs:
- Text length check
- Detection API call status
- Full detection result with all fields
- Action routing decisions

### 2. Handler Entry Logging (`app/exp/client.tsx` lines 450-468)

Added logs at the start of `handleReservationPaste`:
- Function entry confirmation
- Detected type
- Text length
- Selected trip ID
- Trip validation check

## Testing Steps

### Step 1: Hard Refresh Browser

**CRITICAL:** You must clear the browser cache to load the new code.

**On Mac:** `Cmd + Shift + R`
**On Windows/Linux:** `Ctrl + Shift + R`

### Step 2: Open Developer Console

1. Press `F12` or right-click → "Inspect"
2. Click on the **Console** tab
3. Clear the console (trash icon)

### Step 3: Paste Transfer Email

Paste your Sansui Niseko transfer email into the chat.

### Step 4: Watch Console Output

You should see detailed logs. Here's what to look for:

## Expected Console Output

### Scenario A: Everything Works ✅

```
[sendMessage] Text length: 650, checking for reservation...
[sendMessage] Text length > 200, calling detection API...
[sendMessage] Detection API status: 200
[sendMessage] Detection result: {isReservation: true, ...}
[sendMessage] - isReservation: true
[sendMessage] - suggestedAction: extract
[sendMessage] - detectedType: Private Driver
[sendMessage] - confidence: 0.95
[sendMessage] - category: Travel
[sendMessage] - handler: car-rental
[sendMessage] ✅ Auto-extracting: Private Driver (confidence: 0.95)
[handleReservationPaste] 🚀 CALLED!
[handleReservationPaste] - detectedType: Private Driver
[handleReservationPaste] - text length: 650
[handleReservationPaste] - selectedTripId: cmk...
[handleReservationPaste] ✅ Trip selected, starting extraction...
[handleReservationPaste] Extracted car-rental: {...}
```

**What this means:** Auto-extraction is working! Progress steps should appear in chat, and reservation should be created.

---

### Scenario B: Detection Not Called ❌

```
[sendMessage] Text length: 650, checking for reservation...
[sendMessage] Text too short (650 chars), skipping detection
```

**What this means:** The text length check is wrong. The threshold is 200 characters but something is off.

**Fix:** Check if text was trimmed or modified before `sendMessage` was called.

---

### Scenario C: Detection API Error ❌

```
[sendMessage] Text length: 650, checking for reservation...
[sendMessage] Text length > 200, calling detection API...
[sendMessage] Detection API status: 500
[sendMessage] Detection API error: 500 {...}
```

**What this means:** The detection API is failing.

**Fix:** Check server logs in terminal for the actual error. Look for:
```
[DetectPaste] Detected: ...
or
Error in /api/chat/detect-paste
```

---

### Scenario D: Wrong Suggested Action ❌

```
[sendMessage] Detection API status: 200
[sendMessage] - suggestedAction: ignore
[sendMessage] ⏭️ Suggested action is "ignore", continuing as normal message
```

**What this means:** Detection API thinks it's not a reservation or confidence is too low.

**Check the detection result for:**
- `confidence` value (should be >= 0.7 for "extract")
- `detectedType` (should be "Private Driver")
- `debug.companies`, `debug.domains`, `debug.phrases` (should have matches)

**Fix:** Detection logic needs tuning. Check server logs for detailed debug output.

---

### Scenario E: Handler Not Called ❌

```
[sendMessage] ✅ Auto-extracting: Private Driver (confidence: 0.95)
(no handleReservationPaste logs)
```

**What this means:** The function call is being made but not executing.

**Fix:** Check for JavaScript errors in console (red text). Likely an exception is being thrown.

---

### Scenario F: No Trip Selected ❌

```
[handleReservationPaste] 🚀 CALLED!
[handleReservationPaste] - selectedTripId: undefined
[handleReservationPaste] ❌ No trip selected, showing error
```

**What this means:** User hasn't selected a trip.

**Fix:** Select a trip from the dropdown or create a new one.

---

## Manual Detection API Test

Test the detection API directly to verify it works:

```bash
curl -X POST http://localhost:3000/api/chat/detect-paste \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{
  "text": "Dear Mr Alex Kaplinsky, Greetings from Hokkaido, Japan. Thank you for the booking request through Sansui Niseko. We are happy to provide the transfer service for you with Alphard/ Vellfire. (Vellfire is a sportier version of Alphard) Please accept an invoice and credit card payment links attached after the request details. Payment due is 23:59:59 today on January 27th, 2026 (Japan Standard Time). If unfortunately not paid, your booking request shall be canceled. Two payment links are attached just in case. If the first one does not work well, please use the second one. Please be sure not to pay in double. Meanwhile we are preparing for your transfer as follows: Booking request (not confirmed yet)------------------- Lead guest：Mr Alex Kaplinsky Passengers：2 adults Luggage： 2 ski bags Arrival Booking No：R08010702 <Arrival> Date： January 30, 2026 Pickup Location： New Chitose Airport (CTS) Destination： SANSUI NISEKO Flight Number： UA8006 (NH73) eta 18:35 Car type：Alphard Cost：¥52,000, including tax *the driver will be waiting for you at the arrival hall (after baggage claim and Customs) showing a name board. *the drive normally takes 2-2.5 hrs. A short break can be taken on the way if requested. Payment due：23:59:59 today on January 27th, 2026 (Japan Standard Time)."
}
EOF
```

**Expected Response:**
```json
{
  "isReservation": true,
  "confidence": 0.95,
  "detectedType": "Private Driver",
  "category": "Travel",
  "handler": "car-rental",
  "suggestedAction": "extract",
  "alternativeTypes": [...],
  "debug": {
    "companies": ["sansui niseko"],
    "domains": ["veritrans.co.jp"],
    "phrases": ["provide the transfer service", "driver will be waiting"],
    "keywords": ["booking request", "payment due"]
  }
}
```

If `suggestedAction` is NOT "extract", the detection logic needs fixing.

---

## Troubleshooting Checklist

- [ ] Did hard refresh (Cmd+Shift+R)?
- [ ] Is dev server running (`npm run dev`)?
- [ ] Is console open before pasting?
- [ ] Is a trip selected?
- [ ] Are there any red errors in console?
- [ ] What does `suggestedAction` say?
- [ ] What does `confidence` value show?
- [ ] Does `handleReservationPaste` log appear?

---

## Next Steps Based on Findings

1. **If auto-extraction works:** Mark task complete, test with real booking
2. **If detection fails:** Fix detection API logic
3. **If handler fails:** Debug extraction/action handler
4. **If no trip:** Improve error messaging

---

## Files Modified

- `app/exp/client.tsx` - Added comprehensive logging (lines 218-268, 450-468)

---

**Status:** Ready for testing. Please paste the transfer email with console open and report what you see!
