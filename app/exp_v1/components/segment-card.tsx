"use client";

import { Plane, Train, Car, Ship, MapPin } from "lucide-react";

interface SegmentCardProps {
  segmentId: string;
  name: string;
  type: string;
  startLocation: string;
  endLocation: string;
  startTime?: string;
  endTime?: string;
  onOpenModal?: () => void;
}

export function SegmentCard({
  name,
  type,
  startLocation,
  endLocation,
  startTime,
  endTime,
  onOpenModal
}: SegmentCardProps) {
  const getIcon = () => {
    switch (type.toLowerCase()) {
      case 'flight': return <Plane className="h-5 w-5" />;
      case 'train': return <Train className="h-5 w-5" />;
      case 'drive': return <Car className="h-5 w-5" />;
      case 'ferry': return <Ship className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };
  
  return (
    <div
      className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer max-w-md"
      onClick={onOpenModal}
    >
      <div className="flex items-center gap-3">
        <div className="text-slate-600">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-slate-900">{name}</h4>
          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
            <span>{startLocation}</span>
            <span>→</span>
            <span>{endLocation}</span>
          </div>
          {startTime && (
            <div className="text-xs text-slate-500 mt-1">
              {new Date(startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
