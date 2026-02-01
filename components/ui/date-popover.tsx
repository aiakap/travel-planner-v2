"use client";

import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar as CalendarComponent } from "./calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DatePopoverProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  disabled?: boolean;
  /** If true, allows selecting dates in the past. Default: false */
  allowPastDates?: boolean;
}

export function DatePopover({
  value,
  onChange,
  label,
  minDate,
  maxDate,
  className = "",
  disabled = false,
  allowPastDates = false,
}: DatePopoverProps) {
  const [open, setOpen] = useState(false);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select date";
    try {
      const date = new Date(dateStr);
      return format(date, "MMM d, yyyy");
    } catch {
      return "Select date";
    }
  };

  const handleSelect = (date: Date) => {
    onChange(date.toISOString().split("T")[0]);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className={`flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
          disabled={disabled}
          aria-label={label}
        >
          <CalendarIcon className="h-4 w-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-900">
            {formatDisplayDate(value)}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50"
          align="start"
          sideOffset={5}
        >
          <CalendarComponent
            selected={value ? new Date(value) : undefined}
            onSelect={handleSelect}
            disabledDates={(date) => {
              // Check minDate constraint
              if (minDate && date < minDate) {
                return true;
              }
              // Check maxDate constraint
              if (maxDate && date > maxDate) {
                return true;
              }
              // Only restrict past dates if allowPastDates is false
              if (!allowPastDates && !minDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }
              return false;
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
