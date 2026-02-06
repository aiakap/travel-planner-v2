# Complete Object-Based Chat System - User Guide

## Overview

The object-based chat system provides multiple specialized conversational interfaces:
1. **Journey Architect** - Build travel timeline structures (Journeys & Chapters)
2. **Profile Builder** - Build travel profiles through conversation
3. **Trip Chat** - Manage trips with AI assistance for bookings
4. **Trip Explorer** - Create trip structures before committing

---

# Journey Architect Guide

## Overview

The Journey Architect is an AI-powered timeline builder that uses strict terminology (Journey/Chapter/Moment) and acts as an "Intelligent Drafter" to create trip structures.

### Key Concepts

- **Journey**: The entire trip/timeline (maps to Trip in database)
- **Chapter**: Segments or blocks of time (e.g., "Travel", "Stay") (maps to Segment)
- **Moment**: Granular details/activities (NOT the focus - added later)

### Core Behavior

The AI acts as an "Intelligent Drafter":
- Takes partial information
- Infers missing pieces
- Proposes complete draft immediately
- Estimates travel time automatically
- Uses aspirational naming

### Example Usage

**User Input**: "Hokkaido from SFO Jan 29 - Feb 7th for skiing"

**AI Response**:
- Creates "Hokkaido Winter Expedition" journey
- Adds 2-day Travel Chapter (long-haul flight)
- Adds 7-day Stay Chapter ("Hokkaido Alpine Adventure")
- Shows markdown table with dates and day numbers
- Right panel displays editable timeline with auto-save

### Travel Time Estimation

- **Long-haul** (US to Asia/Europe): 1-2 days for Travel Chapter
- **Short-haul/Domestic**: 1 day for Travel Chapter
- **Multi-city**: Splits Stay Chapters evenly

### Scope Control

If you ask for hotels, flights, or restaurants (Moments):
- AI politely declines
- Explains focus is on structure (Chapters)
- Suggests finalizing timeline first
- Shows INFO_REQUEST card

### Access

Visit: `/object/journey_architect`

---

# Profile Builder Guide

## Overview

The profile graph builder combines three powerful features:
1. **Bubble Suggestions** - Rapid-fire profile building
2. **Interactive Canvas** - Drag, zoom, organize visually
3. **Follow-Up Questions** - Guided exploration (planned)

## Full User Experience

### Step 1: Start with Blank Canvas

```
┌─────────────────────────────────────────────────────────────┐
│  Profile Graph Builder                                      │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  ✨ Build Profile    │                                      │
│                      │         Your Profile Graph           │
│  AI: Hi! Tell me     │                                      │
│  about yourself...   │    Start chatting to build your     │
│                      │    profile! Share information...     │
│  [I fly United...]   │                                      │
│  [I have 5 kids]     │                                      │
│                      │                                      │
│  [Type message...][→]│                                      │
└──────────────────────┴──────────────────────────────────────┘
```

### Step 2: Type Message & Get Bubbles

```
┌─────────────────────────────────────────────────────────────┐
│  Profile Graph Builder                                      │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  You: I'm a          │                                      │
│  triathlete who      │                                      │
│  flies United        │                                      │
│                      │         Your Profile Graph           │
│  AI: Impressive!     │                                      │
│  How often do you    │    Start chatting to build your     │
│  compete?            │    profile! Share information...     │
│                      │                                      │
│  Add to profile:     │                                      │
│  [Triathlon 🟢 ×]    │                                      │
│  [Swimming 🟢 ×]     │                                      │
│  [Cycling 🟢 ×]      │                                      │
│  [Running 🟢 ×]      │                                      │
│  [United 🔵 ×]       │                                      │
│                      │                                      │
│  Tell me more:       │                                      │
│  [Competition level] │                                      │
│  [Training schedule] │                                      │
└──────────────────────┴──────────────────────────────────────┘
```

### Step 3: Click Bubbles (Rapid-Fire)

```
User clicks bubbles rapidly:

[Triathlon ×] → fade out...
[Swimming ×] → fade out...
[Cycling ×] → fade out...
[Running ×] → fade out...
[United ×] → fade out...

All gone in 2 seconds! ⚡
```

### Step 4: Graph Builds Dynamically

```
┌─────────────────────────────────────────────────────────────┐
│  Profile Graph Builder                    [Color: Default ▼]│
│                                           [Clear All]        │
├──────────────────────┬──────────────────────────────────────┤
│                      │                                      │
│  AI: Great! What     │              (You)                   │
│  else?               │                •                     │
│                      │         ┌──────┴──────┐             │
│  Tell me more:       │         │             │             │
│  [Travel class]      │    [Hobbies]    [Travel Pref]       │
│  [Destinations]      │         │             │             │
│                      │     [Sports]      [United Airlines]  │
│  [Type message...][→]│    ┌──┼──┼──┐                       │
│                      │    │  │  │  │                       │
│                      │  [Tri][Sw][Cy][Ru]                  │
│                      │                                      │
│                      │  Legend:                             │
│                      │  🟢 Hobbies                          │
│                      │  🔵 Travel Preferences               │
└──────────────────────┴──────────────────────────────────────┘
```

Notice: **Sports subnode auto-created** because 4 sports items!

### Step 5: Drag to Organize

