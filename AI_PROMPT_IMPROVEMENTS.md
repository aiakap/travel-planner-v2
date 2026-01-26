# AI Prompt Improvements for Card Generation

## Issue

After rollback to fa6cce1:
- ✅ RELATED_SUGGESTIONS cards ARE being generated
- ❌ AUTO_ADD cards are NOT being generated
- ❌ TOPIC_CHOICE cards are NOT being generated

## Changes Made to System Prompt

### 1. Made AUTO_ADD Mandatory

**Before:**
```
When user mentions ANY travel-related preference, respond with:
[AUTO_ADD: {...}]
```

**After:**
```
**CRITICAL: When user mentions ANY travel-related preference, you MUST respond with AUTO_ADD first:**
[AUTO_ADD: {...}]

**IMPORTANT RULES:**
- ALWAYS generate AUTO_ADD when user states a preference
- Generate multiple AUTO_ADD cards if user mentions multiple items
- AUTO_ADD items are automatically saved to the user's profile
- NEVER skip AUTO_ADD - it's required for every preference mentioned
```

### 2. Added Complete Response Examples

**Before:** Just showed the card syntax

**After:** Shows complete responses with:
- AUTO_ADD card(s)
- Brief acknowledgment text
- Follow-up RELATED_SUGGESTIONS or TOPIC_CHOICE cards

Example:
```
User: "I love hiking and mountain biking"
Response:
[AUTO_ADD: {"category": "activities", "subcategory": "outdoor", "value": "Hiking"}]
[AUTO_ADD: {"category": "activities", "subcategory": "outdoor", "value": "Mountain Biking"}]

Great! I've added hiking and mountain biking to your profile.

[RELATED_SUGGESTIONS: {
  "primary": "Hiking",
  "suggestions": [...]
}]
```

### 3. Emphasized Card Generation Requirements

Changed from:
- "You can optionally suggest related items"

To:
- "ALWAYS include at least ONE of these after AUTO_ADD"
- "Generate these cards in EVERY response that has AUTO_ADD"

## Testing Instructions

**Test 1: AUTO_ADD Generation**
1. Go to `/object/profile_attribute`
2. Type: "I love dancing"
3. Expected:
   - ✅ AUTO_ADD card appears with "Dancing"
   - ✅ Brief acknowledgment text
   - ✅ RELATED_SUGGESTIONS or TOPIC_CHOICE card follows

**Test 2: Multiple AUTO_ADD**
1. Type: "I enjoy swimming and cycling"
2. Expected:
   - ✅ AUTO_ADD card for "Swimming"
   - ✅ AUTO_ADD card for "Cycling"
   - ✅ Follow-up suggestions

**Test 3: TOPIC_CHOICE Generation**
1. Type: "I like trying new foods"
2. Expected:
   - ✅ AUTO_ADD card for food preference
   - ✅ TOPIC_CHOICE card asking about cuisine types

## Console Logs to Check

Look for these in the browser console:
```
🔍 [RESPONSE PARSER] Parsed AUTO_ADD card: {category: "...", subcategory: "...", value: "..."}
🔍 [RESPONSE PARSER] Parsed RELATED_SUGGESTIONS card: {...}
🔍 [RESPONSE PARSER] Parsed TOPIC_CHOICE card: {...}
```

## Why This Should Work

1. **Explicit Instructions**: Added "MUST", "ALWAYS", "NEVER skip"
2. **Complete Examples**: Shows full response format, not just card syntax
3. **Clear Rules**: Numbered list of when to use each card type
4. **Emphasis**: Used bold, caps, and repetition to reinforce requirements

## If It Still Doesn't Work

If AUTO_ADD still doesn't generate:

1. **Check raw AI response** - Look in network tab for `/api/object/chat` response
2. **Verify AI model** - Make sure we're using GPT-4 (not 3.5)
3. **Test with simpler prompt** - Try removing some complexity
4. **Add few-shot examples** - Include more example conversations in message history

## Files Modified

- `app/object/_configs/profile_attribute.config.ts` - Enhanced system prompt with:
  - Mandatory AUTO_ADD requirements
  - Complete response examples
  - Stronger emphasis on card generation
