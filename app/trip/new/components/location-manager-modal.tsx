"use client";

import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin } from 'lucide-react';
import { SimpleLocationInput } from './simple-location-input';
import { JourneyMapView } from './journey-map-view';
import { type PlaceData } from './place-autocomplete-live';
import {
  analyzeLocationChain,
  applyMultipleSuggestions,
  ChainSuggestion
} from '@/lib/utils/location-chain-engine';

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
  sameLocation?: boolean;
}

interface LocationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: Segment[];
  onSave: (updatedSegments: Segment[]) => void;
  initialFocusIndex?: number;
  initialFocusField?: 'start_location' | 'end_location';
}

export function LocationManagerModal({
  isOpen,
  onClose,
  segments: initialSegments,
  onSave,
  initialFocusIndex,
  initialFocusField
}: LocationManagerModalProps) {
  const [segments, setSegments] = useState<Segment[]>(initialSegments);
  const [focusedSegmentIndex, setFocusedSegmentIndex] = useState(initialFocusIndex);
  const [manualEdits, setManualEdits] = useState<Set<string>>(new Set());
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const isInitialMount = useRef(true);
  const previousSegmentsRef = useRef<Segment[]>(initialSegments);

  // Update segments when prop changes
  useEffect(() => {
    setSegments(initialSegments);
    previousSegmentsRef.current = initialSegments;
  }, [initialSegments]);

  // Auto-apply suggestions whenever segments change
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const analysis = analyzeLocationChain(segments);
    
    // Filter suggestions that should be auto-applied
    const autoSuggestions = analysis.suggestions.filter(suggestion => {
      if (!suggestion.autoApply || suggestion.priority > 2) return false;
      
      // Check if any of the changes would overwrite manual edits
      return suggestion.changes.every(change => {
        const key = `${segments[change.segmentIndex].id}-${change.field}`;
        return !manualEdits.has(key);
      });
    });

    if (autoSuggestions.length > 0) {
      const updated = applyMultipleSuggestions(segments, autoSuggestions);
      
      // Track which fields were auto-filled
      const newAutoFilled = new Set(autoFilledFields);
      autoSuggestions.forEach(suggestion => {
        suggestion.changes.forEach(change => {
          const key = `${segments[change.segmentIndex].id}-${change.field}`;
          newAutoFilled.add(key);
        });
      });
      
      setAutoFilledFields(newAutoFilled);
      setSegments(updated);
    }
  }, [segments.map(s => `${s.start_location}-${s.end_location}`).join(',')]);

  const handleLocationChange = (
    segmentIndex: number,
    field: 'start_location' | 'end_location',
    value: string,
    imageUrl: string | null,
    placeData?: PlaceData
  ) => {
    const updated = [...segments];
    const segment = updated[segmentIndex];
    const prefix = field === 'start_location' ? 'start' : 'end';
    
    // Mark as manual edit
    const key = `${segment.id}-${field}`;
    const newManualEdits = new Set(manualEdits);
    newManualEdits.add(key);
    
    // Remove from auto-filled if it was auto-filled
    const newAutoFilled = new Set(autoFilledFields);
    if (autoFilledFields.has(key)) {
      newAutoFilled.delete(key);
    }
    
    // Update the primary field
    updated[segmentIndex] = {
      ...segment,
      [field]: value,
      [`${prefix}_image`]: imageUrl,
      // Add coordinates and timezone if available
      ...(placeData && {
        [`${prefix}_lat`]: placeData.lat,
        [`${prefix}_lng`]: placeData.lng,
        [`${prefix}_timezone`]: placeData.timezone,
        [`${prefix}_timezone_offset`]: placeData.timezoneOffset,
      })
    };
    
    // If sameLocation is true, sync to the other field
    if (segment.sameLocation) {
      const otherField = field === 'start_location' ? 'end_location' : 'start_location';
      const otherPrefix = field === 'start_location' ? 'end' : 'start';
      
      updated[segmentIndex] = {
        ...updated[segmentIndex],
        [otherField]: value,
        [`${otherPrefix}_image`]: imageUrl,
        ...(placeData && {
          [`${otherPrefix}_lat`]: placeData.lat,
          [`${otherPrefix}_lng`]: placeData.lng,
          [`${otherPrefix}_timezone`]: placeData.timezone,
          [`${otherPrefix}_timezone_offset`]: placeData.timezoneOffset,
        })
      };
      
      // Also mark the other field as manually edited
      const otherKey = `${segment.id}-${otherField}`;
      newManualEdits.add(otherKey);
    }
    
    setManualEdits(newManualEdits);
    setAutoFilledFields(newAutoFilled);
    setSegments(updated);
    
    // Trigger smart suggestions immediately after location change
    setTimeout(() => {
      const analysis = analyzeLocationChain(updated);
      
      // Filter suggestions that should be auto-applied
      const autoSuggestions = analysis.suggestions.filter(suggestion => {
        if (!suggestion.autoApply || suggestion.priority > 2) return false;
        
        // Check if any of the changes would overwrite manual edits
        return suggestion.changes.every(change => {
          const changeKey = `${updated[change.segmentIndex].id}-${change.field}`;
          return !newManualEdits.has(changeKey);
        });
      });
      
      if (autoSuggestions.length > 0) {
        const withSuggestions = applyMultipleSuggestions(updated, autoSuggestions);
        
        // Track which fields were auto-filled
        const updatedAutoFilled = new Set(newAutoFilled);
        autoSuggestions.forEach(suggestion => {
          suggestion.changes.forEach(change => {
            const changeKey = `${updated[change.segmentIndex].id}-${change.field}`;
            updatedAutoFilled.add(changeKey);
          });
        });
        
        setAutoFilledFields(updatedAutoFilled);
        setSegments(withSuggestions);
      }
    }, 0);
  };

  const handleSave = () => {
    onSave(segments);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const handleToggleSameLocation = (segmentIndex: number, newValue: boolean) => {
    const updated = [...segments];
    updated[segmentIndex] = {
      ...updated[segmentIndex],
      sameLocation: newValue
    };
    
    // If toggling ON, sync end to start
    if (newValue && updated[segmentIndex].start_location) {
      updated[segmentIndex].end_location = updated[segmentIndex].start_location;
      updated[segmentIndex].end_image = updated[segmentIndex].start_image;
      updated[segmentIndex].end_lat = updated[segmentIndex].start_lat;
      updated[segmentIndex].end_lng = updated[segmentIndex].start_lng;
      updated[segmentIndex].end_timezone = updated[segmentIndex].start_timezone;
      updated[segmentIndex].end_timezone_offset = updated[segmentIndex].start_timezone_offset;
    }
    
    setSegments(updated);
  };

  const isFieldAutoFilled = (segmentId: string, field: string) => {
    const key = `${segmentId}-${field}`;
    return autoFilledFields.has(key);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-4 md:inset-8 lg:inset-16 z-50 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 h-full flex flex-col overflow-hidden">
          
          {/* Simple Header */}
          <div className="flex-shrink-0 border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Set Locations for Your Journey</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {segments.length} chapter{segments.length !== 1 ? 's' : ''} · Locations auto-suggested as you type
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Map View */}
            <div className="flex-shrink-0 h-[200px] p-6 pb-3">
              <JourneyMapView
                segments={segments}
                focusedIndex={focusedSegmentIndex}
                onMarkerClick={(index) => setFocusedSegmentIndex(index)}
              />
            </div>

            {/* Location Inputs List */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="space-y-2">
                {segments.map((segment, index) => (
                  <SimpleLocationInput
                    key={segment.id}
                    segment={segment}
                    index={index}
                    onLocationChange={(field, value, imageUrl, placeData) =>
                      handleLocationChange(index, field, value, imageUrl, placeData)
                    }
                    onToggleSameLocation={(newValue) => handleToggleSameLocation(index, newValue)}
                    isStartAutoFilled={isFieldAutoFilled(segment.id, 'start_location')}
                    isEndAutoFilled={isFieldAutoFilled(segment.id, 'end_location')}
                    isFocused={focusedSegmentIndex === index}
                    focusField={focusedSegmentIndex === index ? initialFocusField : undefined}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Simple Footer */}
          <div className="flex-shrink-0 bg-gray-50 border-t border-gray-200 p-4 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Save Journey
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
