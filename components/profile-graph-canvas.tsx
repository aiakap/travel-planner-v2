"use client";

/**
 * Profile Graph Canvas Component
 * 
 * Interactive infinite canvas using React Flow for profile visualization
 */

import { useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  useNodesState,
  useEdgesState,
  Connection,
  addEdge,
  NodeTypes,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { GraphData } from '@/lib/types/profile-graph';
import { UserNode } from './graph-nodes/user-node';
import { CategoryNode } from './graph-nodes/category-node';
import { SubnodeNode } from './graph-nodes/subnode-node';
import { ItemNode } from './graph-nodes/item-node';
import { GraphControls } from './graph-controls';
import { COLOR_SCHEMES } from './color-scheme-selector';
import { recalculateSpokes } from '@/lib/graph-layout';

interface ProfileGraphCanvasProps {
  graphData: GraphData;
  colorScheme?: string;
  customColors?: Record<string, string>;
  onNodeDelete?: (nodeId: string) => void;
  onNodesChange?: (nodes: Node[]) => void;
  onColorSchemeChange?: (schemeId: string) => void;
  onCustomColorChange?: (category: string, color: string) => void;
  onClearAll?: () => void;
  className?: string;
}

// Inner component that uses useReactFlow
function ProfileGraphCanvasInner({
  graphData,
  colorScheme = "default",
  customColors = {},
  onNodeDelete,
  onNodesChange,
  onColorSchemeChange,
  onCustomColorChange,
  onClearAll,
  className = ""
}: ProfileGraphCanvasProps) {
  const reactFlowInstance = useReactFlow();

  // Get active colors (custom colors override scheme colors)
  const getNodeColor = (category?: string) => {
    if (!category) return '#6b7280';
    if (customColors[category]) return customColors[category];
    const scheme = COLOR_SCHEMES.find(s => s.id === colorScheme);
    return scheme?.colors[category] || '#6b7280';
  };

  // Handle recenter
  const handleRecenter = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
  }, [reactFlowInstance]);
  
  // Define custom node types
  const nodeTypes: NodeTypes = useMemo(() => ({
    user: UserNode,
    category: CategoryNode,
    subnode: SubnodeNode,
    item: ItemNode,
  }), []);

  // Convert GraphData to React Flow format with color scheme applied
  const initialNodes: Node[] = useMemo(() => {
    // Handle empty or undefined nodes array
    if (!graphData?.nodes || graphData.nodes.length === 0) {
      return [];
    }
    
    return graphData.nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: { x: node.x || 0, y: node.y || 0 },
      data: {
        ...node,
        color: getNodeColor(node.category),
        onDelete: onNodeDelete
      },
      draggable: false, // No dragging - auto-layout only
    }));
  }, [graphData.nodes, onNodeDelete, colorScheme, customColors]);

  const initialEdges: Edge[] = useMemo(() => {
    // Handle empty or undefined edges array
    if (!graphData?.edges || graphData.edges.length === 0) {
      return [];
    }
    
    return graphData.edges.map((edge, index) => {
      // Get source node to determine edge color
      const sourceNode = graphData.nodes.find(n => n.id === edge.from);
      const edgeColor = sourceNode?.color || '#94a3b8';
      
      return {
        id: `edge-${edge.from}-${edge.to}-${index}`,
        source: edge.from,
        target: edge.to,
        type: 'straight', // Straight lines for spokes
        animated: false,
        style: { 
          stroke: edgeColor, 
          strokeWidth: 3,
          opacity: 0.4
        },
      };
    });
  }, [graphData.edges, graphData.nodes]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  
  // Update nodes when graphData changes (e.g., when items are added)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node changes (simplified - no dragging)
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChangeInternal(changes);
  }, [onNodesChangeInternal]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className={`w-full h-full relative ${className}`}>
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
      >
        <Background 
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#cbd5e1"
        />
        <Controls 
          showInteractive={false}
          className="bg-white border border-slate-200 rounded-lg shadow-lg"
        />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as any;
            return data.color || '#94a3b8';
          }}
          className="bg-white border border-slate-200 rounded-lg shadow-lg"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>

      {/* Graph Controls */}
      {onColorSchemeChange && onClearAll && (
        <GraphControls
          colorScheme={colorScheme}
          customColors={customColors}
          onColorSchemeChange={onColorSchemeChange}
          onCustomColorChange={onCustomColorChange}
          onClearAll={onClearAll}
          onRecenter={handleRecenter}
        />
      )}
    </div>
  );
}

// Outer component that provides ReactFlow context
export function ProfileGraphCanvas(props: ProfileGraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <ProfileGraphCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
