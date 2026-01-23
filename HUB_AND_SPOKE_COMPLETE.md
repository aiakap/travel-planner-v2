# Hub-and-Spoke Graph System - Complete

## Overview

Redesigned the profile graph to use an **automatic hub-and-spoke layout** that's intuitive and easy to understand. Hubs (categories) can be dragged around, and spokes (items) automatically radiate from them in a clean, organized pattern.

## Visual Design

### Structure

```
                    ╔════════╗
                    ║  YOU   ║  ← Center (fixed)
                    ╚════════╝
                        │
        ┌───────────────┼───────────────┐
        │               │               │
    ╔═══════╗       ╔═══════╗       ╔═══════╗
    ║ Travel║       ║Hobbies║       ║ Family║  ← Hubs (draggable)
    ╚═══════╝       ╚═══════╝       ╚═══════╝
     /  │  \         /  │  \         /  │  \
    /   │   \       /   │   \       /   │   \
   ●    ●    ●     ●    ●    ●     ●    ●    ●  ← Spokes (bubbles)
United  AA  First Swim Bike Run  Kid1 Kid2 Kid3
```

### Node Types

1. **Center Node (You)**
   - Large gradient blue circle (128px)
   - Fixed at center (0, 0)
   - Not draggable
   - User icon + name

2. **Hub Nodes (Categories)**
   - Medium colored circles (96px)
   - Positioned in ring around center
   - **DRAGGABLE** - user can move them
   - Shows category name + item count
   - White border for emphasis

3. **Sub-Hub Nodes (Subnodes)**
   - Smaller colored circles (64px)
   - Between hub and items
   - **DRAGGABLE** - moves with parent hub
   - Auto-created for 2+ items
   - Slightly transparent (85%)

4. **Spoke Nodes (Items)**
   - Pill-shaped bubbles
   - White with colored border
   - **NOT draggable** - fixed to hub
   - Radiate from hub
   - Delete × on hover

## Automatic Layout System

### Hub Positioning

```typescript
// Hubs arranged in circle around center
const angle = (hubIndex / totalHubs) * 2 * Math.PI;
const hubX = centerX + Math.cos(angle) * hubRadius;
const hubY = centerY + Math.sin(angle) * hubRadius;
```

**Default Settings**:
- Hub radius: 300px from center
- Spoke length: 180px from hub
- Min spoke angle: 20° between spokes

### Spoke Radiating

```typescript
// Spokes radiate from hub
const spokeAngle = hubAngle + (spokeIndex * angleSpread);
const spokeX = hubX + Math.cos(spokeAngle) * spokeLength;
const spokeY = hubY + Math.sin(spokeAngle) * spokeLength;
```

**Features**:
- Spokes evenly distributed around hub
- Max 180° spread per hub
- Minimum 20° between spokes
- Automatic spacing adjustment

### With Subnodes

```
Hub → Subnode → Items

Travel Preferences (hub)
    ↓
  Airlines (subnode, 50% distance)
   /  \
  /    \
United  American (items, full distance)
```

## Drag Behavior

### What's Draggable

✅ **Category Hubs** - Drag anywhere
✅ **Subnodes** - Drag anywhere (moves with spokes)
❌ **User Node** - Fixed at center
❌ **Item Bubbles** - Fixed to hub

### Spoke Recalculation

When you drag a hub:

1. **Hub moves** to new position
2. **Spokes recalculate** automatically
3. **Relative positions maintained**
4. **Smooth animation**

```typescript
// Recalculate spokes when hub moves
function recalculateSpokes(
  graphData: GraphData,
  hubId: string,
  newHubX: number,
  newHubY: number
): GraphData
```

**How it works**:
- Calculates relative angle/distance of each spoke
- Applies same relationship to new hub position
- Updates all connected nodes (subnodes + items)
- Preserves visual structure

### Example

```
Before drag:
    [Hub]
    /  \
   A    B

User drags hub right →

After drag:
         [Hub]
         /  \
        A    B

Spokes moved with hub!
```

