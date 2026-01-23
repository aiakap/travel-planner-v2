"use client";

/**
 * Profile Graph Visualization Component
 * 
 * Interactive radial/bubble graph showing user profile data
 */

import { useState, useEffect, useRef } from "react";
import { GraphData, GraphNode, GraphEdge, GRAPH_CATEGORIES } from "@/lib/types/profile-graph";

interface ProfileGraphVisualizationProps {
  graphData: GraphData;
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
}

export function ProfileGraphVisualization({
  graphData,
  onNodeClick,
  className = ""
}: ProfileGraphVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: -400, y: -400, width: 800, height: 800 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, zoom * delta));
    setZoom(newZoom);
    
    // Adjust viewBox for zoom
    const scaleFactor = 1 / newZoom;
    const centerX = 0;
    const centerY = 0;
    const newWidth = 800 * scaleFactor;
    const newHeight = 800 * scaleFactor;
    
    setViewBox({
      x: centerX - newWidth / 2,
      y: centerY - newHeight / 2,
      width: newWidth,
      height: newHeight
    });
  };

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = (e.clientX - dragStart.x) * (viewBox.width / 800);
    const dy = (e.clientY - dragStart.y) * (viewBox.height / 800);
    
    setViewBox(prev => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy
    }));
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Get node color
  const getNodeColor = (node: GraphNode): string => {
    if (node.type === "user") return "#ffffff";
    if (node.color) return node.color;
    
    const categoryConfig = GRAPH_CATEGORIES.find(c => c.id === node.category);
    return categoryConfig?.color || "#6b7280";
  };

  // Get node size
  const getNodeSize = (node: GraphNode): number => {
    return node.size || 30;
  };

  // Handle node click
  const handleNodeClick = (node: GraphNode) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  };

  return (
    <div className={`relative w-full h-full bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => {
            const newZoom = Math.min(3, zoom * 1.2);
            setZoom(newZoom);
            const scaleFactor = 1 / newZoom;
            const newWidth = 800 * scaleFactor;
            const newHeight = 800 * scaleFactor;
            setViewBox({
              x: -newWidth / 2,
              y: -newHeight / 2,
              width: newWidth,
              height: newHeight
            });
          }}
          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Zoom In"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            const newZoom = Math.max(0.5, zoom * 0.8);
            setZoom(newZoom);
            const scaleFactor = 1 / newZoom;
            const newWidth = 800 * scaleFactor;
            const newHeight = 800 * scaleFactor;
            setViewBox({
              x: -newWidth / 2,
              y: -newHeight / 2,
              width: newWidth,
              height: newHeight
            });
          }}
          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Zoom Out"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => {
            setZoom(1);
            setViewBox({ x: -400, y: -400, width: 800, height: 800 });
          }}
          className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg shadow-lg transition-colors"
          title="Reset View"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Legend - Only show active categories */}
      {(() => {
        const activeCategories = GRAPH_CATEGORIES.filter(cat => 
          graphData.nodes.some(node => node.category === cat.id)
        );
        
        return activeCategories.length > 0 ? (
          <div className="absolute top-4 left-4 z-10 bg-slate-800/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <h3 className="text-white text-sm font-semibold mb-2">Categories</h3>
            <div className="space-y-1">
              {activeCategories.map(category => (
                <div key={category.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-white text-xs">{category.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null;
      })()}

      {/* SVG Graph */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-move"
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} fill="url(#grid)" />

        {/* Edges */}
        <g className="edges">
          {graphData.edges.map((edge, index) => {
            const fromNode = graphData.nodes.find(n => n.id === edge.from);
            const toNode = graphData.nodes.find(n => n.id === edge.to);
            
            if (!fromNode || !toNode) return null;
            
            return (
              <line
                key={`edge-${index}`}
                x1={fromNode.x || 0}
                y1={fromNode.y || 0}
                x2={toNode.x || 0}
                y2={toNode.y || 0}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                className="transition-all duration-300"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {graphData.nodes.map((node) => {
            const size = getNodeSize(node);
            const color = getNodeColor(node);
            const isHovered = hoveredNode === node.id;
            const scale = isHovered ? 1.2 : 1;
            
            return (
              <g
                key={node.id}
                transform={`translate(${node.x || 0}, ${node.y || 0})`}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node circle */}
                <circle
                  r={size * scale}
                  fill={color}
                  stroke={node.type === "user" ? "#3b82f6" : "rgba(255,255,255,0.3)"}
                  strokeWidth={node.type === "user" ? 4 : 2}
                  className="transition-all duration-200"
                  style={{
                    filter: isHovered ? "brightness(1.2)" : "none"
                  }}
                />
                
                {/* Node label */}
                <text
                  y={size * scale + 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize={node.type === "user" ? 16 : node.type === "category" ? 14 : 12}
                  fontWeight={node.type === "user" ? "bold" : node.type === "category" ? "600" : "normal"}
                  className="pointer-events-none select-none"
                >
                  {node.label}
                </text>
                
                {/* Hover tooltip */}
                {isHovered && node.type === "item" && (
                  <g>
                    <rect
                      x={-80}
                      y={-size - 40}
                      width={160}
                      height={30}
                      fill="rgba(0,0,0,0.9)"
                      rx={5}
                      className="pointer-events-none"
                    />
                    <text
                      y={-size - 20}
                      textAnchor="middle"
                      fill="white"
                      fontSize={12}
                      className="pointer-events-none"
                    >
                      Click to explore
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Instructions - Show when graph is empty */}
      {graphData.nodes.length <= 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-6 max-w-md text-center">
            <h3 className="text-white text-lg font-semibold mb-2">
              Your Profile Graph
            </h3>
            <p className="text-slate-300 text-sm">
              Start chatting to build your profile! Share information about your travel preferences, hobbies, family, and more. As you accept suggestions, your graph will grow organically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
