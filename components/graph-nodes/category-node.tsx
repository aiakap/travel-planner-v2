"use client";

/**
 * Category Node Component
 * 
 * Represents a category in the profile graph (e.g., Travel Preferences, Hobbies)
 */

import { Handle, Position } from 'reactflow';
import { ReactFlowNodeData } from '@/lib/types/profile-graph';

interface CategoryNodeProps {
  data: ReactFlowNodeData;
}

export function CategoryNode({ data }: CategoryNodeProps) {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 opacity-0"
        style={{ background: data.color }}
      />
      
      <div 
        className="w-24 h-24 rounded-full shadow-xl flex flex-col items-center justify-center text-white transition-all hover:scale-110 cursor-move border-4 border-white"
        style={{ backgroundColor: data.color }}
      >
        <span className="text-sm font-bold text-center px-2 leading-tight">
          {data.label}
        </span>
        {data.itemCount !== undefined && data.itemCount > 0 && (
          <span className="text-xs opacity-90 mt-1 bg-white/20 px-2 py-0.5 rounded-full">
            {data.itemCount}
          </span>
        )}
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 opacity-0"
        style={{ background: data.color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 opacity-0"
        style={{ background: data.color }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-3 h-3 opacity-0"
        style={{ background: data.color }}
      />
    </div>
  );
}
