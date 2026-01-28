"use client";

import { format, differenceInDays, addDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

interface Trip {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  segments: Array<{
    id: string;
    name: string;
    startTime: Date | null;
    endTime: Date | null;
    segmentType: { name: string };
  }>;
}

interface SegmentTimelineSummaryProps {
  trip: Trip;
  currentSegmentId: string;
  currentSegmentIndex: number;
}

const getSegmentColor = (segmentType: string) => {
  const type = segmentType.toLowerCase();
  if (type.includes("travel") || type.includes("flight")) {
    return "bg-blue-400";
  }
  if (type.includes("stay") || type.includes("hotel")) {
    return "bg-rose-400";
  }
  if (type.includes("tour")) {
    return "bg-emerald-400";
  }
  if (type.includes("retreat")) {
    return "bg-purple-400";
  }
  if (type.includes("road")) {
    return "bg-orange-400";
  }
  return "bg-slate-400";
};

export function SegmentTimelineSummary({
  trip,
  currentSegmentId,
  currentSegmentIndex,
}: SegmentTimelineSummaryProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const currentSegment = trip.segments[currentSegmentIndex];
  if (!currentSegment || !currentSegment.startTime || !currentSegment.endTime) {
    return null;
  }

  // Calculate visible range: ±3 days around current segment
  const segmentStart = currentSegment.startTime;
  const segmentEnd = currentSegment.endTime;
  const rangeStart = addDays(segmentStart, -3);
  const rangeEnd = addDays(segmentEnd, 3);

  // Clamp to trip boundaries
  const displayStart =
    rangeStart < trip.startDate ? trip.startDate : rangeStart;
  const displayEnd = rangeEnd > trip.endDate ? trip.endDate : rangeEnd;

  // Generate days array
  const totalDays = differenceInDays(displayEnd, displayStart) + 1;
  const days: Array<{
    date: Date;
    dayNum: number;
    isCurrentSegment: boolean;
    segmentId: string | null;
    segmentColor: string;
  }> = [];

  for (let i = 0; i < totalDays; i++) {
    const currentDate = addDays(displayStart, i);
    const dayNum = differenceInDays(currentDate, trip.startDate) + 1;

    // Find which segment this day belongs to
    let belongsToSegment: string | null = null;
    let segmentColor = "bg-slate-200";

    for (const seg of trip.segments) {
      if (seg.startTime && seg.endTime) {
        if (currentDate >= seg.startTime && currentDate <= seg.endTime) {
          belongsToSegment = seg.id;
          segmentColor = getSegmentColor(seg.segmentType.name);
          break;
        }
      }
    }

    days.push({
      date: currentDate,
      dayNum,
      isCurrentSegment: belongsToSegment === currentSegmentId,
      segmentId: belongsToSegment,
      segmentColor,
    });
  }

  const scrollCalendar = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="bg-slate-50/80 backdrop-blur-sm p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
            Timeline
          </h3>
          <div className="flex gap-0.5">
            <button
              onClick={() => scrollCalendar("left")}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={12} />
            </button>
            <button
              onClick={() => scrollCalendar("right")}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
        <div className="text-[10px] text-slate-500 font-medium">
          Day {differenceInDays(segmentStart, trip.startDate) + 1}-
          {differenceInDays(segmentEnd, trip.startDate) + 1} of{" "}
          {differenceInDays(trip.endDate, trip.startDate) + 1}
        </div>
      </div>

      {/* Compact Calendar */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar scroll-smooth"
      >
        <div className="flex gap-1 min-w-max">
          {days.map((day, idx) => {
            const isToday = isSameDay(day.date, new Date());
            const isSegmentStart =
              currentSegment.startTime &&
              isSameDay(day.date, currentSegment.startTime);
            const isSegmentEnd =
              currentSegment.endTime &&
              isSameDay(day.date, currentSegment.endTime);

            return (
              <div
                key={idx}
                className={`
                  relative flex-shrink-0 w-10 h-12 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center
                  ${
                    day.isCurrentSegment
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 bg-white"
                  }
                  ${isToday ? "ring-2 ring-yellow-400" : ""}
                `}
              >
                {/* Day number */}
                <span
                  className={`text-[10px] font-bold ${
                    day.isCurrentSegment ? "text-blue-700" : "text-slate-700"
                  }`}
                >
                  {format(day.date, "d")}
                </span>

                {/* Month (if first of month or first day) */}
                {(day.date.getDate() === 1 || idx === 0) && (
                  <span className="text-[8px] text-slate-400 uppercase">
                    {format(day.date, "MMM")}
                  </span>
                )}

                {/* Day of week */}
                <span className="text-[7px] text-slate-400 uppercase">
                  {format(day.date, "EEE").slice(0, 2)}
                </span>

                {/* Segment indicator bar */}
                <div
                  className={`absolute bottom-0.5 inset-x-0.5 h-1 rounded-full ${day.segmentColor}`}
                />

                {/* Start/End markers */}
                {isSegmentStart && (
                  <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 border border-white" />
                )}
                {isSegmentEnd && (
                  <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-600 border border-white" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend - Compact */}
      <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded border-2 border-blue-500 bg-blue-50" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded border-2 border-slate-200 bg-white" />
          <span>Other</span>
        </div>
      </div>
    </div>
  );
}
