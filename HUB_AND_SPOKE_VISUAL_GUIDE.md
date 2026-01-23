# Hub-and-Spoke Visual Guide

## The New Look

### Center: You

```
        ╔══════════════╗
        ║              ║
        ║   👤 YOU     ║  ← 128px gradient blue circle
        ║              ║  ← Fixed at center
        ╚══════════════╝  ← Not draggable
```

### Hubs: Categories

```
    ╔═══════════╗
    ║  TRAVEL   ║  ← 96px colored circle
    ║  PREF     ║  ← White border
    ║   (5)     ║  ← Item count badge
    ╚═══════════╝  ← DRAGGABLE! 🖱️
```

### Spokes: Items

```
    ╭─────────────╮
    │ United ✕    │  ← Pill-shaped bubble
    ╰─────────────╯  ← Colored border
                     ← Delete × on hover
                     ← NOT draggable
```

## Complete Graph Example

```
                    ╔════════════╗
                    ║            ║
                    ║  👤 YOU    ║
                    ║            ║
                    ╚════════════╝
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        │                │                │
    ╔═══════╗        ╔═══════╗       ╔═══════╗
    ║TRAVEL ║        ║HOBBIES║       ║FAMILY ║
    ║ PREF  ║        ║  (4)  ║       ║  (3)  ║
    ╚═══════╝        ╚═══════╝       ╚═══════╝
     /  |  \          /  |  \         /  |  \
    /   |   \        /   |   \       /   |   \
   /    |    \      /    |    \     /    |    \
  
╭────────╮ ╭────────╮ ╭────────╮ ╭────────╮ ╭────────╮
│United ✕│ │American│ │ Swim ✕ │ │ Bike ✕ │ │ Kid1 ✕ │
╰────────╯ ╰────────╯ ╰────────╯ ╰────────╯ ╰────────╯

╭────────╮ ╭────────╮ ╭────────╮ ╭────────╮ ╭────────╮
│  AA ✕  │ │First ✕ │ │ Run ✕  │ │Photo ✕ │ │ Kid2 ✕ │
╰────────╯ ╰────────╯ ╰────────╯ ╰────────╯ ╰────────╯

                                              ╭────────╮
                                              │ Kid3 ✕ │
                                              ╰────────╯
```

## With Subnodes

When you have 2+ items in same subcategory:

```
    ╔═══════════╗
    ║  TRAVEL   ║  ← Main hub
    ║   PREF    ║
    ╚═══════════╝
         │
         │
      ╔═════╗
      ║AIRLN║  ← Subnode (auto-created)
      ║ (2) ║  ← 64px, 85% opacity
      ╚═════╝
       /   \
      /     \
     /       \
╭────────╮ ╭────────╮
│United ✕│ │American│  ← Items radiate from subnode
╰────────╯ ╰────────╯
```

## Drag Interaction

### Before Drag

```
        [YOU]
          │
      ╔═══════╗
      ║HOBBIES║ ← Click and drag this
      ╚═══════╝
       /  |  \
      /   |   \
  [Swim][Bike][Run]
```

### During Drag

```
        [YOU]
          │
          │    ╔═══════╗
          │    ║HOBBIES║ ← Dragging...
          │    ╚═══════╝
          │     /  |  \
          │    /   |   \
          └→[Swim][Bike][Run]
```

### After Drag

```
        [YOU]
          │
          │         ╔═══════╗
          └─────────║HOBBIES║ ← New position!
                    ╚═══════╝
                     /  |  \
                    /   |   \
               [Swim][Bike][Run]
                    
Spokes followed the hub! ✨
```

## Color Coordination

Everything uses the category color:

```
    ╔═══════════╗
    ║  TRAVEL   ║  ← Blue background
    ║   PREF    ║
    ╚═══════════╝
         │
         │ ← Blue line (40% opacity)
         │
      ╔═════╗
      ║AIRLN║  ← Blue background (85% opacity)
      ╚═════╝
         │
         │ ← Blue line (40% opacity)
         │
    ╭────────╮
    │United ✕│  ← Blue border (3px)
    ╰────────╯
```

## Spacing & Angles

### Even Distribution

```
        [HUB]
       /  |  \
      /   |   \
     /    |    \
   [A]   [B]   [C]

Minimum 20° between spokes
Maximum 180° spread
```

### Many Items

```
        [HUB]
    / / | | \ \
   / /  |  \ \ \
  A B   C   D E F

Angles adjust automatically!
```

### With Subnode

```
        [HUB]
       /     \
      /       \
  [SUBNODE]  [Item]
    /   \
   /     \
 [A]     [B]

Subnode at 50% distance
Items at full distance
```