## Visual Improvements

### Bubble Design

**Hubs (Categories)**:
- 96px diameter circles
- Bold white text
- Item count badge
- White border (4px)
- Hover: Scale 110%
- Shadow: Extra large
- Cursor: Move (grab hand)

**Sub-hubs (Subnodes)**:
- 64px diameter circles
- Same color as parent
- 85% opacity
- White border (2px)
- Hover: Scale 105%

**Spokes (Items)**:
- Pill-shaped (rounded-full)
- White background
- Colored border (3px)
- Bold text
- Hover: Scale 105% + larger shadow
- Delete × appears top-right

### Connection Lines

**Style**:
- Straight lines (not curved)
- Match hub color
- 3px width
- 40% opacity
- Clean, minimal look

### Color Coordination

All elements use category color:
- Hub background
- Subnode background
- Item border
- Connection lines

Creates visual grouping!

## Layout Algorithm

### File: `lib/graph-layout.ts`

#### Main Function

```typescript
calculateHubSpokeLayout(
  graphData: GraphData,
  config?: LayoutConfig
): GraphData
```

**Steps**:
1. Place user at center (0, 0)
2. Arrange hubs in circle around user
3. For each hub:
   - Check for subnodes
   - If subnodes: position between hub and items
   - Position items radiating from hub/subnode
4. Create edges (connections)
5. Return positioned graph

#### Spoke Recalculation

```typescript
recalculateSpokes(
  graphData: GraphData,
  hubId: string,
  newHubX: number,
  newHubY: number
): GraphData
```

**Steps**:
1. Find hub node
2. Find all connected nodes (children + grandchildren)
3. Calculate relative position from old hub
4. Apply same relative position to new hub
5. Update all node positions
6. Return updated graph

## Integration

### Files Modified

1. **`lib/graph-layout.ts`** (NEW)
   - Hub-and-spoke layout algorithm
   - Spoke recalculation logic
   - Layout configuration

2. **`lib/profile-graph-xml.ts`**
   - Import `calculateHubSpokeLayout`
   - Apply layout after parsing XML

3. **`components/profile-graph-canvas.tsx`**
   - Import `recalculateSpokes`
   - Handle hub drag events
   - Recalculate spokes on drag end
   - Only hubs draggable
   - Straight edge lines

4. **`components/graph-nodes/user-node.tsx`**
   - Larger size (128px)
   - Gradient blue background
   - Bigger icon

5. **`components/graph-nodes/category-node.tsx`**
   - Larger size (96px)
   - White border
   - Item count badge
   - Cursor: move

6. **`components/graph-nodes/subnode-node.tsx`**
   - Circular design (64px)
   - 85% opacity
   - White border

7. **`components/graph-nodes/item-node.tsx`**
   - Pill-shaped bubbles
   - Colored border (3px)
   - Delete × positioned top-right
   - Not draggable

## User Experience

### Building Your Graph

1. **Start**: Empty canvas with "You" at center
2. **Add items**: Chat with AI, click bubbles
3. **Watch grow**: Hubs appear automatically
4. **Spokes radiate**: Items fan out from hubs
5. **Subnodes form**: When 2+ items share subcategory

### Organizing Your Graph

1. **Drag hubs**: Click and drag any category
2. **Spokes follow**: Items move with hub
3. **Arrange visually**: Position hubs where you want
4. **Zoom/pan**: Navigate large graphs

### Example Workflow

```
Step 1: Add "United Airlines"
→ Travel Preferences hub appears
→ United spoke radiates from hub

Step 2: Add "American Airlines"
→ Airlines subnode auto-creates
→ Both airlines radiate from subnode

Step 3: Drag Travel Preferences hub
→ Hub moves to new position
→ Airlines subnode follows
→ Both airline spokes follow
→ Perfect alignment maintained!
```

## Benefits

### Clarity
- ✅ Clear hub-and-spoke structure
- ✅ Easy to see relationships
- ✅ Visual grouping by color
- ✅ Organized, not cluttered

