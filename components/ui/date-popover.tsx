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
  minDate?: string; // YYYY-MM-DD format
  maxDate?: string; // YYYY-MM-DD format
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

  // Parse YYYY-MM-DD string as local time (not UTC)
  const parseLocalDate = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Compare two dates by calendar day only (ignores time)
  const compareDates = (a: Date, b: Date): number => {
    const aYear = a.getFullYear(), aMonth = a.getMonth(), aDay = a.getDate();
    const bYear = b.getFullYear(), bMonth = b.getMonth(), bDay = b.getDate();
    if (aYear !== bYear) return aYear - bYear;
    if (aMonth !== bMonth) return aMonth - bMonth;
    return aDay - bDay;
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select date";
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return format(date, "MMM d, yyyy");
    } catch {
      return "Select date";
    }
  };

  const handleSelect = (date: Date) => {
    // Use local date components to avoid UTC conversion
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
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
            selected={parseLocalDate(value)}
            onSelect={handleSelect}
            disabledDates={(date) => {
              // Check minDate constraint (compare by calendar day)
              if (minDate) {
                const minDateParsed = parseLocalDate(minDate);
                if (minDateParsed && compareDates(date, minDateParsed) < 0) {
                  return true;
                }
              }
              // Check maxDate constraint (compare by calendar day)
              if (maxDate) {
                const maxDateParsed = parseLocalDate(maxDate);
                if (maxDateParsed && compareDates(date, maxDateParsed) > 0) {
                  return true;
                }
              }
              // Only restrict past dates if allowPastDates is false
              if (!allowPastDates && !minDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (compareDates(date, today) < 0) {
                  return true;
                }
              }
              return false;
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
