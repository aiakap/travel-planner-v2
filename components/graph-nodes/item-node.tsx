"use client";

/**
 * Item Node Component
 * 
 * Represents an individual profile item (e.g., United Airlines, Photography)
 */

import { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { X } from 'lucide-react';
import { ReactFlowNodeData } from '@/lib/types/profile-graph';

interface ItemNodeProps {
  data: ReactFlowNodeData;
}

export function ItemNode({ data }: ItemNodeProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onDelete) {
      data.onDelete(data.id);
    }
  };

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 opacity-0"
        style={{ background: data.color }}
      />
      
      <div 
        className="px-5 py-2.5 rounded-full bg-white shadow-lg border-3 transition-all hover:shadow-xl hover:scale-105 relative"
        style={{ 
          borderColor: data.color,
          borderWidth: '3px',
          borderStyle: 'solid',
          minWidth: '100px',
          maxWidth: '180px'
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800 truncate">
            {data.value || data.label}
          </span>
          
          {isHovered && (
            <button
              onClick={handleDelete}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all absolute -top-2 -right-2 shadow-md"
              title="Delete item"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