### Usability
- ✅ Drag hubs to organize
- ✅ Spokes automatically adjust
- ✅ Can't accidentally break layout
- ✅ Intuitive interaction

### Scalability
- ✅ Handles many items per hub
- ✅ Subnodes prevent overcrowding
- ✅ Automatic spacing
- ✅ Clean at any size

### Visual Appeal
- ✅ Bubble design is friendly
- ✅ Color coordination
- ✅ Professional appearance
- ✅ Smooth animations

## Technical Details

### Layout Configuration

```typescript
interface LayoutConfig {
  centerX: number;        // 0
  centerY: number;        // 0
  hubRadius: number;      // 300px
  spokeLength: number;    // 180px
  minSpokeAngle: number;  // 20°
}
```

### Node Draggability

```typescript
draggable: node.type !== 'user' && node.type !== 'item'
```

Only categories and subnodes can be dragged.

### Edge Styling

```typescript
{
  type: 'straight',
  style: {
    stroke: hubColor,
    strokeWidth: 3,
    opacity: 0.4
  }
}
```

Straight lines with hub color.

### Drag Handler

```typescript
handleNodesChange(changes) {
  // Detect hub drag end
  if (draggedHub && isHub(draggedHub)) {
    // Recalculate all spokes
    const updated = recalculateSpokes(
      currentGraph,
      hubId,
      newX,
      newY
    );
    // Update all positions
    setNodes(updated.nodes);
  }
}
```

## Examples

### Simple Hub

```
    [Hobbies]
     /  |  \
    /   |   \
[Photo][Art][Music]
```

### With Subnode

```
    [Travel Pref]
         |
     [Airlines]
       /    \
      /      \
  [United][American]
```

### Multiple Subnodes

```
      [Travel Pref]
       /         \
   [Airlines]   [Hotels]
    /    \       /    \
  [UA]  [AA]  [Hyatt][Marriott]
```

### Full Graph

```
              [YOU]
        /       |       \
    [Travel] [Hobbies] [Family]
      /  \      /  \      /  \
    ...  ...  ...  ...  ...  ...
```

## Testing

### Test Scenarios

1. ✅ **Add first item** → Hub appears
2. ✅ **Add second item** → Spoke radiates
3. ✅ **Add third item same subcategory** → Subnode forms
4. ✅ **Drag hub** → Spokes follow
5. ✅ **Drag subnode** → Items follow
6. ✅ **Zoom/pan** → Layout maintains
7. ✅ **Delete item** → Layout adjusts
8. ✅ **Add many items** → Spacing adjusts

### Visual Tests

1. ✅ Hubs are large and clear
2. ✅ Spokes are bubble-shaped
3. ✅ Colors coordinate
4. ✅ Lines are straight
5. ✅ Spacing is even
6. ✅ No overlaps
7. ✅ Smooth animations
8. ✅ Delete × visible on hover

## Future Enhancements

### Possible Additions

1. **Auto-arrange** - Button to reset to default layout
2. **Collapse/expand** - Hide/show spokes for hub
3. **Hub labels** - Show on canvas (not just in node)
4. **Spoke count** - Show on hub
5. **Connection strength** - Thicker lines for more items
6. **Animation** - Smooth transitions when adding items
7. **Snap to grid** - Optional grid snapping for hubs
8. **Hub grouping** - Drag multiple hubs together

## Summary

The new hub-and-spoke system provides:

**Automatic Layout**:
- Hubs arranged in circle
- Spokes radiate outward
- Subnodes between hub and items
- Clean, organized appearance

**Intuitive Interaction**:
- Drag hubs to organize
- Spokes follow automatically
- Can't break the layout
- Visual feedback

**Beautiful Design**:
- Bubble-shaped nodes
- Color coordination
- Smooth animations
- Professional look

**Easy to Use**:
- Clear visual hierarchy
- Obvious relationships
- Simple drag interaction
- Automatic adjustments

The graph now looks like a solar system with you at the center and your interests radiating outward! 🌟
