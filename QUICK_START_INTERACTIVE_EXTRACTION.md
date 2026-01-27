# Quick Start: Interactive Email Extraction

## What's New?

Your email extraction now has an **interactive approval step** where you can:
- ✅ See why AI chose a type (scoring breakdown)
- ✅ Approve or override the AI's decision
- ✅ Provide feedback when AI is wrong
- ✅ System learns from your corrections

---

## Using the New System

### Step-by-Step

1. **Go to**: `http://localhost:3000/admin/email-extract`

2. **Paste your email** (e.g., the tabi pirka private driver email)

3. **Click**: "Analyze Email" (not "Extract" - that's the old button)

4. **Review the AI's decision**:
   ```
   AI Detected Type: Private Driver (92% confidence)
   
   Detection Reasoning:
     Company Matches: +0.8 (tabi pirka)
     Semantic Phrases: +0.6 ("driver will be waiting")
     Confirmation Keywords: +0.2 ("booking confirmed")
   
   Other Possible Types:
     Car Rental (45%), Taxi (32%), Ride Share (28%)
   ```

5. **Make your decision**:
   - **If AI is correct**: Just click "Continue with AI Selection"
   - **If AI is wrong**: 
     - Select correct type from dropdown
     - Type a reason (e.g., "This is a taxi, not private driver - no assigned driver")
     - Click "Continue with Override"

6. **System extracts** with your approved type

7. **Feedback is logged** for future learning

---

## For Your Private Driver Email

Expected detection:
```
Type: Private Driver
Confidence: 92%
Reason: Matched "tabi pirka", "driver will be waiting", "showing a name board"
```

Just click "Continue with AI Selection" - AI got it right! ✅

---

## When to Override

Override if you see:
- ❌ AI detected "Taxi" but email has assigned driver details → Change to "Private Driver"
- ❌ AI detected "Private Driver" but it's a Hertz rental → Change to "Car Rental"  
- ❌ AI detected "Car Rental" but it's an Uber → Change to "Ride Share"
- ❌ AI detected wrong category entirely → Change to correct type

**Your feedback helps the AI learn!**

---

## What Gets Logged

Every time you use the system, it logs:

**If you approve**:
```
✅ AI: Private Driver (92%)
✅ User: Private Driver (approved)
✅ Feedback: System learns it was correct
```

**If you override**:
```
🔄 AI: Private Driver (92%)
🔄 User: Taxi (overridden)
📝 Reason: "No driver details - this is an on-demand taxi"
🧠 Feedback: System learns to distinguish these cases
```

---

## Viewing Learning Data

Check the database:
```sql
-- See recent decisions
SELECT 
  aiTopType,
  userSelectedType,
  CASE WHEN wasOverridden THEN 'Override' ELSE 'Approved' END as result,
  userReason,
  createdAt
FROM "ExtractionFeedback"
ORDER BY createdAt DESC
LIMIT 10;

-- Get accuracy rate
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN wasOverridden = false THEN 1 END) as correct,
  ROUND(AVG(CASE WHEN wasOverridden = false THEN 100.0 ELSE 0.0 END), 1) || '%' as accuracy
FROM "ExtractionFeedback";
```

Or use the API:
```bash
curl http://localhost:3000/api/admin/feedback/extraction-type
```

---

## Tips

1. **Take a moment to review** - The AI is usually right, but it's worth checking
2. **Provide feedback when wrong** - Even a short reason helps (e.g., "no driver name")
3. **Trust the scoring** - High confidence (>80%) is usually accurate
4. **Check alternatives** - If they're close in score, AI was uncertain
5. **Use all 33 types** - Don't force into wrong category

---

## Troubleshooting

**Q: Don't see the approval screen?**  
A: Click "Analyze Email" (not "Extract Booking Info")

**Q: Dropdown is empty?**  
A: Database might need seeding. Run: `npx tsx prisma/seed.js`

**Q: Feedback not logging?**  
A: Check if you're logged in. Feedback requires authentication.

**Q: AI always detects wrong type?**  
A: That's okay! Override it and provide feedback. The system will learn.

---

## What's Next

After you test:
1. Try 10-20 different emails
2. Note which types AI confuses
3. Review feedback in database
4. Identify patterns (e.g., "Private Driver vs Taxi confusion")
5. We'll use this data to improve detection

---

## The Power of This System

**Traditional**: AI extracts → Hope it's right → Fix manually if wrong

**New System**: AI proposes → You review → You approve or correct → System learns

**Result**: Gets better every time you use it! 🎓

---

## Ready to Test?

```bash
npm run dev
```

Then go to: `http://localhost:3000/admin/email-extract`

Paste your tabi pirka email and see the magic! ✨
