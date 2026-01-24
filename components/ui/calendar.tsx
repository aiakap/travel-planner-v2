"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  startOfDay,
} from "date-fns";

interface CalendarProps {
  selected?: Date;
  onSelect: (date: Date) => void;
  disabledDates?: (date: Date) => boolean;
  className?: string;
}

export function Calendar({
  selected,
  onSelect,
  disabledDates,
  className = "",
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows: Date[][] = [];
  let days: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const previousMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isDisabled = (day: Date) => {
    if (disabledDates) {
      return disabledDates(day);
    }
    // By default, disable past dates
    return isBefore(startOfDay(day), startOfDay(new Date()));
  };

  return (
    <div className={`p-3 bg-white rounded-lg shadow-lg border border-slate-200 ${className}`}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={previousMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold text-slate-900">
          {format(currentMonth, "MMMM yyyy")}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 h-8 flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {rows.map((week, weekIdx) =>
          week.map((day, dayIdx) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isSelectedDay = selected && isSameDay(day, selected);
            const isTodayDay = isToday(day);
            const disabled = isDisabled(day);

            return (
              <button
                key={`${weekIdx}-${dayIdx}`}
                onClick={() => !disabled && onSelect(day)}
                disabled={disabled}
                className={`
                  h-8 w-8 text-sm rounded-md flex items-center justify-center
                  transition-colors
                  ${!isCurrentMonth ? "text-slate-300" : "text-slate-900"}
                  ${isSelectedDay ? "bg-blue-600 text-white font-semibold hover:bg-blue-700" : ""}
                  ${isTodayDay && !isSelectedDay ? "bg-blue-50 text-blue-600 font-semibold" : ""}
                  ${!isSelectedDay && !isTodayDay && isCurrentMonth && !disabled ? "hover:bg-slate-100" : ""}
                  ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
                `}
              >
                {format(day, dateFormat)}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
