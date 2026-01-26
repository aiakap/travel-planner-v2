"use client";

import { Lightbulb, Calendar, CheckCircle } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/app/exp/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/exp/ui/popover";
import { Button } from "@/app/exp/ui/button";

type ReservationStatus = "suggested" | "planned" | "confirmed";

interface StatusIconIndicatorProps {
  status: ReservationStatus;
  onStatusChange: (status: ReservationStatus) => void;
  size?: "sm" | "md";
}

const statusConfig = {
  suggested: {
    icon: Lightbulb,
    label: "Suggestion",
    description: "Considering this option",
    color: "text-amber-600",
    hoverColor: "hover:text-amber-700",
    bgColor: "bg-amber-50",
  },
  planned: {
    icon: Calendar,
    label: "Planned",
    description: "Decided but not booked",
    color: "text-sky-600",
    hoverColor: "hover:text-sky-700",
    bgColor: "bg-sky-50",
  },
  confirmed: {
    icon: CheckCircle,
    label: "Confirmed",
    description: "Reservation confirmed",
    color: "text-emerald-600",
    hoverColor: "hover:text-emerald-700",
    bgColor: "bg-emerald-50",
  },
};

export function StatusIconIndicator({
  status,
  onStatusChange,
  size = "sm",
}: StatusIconIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <Popover>
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className={`inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${config.color} ${config.hoverColor} hover:bg-muted/50`}
              title={config.label}
            >
              <Icon className={iconSize} />
            </button>
          </PopoverTrigger>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="w-auto p-2 text-xs">
          <div className="font-medium">{config.label}</div>
          <div className="text-muted-foreground">{config.description}</div>
        </HoverCardContent>
      </HoverCard>
      <PopoverContent className="w-64 p-2" align="start">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground px-2 py-1">
            Change Status
          </div>
          {(Object.keys(statusConfig) as ReservationStatus[]).map((key) => {
            const item = statusConfig[key];
            const ItemIcon = item.icon;
            const isActive = key === status;

            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-sm ${
                  isActive ? item.bgColor : ""
                }`}
                onClick={() => {
                  onStatusChange(key);
                }}
              >
                <ItemIcon className={`h-4 w-4 mr-2 ${item.color}`} />
                <div className="flex-1 text-left">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.description}
                  </div>
                </div>
                {isActive && (
                  <CheckCircle className="h-3 w-3 text-muted-foreground ml-2" />
                )}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
