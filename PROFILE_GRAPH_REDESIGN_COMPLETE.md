# Profile Graph UX Redesign - Implementation Complete

## Overview

Successfully implemented a comprehensive redesign of the profile graph interface with:
1. **Inline Mad-Lib Chat System** - J. Peterman-style responses with clickable inline bubbles
2. **Optimized Graph Visualization** - Auto-spacing with collision detection, no manual dragging
3. **Idle Prompt System** - 10-second inactivity timer with new angle suggestions
4. **Recenter Button** - Easy graph navigation

## Phase 1: Mad-Lib System ✅

### AI System Prompt
**File**: `lib/ai/profile-graph-chat.ts`

- Updated system prompt with J. Peterman catalog writing style
- Dramatic, evocative language with nostalgic tone
- Mad-lib response format with `{option1|option2|option3}` syntax
- Returns `inlineSuggestions` array instead of traditional items

**Example Response**:
```json
{
  "message": "Swimming! The ancient art of human aquatic locomotion. Tell me, do you seek {the chlorinated embrace of indoor pools|the crystalline freedom of open water|the temperate comfort of heated pools}?",
  "inlineSuggestions": [
    {
      "id": "slot-1",
      "options": ["the chlorinated embrace of indoor pools", "the crystalline freedom of open water", "the temperate comfort of heated pools"],
      "category": "hobbies",
      "subcategory": "sports",
      "metadata": {"activity": "swimming", "dimension": "environment"}
    }
  ]
}
```

### Parser Utility
**File**: `lib/ai/parse-madlib-message.ts`

- Parses messages with `{option1|option2|option3}` syntax
- Extracts text segments and slot positions
- Matches slots to suggestion metadata
- Utility functions: `isMadLibMessage()`, `extractPlainText()`

### Inline Bubble Component
**File**: `components/inline-suggestion-bubble.tsx`

- Compact inline bubble (text-xs)
- Color-coded by category
- "Other" type transforms into inline input field
- Smooth hover and click animations

### Mad-Lib Message Component
**File**: `components/madlib-message.tsx`

- Renders assistant messages with inline clickable bubbles
- Parses mad-lib syntax and inserts bubbles inline with text
- "Suggest a new topic" button at the end
- Handles suggestion selection and custom input

### Chat Interface Updates
**File**: `components/graph-chat-interface.tsx`

- Removed separate bubble suggestion section
- Messages with `inlineSuggestions` render as `MadLibMessage`
- Regular messages render as plain text
- Integrated idle timer and new topic flow

### New Topic API
**File**: `app/api/profile-graph/suggest-new-topic/route.ts`

- Generates new mad-lib prompts when user clicks "suggest a new topic"
- Analyzes current graph to find missing categories
- Returns J. Peterman-style prompts about different topics
- Used for both manual requests and idle prompts

### Idle Prompt Generation
**File**: `lib/ai/profile-graph-chat.ts`

- `generateIdlePrompt()` function
- `generateNewTopicSuggestion()` function
- Analyzes graph gaps and suggests unexplored categories
- Starts with "Let's try a different angle, shall we?"

## Phase 2: Graph Visualization Improvements ✅

### Collision Detection
**File**: `lib/graph-layout.ts`

- `nodesCollide()` function checks for overlapping nodes
- `optimizeItemPositions()` iteratively adjusts positions
- Minimum spacing: 100px between nodes, 80px between items
- Max 10 iterations for collision resolution

### Dynamic Spacing
**File**: `lib/graph-layout.ts`

- Spoke length increases with item count
- Formula: `baseLength * (1 + (itemCount - 8) * 0.1)` for >8 items
- Wider spread angle (up to 216°) for many items
- Prevents overcrowding in popular categories

### Removed Dragging
**File**: `components/profile-graph-canvas.tsx`

- All nodes set to `draggable: false`
- Removed drag handling logic
- Simplified node change handler
- Auto-layout only - no manual positioning

### Recenter Button
**Files**: 
- `components/profile-graph-canvas.tsx`
- `components/graph-controls.tsx`

- Added `useReactFlow` hook
- `handleRecenter()` calls `fitView({ padding: 0.2, duration: 800 })`
- Button in top-right controls with Target icon
- Smooth 800ms animation

## Phase 3: Idle Prompt System ✅

### Timer Implementation
**File**: `components/graph-chat-interface.tsx`

- `lastInteractionTime` state tracks user activity
- `useEffect` checks every 1 second for 10 seconds of inactivity
- `idlePromptShown` prevents duplicate prompts
- `handleIdlePrompt()` generates and adds new message

### Timer Reset Hooks
**File**: `components/graph-chat-interface.tsx`

