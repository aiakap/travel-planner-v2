"use client";

import { Plane, Home, Map, Palmtree, Car } from "lucide-react";
import { format } from "date-fns";

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

interface HorizontalSegmentBlockProps {
  segment: InMemorySegment;
  widthPercent: number;
  segmentNumber: number;
  onUpdate: (updates: Partial<InMemorySegment>) => void;
  onContentClick: () => void;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const segmentTypeColors: Record<string, { bgColor: string; borderColor: string }> = {
  Travel: { bgColor: "bg-blue-100", borderColor: "border-blue-300" },
  Stay: { bgColor: "bg-indigo-100", borderColor: "border-indigo-300" },
  Tour: { bgColor: "bg-purple-100", borderColor: "border-purple-300" },
  Retreat: { bgColor: "bg-teal-100", borderColor: "border-teal-300" },
  "Road Trip": { bgColor: "bg-orange-100", borderColor: "border-orange-300" },
};

const segmentTypeIcons: Record<string, any> = {
  Travel: Plane,
  Stay: Home,
  Tour: Map,
  Retreat: Palmtree,
  "Road Trip": Car,
};

const calculateDays = (start: string | null, end: string | null): number => {
  if (!start || !end) return 1;
  const startDt = new Date(start);
  const endDt = new Date(end);
  const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
};

const formatDateRange = (start: string | null, end: string | null): string => {
  if (!start || !end) return "";
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${format(startDate, "MMM d")}-${format(endDate, "MMM d")}`;
};

export function HorizontalSegmentBlock({
  segment,
  widthPercent,
  segmentNumber,
  onUpdate,
  onContentClick,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: HorizontalSegmentBlockProps) {
  const colors = segmentTypeColors[segment.segmentType] || segmentTypeColors.Stay;
  const Icon = segmentTypeIcons[segment.segmentType] || Home;
  const days = calculateDays(segment.startTime, segment.endTime);

  return (
    <div
      className="flex-shrink-0 transition-all duration-200"
      style={{ width: `${widthPercent}%`, minWidth: "60px" }}
    >
      {/* Segment Content */}
      <div 
        className={`${colors.bgColor} border-2 ${colors.borderColor} rounded-lg p-2 flex flex-col h-24 cursor-pointer transition-all duration-300 ${
          isHovered ? "shadow-lg scale-105 ring-2 ring-offset-1 ring-blue-400" : "hover:shadow-md"
        }`}
        onClick={onContentClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Top Row: Icon and Duration Badge */}
        <div className="flex items-start justify-between mb-1">
          <Icon className="h-4 w-4 text-slate-700 flex-shrink-0" />
          <span className="text-xs font-semibold text-slate-600 bg-white/60 px-1.5 py-0.5 rounded">
            {days}d
          </span>
        </div>

        {/* Title */}
        <div className="flex-1 flex items-center justify-center px-1">
          <div className="text-sm font-medium text-slate-900 text-center line-clamp-1 w-full">
            {segment.name || `Part ${segmentNumber}`}
          </div>
        </div>

        {/* Locations */}
        {(segment.startLocation || segment.endLocation) && (
          <div className="text-xs text-slate-600 text-center mb-1 line-clamp-1">
            {segment.startLocation && segment.endLocation && segment.startLocation !== segment.endLocation
              ? `${segment.startLocation} → ${segment.endLocation}`
              : segment.startLocation || segment.endLocation}
          </div>
        )}

        {/* Date Range */}
        <div className="text-xs text-slate-600 text-center font-medium">
          {days}d | {formatDateRange(segment.startTime, segment.endTime)}
        </div>
      </div>
    </div>
  );
}
