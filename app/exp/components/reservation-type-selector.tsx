"use client";

import { useState } from "react";
import { Hotel, Plane, Car, Utensils, Ticket, Train, Ship, AlertCircle } from "lucide-react";
import { Button } from "@/app/exp/ui/button";
import { Badge } from "@/app/exp/ui/badge";

type ReservationType = "hotel" | "flight" | "car-rental" | "restaurant" | "event" | "train" | "cruise";

interface TypeOption {
  id: ReservationType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  { id: "hotel", label: "Hotel", icon: Hotel, description: "Accommodation booking" },
  { id: "flight", label: "Flight", icon: Plane, description: "Airline ticket" },
  { id: "car-rental", label: "Car Rental / Transfer", icon: Car, description: "Vehicle rental or transfer service" },
  { id: "restaurant", label: "Restaurant", icon: Utensils, description: "Dining reservation" },
  { id: "event", label: "Event", icon: Ticket, description: "Tickets or admission" },
  { id: "train", label: "Train", icon: Train, description: "Rail ticket" },
  { id: "cruise", label: "Cruise", icon: Ship, description: "Cruise booking" },
];

interface ReservationTypeSelectorProps {
  detectedType: ReservationType;
  confidence: number;
  onConfirm: (selectedType: ReservationType) => void;
  onCancel: () => void;
}

export function ReservationTypeSelector({
  detectedType,
  confidence,
  onConfirm,
  onCancel,
}: ReservationTypeSelectorProps) {
  const [selectedType, setSelectedType] = useState<ReservationType>(detectedType);

  const confidencePercent = Math.round(confidence * 100);
  const confidenceColor = confidence > 0.6 ? "bg-yellow-500/10 text-yellow-700 border-yellow-500/20" :
                          confidence > 0.5 ? "bg-orange-500/10 text-orange-700 border-orange-500/20" :
                          "bg-red-500/10 text-red-700 border-red-500/20";

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-medium text-blue-900">
              I detected a booking confirmation
            </h4>
            <Badge variant="outline" className={`${confidenceColor} text-xs`}>
              {confidencePercent}% confidence
            </Badge>
          </div>
          <p className="text-sm text-blue-700">
            Please confirm the type of reservation:
          </p>
        </div>
      </div>

      {/* Type Selection Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {TYPE_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedType === option.id;
          const isDetected = detectedType === option.id;

          return (
            <button
              key={option.id}
              onClick={() => setSelectedType(option.id)}
              className={`
                relative p-3 rounded-lg border-2 transition-all text-left
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
                }
              `}
            >
              {isDetected && !isSelected && (
                <div className="absolute top-1 right-1">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-300">
                    detected
                  </Badge>
                </div>
              )}
              {isSelected && (
                <div className="absolute top-1 right-1">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {option.label}
                </span>
              </div>
              <p className={`text-xs ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                {option.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={() => onConfirm(selectedType)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="sm"
        >
          Extract as {TYPE_OPTIONS.find(t => t.id === selectedType)?.label}
        </Button>
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
        >
          Cancel - Send as Message
        </Button>
      </div>
    </div>
  );
}
