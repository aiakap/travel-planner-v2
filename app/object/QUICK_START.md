# Object Chat System - Quick Start Guide

## Getting Started in 5 Minutes

### Step 1: Start the Dev Server

```bash
npm run dev
```

### Step 2: Navigate to an Object Type

Open your browser and go to one of these URLs:

**Trip Chat** (requires existing trip):
```
http://localhost:3000/object/new_chat?tripId=YOUR_TRIP_ID
```

**Profile Builder**:
```
http://localhost:3000/object/profile_attribute
```

**Trip Creator**:
```
http://localhost:3000/object/trip_explorer
```

### Step 3: Test the Interface

1. **Type a message** in the chat input
2. **Press Enter** or click "Send"
3. **See AI response** with interactive cards
4. **Click card buttons** to take actions
5. **Watch right panel** update in real-time

### Step 4: Test Panel Controls

**Resize Panels:**
- Drag the divider between panels

**Collapse/Expand:**
- Click the arrow buttons in panel corners
- Or use keyboard shortcuts:
  - `Cmd/Ctrl + [` - Toggle left panel
  - `Cmd/Ctrl + ]` - Toggle right panel
  - `Cmd/Ctrl + \` - Reset to default

## Example Conversations

### Trip Chat (`/object/new_chat?tripId=xxx`)

```
You: Find hotels in Paris
AI: I found 3 hotels in Paris:
    [Hotel Card: Le Meurice]
    [Hotel Card: Plaza Athénée]
    [Hotel Card: Ritz Paris]
```

### Profile Builder (`/object/profile_attribute`)

```
You: I love skiing and snowboarding
AI: Great! I'll add these to your profile:
    [Suggestion: Skiing]
    [Suggestion: Snowboarding]
```

### Trip Creator (`/object/trip_explorer`)

```
You: I'm going to Japan from Jan 30 to Feb 6
AI: Here's a suggested trip structure:
    [Trip Structure Card]
    - Arrival in Tokyo (Jan 30)
    - Travel to Niseko (Jan 31)
    - Skiing in Niseko (Jan 31 - Feb 5)
    - Return to Tokyo (Feb 6)
```

## Troubleshooting

### "Object type not found"
- Make sure the URL is correct: `/object/new_chat` (not `/object/newchat`)
- Check that the config is registered in `_configs/registry.ts`

### "No data yet"
- For `new_chat`, make sure you include `?tripId=xxx` in the URL
- For `profile_attribute` and `trip_explorer`, this is normal on first visit

### AI not responding
- Check that `ANTHROPIC_API_KEY` is set in `.env`
- Check browser console for errors
- Check server logs for API errors

### Cards not appearing
- Check that the AI response includes card syntax: `[HOTEL_CARD: {...}]`
- Check browser console for parsing errors
- Verify card type is registered in config's `cardRenderers`

## Next Steps

1. **Read the full README**: `app/object/README.md`
2. **Create your own object type**: Follow the guide in README
3. **Customize styling**: Replace inline styles with Tailwind
4. **Add more features**: Implement card actions, real-time updates, etc.

## Need Help?

Check these files:
- `app/object/README.md` - Full documentation
- `OBJECT_CHAT_IMPLEMENTATION_COMPLETE.md` - Implementation details
- `app/object/_configs/new_chat.config.ts` - Example config
- `app/object/_core/chat-layout.tsx` - Core layout component

Happy coding! 🚀
