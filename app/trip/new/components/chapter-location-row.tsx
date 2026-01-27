"use client";

import React, { useEffect, useRef } from 'react';
import { MapPin, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { PlaceAutocompleteLive, type PlaceData } from './place-autocomplete-live';
import { ValidationError } from '@/lib/utils/location-chain-engine';

interface Segment {
  id: string;
  dbId?: string;
  type: string;
  name: string;
  days: number;
  start_location: string;
  end_location: string;
  start_image: string | null;
  end_image: string | null;
  start_lat?: number;
  start_lng?: number;
  end_lat?: number;
  end_lng?: number;
  start_timezone?: string;
  end_timezone?: string;
  start_timezone_offset?: number;
  end_timezone_offset?: number;
}

interface ChapterLocationRowProps {
  segment: Segment;
  index: number;
  totalSegments: number;
  isSingleLocation: boolean;
  onLocationChange: (field: 'start_location' | 'end_location', value: string, imageUrl: string | null, placeData?: PlaceData) => void;
  hasSuggestion?: boolean;
  validationErrors?: ValidationError[];
  isFocused?: boolean;
  focusField?: 'start_location' | 'end_location';
}

export function ChapterLocationRow({
  segment,
  index,
  totalSegments,
  isSingleLocation,
  onLocationChange,
  hasSuggestion,
  validationErrors = [],
  isFocused,
  focusField
}: ChapterLocationRowProps) {
  const startInputRef = useRef<HTMLDivElement>(null);
  const endInputRef = useRef<HTMLDivElement>(null);

  // Auto-focus on the specified field when focused
  useEffect(() => {
    if (isFocused && focusField) {
      const targetRef = focusField === 'start_location' ? startInputRef : endInputRef;
      targetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Focus the input inside the PlaceAutocompleteLive
      setTimeout(() => {
        const input = targetRef.current?.querySelector('input');
        input?.focus();
      }, 100);
    }
  }, [isFocused, focusField]);

  const startErrors = validationErrors.filter(e => e.field === 'start_location');
  const endErrors = validationErrors.filter(e => e.field === 'end_location');

  return (
    <div 
      className={`
        relative border rounded-lg p-4 transition-all
        ${isFocused ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20' : 'bg-white border-gray-200'}
      `}
    >
      {/* Chapter Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
            #{index + 1}
          </div>
          <div className="font-semibold text-sm text-gray-900">
            {segment.name}
          </div>
          <div className={`text-xs px-2 py-1 rounded font-medium ${getSegmentTypeColor(segment.type)}`}>
            {formatSegmentType(segment.type)}
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {segment.days} day{segment.days !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Location Inputs */}
      {isSingleLocation ? (
        /* Single Location Input */
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
            <MapPin size={12} />
            <span>Location</span>
            {hasSuggestion && (
              <div className="flex items-center gap-1 text-indigo-600">
                <Sparkles size={12} />
                <span className="text-[10px]">Suggested</span>
              </div>
            )}
          </div>
          <div ref={startInputRef}>
            <PlaceAutocompleteLive
              value={segment.start_location}
              onChange={(value, imageUrl) => {
                onLocationChange('start_location', value, imageUrl);
                // Auto-sync for single-location segments
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
          {startErrors.map((error, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-red-600 mt-1">
              <AlertCircle size={12} />
              <span>{error.message}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Start and End Locations */
        <div className="space-y-3">
          {/* Start Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <MapPin size={12} />
              <span>Start</span>
              {hasSuggestion && startErrors.length === 0 && (
                <div className="flex items-center gap-1 text-indigo-600">
                  <Sparkles size={12} />
                  <span className="text-[10px]">Suggested</span>
                </div>
              )}
            </div>
            <div ref={startInputRef}>
              <PlaceAutocompleteLive
                value={segment.start_location}
                onChange={(value, imageUrl) => onLocationChange('start_location', value, imageUrl)}
                onPlaceSelected={(value, imageUrl, placeData) => onLocationChange('start_location', value, imageUrl, placeData)}
                placeholder="Start location"
                icon={MapPin}
              />
            </div>
            {startErrors.map((error, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-1 text-xs mt-1 ${
                  error.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}
              >
                <AlertCircle size={12} />
                <span>{error.message}</span>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight size={16} className="text-gray-300" />
          </div>

          {/* End Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase">
              <MapPin size={12} />
              <span>End</span>
              {hasSuggestion && endErrors.length === 0 && (
                <div className="flex items-center gap-1 text-indigo-600">
                  <Sparkles size={12} />
                  <span className="text-[10px]">Suggested</span>
                </div>
              )}
            </div>
            <div ref={endInputRef}>
              <PlaceAutocompleteLive
                value={segment.end_location}
                onChange={(value, imageUrl) => onLocationChange('end_location', value, imageUrl)}
                onPlaceSelected={(value, imageUrl, placeData) => onLocationChange('end_location', value, imageUrl, placeData)}
                placeholder="End location"
                icon={MapPin}
              />
            </div>
            {endErrors.map((error, i) => (
              <div 
                key={i} 
                className={`flex items-center gap-1 text-xs mt-1 ${
                  error.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                }`}
              >
                <AlertCircle size={12} />
                <span>{error.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Get color class for segment type
 */
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

/**
 * Format segment type for display
 */
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
