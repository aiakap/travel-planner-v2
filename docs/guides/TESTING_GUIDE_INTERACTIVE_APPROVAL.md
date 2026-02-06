# Testing Guide: Interactive Email Extraction Approval

## Quick Start

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to**: `http://localhost:3000/admin/email-extract`

3. **Test with your private driver email** (the tabi pirka one)

---

## What You'll See

### Step 1: Email Input Screen

```
┌────────────────────────────────────────────────┐
│ Step 1: Email Input                            │
│                                                 │
│ Upload .eml file (optional)                    │
│ [Choose File]                                  │
│                                                 │
│ Or paste email content                         │
│ ┌────────────────────────────────────────────┐ │
│ │ Dear Mr Alex Kaplinsky,                    │ │
│ │                                            │ │
│ │ Thank you for your prompt payment!         │ │
│ │ We are glad to confirm your booking.       │ │
│ │ ...                                        │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ [📧 Analyze Email]                             │
└────────────────────────────────────────────────┘
```

### Step 2: Type Approval Screen (NEW!)

When you click "Analyze Email", you'll see:

```
┌────────────────────────────────────────────────┐
│ Step 2: Confirm Reservation Type               │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ ✅ AI Detected Type                        │ │
│ │                                            │ │
│ │ [Private Driver] [High Confidence] 92%     │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ 📈 Detection Reasoning                     │ │
│ │                                            │ │
│ │ Company Matches           +0.80            │ │
│ │   tabi pirka                               │ │
│ │                                            │ │
│ │ Semantic Phrases          +0.60            │ │
│ │   "driver will be waiting",                │ │
│ │   "showing a name board"                   │ │
│ │                                            │ │
│ │ Confirmation Keywords     +0.20            │ │
│ │   "booking confirmed"                      │ │
│ │                                            │ │
│ │ Confidence Gap Bonus      +0.20            │ │
│ │   Lead over Car Rental (0.45)              │ │
│ │ ──────────────────────────────────         │ │
│ │ Total Confidence           92%             │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ Other Possible Types                       │ │
│ │                                            │ │
│ │ [Car Rental (45%)] [Taxi (32%)]            │ │
│ │ [Ride Share (28%)]                         │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ ┌────────────────────────────────────────────┐ │
│ │ Select Reservation Type                    │ │
│ │ ┌────────────────────────────────────────┐ │ │
│ │ │ Private Driver               ▼         │ │ │
│ │ └────────────────────────────────────────┘ │ │
│ │                                            │ │
│ │ Dropdown contains:                         │ │
│ │   Travel:                                  │ │
│ │     - Flight                               │ │
│ │     - Private Driver ← Selected            │ │
│ │     - Car Rental                           │ │
│ │     - Taxi                                 │ │
│ │     - ... (10 travel types)                │ │
│ │   Stay:                                    │ │
│ │     - Hotel, Airbnb, ... (6 types)         │ │
│ │   Activity:                                │ │
│ │     - Tour, Event Tickets, ... (13 types)  │ │
│ │   Dining:                                  │ │
│ │     - Restaurant, Cafe, ... (4 types)      │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ [Back]  [✅ Continue with AI Selection: Private Driver] │
└────────────────────────────────────────────────┘
```

### Step 2b: If You Override (Change Type)

If you change the dropdown from "Private Driver" to "Taxi":

```
┌────────────────────────────────────────────────┐
│ ⚠️ You've changed the type from                │
│    Private Driver to Taxi                      │
│                                                 │
│ Why was the AI wrong? (Optional but helpful)   │
│ ┌────────────────────────────────────────────┐ │
│ │ This is actually a taxi because there's    │ │
│ │ no assigned driver name or vehicle plate   │ │
│ │ number - it's an on-demand booking         │ │
│ └────────────────────────────────────────────┘ │
│                                                 │
│ Your feedback helps improve AI accuracy        │
│                                                 │
│ [Back]  [⚠ Continue with Override: Taxi]      │
└────────────────────────────────────────────────┘
```

### Step 3: Extracting

```
┌────────────────────────────────────────────────┐
│                                                 │
│           ⏳ (spinning loader)                  │
│                                                 │
│       Extracting booking information...        │
│                                                 │
│   Processing email with AI to extract          │
│   structured data                              │
│                                                 │
└────────────────────────────────────────────────┘
```

### Step 4: Complete (Existing UI)

Shows the extracted data as it does currently, with all the flight/hotel/car details.

---

## Test Scenarios

### Scenario 1: Approve AI Selection

**Input**: Paste tabi pirka private driver email

