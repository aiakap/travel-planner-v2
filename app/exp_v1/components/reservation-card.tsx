"use client";

import { useState, useEffect } from "react";
import { Hotel, Utensils, Ticket, MapPin, DollarSign, Plane, Train, Camera, Calendar, Clock, Moon, Edit2, ExternalLink } from "lucide-react";
import { Button } from "@/app/exp/ui/button";
import { Badge } from "@/app/exp/ui/badge";
import { Input } from "@/app/exp/ui/input";
import { SaveIndicator } from "@/app/exp/ui/save-indicator";
import { useAutoSaveCallback } from "@/hooks/use-auto-save";
import { updateReservationSimple } from "@/lib/actions/update-reservation-simple";

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
  endTime?: string;
  imageUrl?: string;
  vendor?: string;
  onOpenModal?: () => void;
  onEdit?: () => void;
  onSaved?: () => void;
}

export function ReservationCard({
  reservationId: rawReservationId,
  name: initialName,
  category,
  type,
  status,
  cost,
  currency = 'USD',
  location,
  startTime: initialStartTime,
  endTime: initialEndTime,
  imageUrl,
  vendor: initialVendor,
  onOpenModal,
  onEdit,
  onSaved,
}: ReservationCardProps) {
  // Ensure reservationId is always a string (defensive type conversion)
  const reservationId = String(rawReservationId);
  
  // Local state for editable fields
  const [name, setName] = useState(initialName);
  const [vendor, setVendor] = useState(initialVendor || initialName);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  
  // Editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDates, setIsEditingDates] = useState(false);

  // Auto-save hook
  const { save, saveState } = useAutoSaveCallback(async (updates: any) => {
    await updateReservationSimple(reservationId, updates);
    onSaved?.();
  }, { delay: 500 });

  // Date formatting utilities
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  const formatTimeForInput = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toTimeString().slice(0, 5);
    } catch {
      return "";
    }
  };

  // Return datetime-local format directly - no ISO/UTC conversion
  // Wall clock fields are source of truth, server parses this format correctly
  const combineDateAndTime = (date: string, time: string) => {
    return `${date}T${time}`;
  };

  const formatDateDisplay = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return "";
    }
  };

  const formatTimeDisplay = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit'
      });
    } catch {
      return "";
    }
  };

  const formatDateRange = () => {
    if (!startTime) return "";
    
    const startDate = formatDateDisplay(startTime);
    const startTimeStr = formatTimeDisplay(startTime);
    
    if (!endTime) {
      return `${startDate} at ${startTimeStr}`;
    }
    
    const endDate = formatDateDisplay(endTime);
    const endTimeStr = formatTimeDisplay(endTime);
    
    // Same day
    if (formatDateForInput(startTime) === formatDateForInput(endTime)) {
      return `${startDate}, ${startTimeStr} - ${endTimeStr}`;
    }
    
    // Different days
    return `${startDate} - ${endDate}`;
  };

  const calculateNights = (): number | null => {
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, nights);
  };

  // Handle field updates
  const handleNameChange = (newName: string) => {
    setName(newName);
    setVendor(newName);
    save({ name: newName, vendor: newName });
  };

  const handleStartDateChange = (date: string) => {
    const time = formatTimeForInput(startTime) || "12:00";
    const newStartTime = combineDateAndTime(date, time);
    setStartTime(newStartTime);
    save({ startTime: newStartTime });
  };

  const handleStartTimeChange = (time: string) => {
    const date = formatDateForInput(startTime) || new Date().toISOString().split('T')[0];
    const newStartTime = combineDateAndTime(date, time);
    setStartTime(newStartTime);
    save({ startTime: newStartTime });
  };

  const handleEndDateChange = (date: string) => {
    const time = formatTimeForInput(endTime) || "12:00";
    const newEndTime = combineDateAndTime(date, time);
    setEndTime(newEndTime);
    save({ endTime: newEndTime });
  };

  const handleEndTimeChange = (time: string) => {
    const date = formatDateForInput(endTime) || new Date().toISOString().split('T')[0];
    const newEndTime = combineDateAndTime(date, time);
    setEndTime(newEndTime);
    save({ endTime: newEndTime });
  };

  const getIcon = () => {
    const iconClass = "h-12 w-12";
    switch (category.toLowerCase()) {
      case 'stay': 
      case 'hotel':
        return <Hotel className={iconClass} />;
      case 'dining': 
      case 'restaurant':
        return <Utensils className={iconClass} />;
      case 'activity': 
      case 'attraction':
        return <Camera className={iconClass} />;
      case 'flight':
        return <Plane className={iconClass} />;
      case 'train':
        return <Train className={iconClass} />;
      default: 
        return <Ticket className={iconClass} />;
    }
  };
  
  const getStatusBadge = () => {
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('confirm')) {
      return (
        <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5 font-medium border-green-200">
          Confirmed
        </Badge>
      );
    }
    if (statusLower.includes('plan')) {
      return (
        <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 font-medium border-blue-200">
          Planned
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-medium border-amber-200">
        Suggestion
      </Badge>
    );
  };

  const nights = calculateNights();

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200 max-w-md">
      {/* Header with image/icon */}
      <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-400">
            {getIcon()}
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          {getStatusBadge()}
          {nights && nights > 0 && (
            <Badge className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 font-medium border-indigo-200 flex items-center gap-1">
              <Moon className="h-3 w-3" />
              {nights}
            </Badge>
          )}
        </div>
        <div className="absolute top-2 left-2">
          <SaveIndicator state={saveState} />
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 space-y-3">
        {/* Name/Vendor - Inline editable */}
        <div>
          {isEditingName ? (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                setIsEditingName(false);
                if (name !== initialName) {
                  handleNameChange(name);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingName(false);
                  if (name !== initialName) {
                    handleNameChange(name);
                  }
                } else if (e.key === 'Escape') {
                  setName(initialName);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="text-lg font-bold"
            />
          ) : (
            <div 
              onClick={() => setIsEditingName(true)}
              className="cursor-pointer hover:bg-slate-50 rounded px-2 py-1 -mx-2 transition-colors group"
            >
              <h3 className="text-lg font-bold text-slate-900 flex items-center justify-between">
                <span>{name}</span>
                <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
            </div>
          )}
          <p className="text-sm text-slate-600 mt-0.5">{type}</p>
        </div>

        {/* Date & Time - Inline editable */}
        {!isEditingDates ? (
          <div 
            onClick={() => setIsEditingDates(true)}
            className="cursor-pointer hover:bg-slate-50 rounded p-2 -mx-2 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{formatDateRange()}</p>
              </div>
              <Edit2 className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-2 bg-slate-50 rounded border border-slate-200">
            <div className="text-xs font-medium text-slate-600 mb-2">Edit Date & Time</div>
            
            {/* Start Date/Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">Start Date</label>
                <Input
                  type="date"
                  value={formatDateForInput(startTime)}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Start Time</label>
                <Input
                  type="time"
                  value={formatTimeForInput(startTime)}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="text-sm mt-1"
                />
              </div>
            </div>

            {/* End Date/Time */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500">End Date</label>
                <Input
                  type="date"
                  value={formatDateForInput(endTime)}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">End Time</label>
                <Input
                  type="time"
                  value={formatTimeForInput(endTime)}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="text-sm mt-1"
                />
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditingDates(false)}
              className="w-full text-xs mt-2"
            >
              Done
            </Button>
          </div>
        )}

        {/* Location */}
        {location && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{location}</span>
          </div>
        )}

        {/* Cost */}
        {cost && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
            <DollarSign className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-900">
              {currency === 'USD' ? '$' : currency}{cost.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-between">
        <div className="flex gap-2">
          {onEdit && (
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              className="text-xs"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          {location && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(location)}`, '_blank')}
              className="text-xs hover:bg-slate-100"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Map
            </Button>
          )}
        </div>
        {saveState !== 'idle' && (
          <div className="text-xs text-slate-500">
            {saveState === 'saving' && 'Saving...'}
            {saveState === 'saved' && 'Saved'}
            {saveState === 'error' && 'Error'}
          </div>
        )}
      </div>
    </div>
  );
}
