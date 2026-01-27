"use client";

import { Clock, Lightbulb } from "lucide-react";
import { Button } from "@/app/exp/ui/button";

interface AlternativeTimeSlotsProps {
  alternatives: Array<{
    startTime: string;
    endTime: string;
    reason: string;
  }>;
  onSelect: (startTime: string, endTime: string) => void;
  selectedStartTime?: string;
  className?: string;
}

export function AlternativeTimeSlots({
  alternatives,
  onSelect,
  selectedStartTime,
  className = "",
}: AlternativeTimeSlotsProps) {
  if (alternatives.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-slate-700">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">Suggested alternatives:</span>
      </div>

      <div className="space-y-2">
        {alternatives.map((alt, idx) => {
          const isSelected = selectedStartTime === alt.startTime;
          
          return (
            <Button
              key={idx}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelect(alt.startTime, alt.endTime)}
              className={`w-full justify-start text-left h-auto py-2 ${
                isSelected ? "bg-blue-600 hover:bg-blue-700" : "bg-white"
              }`}
            >
              <div className="flex items-start gap-2 w-full">
                <Clock className={`h-3.5 w-3.5 mt-0.5 ${isSelected ? "text-white" : "text-slate-500"}`} />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${isSelected ? "text-white" : "text-slate-900"}`}>
                    {alt.startTime} - {alt.endTime}
                  </div>
                  <div className={`text-xs ${isSelected ? "text-blue-100" : "text-slate-500"}`}>
                    {alt.reason}
                  </div>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
