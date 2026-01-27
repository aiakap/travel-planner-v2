"use client";

import React, { useEffect, useRef } from 'react';
import { MapPin, Sparkles, Check } from 'lucide-react';
import { PlaceAutocompleteLive, type PlaceData } from './place-autocomplete-live';

interface Segment {
  id: string;
  type: string;
  name: string;
  days: number;
  start_location: string;
  end_location: string;
  start_image: string | null;
  end_image: string | null;
  sameLocation?: boolean;
}

interface SimpleLocationInputProps {
  segment: Segment;
  index: number;
  onLocationChange: (field: 'start_location' | 'end_location', value: string, imageUrl: string | null, placeData?: PlaceData) => void;
  onToggleSameLocation: (newValue: boolean) => void;
  isStartAutoFilled?: boolean;
  isEndAutoFilled?: boolean;
  isFocused?: boolean;
  focusField?: 'start_location' | 'end_location';
}

export function SimpleLocationInput({
  segment,
  index,
  onLocationChange,
  onToggleSameLocation,
  isStartAutoFilled,
  isEndAutoFilled,
  isFocused,
  focusField
}: SimpleLocationInputProps) {
  const startInputRef = useRef<HTMLDivElement>(null);
  const endInputRef = useRef<HTMLDivElement>(null);
  const sameLocation = segment.sameLocation ?? false;

  // Auto-focus on the specified field when focused
  useEffect(() => {
    if (isFocused && focusField) {
      const targetRef = focusField === 'start_location' ? startInputRef : endInputRef;
      targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        const input = targetRef.current?.querySelector('input');
        input?.focus();
      }, 100);
    }
  }, [isFocused, focusField]);

  return (
    <div 
      className={`
        flex items-center gap-3 py-3 px-4 rounded-lg transition-all
        ${isFocused ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'bg-white hover:bg-gray-50'}
      `}
    >
      {/* Chapter Number */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
        {index + 1}
      </div>

      {/* Chapter Name */}
      <div className="flex-shrink-0 w-32">
        <div className="text-sm font-medium text-gray-900 truncate">
          {segment.name}
        </div>
        <div className="text-xs text-gray-500">
          {segment.days} day{segment.days !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Toggle Button */}
      <div className="flex-shrink-0">
        <button
          onClick={() => onToggleSameLocation(!sameLocation)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 hover:border-gray-400 transition-colors bg-white"
          type="button"
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
            sameLocation ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
          }`}>
            {sameLocation && <Check size={12} className="text-white" strokeWidth={3} />}
          </div>
          <span className="text-xs font-medium text-gray-700 whitespace-nowrap">
            {sameLocation ? 'Same location' : 'Different locations'}
          </span>
        </button>
      </div>

      {/* Location Inputs */}
      {sameLocation ? (
        <div className="flex-1 flex items-center gap-2" ref={startInputRef}>
          <div className="flex-1">
            <PlaceAutocompleteLive
              value={segment.start_location}
              onChange={(value, imageUrl) => {
                onLocationChange('start_location', value, imageUrl);
                onLocationChange('end_location', value, imageUrl);
              }}
              onPlaceSelected={(value, imageUrl, placeData) => {
                onLocationChange('start_location', value, imageUrl, placeData);
                onLocationChange('end_location', value, imageUrl, placeData);
              }}
              placeholder="Enter location"
              icon={MapPin}
            />
          </div>
          {isStartAutoFilled && (
            <div className="flex-shrink-0 flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              <Sparkles size={12} />
              <span>auto</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1" ref={startInputRef}>
            <PlaceAutocompleteLive
              value={segment.start_location}
              onChange={(value, imageUrl) => onLocationChange('start_location', value, imageUrl)}
              onPlaceSelected={(value, imageUrl, placeData) => onLocationChange('start_location', value, imageUrl, placeData)}
              placeholder="From"
              icon={MapPin}
            />
          </div>
          {isStartAutoFilled && (
            <div className="flex-shrink-0 flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              <Sparkles size={12} />
              <span>auto</span>
            </div>
          )}
          <div className="flex-shrink-0 text-gray-300">→</div>
          <div className="flex-1" ref={endInputRef}>
            <PlaceAutocompleteLive
              value={segment.end_location}
              onChange={(value, imageUrl) => onLocationChange('end_location', value, imageUrl)}
              onPlaceSelected={(value, imageUrl, placeData) => onLocationChange('end_location', value, imageUrl, placeData)}
              placeholder="To"
              icon={MapPin}
            />
          </div>
          {isEndAutoFilled && (
            <div className="flex-shrink-0 flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              <Sparkles size={12} />
              <span>auto</span>
            </div>
          )}
        </div>
      )}

      {/* Segment Type Badge */}
      <div className="flex-shrink-0">
        <div className={`text-xs px-2 py-1 rounded font-medium ${getSegmentTypeColor(segment.type)}`}>
          {formatSegmentType(segment.type)}
        </div>
      </div>
    </div>
  );
}

function getSegmentTypeColor(type: string): string {
  const typeUpper = type.toUpperCase();
  switch (typeUpper) {
    case 'STAY':
      return 'bg-indigo-100 text-indigo-700';
    case 'RETREAT':
      return 'bg-emerald-100 text-emerald-700';
    case 'TOUR':
      return 'bg-orange-100 text-orange-700';
    case 'ROAD_TRIP':
      return 'bg-cyan-100 text-cyan-700';
    case 'TRAVEL':
      return 'bg-stone-100 text-stone-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function formatSegmentType(type: string): string {
  const typeUpper = type.toUpperCase();
  switch (typeUpper) {
    case 'STAY':
      return 'Stay';
    case 'RETREAT':
      return 'Retreat';
    case 'TOUR':
      return 'Tour';
    case 'ROAD_TRIP':
      return 'Road Trip';
    case 'TRAVEL':
      return 'Travel';
    default:
      return type;
  }
}