**Expected**:
- AI detects: "Private Driver" (92% confidence)
- Scoring shows: company matches, semantic phrases
- Alternatives: Car Rental, Taxi, Ride Share
- You click: "Continue with AI Selection"

**Result**:
- Extracts with `privateDriverExtractionSchema`
- Logs to database: `wasOverridden: false`
- Console shows: "✅ USER APPROVED AI SELECTION"
- Data includes: driver name, vehicle, plate number, meeting instructions

**Database**:
```sql
SELECT * FROM "ExtractionFeedback" 
WHERE emailHash = '<hash of email>';

-- Should show:
aiTopType: "Private Driver"
userSelectedType: "Private Driver"  
wasOverridden: false
userReason: null
```

### Scenario 2: Override AI Selection

**Input**: Same email, but pretend it's wrong

**Steps**:
1. Paste email
2. Click "Analyze Email"
3. See "Private Driver" detected
4. Change dropdown to "Taxi"
5. Feedback box appears
6. Type: "Testing override - this is actually a taxi booking"
7. Click "Continue with Override: Taxi"

**Result**:
- Extracts with `taxiExtractionSchema` (when implemented)
- Logs to database: `wasOverridden: true`
- Console shows: "🔄 TYPE OVERRIDE DETECTED"
- Includes your reason

**Database**:
```sql
SELECT * FROM "ExtractionFeedback" 
WHERE wasOverridden = true
ORDER BY createdAt DESC
LIMIT 1;

-- Should show:
aiTopType: "Private Driver"
userSelectedType: "Taxi"
wasOverridden: true
userReason: "Testing override - this is actually a taxi booking"
```

### Scenario 3: Low Confidence Detection

**Input**: Paste an ambiguous email (e.g., short car booking)

**Expected**:
- AI detects a type with lower confidence (e.g., 55%)
- Scoring shows fewer matches
- More alternatives listed
- You can review and decide

**This is where human oversight adds value!**

---

## Verifying the System Works

### Check Console Logs

When you analyze an email, look for:

```
📧 Email analysis request received, text length: 1247
🔍 Running type detection...
[DetectPaste] Detected: YES, Type: Private Driver, Confidence: 0.92
[DetectPaste] Companies: tabi pirka
[DetectPaste] Phrases: driver will be waiting, showing a name board
✅ Detection complete: Private Driver (92%)
📋 Loading all reservation types...
✅ Loaded 33 reservation types
```

When you click Continue:

```
📧 Email extraction request received, text length: 1247
📋 Pre-detected type provided: Private Driver
📋 Mapped "Private Driver" (Travel) → private-driver → private-driver-extraction
🤖 Starting AI extraction with private-driver schema...
📝 Logging extraction feedback...
✅ Feedback logged successfully
✅ Successfully extracted private driver transfer
```

### Check Database

```sql
-- View all feedback
SELECT 
  id,
  aiTopType,
  aiConfidence,
  userSelectedType,
  wasOverridden,
  userReason,
  createdAt
FROM "ExtractionFeedback"
ORDER BY createdAt DESC;

-- Get accuracy statistics
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN wasOverridden = false THEN 1 END) as approved,
  COUNT(CASE WHEN wasOverridden = true THEN 1 END) as overridden,
  ROUND(COUNT(CASE WHEN wasOverridden = false THEN 1 END)::numeric / COUNT(*) * 100, 1) as accuracy_rate
FROM "ExtractionFeedback";

-- Find confusion patterns
SELECT 
  aiTopType,
  userSelectedType,
  COUNT(*) as count
FROM "ExtractionFeedback"
WHERE wasOverridden = true
GROUP BY aiTopType, userSelectedType
ORDER BY count DESC;
```

---

## What Gets Logged

### Approval (AI Correct)
```json
{
  "aiTopType": "Private Driver",
  "aiConfidence": 0.92,
  "aiScoring": {
    "companyMatches": { "score": 0.8, "matches": ["tabi pirka"] },
    "semanticPhrases": { "score": 0.6, "matches": ["driver will be waiting", "showing a name board"] },
    "confirmationKeywords": { "score": 0.2, "matches": ["booking confirmed"] }
  },
  "userSelectedType": "Private Driver",
  "wasOverridden": false,
  "userReason": null
}
```

### Override (AI Wrong)
```json
{
  "aiTopType": "Private Driver",
  "aiConfidence": 0.92,
  "aiScoring": { ... },
  "userSelectedType": "Taxi",
  "wasOverridden": true,
  "userReason": "No driver name or vehicle details - this is an on-demand taxi"
}
```

---

## Troubleshooting

### Issue: Type approval screen doesn't appear

**Cause**: Analysis endpoint might have failed

