"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddToTripModalProps {
  tripId: string;
  tripTitle: string;
  itemName: string;
  onClose: () => void;
  onAdd: (data: {
    tripId: string;
    date: string;
    startTime: string;
    endTime: string;
    status: "suggested" | "planned" | "confirmed";
  }) => Promise<void>;
}

export function AddToTripModal({
  tripId,
  tripTitle,
  itemName,
  onClose,
  onAdd,
}: AddToTripModalProps) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [status, setStatus] = useState<"suggested" | "planned" | "confirmed">("suggested");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate times
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) {
      setError("End time must be after start time");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        tripId,
        date,
        startTime,
        endTime,
        status,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add to trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (statusValue: string) => {
    const configs = {
      suggested: {
        icon: Lightbulb,
        label: "Suggestion",
        className: "bg-amber-100 text-amber-700 border-amber-300",
      },
      planned: {
        icon: Calendar,
        label: "Planned",
        className: "bg-sky-100 text-sky-700 border-sky-300",
      },
      confirmed: {
        icon: CheckCircle,
        label: "Confirmed",
        className: "bg-emerald-100 text-emerald-700 border-emerald-300",
      },
    };

    const config = configs[statusValue as keyof typeof configs];
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-md border ${config.className}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{config.label}</span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Add to Trip</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {tripTitle}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Item Name */}
          <div className="bg-slate-50 p-3 rounded-md">
            <div className="text-sm font-medium text-slate-900">{itemName}</div>
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suggested">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <div>
                      <div className="font-medium">Suggestion</div>
                      <div className="text-xs text-muted-foreground">
                        Considering this option
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="planned">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-sky-600" />
                    <div>
                      <div className="font-medium">Planned</div>
                      <div className="text-xs text-muted-foreground">
                        Decided but not booked
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="confirmed">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <div>
                      <div className="font-medium">Confirmed</div>
                      <div className="text-xs text-muted-foreground">
                        Reservation confirmed
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex justify-center mt-2">
              {getStatusBadge(status)}
            </div>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Trip
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
