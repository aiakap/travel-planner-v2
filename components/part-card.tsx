"use client";

import { Plane, Car, Train, Ship, MapPin, Calendar, Edit2, Trash2, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

interface PartCardProps {
  part: {
    id: string;
    name: string;
    startTitle: string;
    endTitle: string;
    segmentType: { name: string };
    startTime: Date | null;
    endTime: Date | null;
    order: number;
  };
  partNumber: number;
  onEdit?: (partId: string) => void;
  onDelete?: (partId: string) => void;
}

const segmentTypeConfig: Record<string, { icon: any; color: string; bgColor: string }> = {
  Flight: { icon: Plane, color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  Drive: { icon: Car, color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
  Train: { icon: Train, color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
  Ferry: { icon: Ship, color: "text-cyan-600", bgColor: "bg-cyan-50 border-cyan-200" },
  Walk: { icon: MapPin, color: "text-amber-600", bgColor: "bg-amber-50 border-amber-200" },
  Other: { icon: MapPin, color: "text-rose-600", bgColor: "bg-rose-50 border-rose-200" },
};

export function PartCard({ part, partNumber, onEdit, onDelete }: PartCardProps) {
  const config = segmentTypeConfig[part.segmentType.name] || segmentTypeConfig.Other;
  const Icon = config.icon;

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const startDate = formatDate(part.startTime);
  const endDate = formatDate(part.endTime);

  return (
    <div className={`relative border rounded-lg p-4 hover:shadow-md transition-all group ${config.bgColor}`}>
      {/* Part Number Badge */}
      <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
        {partNumber}
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onEdit(part.id)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(part.id)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="space-y-3 pt-2">
        {/* Type Badge & Name */}
        <div className="space-y-2">
          <Badge variant="secondary" className={`${config.color} bg-white`}>
            <Icon className="h-3 w-3 mr-1" />
            {part.segmentType.name}
          </Badge>
          <h3 className="font-semibold text-slate-900 text-lg pr-16">{part.name}</h3>
        </div>

        {/* Locations */}
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <MapPin className="h-4 w-4 flex-shrink-0 text-slate-500" />
          <span className="font-medium">{part.startTitle}</span>
          {part.startTitle !== part.endTitle && (
            <>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span className="font-medium">{part.endTitle}</span>
            </>
          )}
        </div>

        {/* Dates */}
        {(startDate || endDate) && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <span>
              {startDate && endDate ? (
                startDate === endDate ? (
                  startDate
                ) : (
                  `${startDate} - ${endDate}`
                )
              ) : (
                startDate || endDate
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
