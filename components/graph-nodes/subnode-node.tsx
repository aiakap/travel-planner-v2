"use client";

/**
 * Subnode Component
 * 
 * Represents a subcategory grouping (e.g., Airlines, Hotels)
 * Auto-created when 2+ items share the same subcategory
 */

import { Handle, Position } from 'reactflow';
import { ReactFlowNodeData } from '@/lib/types/profile-graph';

interface SubnodeNodeProps {
  data: ReactFlowNodeData;
}

export function SubnodeNode({ data }: SubnodeNodeProps) {
  return (
    <div className="relative">
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 opacity-0"
        style={{ background: data.color }}
      />
      
      <div 
        className="w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 border-2 border-white"
        style={{ 
          backgroundColor: data.color,
          opacity: 0.85
        }}
      >
        <div className="text-center">
          <span className="text-xs font-bold leading-tight">
            {data.subcategory || data.label}
          </span>
          {data.itemCount !== undefined && data.itemCount > 0 && (
            <div className="text-[10px] opacity-90 mt-0.5">
              {data.itemCount}
            </div>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 opacity-0"
        style={{ background: data.color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-2 h-2 opacity-0"
        style={{ background: data.color }}
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-2 h-2 opacity-0"
        style={{ background: data.color }}
      />
    </div>
  );
}
