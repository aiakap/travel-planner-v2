"use client";

import { useState } from "react";
import { MapPin, Calendar, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripCardProps {
  tripId: string;
  title: string;
  startDate: string;
  endDate: string;
  description?: string;
  onUpdate?: (updates: any) => void;
  onOpenModal?: () => void;
}

export function TripCard({
  tripId,
  title,
  startDate,
  endDate,
  description,
  onUpdate,
  onOpenModal
}: TripCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editStart, setEditStart] = useState(startDate);
  const [editEnd, setEditEnd] = useState(endDate);
  
  const handleSave = () => {
    onUpdate?.({
      title: editTitle,
      startDate: editStart,
      endDate: editEnd
    });
    setIsEditing(false);
  };
  
  const formatDateRange = (start: string, end: string) => {
    const startDt = new Date(start);
    const endDt = new Date(end);
    const days = Math.ceil((endDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24));
    return `${startDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (${days} days)`;
  };
  
  if (isEditing) {
    return (
      <div className="bg-white border-2 border-blue-400 rounded-lg p-4 shadow-sm space-y-3 max-w-md">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full text-lg font-medium border-b border-slate-200 focus:outline-none focus:border-blue-500 pb-1"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={editStart}
            onChange={(e) => setEditStart(e.target.value)}
            className="flex-1 text-sm border border-slate-200 rounded px-2 py-1"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={editEnd}
            onChange={(e) => setEditEnd(e.target.value)}
            className="flex-1 text-sm border border-slate-200 rounded px-2 py-1"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave}>
            <Check className="h-4 w-4 mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
            <X className="h-4 w-4 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div
      className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer max-w-md group"
      onClick={onOpenModal}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4" />
            <span>{formatDateRange(startDate, endDate)}</span>
          </div>
          {description && (
            <p className="text-sm text-slate-500 mt-2">{description}</p>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 text-xs text-slate-400">
        Click to edit or keep chatting
      </div>
    </div>
  );
}
