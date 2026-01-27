"use client";

import React, { useEffect, useRef } from 'react';
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
  isFocused?: boolean;
  focusField?: 'start_location' | 'end_location';
}

export function SimpleLocationInput({
  segment,
  index,
  onLocationChange,
  onToggleSameLocation,
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
        bg-white border-2 rounded-lg p-4 transition-all
        ${isFocused ? 'border-indigo-400 shadow-lg' : 'border-gray-200 hover:border-indigo-300'}
      `}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">
            {index + 1}. {segment.name}
          </span>
          <span className="text-xs text-gray-500">
            ({segment.days} {segment.days === 1 ? 'day' : 'days'})
          </span>
        </div>
      </div>

      {/* PROMINENT LOCATION INPUTS */}
      {sameLocation ? (
        <div className="space-y-2" ref={startInputRef}>
          <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
            Location
          </label>
          <div className="text-base">
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
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div ref={startInputRef}>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
              From
            </label>
            <div className="text-base">
              <PlaceAutocompleteLive
                value={segment.start_location}
                onChange={(value, imageUrl) => onLocationChange('start_location', value, imageUrl)}
                onPlaceSelected={(value, imageUrl, placeData) => onLocationChange('start_location', value, imageUrl, placeData)}
                placeholder="Starting location"
              />
            </div>
          </div>
          <div ref={endInputRef}>
            <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">
              To
            </label>
            <div className="text-base">
              <PlaceAutocompleteLive
                value={segment.end_location}
                onChange={(value, imageUrl) => onLocationChange('end_location', value, imageUrl)}
                onPlaceSelected={(value, imageUrl, placeData) => onLocationChange('end_location', value, imageUrl, placeData)}
                placeholder="Ending location"
              />
            </div>
          </div>
        </div>
      )}

      {/* Subtle toggle at bottom */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
          <input
            type="checkbox"
            checked={sameLocation}
            onChange={(e) => onToggleSameLocation(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Same start and end location
        </label>
      </div>
    </div>
  );
}
