# Mad-Lib Profile Graph - Quick Start Guide

## What's New?

The profile graph now uses an **inline mad-lib system** with J. Peterman-style writing for a more engaging, conversational experience.

## How It Works

### 1. User Types a Message
```
User: "I like to swim"
```

### 2. AI Responds with Mad-Lib
```
Swimming! The ancient art of human aquatic locomotion. 
Tell me, do you seek [indoor pools] [open water] [heated pools]? 
And when you swim, is it for [competition] [meditation] [exercise] [other]?
```

### 3. User Clicks Inline Bubbles
- Click any bubble to add that preference to your profile
- Click "other" to type a custom answer
- Graph updates automatically on the right

### 4. Explore New Topics
- Click "Suggest a new topic" button anytime
- Or wait 10 seconds - AI will prompt you automatically

## Key Features

### Inline Clickable Bubbles
- **Color-coded** by category (travel, hobbies, family, etc.)
- **Inline with text** - part of the conversation flow
- **Quick selection** - rapid-fire clicking to build profile
- **Custom input** - "other" option for personalized answers

### J. Peterman Style
- **Dramatic** - "The ancient art of human aquatic locomotion"
- **Evocative** - "The chlorinated embrace of indoor pools"
- **Storytelling** - Paints a picture with words
- **Humorous** - Slightly over-the-top but fun

### Auto-Spacing Graph
- **No dragging** - everything auto-positions
- **Collision-free** - nodes never overlap
- **Dynamic spacing** - adjusts based on item count
- **Recenter button** - easy navigation

### Idle Prompts
- **10-second timer** - detects inactivity
- **New angles** - explores different topics
- **Keeps flowing** - conversation never stalls

## Example Conversation

**User**: "I have 3 kids"

**AI**: "Ah, three children! A traveling party of five. Picture this: you're boarding a plane, your small tribe in tow, heading to [theme park paradise] [beach resort] [European city] [all-inclusive] [other]. You prefer to stay at [luxury resorts with kids' clubs] [family-friendly hotels] [vacation rentals] [boutique properties] [other]?"

**User**: *clicks "beach resort" and "vacation rentals"*

**Graph**: Updates with 2 new items in "destinations" and "travel-preferences" categories

**AI** (after 10 seconds): "Let's try a different angle, shall we? When you're not traveling, how do you spend your time? Perhaps [capturing the world through a lens] [pushing physical limits in athletic pursuit] [losing yourself in literature] [other]?"

## Tips for Best Experience

1. **Be specific** - "I fly United" is better than "I like planes"
2. **Click quickly** - Rapid-fire clicking builds profile fast
3. **Use "other"** - Don't see your answer? Type it!
4. **Try new topics** - Don't get stuck on one category
5. **Let it prompt you** - Idle timer helps explore new areas

## Technical Details

### Message Format
```json
{
  "message": "Text with {option1|option2|option3} slots",
  "inlineSuggestions": [
    {
      "id": "slot-1",
      "options": ["option1", "option2", "option3"],
      "category": "hobbies",
      "subcategory": "sports",
      "metadata": {"dimension": "environment"}
    }
  ]
}
```

### Slot Syntax
- `{option1|option2|option3}` - Multiple choice slot
- Options separated by `|` (pipe character)
- Parsed and rendered as inline bubbles
- Always include "other" as last option

### Color Coding
- **Blue** - Travel Preferences
- **Green** - Family
- **Purple** - Hobbies
- **Orange** - Spending Priorities
- **Pink** - Travel Style
- **Teal** - Destinations
- **Gray** - Other

## Troubleshooting

**Bubbles not showing?**
- Check that message has `{option1|option2}` syntax
- Verify `inlineSuggestions` array is populated

**Idle timer not working?**
- Must have at least 2 messages in conversation
- Timer resets on any interaction (typing, clicking)
- Check browser console for "⏰ [Idle Timer]" logs

**Graph overlapping?**
- Collision detection should prevent this
- Try recenter button
- Check `minNodeSpacing` in `lib/graph-layout.ts`

**"Other" input not working?**
- Click the "other" bubble
- Input field should appear inline
- Type and press Enter

## Next Steps

1. Navigate to `/profile/graph`
2. Start chatting about your interests
3. Click inline bubbles to build your profile
4. Watch the graph grow on the right
5. Try "Suggest a new topic" for variety
6. Let the idle timer surprise you!

Enjoy building your profile with style! 🎩✨
