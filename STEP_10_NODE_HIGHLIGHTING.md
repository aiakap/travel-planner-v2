# Step 10: Node Highlighting & Polish

## Goal
Add visual polish - highlight new nodes with pulse animation and smooth transitions.

## Status
⏳ PENDING

## Files to Modify
- `components/profile-graph-canvas.tsx`
- `app/profile/graph/client.tsx`

## Changes Required

### 1. Add highlightedNodeId Prop to Canvas

**File:** `components/profile-graph-canvas.tsx`

Already has `highlightedNodeId` prop from Step 9. Just ensure it's being used:

```typescript
const initialNodes: Node[] = useMemo(() => {
  // ... existing code ...
  
  return layoutData.nodes.map(node => ({
    id: node.id,
    type: node.type,
    position: { x: node.x || 0, y: node.y || 0 },
    data: {
      ...node,
      color: getNodeColor(node.category),
      theme: activeTheme,
      isHighlighted: node.id === highlightedNodeId, // Already added
      onDelete: onNodeDelete
    },
    draggable: false,
    className: node.id === highlightedNodeId ? 'animate-[pulse_1s_ease-in-out_3]' : '' // Already added
  }));
}, [graphData, onNodeDelete, theme, activeTheme, highlightedNodeId]);
```

### 2. Update Client to Highlight New Nodes

**File:** `app/profile/graph/client.tsx`

```typescript
export function ProfileGraphClient({
  initialGraphData,
  initialXmlData,
  user
}: ProfileGraphClientProps) {
  const [graphData, setGraphData] = useState<GraphData>(initialGraphData);
  const [xmlData, setXmlData] = useState<string | null>(initialXmlData);
  const [theme, setTheme] = useState<string>("clean");
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | undefined>(undefined);

  // Handle suggestion accepted
  const handleSuggestionAccepted = async (suggestion: any) => {
    try {
      const response = await fetch("/api/profile-graph/add-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: suggestion.category,
          subcategory: suggestion.subcategory,
          value: suggestion.value,
          metadata: suggestion.metadata
        })
      });

      if (!response.ok) throw new Error("Failed to add item");

      const data = await response.json();

      // Update graph with new item
      if (data.graphData) {
        setGraphData(data.graphData);
        
        // Find the newly added node and highlight it
        const newNode = data.graphData.nodes.find(
          (n: any) => n.type === 'item' && n.value === suggestion.value
        );
        
        if (newNode) {
          setHighlightedNodeId(newNode.id);
          
          // Clear highlight after 3 seconds
          setTimeout(() => {
            setHighlightedNodeId(undefined);
          }, 3000);
        }
      }

      if (data.xmlData) {
        setXmlData(data.xmlData);
      }

      console.log("✅ Item added to profile:", suggestion.value);
    } catch (error) {
      console.error("Error accepting suggestion:", error);
      throw error;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* ... header ... */}

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Chat Interface */}
        <div className="w-2/5 border-r border-slate-200 flex flex-col">
          <GraphChatInterface 
            onMessageSent={handleMessageSent}
            onSuggestionAccepted={handleSuggestionAccepted}
            onNewTopicRequested={handleNewTopicRequested}
          />
        </div>

        {/* Right: Graph Visualization */}
        <div className="flex-1">
          <ProfileGraphCanvas
            graphData={graphData}
            theme={theme}
            highlightedNodeId={highlightedNodeId}
            onNodeDelete={handleNodeDelete}
            onNodesChange={handleNodesChange}
            onThemeChange={setTheme}
            onClearAll={handleClearGraph}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
```

### 3. Add Smooth Transitions

**File:** `components/profile-graph-canvas.tsx`

Add transition styles to ReactFlow:

```typescript
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={handleNodesChange}
  onEdgesChange={onEdgesChangeInternal}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  fitView
  minZoom={0.1}
  maxZoom={2}
  defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
  proOptions={{ hideAttribution: true }}
  style={{ transition: 'background-color 0.3s ease' }}
>
  {/* ... children ... */}
</ReactFlow>
```

### 4. Add Pulse Animation to Global CSS

**File:** `app/globals.css`

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.animate-pulse-3 {
  animation: pulse 1s ease-in-out 3;
}
```

### 5. Update Node Components to Show Highlight

**File:** `components/graph-nodes/item-node.tsx`

```typescript
export function ItemNode({ data }: NodeProps) {
  const isHighlighted = data.isHighlighted;
  
  return (
    <div 
      className={`
        px-3 py-2 rounded-lg border-2 bg-white shadow-md
        ${isHighlighted ? 'border-yellow-400 ring-4 ring-yellow-200' : 'border-slate-200'}
        transition-all duration-300
      `}
      style={{
        borderColor: isHighlighted ? '#fbbf24' : data.color
      }}
    >
      <div className="text-sm font-medium">{data.value}</div>
      {data.onDelete && (
        <button
          onClick={() => data.onDelete(data.id)}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

## Testing
- ✅ Type "I like swimming"
- ✅ AI auto-adds "Swimming" to profile
- ✅ New "Swimming" node appears in graph
- ✅ Node pulses 3 times with yellow highlight
- ✅ After 3 seconds, highlight fades away
- ✅ Click suggestion chip to add item
- ✅ New node pulses with highlight
- ✅ Switch themes - smooth transition
- ✅ All animations are smooth and polished

## Expected Behavior
- New nodes appear with:
  - Yellow border
  - Yellow ring (ring-4)
  - Pulse animation (3 times)
  - 1 second per pulse
- After 3 seconds:
  - Highlight fades away
  - Node returns to normal styling
- Theme transitions:
  - Background color fades smoothly
  - Node colors transition
  - Layout changes smoothly
- All interactions feel polished and responsive

## Visual Polish Checklist
- ✅ Pulse animation on new nodes
- ✅ Yellow highlight ring
- ✅ Smooth theme transitions
- ✅ Smooth layout transitions
- ✅ Hover effects on nodes
- ✅ Delete button appears on hover
- ✅ Toast notifications
- ✅ Loading states
- ✅ Error states

## Success Criteria
All 10 steps complete:
- ✅ Step 1: JSON Safety Layer
- ✅ Step 2: Concierge AI Prompt
- ✅ Step 3: Auto-Add Items Backend
- ✅ Step 4: Toast Notifications
- ✅ Step 5: Inline Suggestion Chips
- ✅ Step 6: Category Limits Validation
- ✅ Step 7: AI Reorganization System
- ✅ Step 8: Radial Layout Algorithm
- ✅ Step 9: Theme System Integration
- ✅ Step 10: Node Highlighting & Polish

## Final Result
- Conversational AI responses
- Auto-add high-confidence items
- Toast notifications for feedback
- Inline suggestion chips with (+)/(x) buttons
- 5/5 category limits enforced
- AI-driven subcategory reorganization
- Radial theme visualization option
- Smooth animations and node highlighting
- Polished, professional UX
