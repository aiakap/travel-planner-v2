"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, Calendar, Plane, Hotel, Utensils, Ticket, DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateTripSimple } from "@/lib/actions/update-trip-simple";
import { updateSegmentSimple } from "@/lib/actions/update-segment-simple";
import { updateReservationSimple } from "@/lib/actions/update-reservation-simple";

interface ContextAction {
  id: string;
  label: string;
  prompt: string;
}

interface ContextCardProps {
  type: "trip" | "segment" | "reservation";
  data: any;
  actions: ContextAction[];
  onActionClick: (prompt: string) => void;
  onSaved?: () => void;
}

type SaveStatus = "idle" | "saving" | "saved";

export function ContextCard({ type, data, actions, onActionClick, onSaved }: ContextCardProps) {
  // Trip state
  const [tripTitle, setTripTitle] = useState(data.title || "");
  const [tripStartDate, setTripStartDate] = useState(data.startDate || "");
  const [tripEndDate, setTripEndDate] = useState(data.endDate || "");
  
  // Segment state
  const [segmentName, setSegmentName] = useState(data.name || "");
  
  // Reservation state
  const [resName, setResName] = useState(data.vendor || data.name || "");
  const [resConfNum, setResConfNum] = useState(data.confirmationNumber || "");
  const [resCost, setResCost] = useState(data.cost?.toString() || "");
  
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save function
  const scheduleSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    setSaveStatus("idle");
    
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      
      try {
        if (type === "trip") {
          await updateTripSimple(data.tripId, {
            title: tripTitle,
            startDate: tripStartDate,
            endDate: tripEndDate,
          });
        } else if (type === "segment") {
          await updateSegmentSimple(data.segmentId, {
            name: segmentName,
          });
        } else if (type === "reservation") {
          await updateReservationSimple(data.reservationId, {
            name: resName,
            confirmationNumber: resConfNum,
            cost: resCost ? parseFloat(resCost) : undefined,
          });
        }
        
        setSaveStatus("saved");
        onSaved?.();
        
        // Clear "saved" indicator after 2 seconds
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Save failed:", error);
        setSaveStatus("idle");
      }
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const renderTripCard = () => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-5 w-5 text-blue-600" />
        <input
          type="text"
          value={tripTitle}
          onChange={(e) => {
            setTripTitle(e.target.value);
            scheduleSave();
          }}
          className="flex-1 text-lg font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none px-1"
          placeholder="Trip title"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <input
            type="date"
            value={tripStartDate}
            onChange={(e) => {
              setTripStartDate(e.target.value);
              scheduleSave();
            }}
            className="text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
          />
          <span>→</span>
          <input
            type="date"
            value={tripEndDate}
            onChange={(e) => {
              setTripEndDate(e.target.value);
              scheduleSave();
            }}
            className="text-sm border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:outline-none"
          />
        </div>
        {data.totalCost !== undefined && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span>Total: ${data.totalCost.toLocaleString()}</span>
          </div>
        )}
        <div className="text-xs text-slate-600">
          {data.segmentsCount} segments • {data.totalReservations} reservations
        </div>
      </div>
      {renderSaveIndicator()}
    </div>
  );
  
  const renderSegmentCard = () => (
    <div className="bg-white border-2 border-slate-300 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Plane className="h-5 w-5 text-slate-600" />
        <input
          type="text"
          value={segmentName}
          onChange={(e) => {
            setSegmentName(e.target.value);
            scheduleSave();
          }}
          className="flex-1 text-base font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-slate-500 focus:outline-none px-1"
          placeholder="Segment name"
        />
      </div>
      <div className="text-sm text-slate-700 space-y-1">
        <div>{data.startLocation} → {data.endLocation}</div>
        <div className="text-xs text-slate-600">
          {data.startDate} - {data.endDate}
        </div>
        <div className="text-xs text-slate-600">
          {data.reservationsCount} reservations
        </div>
      </div>
      {renderSaveIndicator()}
    </div>
  );
  
  const renderReservationCard = () => {
    const getIcon = () => {
      const category = data.category?.toLowerCase() || '';
      if (category.includes('stay')) return <Hotel className="h-5 w-5" />;
      if (category.includes('dining')) return <Utensils className="h-5 w-5" />;
      if (category.includes('activity')) return <Ticket className="h-5 w-5" />;
      return <MapPin className="h-5 w-5" />;
    };
    
    const getStatusColor = () => {
      switch (data.status?.toLowerCase()) {
        case 'confirmed': return 'bg-green-50 border-green-300';
        case 'pending': return 'bg-yellow-50 border-yellow-300';
        case 'suggested': return 'bg-yellow-50 border-yellow-300';
        default: return 'bg-slate-50 border-slate-300';
      }
    };
    
    return (
      <div className={`border-2 rounded-lg p-4 space-y-3 ${getStatusColor()}`}>
        <div className="flex items-center gap-2">
          <div className="text-current opacity-70">{getIcon()}</div>
          <input
            type="text"
            value={resName}
            onChange={(e) => {
              setResName(e.target.value);
              scheduleSave();
            }}
            className="flex-1 text-base font-semibold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-400 focus:border-slate-600 focus:outline-none px-1"
            placeholder="Reservation name"
          />
        </div>
        <div className="text-sm space-y-2">
          <div className="font-medium">Status: {data.status}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs">Conf #:</span>
            <input
              type="text"
              value={resConfNum}
              onChange={(e) => {
                setResConfNum(e.target.value);
                scheduleSave();
              }}
              className="flex-1 text-sm bg-transparent border-b border-transparent hover:border-slate-400 focus:border-slate-600 focus:outline-none px-1"
              placeholder="Add confirmation"
            />
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <input
              type="number"
              value={resCost}
              onChange={(e) => {
                setResCost(e.target.value);
                scheduleSave();
              }}
              className="w-24 text-sm bg-transparent border-b border-transparent hover:border-slate-400 focus:border-slate-600 focus:outline-none px-1"
              placeholder="Cost"
            />
          </div>
          {data.startTime && (
            <div className="text-xs opacity-80">
              {new Date(data.startTime).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: 'numeric', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
        {renderSaveIndicator()}
      </div>
    );
  };
  
  const renderSaveIndicator = () => {
    if (saveStatus === "idle") return null;
    
    return (
      <div className="flex items-center gap-1 text-xs">
        {saveStatus === "saving" && (
          <>
            <div className="animate-spin h-3 w-3 border-2 border-slate-400 border-t-transparent rounded-full" />
            <span className="text-slate-600">Saving...</span>
          </>
        )}
        {saveStatus === "saved" && (
          <>
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-green-600">Saved</span>
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="my-3 space-y-3">
      {type === "trip" && renderTripCard()}
      {type === "segment" && renderSegmentCard()}
      {type === "reservation" && renderReservationCard()}
      
      {actions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">What would you like to do?</p>
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                className="text-xs justify-start h-auto py-2"
                onClick={() => onActionClick(action.prompt)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