```
User drags "Hobbies" category to the right:

Before:
    (You)
   /    \
[Hobbies] [Travel]

After (dragged):
    (You)
   /        \
[Travel]    [Hobbies]
```

### Step 6: Add More Items

```
User: "I also fly American Airlines"

Bubbles:
[American Airlines 🔵 ×]

User clicks → Added!

Graph updates:
Travel Preferences
        │
    [Airlines] ← Subnode auto-created!
     /      \
[United]  [American]
```

### Step 7: Customize Colors

```
User clicks [Color: Default ▼]

┌─────────────────────────────┐
│ ● ● ● ● ● ● Default     ✓  │
│ ● ● ● ● ● ● Dark           │
│ ● ● ● ● ● ● Pastel         │
│ ● ● ● ● ● ● Vibrant        │
│                             │
│ [Customize Colors]          │
└─────────────────────────────┘

User selects "Pastel" → Graph colors change!
```

### Step 8: Delete Item

```
User hovers over "United Airlines":

[United Airlines ×] ← × appears

User clicks × :

┌─────────────────────────────────────┐
│ Delete "United Airlines"?           │
│                                     │
│ This will remove it from your       │
│ profile permanently.                │
│                                     │
│ [Cancel]              [Delete]      │
└─────────────────────────────────────┘

User confirms → Item fades out and removed!
```

## Complete Feature Set

### Chat Interface (Left Side)
- ✅ Bubble suggestions with +/- actions
- ✅ AI expansion (triathlete → 4 bubbles)
- ✅ Fade-out animations
- ✅ Prompt suggestions as bubbles
- ✅ Unified interface
- ✅ Rapid-fire clicking

### Graph Canvas (Right Side)
- ✅ Infinite canvas
- ✅ Drag nodes anywhere
- ✅ Zoom in/out (mouse wheel)
- ✅ Pan by dragging
- ✅ Auto-subnode creation (2+ items)
- ✅ 5 color scheme presets
- ✅ Custom color picker
- ✅ Node deletion with confirmation
- ✅ Clear all with confirmation
- ✅ Minimap navigation
- ✅ Zoom controls
- ✅ Fit view button
- ✅ Dot grid background

### Data Management
- ✅ Real-time graph updates
- ✅ XML persistence
- ✅ Export to XML
- ✅ Clear all data
- ✅ Delete individual items

## Keyboard Shortcuts

### Canvas Navigation
- **Mouse Wheel** - Zoom in/out
- **Click + Drag Background** - Pan
- **Escape** - Deselect nodes

### Future Shortcuts
- **Ctrl/Cmd + Z** - Undo
- **Ctrl/Cmd + Y** - Redo
- **Delete** - Delete selected node
- **Ctrl/Cmd + A** - Select all
- **Ctrl/Cmd + F** - Find node

## Tips & Tricks

### Building Profiles Fast
1. Type compound activities (triathlete, photographer, etc.)
2. Click all bubbles rapidly
3. Watch graph grow!

### Organizing Your Graph
1. Drag categories to preferred positions
2. Zoom in to focus on specific areas
3. Use minimap to navigate large graphs

### Visual Customization
1. Try different color schemes
2. Use Pastel for soft look
3. Use Vibrant for bold look
4. Customize specific categories

### Managing Your Profile
1. Hover over items to see delete button
2. Delete incorrect or outdated items
3. Use Clear All to start fresh
4. Export XML for backup

## Common Workflows

### Workflow 1: Quick Profile Build

```
1. Type: "I'm a triathlete who loves Paris"
2. Click all bubbles (6 items)
3. Type: "I fly United first class"
4. Click all bubbles (2 items)
5. Done! 8 items in 30 seconds
```

### Workflow 2: Detailed Exploration

```
1. Type: "I love photography"
2. Click [Photography ×]
3. Click prompt: [What do you photograph?]
4. Type: "Landscapes and travel"
5. Click [Landscapes ×] [Travel photography ×]
6. Continue exploring...
```

### Workflow 3: Organization

```
1. Build profile with bubbles
2. Switch to graph view
3. Drag nodes to organize visually
4. Group related items together
5. Zoom out to see full picture
```

### Workflow 4: Cleanup

```
1. Review your graph
2. Hover over outdated items
3. Click × to delete
4. Confirm deletion
5. Graph updates automatically
```

## Troubleshooting

### Bubbles Not Appearing
- Check you typed a specific statement
- Wait for AI response
- Scroll down in chat

### Can't Drag Nodes
- User node is not draggable (by design)
- Other nodes should drag smoothly
- Try clicking directly on node

### Subnode Not Creating
- Need 2+ items with same subcategory
- Example: Need 2 airlines for "Airlines" subnode
- Add more items to trigger

### Colors Not Changing
- Make sure you selected a scheme
- Custom colors override preset
- Refresh if needed

### Graph Too Zoomed In/Out
- Click "Fit View" button
- Or use zoom controls
- Or mouse wheel

## Summary

The complete system provides:

**Fast Profile Building**:
- Type naturally
- Click bubbles rapidly
- Watch graph grow

**Visual Organization**:
- Infinite canvas
- Drag and arrange
- Zoom and navigate

**Full Control**:
- Delete items
- Clear all
- Customize colors

**Smart Features**:
- Auto-subnodes
- AI expansion
- Guided exploration

Start building your profile at `/profile/graph`!
