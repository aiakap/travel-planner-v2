# Step 9: Theme System Integration

## Goal
Add theme selector with radial theme option that applies the radial layout.

## Status
⏳ PENDING

## Files to Create/Modify
- `lib/types/graph-themes.ts` (NEW)
- `components/graph-theme-selector.tsx` (NEW)
- `components/profile-graph-canvas.tsx`
- `components/graph-controls.tsx`

## Changes Required

### 1. Define Theme Types

**File:** `lib/types/graph-themes.ts`

```typescript
export interface GraphTheme {
  id: string;
  name: string;
  description: string;
  layoutType: 'hub-spoke' | 'radial';
  colors: {
    background: string;
    userNode: string;
    categoryNodes: Record<string, string>;
    edges: string;
  };
  backgroundPattern: 'dots' | 'grid' | 'lines' | 'none';
  backgroundOpacity: number;
}

export const GRAPH_THEMES: GraphTheme[] = [
  {
    id: 'clean',
    name: 'Clean',
    description: 'Simple hub-spoke layout with minimal styling',
    layoutType: 'hub-spoke',
    colors: {
      background: '#ffffff',
      userNode: '#3b82f6',
      categoryNodes: {
        'hobbies': '#10b981',
        'travel-preferences': '#f59e0b',
        'family': '#ec4899',
        'destinations': '#8b5cf6',
        'travel-style': '#06b6d4',
        'spending-priorities': '#f97316',
        'other': '#6b7280'
      },
      edges: '#cbd5e1'
    },
    backgroundPattern: 'dots',
    backgroundOpacity: 0.3
  },
  {
    id: 'radial',
    name: 'Radial',
    description: 'Concentric circles layout with vibrant colors',
    layoutType: 'radial',
    colors: {
      background: '#0f172a',
      userNode: '#fbbf24',
      categoryNodes: {
        'hobbies': '#34d399',
        'travel-preferences': '#60a5fa',
        'family': '#f472b6',
        'destinations': '#a78bfa',
        'travel-style': '#22d3ee',
        'spending-priorities': '#fb923c',
        'other': '#94a3b8'
      },
      edges: '#475569'
    },
    backgroundPattern: 'none',
    backgroundOpacity: 0
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean hub-spoke with monochrome palette',
    layoutType: 'hub-spoke',
    colors: {
      background: '#fafafa',
      userNode: '#1f2937',
      categoryNodes: {
        'hobbies': '#4b5563',
        'travel-preferences': '#6b7280',
        'family': '#9ca3af',
        'destinations': '#4b5563',
        'travel-style': '#6b7280',
        'spending-priorities': '#9ca3af',
        'other': '#d1d5db'
      },
      edges: '#e5e7eb'
    },
    backgroundPattern: 'lines',
    backgroundOpacity: 0.2
  }
];

export function getThemeById(themeId: string): GraphTheme {
  return GRAPH_THEMES.find(t => t.id === themeId) || GRAPH_THEMES[0];
}

export function getCategoryColor(theme: GraphTheme, category: string): string {
  return theme.colors.categoryNodes[category] || theme.colors.categoryNodes['other'];
}
```

### 2. Create Theme Selector Component

**File:** `components/graph-theme-selector.tsx`

```typescript
"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GRAPH_THEMES } from "@/lib/types/graph-themes";

interface GraphThemeSelectorProps {
  activeTheme: string;
  onThemeChange: (themeId: string) => void;
}

export function GraphThemeSelector({
  activeTheme,
  onThemeChange
}: GraphThemeSelectorProps) {
  const currentTheme = GRAPH_THEMES.find(t => t.id === activeTheme);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-white">
          <Palette className="w-4 h-4" />
          {currentTheme?.name || 'Theme'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {GRAPH_THEMES.map(theme => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={activeTheme === theme.id ? "bg-slate-100" : ""}
          >
            <div className="flex flex-col gap-1">
              <div className="font-medium">{theme.name}</div>
              <div className="text-xs text-slate-500">{theme.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 3. Update GraphControls

**File:** `components/graph-controls.tsx`

```typescript
import { GraphThemeSelector } from "./graph-theme-selector";

interface GraphControlsProps {
  theme?: string;
  onThemeChange?: (themeId: string) => void;
  onClearAll: () => void;
  onRecenter?: () => void;
  className?: string;
}

