# Debug Checklist - Places Not Appearing

## Step 1: Check Server Terminal Logs

When you send a message, look for these logs in your **terminal** (where `npm run dev` is running):

### ✅ What you SHOULD see:
```
================================================================================
🔧 [TOOL INVOCATIONS DEBUG]
Total tool calls: 3
📞 Tool Call 1: { toolName: 'suggest_place', args: { placeName: '...' } }
✨ PLACE SUGGESTION DETECTED: { placeName: "Restaurant Name", category: "Dining", ... }
```

### ❌ If you see this instead:
```
🔧 [TOOL INVOCATIONS DEBUG]
Total tool calls: 0
⚠️  No tool calls made in this response
```
**Problem**: AI is not calling the suggest_place tool
**Solution**: The AI needs to be prompted more specifically

## Step 2: Check Browser Console Logs

Open your browser console (F12 or Cmd+Option+I) and look for:

### ✅ What you SHOULD see:
```
🔍 [getPlaceSuggestions] Analyzing message parts: { totalParts: 3, partTypes: [...] }
🔍 [getPlaceSuggestions] Part 0: { type: 'tool-result', toolName: 'suggest_place', hasResult: true }
✨ [getPlaceSuggestions] Found suggest_place result: { success: true, placeName: '...' }
✅ [getPlaceSuggestions] Added suggestion: Restaurant Name
📍 [getPlaceSuggestions] Place names: ['Restaurant Name']
```

### ❌ If you see this instead:
```
🔍 [getPlaceSuggestions] Total suggestions extracted: 0
⚠️  [renderTextWithPlaceLinks] No suggestions, rendering plain text
```
**Problem**: Tool results aren't being extracted properly
**Reason**: Message structure might be different than expected

## Step 3: Test with Specific Prompts

Try these EXACT prompts to force the AI to use suggest_place:

### Prompt 1 (Very Direct):
```
I need restaurant suggestions in Paris. Please use the suggest_place tool to recommend 3 specific restaurants with names.
```

### Prompt 2 (Explicit Tool Request):
```
Call the suggest_place tool for "Le Jules Verne" restaurant in Paris
```

### Prompt 3 (Context-Based):
```
I'm planning a trip to Tokyo. What are the best sushi restaurants? Give me 3 specific names.
```

## Step 4: Check Message Structure

In the browser console, look for the full message object. Add this temporarily to see it:

In your browser console, type:
```javascript
// After you get a response, check the last message
console.log('Last message:', window.lastMessage);
```

## Step 5: Common Issues & Solutions

### Issue 1: AI responds but doesn't call suggest_place
**Symptoms**: 
- Text mentions places but no clickable links
- Server logs show 0 tool calls

**Solutions**:
- Try: "Use suggest_place to recommend restaurants"
- Try: "Give me 3 specific restaurant names in Paris"
- Try: "What restaurants do you suggest?" (then click any mentioned)

### Issue 2: Tool is called but places not clickable
**Symptoms**:
- Server logs show suggest_place calls
- Browser logs show 0 suggestions extracted

**Debug**:
```javascript
// In browser console, after getting response:
// Check the message parts structure
console.log(messages[messages.length - 1].parts);
```

### Issue 3: Places don't match text
**Symptoms**:
- Server: ✅ suggest_place called
- Browser: ✅ suggestions extracted
- Browser: ❌ "Place name NOT FOUND in text"

**Example**:
- Tool call: `{ placeName: "Grand Hotel" }`
- AI text: "I recommend the Grand Hotel"
- Match fails because of "the " prefix

**Solution**: The flexible matching should handle this now, but check the logs

## Step 6: Manual Test API

Test if places API works directly:

```bash
npx tsx scripts/test-places-integration.ts
```

Should show:
```
✅ Found place: Osteria Francescana
✅ Found place: The Ritz London
✅ Found place: Eiffel Tower
```

## Step 7: Check Network Tab

1. Open browser DevTools
2. Go to "Network" tab
3. Filter by "places"
4. Send a chat message
5. Look for `/api/places` request
6. Check:
   - Request payload (placeName, tripId)
   - Response (should have placeData)

## Quick Fixes to Try

1. **Restart dev server**: Ctrl+C, then `npm run dev`
2. **Clear browser cache**: Hard reload (Cmd+Shift+R or Ctrl+Shift+R)
3. **Try a different browser**: Sometimes helps with cache issues
4. **Check you're logged in**: Some features require authentication

## What to Send Me

If still not working, send me:

1. **Your exact prompt**: "..."
2. **AI response text**: (copy the full text response)
3. **Server terminal logs**: (the 🔧 section)
4. **Browser console logs**: (the 🔍 sections)
5. **Screenshot**: (if helpful)

This will help me pinpoint exactly where the flow is breaking!
