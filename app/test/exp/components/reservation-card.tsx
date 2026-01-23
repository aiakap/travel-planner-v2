"use client";

import { Hotel, Utensils, Ticket, MapPin, DollarSign } from "lucide-react";

interface ReservationCardProps {
  reservationId: string;
  name: string;
  category: string;
  type: string;
  status: string;
  cost?: number;
  currency?: string;
  location?: string;
  startTime?: string;
  onOpenModal?: () => void;
}

export function ReservationCard({
  name,
  category,
  type,
  status,
  cost,
  currency = 'USD',
  location,
  startTime,
  onOpenModal
}: ReservationCardProps) {
  const getIcon = () => {
    switch (category.toLowerCase()) {
      case 'stay': return <Hotel className="h-5 w-5" />;
      case 'dining': return <Utensils className="h-5 w-5" />;
      case 'activity': return <Ticket className="h-5 w-5" />;
      default: return <MapPin className="h-5 w-5" />;
    }
  };
  
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-50 border-green-200 text-green-700';
      case 'pending': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };
  
  return (
    <div
      className={`border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer max-w-md ${getStatusColor()}`}
      onClick={onOpenModal}
    >
      <div className="flex items-start gap-3">
        <div className="text-current opacity-70">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-slate-900 truncate">{name}</h4>
            {cost && (
              <span className="text-xs font-medium whitespace-nowrap">
                {currency === 'USD' ? '$' : currency}{cost}
              </span>
            )}
          </div>
          <div className="text-xs opacity-70 mt-1">{type}</div>
          {location && (
            <div className="text-xs opacity-60 mt-1 truncate">{location}</div>
          )}
          {startTime && (
            <div className="text-xs opacity-60 mt-1">
              {new Date(startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