## Size Comparison

```
╔════════════╗  ← User: 128px
║  👤 YOU    ║
╚════════════╝

╔═══════════╗  ← Hub: 96px
║  TRAVEL   ║
╚═══════════╝

╔═════╗  ← Subnode: 64px
║AIRLN║
╚═════╝

╭────────╮  ← Item: 100-180px wide, 36px tall
│United ✕│
╰────────╯
```

## Hover States

### Hub Hover

```
Before:
╔═══════════╗
║  TRAVEL   ║
╚═══════════╝

After (hover):
╔═══════════╗  ← Scales to 110%
║  TRAVEL   ║  ← Larger shadow
╚═══════════╝  ← Cursor: grab hand
```

### Item Hover

```
Before:
╭────────╮
│United  │
╰────────╯

After (hover):
╭────────╮  ← Scales to 105%
│United ✕│  ← × appears top-right
╰────────╯  ← Larger shadow
```

## Real-World Example

### Profile: "Travel Enthusiast"

```
                    ╔════════════╗
                    ║            ║
                    ║  👤 ALEX   ║
                    ║            ║
                    ╚════════════╝
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        │                │                │
    ╔═══════╗        ╔═══════╗       ╔═══════╗
    ║TRAVEL ║        ║HOBBIES║       ║DESTIN ║
    ║ PREF  ║        ║  (3)  ║       ║ (4)   ║
    ║  (6)  ║        ╚═══════╝       ╚═══════╝
    ╚═══════╝         /  |  \         /  |  \
     /  |  \         /   |   \       /   |   \
    /   |   \    ╭────╮╭────╮╭────╮╭────╮╭────╮
   /    |    \   │Swim││Bike││Run ││Paris││Rome│
  /     |     \  ╰────╯╰────╯╰────╯╰────╯╰────╯
╔═════╗╔═════╗╭────╮                ╭────────╮╭────────╮
║AIRLN║║HOTEL║│1st │                │London ✕││Tokyo ✕ │
║ (2) ║║ (2) ║╰────╯                ╰────────╯╰────────╯
╚═════╝╚═════╝
 /   \  /   \
/     \/     \
╭────╮╭────╮╭────╮╭────╮
│UA ✕││AA ✕││Hyatt││Marr│
╰────╯╰────╯╰────╯╰────╯
```

## Layout Math

### Hub Positions

```
Hub 0 (Travel):  angle = 0°     → (300, 0)
Hub 1 (Hobbies): angle = 120°   → (-150, 260)
Hub 2 (Destin):  angle = 240°   → (-150, -260)

All 300px from center
Evenly distributed in circle
```

### Spoke Positions

```
Hub at (300, 0)
3 items: Swim, Bike, Run

Swim:  angle = -20° → (300 + 169, -61)
Bike:  angle = 0°   → (300 + 180, 0)
Run:   angle = +20° → (300 + 169, 61)

20° between each spoke
180px from hub
```

## Interaction Guide

### What You Can Do

✅ **Drag hubs** - Move categories around
✅ **Zoom in/out** - Mouse wheel
✅ **Pan canvas** - Drag background
✅ **Delete items** - Hover + click ×
✅ **Change colors** - Color scheme selector
✅ **Clear all** - Start fresh

### What Happens Automatically

🤖 **Hubs arrange** - In circle around you
🤖 **Spokes radiate** - From hubs
🤖 **Subnodes form** - When 2+ items
🤖 **Spokes follow** - When hub dragged
🤖 **Spacing adjusts** - For new items
🤖 **Colors coordinate** - All elements

## Tips for Best Layout

### 1. Let It Auto-Arrange
Don't fight the system - it's designed to look good!

### 2. Drag Hubs to Separate
If hubs overlap, drag them apart

### 3. Use Color Schemes
Try different themes for better visibility

### 4. Zoom Out for Overview
See the full picture

### 5. Zoom In for Details
Focus on specific areas

## Summary

The hub-and-spoke system gives you:

**Clear Structure**:
```
Center → Hubs → Spokes
  You → Categories → Items
```

**Easy Interaction**:
```
Drag hubs → Spokes follow
Add items → Auto-arrange
Delete items → Layout adjusts
```

**Beautiful Design**:
```
Gradient center
Colored hubs
Bubble spokes
Coordinated colors
```

**Automatic Everything**:
```
✨ Layout
✨ Spacing
✨ Subnodes
✨ Adjustments
```

Your profile graph now looks like a solar system with you at the center! 🌟