export function GraphControls({
  theme = "clean",
  onThemeChange,
  onClearAll,
  onRecenter,
  className = ""
}: GraphControlsProps) {
  return (
    <div className={`absolute top-4 right-4 z-10 flex flex-col gap-2 ${className}`}>
      {onThemeChange && (
        <GraphThemeSelector
          activeTheme={theme}
          onThemeChange={onThemeChange}
        />
      )}
      
      {/* ... existing buttons ... */}
    </div>
  );
}
```

### 4. Update ProfileGraphCanvas to Apply Theme

**File:** `components/profile-graph-canvas.tsx`

```typescript
import { getThemeById, getCategoryColor } from '@/lib/types/graph-themes';
import { calculateRadialLayout } from '@/lib/graph-layout';

interface ProfileGraphCanvasProps {
  graphData: GraphData;
  theme?: string;
  highlightedNodeId?: string;
  onNodeDelete?: (nodeId: string) => void;
  onNodesChange?: (nodes: Node[]) => void;
  onThemeChange?: (themeId: string) => void;
  onClearAll?: () => void;
  className?: string;
}

function ProfileGraphCanvasInner({
  graphData,
  theme = "clean",
  highlightedNodeId,
  onNodeDelete,
  onNodesChange,
  onThemeChange,
  onClearAll,
  className = ""
}: ProfileGraphCanvasProps) {
  const reactFlowInstance = useReactFlow();
  const activeTheme = getThemeById(theme);

  // Get node color from theme
  const getNodeColor = (category?: string) => {
    if (!category) return activeTheme.colors.categoryNodes['other'];
    return getCategoryColor(activeTheme, category);
  };

  // Convert GraphData to React Flow format with theme applied
  const initialNodes: Node[] = useMemo(() => {
    if (!graphData?.nodes || graphData.nodes.length === 0) {
      return [];
    }

    // Apply radial layout if radial theme is active
    let layoutData = graphData;
    if (activeTheme.layoutType === 'radial') {
      layoutData = calculateRadialLayout(graphData);
    }
    
    return layoutData.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: { x: node.x || 0, y: node.y || 0 },
      data: {
        ...node,
        color: getNodeColor(node.category),
        theme: activeTheme,
        isHighlighted: node.id === highlightedNodeId,
        onDelete: onNodeDelete
      },
      draggable: false,
      className: node.id === highlightedNodeId ? 'animate-[pulse_1s_ease-in-out_3]' : ''
    }));
  }, [graphData, onNodeDelete, theme, activeTheme, highlightedNodeId]);

  // Apply theme background and styling
  return (
    <div 
      className={`w-full h-full relative ${className}`}
      style={{ backgroundColor: activeTheme.colors.background }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        // ... other props ...
      >
        <Background 
          variant={activeTheme.backgroundPattern === 'dots' ? BackgroundVariant.Dots : BackgroundVariant.Lines}
          gap={20}
          size={1}
          color={activeTheme.colors.edges}
          style={{ opacity: activeTheme.backgroundOpacity }}
        />
        {/* ... controls ... */}
      </ReactFlow>

      <GraphControls
        theme={theme}
        onThemeChange={onThemeChange}
        onClearAll={onClearAll}
        onRecenter={handleRecenter}
      />
    </div>
  );
}
```

## Testing
- ✅ Open theme selector dropdown
- ✅ See 3 themes: Clean, Radial, Minimal
- ✅ Select "Radial" theme
- ✅ Graph re-layouts to concentric circles
- ✅ Background changes to dark (#0f172a)
- ✅ Node colors update to vibrant palette
- ✅ Switch back to "Clean" theme
- ✅ Graph returns to hub-spoke layout
- ✅ Background returns to white

## Expected Behavior
- Theme selector in top-right corner
- Dropdown shows 3 theme options with descriptions
- Selecting theme:
  - Updates layout (hub-spoke vs radial)
  - Updates colors (background, nodes, edges)
  - Updates background pattern
  - Smooth transition between layouts
- Radial theme:
  - Dark background
  - Concentric circles layout
  - Vibrant colors
  - No background pattern
- Clean theme:
  - White background
  - Hub-spoke layout
  - Pastel colors
  - Dots background pattern

## Next Step
Proceed to Step 10: Node Highlighting & Polish