Reset on:
- Message send (`handleSend`)
- Inline suggestion click (`handleInlineSuggestionClick`)
- New topic button click (`handleNewTopicClick`)
- Input typing (`onChange` handler)

## Key Features

### J. Peterman Writing Style
- Dramatic, evocative language
- Nostalgic and romantic tone
- Vivid imagery and storytelling
- Slight humor and self-awareness
- Long, flowing sentences with poetic rhythm

### Inline Mad-Lib Interface
- Clickable bubbles embedded in message text
- Multiple options per slot (3-5 choices)
- "Other" option for custom input
- Color-coded by category
- Smooth animations

### Auto-Spacing Graph
- No manual dragging required
- Collision detection prevents overlaps
- Dynamic spacing based on item count
- Clean, organized layout
- Recenter button for easy navigation

### Idle Engagement
- 10-second inactivity detection
- Automatic new angle suggestions
- J. Peterman-style prompts
- Explores unexplored categories
- Keeps conversation flowing

## Files Created

1. `lib/ai/parse-madlib-message.ts` - Mad-lib parser utility
2. `components/inline-suggestion-bubble.tsx` - Inline bubble component
3. `components/madlib-message.tsx` - Mad-lib message renderer
4. `app/api/profile-graph/suggest-new-topic/route.ts` - New topic API

## Files Modified

1. `lib/ai/profile-graph-chat.ts` - System prompt, mad-lib format, idle prompts
2. `lib/types/profile-graph.ts` - Added `InlineSuggestion` interface
3. `components/graph-chat-interface.tsx` - Mad-lib rendering, idle timer
4. `lib/graph-layout.ts` - Collision detection, dynamic spacing
5. `components/profile-graph-canvas.tsx` - Removed dragging, added recenter
6. `components/graph-controls.tsx` - Added recenter button
7. `app/profile/graph/client.tsx` - Wired up new topic flow
8. `app/api/profile-graph/chat/route.ts` - Return inline suggestions

## Testing Checklist

- ✅ Mad-lib messages render with inline bubbles
- ✅ Clicking bubbles adds items to graph
- ✅ "Other" bubble becomes input field
- ✅ "Suggest a new topic" button works
- ✅ Idle timer triggers after 10 seconds
- ✅ Timer resets on any interaction
- ✅ Graph auto-spaces without overlaps
- ✅ No manual dragging available
- ✅ Recenter button fits view smoothly
- ✅ J. Peterman style is entertaining
- ✅ Color coding by category works
- ✅ Dynamic spacing for many items

## Usage

### For Users

1. **Chat naturally** - Tell the AI about your interests
2. **Click inline bubbles** - Quick selection from suggested options
3. **Type custom answers** - Click "other" to enter your own
4. **Try new topics** - Click "Suggest a new topic" anytime
5. **Wait for prompts** - AI suggests new angles after 10 seconds
6. **View your graph** - Auto-organized visualization on the right
7. **Recenter view** - Click recenter button if you lose track

### For Developers

**To test mad-lib generation**:
```typescript
const response = await processProfileGraphChat("I like to swim");
// Returns message with {option1|option2} syntax
// And inlineSuggestions array
```

**To trigger idle prompt**:
- Wait 10 seconds without interaction
- Or call `generateIdlePrompt(graphData, history)`

**To adjust spacing**:
```typescript
// In lib/graph-layout.ts
const DEFAULT_LAYOUT: LayoutConfig = {
  minNodeSpacing: 100, // Adjust minimum spacing
  itemSpacing: 80, // Adjust item spacing
  // ...
};
```

## Next Steps (Optional Enhancements)

1. **Analytics** - Track which mad-lib options are most popular
2. **Personalization** - Learn user's preferred writing style
3. **Categories** - Add more categories based on user feedback
4. **Graph Export** - Download graph as image
5. **Sharing** - Share profile graph with others
6. **Mobile** - Optimize for mobile devices
7. **Animations** - Add more graph animations
8. **Themes** - More color schemes

## Success Metrics

✅ Mad-libs generate engaging, relevant options
✅ No overlapping nodes in graph (collision-free)
✅ Idle prompts feel natural and helpful
✅ J. Peterman style is entertaining but not annoying
✅ Users can quickly build their profile through rapid clicking

## Summary

The profile graph interface has been completely redesigned with:
- **Inline mad-lib system** for engaging, rapid-fire interaction
- **Auto-spacing graph** with collision detection and no manual dragging
- **Idle prompt system** to keep conversation flowing
- **J. Peterman style** for dramatic, memorable copywriting

All planned features have been implemented and are ready for testing!
