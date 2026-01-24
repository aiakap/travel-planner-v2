"use client";

import React from "react";
import { addDays } from "date-fns";

interface InMemorySegment {
  tempId: string;
  name: string;
  segmentType: string;
  startLocation: string;
  endLocation: string;
  startTime: string | null;
  endTime: string | null;
  notes: string | null;
  order: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  startTimeZoneId?: string;
  startTimeZoneName?: string;
  endTimeZoneId?: string;
  endTimeZoneName?: string;
}

interface TripDayDashesProps {
  totalDays: number;
  segments: InMemorySegment[];
  startDate: string;
}

const segmentTypeDashColors: Record<string, string> = {
  Travel: "bg-blue-400",
  Stay: "bg-indigo-400",
  Tour: "bg-purple-400",
  Retreat: "bg-teal-400",
  "Road Trip": "bg-orange-400",
};

const calculateDays = (start: string | null, end: string | null): number => {
  if (!start || !end) return 1;
  const startDt = new Date(start);
  const endDt = new Date(end);
  const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

export function TripDayDashes({ totalDays, segments, startDate }: TripDayDashesProps) {
  // Map each day index to its segment
  const dayToSegmentMap: Record<number, InMemorySegment> = {};
  
  segments.forEach((segment) => {
    if (!segment.startTime || !segment.endTime) return;
    
    const segmentStart = new Date(segment.startTime);
    const tripStart = new Date(startDate);
    const segmentDays = calculateDays(segment.startTime, segment.endTime);
    
    // Calculate which day indices this segment occupies
    const startDayIndex = Math.floor((segmentStart.getTime() - tripStart.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < segmentDays; i++) {
      dayToSegmentMap[startDayIndex + i] = segment;
    }
  });

  // Calculate gap positions based on segment boundaries (where dividers appear)
  const gapPositions = new Set<number>();
  let dayIndex = 0;
  segments.forEach((segment, segIndex) => {
    if (segIndex < segments.length - 1) {
      dayIndex += calculateDays(segment.startTime, segment.endTime);
      gapPositions.add(dayIndex);
    }
  });

  return (
    <div className="flex gap-0 h-10 border-t border-slate-200 pt-2">
      {Array.from({ length: totalDays }).map((_, idx) => {
        const segment = dayToSegmentMap[idx];
        const dashColor = segment 
          ? segmentTypeDashColors[segment.segmentType] || segmentTypeDashColors.Stay
          : "bg-slate-300";
        
        const hasGapAfter = gapPositions.has(idx + 1);
        
        return (
          <React.Fragment key={idx}>
            <div 
              className="flex-1 flex flex-col items-center gap-1"
            >
              {/* Day dash */}
              <div className={`w-0.5 h-4 ${dashColor} rounded-full`} />
              {/* Day number */}
              <span className="text-[10px] text-slate-400 font-medium">{idx + 1}</span>
            </div>
            {hasGapAfter && <div className="w-2" />} {/* Match divider width */}
          </React.Fragment>
        );
      })}
    </div>
  );
}
