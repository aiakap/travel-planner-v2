# Quick Start Guide - Places API Integration

## 🚀 What's New

Your travel planner now has powerful new features:

### ✨ Clickable Place Suggestions
- AI-suggested places appear as **blue clickable links** with sparkle (✨) or pin (📍) icons
- Click any place to see photos, ratings, and details from Google Places
- One-click add to your itinerary

### ⏰ Smart Scheduling
- Automatic time suggestions based on activity type
- Real-time conflict detection
- Alternative time slot recommendations
- Visual indicators for conflicts and availability

## 🎯 Quick Setup

### 1. Environment Variables

Add to your `.env` file:

```bash
GOOGLE_PLACES_API_KEY=your_google_places_key
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

**Get API Keys:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Places API" and "Maps JavaScript API"
3. Create credentials (API keys)
4. Copy keys to `.env`

### 2. Test the Integration

```bash
# Test Google Places API
npm run test-places

# Start development server
npm run dev
```

## 📝 How to Use

### For Users

1. **Chat with AI:**
   ```
   "Suggest restaurants in Paris"
   "Find hotels in Tokyo"
   "What activities in Rome?"
   ```

2. **Click Place Names:**
   - Look for blue text with ✨ icon
   - Click to open details modal

3. **Review & Add:**
   - See photos, ratings, contact info
   - Check suggested time (AI picks best slot)
   - If conflict: see alternatives
   - Click "Add to Itinerary"

### For Developers

**Key Files:**
- `components/suggestion-detail-modal.tsx` - Main modal with all features
- `lib/actions/check-conflicts.ts` - Conflict detection logic
- `lib/smart-scheduling.ts` - Scheduling algorithm

**Customize Scheduling Defaults:**

Edit `lib/smart-scheduling.ts`:
```typescript
function getDefaultTimeForType(category: string, type: string) {
  switch (category) {
    case "Dining":
      if (type.includes("breakfast")) return { startTime: "08:00", ... }
      if (type.includes("lunch")) return { startTime: "12:00", ... }
      return { startTime: "19:00", ... } // dinner
    // ... customize for your needs
  }
}
```

## 🔍 Visual Guide

### Before (Broken):
```
"I recommend Osteria Francescana for dinner"
                      ^^^ plain text, not clickable
```

### After (Fixed):
```
"I recommend Osteria Francescana ✨ for dinner"
                      ^^^ blue, underlined, clickable
```

### Scheduling UI:

**No Conflicts:**
```
┌─────────────────────────────────────┐
│ ✅ No conflicts - time slot available│
└─────────────────────────────────────┘
```

**With Conflicts:**
```
┌──────────────────────────────────────────┐
│ ⚠️ Time conflict with 1 reservation      │
│   ℹ️ Dinner at La Pergola (Dining)      │
│      7:00 PM - 9:00 PM                   │
└──────────────────────────────────────────┘

💡 Suggested alternatives:
┌─────────────────────────────────────┐
│ 🕐 5:00 PM - 7:00 PM               │
│    Close to your preferred time     │
└─────────────────────────────────────┘
```

## 🎨 Features Showcase

### 1. Place Modal
- **Header:** Place photo from Google
- **Info:** Name, category badge, rating with stars
- **Details:** Address with map link, opening hours
- **Contact:** Call button, website link
- **AI Notes:** Recommendations from conversation
- **Scheduling:** Smart suggestions with conflict detection

### 2. Conflict Detection
- **Green Badge:** ✅ Time available
- **Amber Badge:** ⚠️ Conflicts detected
- **Details:** Shows what conflicts and when
- **Alternatives:** 2-3 smart suggestions

### 3. Scheduling Reason
- **Prominent Display:** Blue badge with sparkle icon
- **Explanations:**
  - "Based on your conversation" (from chat)
  - "Next available time on that day"
  - "Optimal time slot found"
  - "Default time for this activity"

## 🐛 Troubleshooting

### Places not clickable?
- Check browser console for errors
- Verify AI is calling `suggest_place` tool
- Try: "Suggest restaurants" instead of just naming places

### Modal not loading data?
- Check `GOOGLE_PLACES_API_KEY` in `.env`
- Verify Places API is enabled in Google Cloud
- Check server logs: `npm run dev` output

### No alternatives shown?
- Day might be fully booked
- Try a different day
- Check existing reservations have times set

### Test the API:
```bash
npm run test-places
```

Expected output:
```
🧪 Testing Google Places API Integration

Test 1: Searching for 'Osteria Francescana' in 'Modena, Italy'
✅ Found place:
   Name: Osteria Francescana
   Address: Via Stella, 22, 41121 Modena MO, Italy
   Rating: 4.6
   ...
```

## 📚 Documentation

**Full Documentation:** `docs/PLACES_API_INTEGRATION.md`
**Implementation Details:** `IMPLEMENTATION_SUMMARY.md`

## 🎉 What's Working

✅ Interactive clickable place suggestions
✅ Google Places data with photos
✅ Real-time conflict detection
✅ Alternative time suggestions
✅ Smart scheduling with explanations
✅ Enhanced chat experience
✅ Zero linter errors
✅ TypeScript compilation successful

## 🚦 Next Steps

1. Set up API keys
2. Run `npm run test-places`
3. Start dev server: `npm run dev`
4. Open chat and try: "Suggest restaurants in Paris"
5. Click a place name
6. See the magic! ✨

## 💡 Pro Tips

- Be specific: "Find Italian restaurants in Manhattan" works better than "Find food"
- Let AI know preferences: "I like seafood, what's good in Boston?"
- Mention time context: "What's open for lunch on Day 2?"
- Use the alternatives: Click suggested times when conflicts occur

## 📞 Support

Issues? Check:
1. `docs/PLACES_API_INTEGRATION.md` - Troubleshooting section
2. Server logs - `npm run dev` output
3. Browser console - F12 developer tools
4. Test script - `npm run test-places`

Happy trip planning! 🌍✈️🗺️
