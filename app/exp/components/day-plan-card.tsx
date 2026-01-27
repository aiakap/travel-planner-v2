"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/exp/ui/button";
import { Badge } from "@/app/exp/ui/badge";
import { 
  Calendar, 
  Clock, 
  MapPin,
  Plane,
  Hotel,
  UtensilsCrossed,
  Ticket,
  Loader2,
  Plus,
  Edit,
  Map as MapIcon
} from "lucide-react";

interface TimeBlock {
  id: string;
  name: string;
  category: string;
  startTime: string;
  endTime?: string;
  location?: string;
  status: string;
  cost?: number;
  currency?: string;
}

interface DayPlanCardProps {
  tripId: string;
  date: string;
  segmentId?: string;
}

export function DayPlanCard({ tripId, date, segmentId }: DayPlanCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [dayInfo, setDayInfo] = useState<{ dayName: string; dateFormatted: string } | null>(null);

  useEffect(() => {
    loadDayPlan();
  }, [tripId, date, segmentId]);

  const loadDayPlan = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trip data
      const response = await fetch(`/api/trips/${tripId}`);
      if (!response.ok) throw new Error("Failed to load trip");
      
      const trip = await response.json();

      // Format date info
      const dateObj = new Date(date);
      setDayInfo({
        dayName: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
        dateFormatted: dateObj.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        }),
      });

      // Collect all reservations for this date
      const blocks: TimeBlock[] = [];
      
      trip.segments?.forEach((segment: any) => {
        segment.reservations?.forEach((reservation: any) => {
          const resDate = reservation.startTime ? new Date(reservation.startTime).toISOString().split('T')[0] : null;
          
          if (resDate === date) {
            blocks.push({
              id: reservation.id,
              name: reservation.vendor || reservation.reservationType?.name || "Untitled",
              category: reservation.reservationType?.category?.name || "Other",
              startTime: reservation.startTime,
              endTime: reservation.endTime,
              location: reservation.address,
              status: reservation.reservationStatus?.name || "Suggested",
              cost: reservation.cost,
              currency: reservation.currency,
            });
          }
        });
      });

      // Sort by start time
      blocks.sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      setTimeBlocks(blocks);
    } catch (err: any) {
      console.error("Error loading day plan:", err);
      setError(err.message || "Failed to load day plan");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateTime: string | undefined): string => {
    if (!dateTime) return "—";
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Transport":
        return Plane;
      case "Stay":
        return Hotel;
      case "Eat":
        return UtensilsCrossed;
      case "Do":
        return Ticket;
      default:
        return MapPin;
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "Transport":
        return "bg-sky-100 text-sky-700 border-sky-200";
      case "Stay":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "Eat":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Do":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string): string => {
    const lower = status.toLowerCase();
    if (lower.includes("confirm")) return "bg-emerald-100 text-emerald-700";
    if (lower.includes("plan")) return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  };

  const calculateGap = (currentEnd: string | undefined, nextStart: string | undefined): number => {
    if (!currentEnd || !nextStart) return 0;
    const end = new Date(currentEnd).getTime();
    const start = new Date(nextStart).getTime();
    return Math.max(0, (start - end) / (1000 * 60)); // minutes
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading day plan...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-900">{dayInfo?.dayName}</h3>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {dayInfo?.dateFormatted}
            </p>
          </div>
          <Button size="sm" variant="outline">
            <MapIcon className="h-4 w-4 mr-1" />
            View Map
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-4">
        {timeBlocks.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">No activities scheduled for this day</p>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Activity
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {timeBlocks.map((block, idx) => {
              const Icon = getCategoryIcon(block.category);
              const nextBlock = timeBlocks[idx + 1];
              const gapMinutes = calculateGap(block.endTime, nextBlock?.startTime);

              return (
                <div key={block.id}>
                  {/* Time block */}
                  <div className="flex gap-3 group">
                    {/* Timeline */}
                    <div className="flex flex-col items-center pt-1">
                      <div className={`w-3 h-3 rounded-full border-2 ${getCategoryColor(block.category)} bg-white`} />
                      {idx < timeBlocks.length - 1 && (
                        <div className="w-0.5 h-full min-h-[60px] bg-slate-200 my-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className={`rounded-lg border-2 ${getCategoryColor(block.category)} p-3 group-hover:shadow-md transition-shadow`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Time */}
                            <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {formatTime(block.startTime)}
                                {block.endTime && ` - ${formatTime(block.endTime)}`}
                              </span>
                            </div>

                            {/* Name */}
                            <h4 className="font-medium text-slate-900 mb-1">
                              {block.name}
                            </h4>

                            {/* Location */}
                            {block.location && (
                              <div className="flex items-center gap-1 text-sm text-slate-600 mb-2">
                                <MapPin className="h-3.5 w-3.5" />
                                <span className="truncate">{block.location}</span>
                              </div>
                            )}

                            {/* Badges */}
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Icon className="h-3 w-3 mr-1" />
                                {block.category}
                              </Badge>
                              <Badge className={`text-xs ${getStatusColor(block.status)}`}>
                                {block.status}
                              </Badge>
                              {block.cost && block.cost > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {block.currency} {block.cost}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Edit button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Gap indicator */}
                      {gapMinutes > 30 && (
                        <div className="flex items-center gap-2 py-2 px-3 text-xs text-slate-500">
                          <div className="flex-1 border-t border-dashed border-slate-300" />
                          <span>{Math.round(gapMinutes)} min free time</span>
                          <div className="flex-1 border-t border-dashed border-slate-300" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer summary */}
      {timeBlocks.length > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-600">
              {timeBlocks.length} activit{timeBlocks.length === 1 ? 'y' : 'ies'} scheduled
            </div>
            <div className="text-slate-600">
              {formatTime(timeBlocks[0]?.startTime)} - {formatTime(timeBlocks[timeBlocks.length - 1]?.endTime)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
