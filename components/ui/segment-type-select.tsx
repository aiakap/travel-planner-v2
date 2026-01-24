"use client";

import { useState } from "react";
import { Plane, Home, Map, Palmtree, Car, ChevronDown } from "lucide-react";

interface SegmentTypeSelectProps {
  value: string;
  onChange: (type: string) => void;
  className?: string;
}

const segmentTypes = [
  { value: "Travel", label: "Travel", icon: Plane, color: "text-blue-600", bgColor: "bg-blue-50 hover:bg-blue-100" },
  { value: "Stay", label: "Stay", icon: Home, color: "text-indigo-600", bgColor: "bg-indigo-50 hover:bg-indigo-100" },
  { value: "Tour", label: "Tour", icon: Map, color: "text-purple-600", bgColor: "bg-purple-50 hover:bg-purple-100" },
  { value: "Retreat", label: "Retreat", icon: Palmtree, color: "text-teal-600", bgColor: "bg-teal-50 hover:bg-teal-100" },
  { value: "Road Trip", label: "Road Trip", icon: Car, color: "text-orange-600", bgColor: "bg-orange-50 hover:bg-orange-100" },
];

export function SegmentTypeSelect({ value, onChange, className = "" }: SegmentTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedType = segmentTypes.find(t => t.value === value) || segmentTypes[1]; // Default to "Stay"
  const Icon = selectedType.icon;

  const handleSelect = (type: string) => {
    onChange(type);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-sm font-medium transition-colors ${selectedType.color} ${selectedType.bgColor} border-current`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{selectedType.label}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-1">
            {segmentTypes.map((type) => {
              const TypeIcon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => handleSelect(type.value)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${type.color} ${type.bgColor} ${
                    value === type.value ? "font-semibold" : "font-medium"
                  }`}
                >
                  <TypeIcon className="h-4 w-4" />
                  <span>{type.label}</span>
                  {value === type.value && (
                    <span className="ml-auto text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
