"use client";

import React from 'react';
import { MapPin, ArrowRight, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { ChainNode, ChainConnection } from '@/lib/utils/location-chain-engine';

interface JourneyChainVisualizerProps {
  nodes: ChainNode[];
  connections: ChainConnection[];
  onNodeClick?: (segmentIndex: number, nodeType: 'start' | 'end') => void;
  focusedSegmentIndex?: number;
}

export function JourneyChainVisualizer({
  nodes,
  connections,
  onNodeClick,
  focusedSegmentIndex
}: JourneyChainVisualizerProps) {
  
  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <MapPin size={48} className="mb-4 opacity-50" />
        <p className="text-sm">Add locations to see your journey chain</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex flex-col gap-1">
        {nodes.map((node, index) => {
          const connection = connections.find(c => c.from === index);
          const isFocused = node.segmentIndex === focusedSegmentIndex;
          
          return (
            <React.Fragment key={`${node.segmentIndex}-${node.nodeType}`}>
              {/* Node */}
              <div
                onClick={() => onNodeClick?.(node.segmentIndex, node.nodeType)}
                className={`
                  relative flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${isFocused ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-white border-gray-200'}
                  ${onNodeClick ? 'cursor-pointer hover:border-indigo-400 hover:shadow-sm' : ''}
                `}
              >
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {node.isEmpty ? (
                    <Circle size={20} className="text-gray-300" />
                  ) : node.hasIssue ? (
                    <AlertTriangle size={20} className="text-yellow-500" />
                  ) : (
                    <CheckCircle2 size={20} className="text-green-500" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      {node.segmentName}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">
                      {node.nodeType === 'start' ? 'Start' : 'End'}
                    </span>
                  </div>
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {node.location || (
                      <span className="text-gray-400 italic">Not set</span>
                    )}
                  </div>
                </div>

                {/* Segment Type Badge */}
                <div className="flex-shrink-0">
                  <div className={`
                    text-xs px-2 py-1 rounded font-medium
                    ${getSegmentTypeColor(node.segmentType)}
                  `}>
                    {formatSegmentType(node.segmentType)}
                  </div>
                </div>
              </div>

              {/* Connection Arrow */}
              {connection && (
                <div className="flex items-center justify-center py-1">
                  {connection.isConnected ? (
                    connection.isSameLocation ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <div className="h-8 w-0.5 bg-green-300"></div>
                        <CheckCircle2 size={16} />
                        <div className="text-xs font-medium">Connected</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-yellow-600">
                        <div className="h-8 w-0.5 bg-yellow-300"></div>
                        <AlertTriangle size={16} />
                        <div className="text-xs font-medium">Different locations</div>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2 text-gray-300">
                      <div className="h-8 w-0.5 bg-gray-200 border-l-2 border-dashed border-gray-300"></div>
                      <Circle size={16} />
                      <div className="text-xs font-medium">Not connected</div>
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Legend</div>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-500" />
            <span className="text-gray-600">Location set and connected</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            <span className="text-gray-600">Warning or chain break</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle size={16} className="text-gray-300" />
            <span className="text-gray-600">Location not set</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Get color class for segment type
 */
function getSegmentTypeColor(type: string): string {
  const typeUpper = type.toUpperCase();
  switch (typeUpper) {
    case 'STAY':
      return 'bg-indigo-100 text-indigo-700';
    case 'RETREAT':
      return 'bg-emerald-100 text-emerald-700';
    case 'TOUR':
      return 'bg-orange-100 text-orange-700';
    case 'ROAD_TRIP':
      return 'bg-cyan-100 text-cyan-700';
    case 'TRAVEL':
      return 'bg-stone-100 text-stone-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

/**
 * Format segment type for display
 */
function formatSegmentType(type: string): string {
  const typeUpper = type.toUpperCase();
  switch (typeUpper) {
    case 'STAY':
      return 'Stay';
    case 'RETREAT':
      return 'Retreat';
    case 'TOUR':
      return 'Tour';
    case 'ROAD_TRIP':
      return 'Road Trip';
    case 'TRAVEL':
      return 'Travel';
    default:
      return type;
  }
}
