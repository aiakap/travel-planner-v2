"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConflictIndicatorProps {
  hasConflict: boolean;
  conflictingReservations?: Array<{
    id: string;
    name: string;
    startTime: Date;
    endTime: Date | null;
    category: string;
  }>;
  className?: string;
}

export function ConflictIndicator({
  hasConflict,
  conflictingReservations = [],
  className = "",
}: ConflictIndicatorProps) {
  if (!hasConflict) {
    return (
      <div className={`flex items-center gap-2 text-green-700 bg-green-50 px-3 py-2 rounded-md ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm font-medium">No conflicts - time slot available</span>
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Time conflict with {conflictingReservations.length} reservation{conflictingReservations.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-1 ml-6">
        {conflictingReservations.map((res) => (
          <div key={res.id} className="flex items-center gap-2 text-xs text-slate-600">
            <Info className="h-3 w-3" />
            <span>
              <strong>{res.name}</strong> ({res.category})
            </span>
            <span className="text-slate-400">•</span>
            <span>
              {formatTime(res.startTime)}
              {res.endTime && ` - ${formatTime(res.endTime)}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