**Fix**:
1. Check browser console for errors
2. Check server logs for API errors
3. Verify `/api/admin/email-extract/analyze` endpoint exists

### Issue: Dropdown shows no types

**Cause**: Database query failed or returned empty

**Fix**:
1. Check if `ReservationType` table has data
2. Run: `npx prisma db push` to sync schema
3. Run: `npx tsx prisma/seed.js` to seed data

### Issue: Feedback not logging

**Cause**: ExtractionFeedback table doesn't exist or API failed

**Fix**:
1. Verify table exists: `SELECT * FROM "ExtractionFeedback" LIMIT 1;`
2. Check server logs for feedback API errors
3. Verify auth session is valid

### Issue: Scoring breakdown not showing

**Cause**: Detection API not returning enhanced format

**Fix**:
1. Check detection API logs
2. Verify `scoringBreakdown` field in response
3. Clear browser cache and retry

---

## Success Criteria

After testing, verify:

- [ ] Email input screen renders
- [ ] "Analyze Email" button works
- [ ] Type approval screen appears after analysis
- [ ] AI detected type is shown with confidence
- [ ] Scoring breakdown displays with matched items
- [ ] Alternative types list appears
- [ ] Dropdown contains all 33 types grouped by category
- [ ] Selecting AI's type shows "Continue with AI Selection"
- [ ] Changing type shows feedback textarea
- [ ] Feedback textarea is labeled "Why was AI wrong?"
- [ ] "Continue with Override" button appears when type changed
- [ ] Clicking continue triggers extraction
- [ ] Extracted data displays correctly
- [ ] Database has new ExtractionFeedback entry
- [ ] Console logs show feedback logging
- [ ] Statistics endpoint returns data

---

## Next Steps After Testing

1. **Collect Real Feedback**: Use the system with 20-30 different emails
2. **Review Patterns**: Check which types AI confuses most
3. **Add Keywords**: Update detection based on override patterns
4. **Build Analytics Dashboard**: Visualize accuracy over time
5. **Implement Remaining Handlers**: Create taxi, ride-share, and other type-specific schemas

---

## Example Test Emails to Try

### Test 1: Private Driver (Should detect correctly)
- Your tabi pirka email
- Expected: Private Driver (high confidence)

### Test 2: Car Rental (Traditional)
- Any Hertz/Enterprise email
- Expected: Car Rental (high confidence)
- Should NOT confuse with Private Driver

### Test 3: Taxi Booking
- Create a sample taxi email without driver details
- Expected: Taxi OR Generic (moderate confidence)
- Test override if detected as Private Driver

### Test 4: Ride Share
- Sample Uber/Lyft scheduled ride
- Expected: Ride Share (high confidence)
- Should NOT confuse with Private Driver or Taxi

### Test 5: Ambiguous Email
- Short email with minimal details
- Expected: Low confidence, multiple alternatives
- **This is where human review is valuable!**

---

## Monitoring Feedback

### View Recent Feedback

```sql
SELECT 
  LEFT(emailText, 50) as email_preview,
  aiTopType,
  ROUND(aiConfidence * 100) as ai_confidence,
  userSelectedType,
  CASE WHEN wasOverridden THEN '🔄 Override' ELSE '✅ Approved' END as status,
  userReason,
  createdAt
FROM "ExtractionFeedback"
ORDER BY createdAt DESC
LIMIT 20;
```

### Find Problem Areas

```sql
-- Types with highest override rate
SELECT 
  aiTopType,
  COUNT(*) as total_detections,
  COUNT(CASE WHEN wasOverridden THEN 1 END) as overrides,
  ROUND(COUNT(CASE WHEN wasOverridden THEN 1 END)::numeric / COUNT(*) * 100, 1) as override_rate
FROM "ExtractionFeedback"
GROUP BY aiTopType
HAVING COUNT(*) >= 3
ORDER BY override_rate DESC;
```

### Common Corrections

```sql
-- Most frequent AI mistake → User correction pairs
SELECT 
  aiTopType as ai_said,
  userSelectedType as user_said,
  COUNT(*) as times,
  STRING_AGG(DISTINCT LEFT(userReason, 50), ' | ') as common_reasons
FROM "ExtractionFeedback"
WHERE wasOverridden = true
GROUP BY aiTopType, userSelectedType
ORDER BY times DESC
LIMIT 10;
```

---

## Success!

When everything works, you should see:

1. ✅ Smooth 3-step flow (input → approval → complete)
2. ✅ Clear AI reasoning display
3. ✅ Easy type selection and override
4. ✅ Feedback captured in database
5. ✅ Learning data accumulating

**The system is now learning from every extraction!** 🎓
