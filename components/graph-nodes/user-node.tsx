"use client";

/**
 * User Node Component
 * 
 * Central node representing the user in the profile graph
 */

import { Handle, Position } from 'reactflow';
import { User } from 'lucide-react';
import { ReactFlowNodeData } from '@/lib/types/profile-graph';

interface UserNodeProps {
  data: ReactFlowNodeData;
}

export function UserNode({ data }: UserNodeProps) {
  return (
    <div className="relative">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white shadow-2xl flex flex-col items-center justify-center">
        <User className="w-12 h-12 text-white" />
        <span className="text-sm font-bold text-white mt-2">
          {data.label}
        </span>
      </div>
      
      {/* Handles for connections - invisible but functional */}
      <Handle
        type="source"
        position={Position.Top}
        className="w-3 h-3 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 opacity-0"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="w-3 h-3 opacity-0"
      />
    </div>
  );
}
