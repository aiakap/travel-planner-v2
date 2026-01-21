"use client";

import { AlertTriangle, CheckCircle, Info, Navigation } from "lucide-react";
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
  travelTimeIssues?: Array<{
    from: string;
    to: string;
    requiredTime: number;
    availableTime: number;
    shortfall: number;
    travelTimeText: string;
  }>;
  className?: string;
}

export function ConflictIndicator({
  hasConflict,
  conflictingReservations = [],
  travelTimeIssues = [],
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

  const totalIssues = conflictingReservations.length + travelTimeIssues.length;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          {conflictingReservations.length > 0 && travelTimeIssues.length > 0
            ? `Time conflicts and travel time issues detected`
            : conflictingReservations.length > 0
            ? `Time conflict with ${conflictingReservations.length} reservation${conflictingReservations.length > 1 ? "s" : ""}`
            : `Travel time issues detected`}
        </span>
      </div>

      {conflictingReservations.length > 0 && (
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
      )}

      {travelTimeIssues.length > 0 && (
        <div className="space-y-1 ml-6">
          {travelTimeIssues.map((issue, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
              <Navigation className="h-3 w-3 mt-0.5 text-orange-500" />
              <div className="flex-1">
                <div className="font-medium text-orange-600">
                  Insufficient travel time
                </div>
                <div className="mt-0.5">
                  <strong>{issue.from}</strong> → <strong>{issue.to}</strong>
                </div>
                <div className="text-slate-500 mt-0.5">
                  Need {issue.travelTimeText} but only {Math.round(issue.availableTime)} min available
                  <span className="text-orange-500 font-medium ml-1">
                    ({Math.round(issue.shortfall)} min short)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
