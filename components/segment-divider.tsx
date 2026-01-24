"use client";

import { useRef } from "react";
import { GripVertical } from "lucide-react";

interface SegmentDividerProps {
  dividerIndex: number; // 0 = between segment 0 and 1
  totalDays: number;
  startDate: string;
  onDrag: (dividerIndex: number, targetDayIndex: number) => void;
  timelineRef: React.RefObject<HTMLDivElement>;
}

export function SegmentDivider({ 
  dividerIndex, 
  totalDays, 
  startDate,
  onDrag,
  timelineRef
}: SegmentDividerProps) {
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isDragging.current = true;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current || !timelineRef.current) return;
      
      const timelineRect = timelineRef.current.getBoundingClientRect();
      const relativeX = moveEvent.clientX - timelineRect.left;
      
      // Calculate which day boundary we're closest to
      const dayWidth = timelineRect.width / totalDays;
      const targetDayIndex = Math.round(relativeX / dayWidth);
      
      // Clamp to valid range (at least 1 day for each segment)
      const clampedDayIndex = Math.max(dividerIndex + 1, Math.min(targetDayIndex, totalDays - (dividerIndex + 2)));
      
      onDrag(dividerIndex, clampedDayIndex);
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  return (
    <div
      className="w-2 bg-slate-200 hover:bg-slate-300 cursor-col-resize flex items-center justify-center group transition-colors flex-shrink-0"
      onMouseDown={handleMouseDown}
      style={{ height: "96px" }} // Match segment block height (h-24 = 96px)
    >
      <GripVertical className="h-6 w-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
    </div>
  );
}
