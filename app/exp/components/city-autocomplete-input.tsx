"use client";

import React, { useState, useEffect, useRef } from 'react';
import { searchPlacesAutocomplete, type PlaceResult } from '../actions/google-places-autocomplete';
import { MapPin, Loader2 } from 'lucide-react';

interface CityAutocompleteInputProps {
  value: string;
  onSelect: (description: string) => void;
  placeholder: string;
  required?: boolean;
}

export function CityAutocompleteInput({ 
  value, 
  onSelect,
  placeholder,
  required = false
}: CityAutocompleteInputProps) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (val.length > 1) {
      setIsLoading(true);
      
      // Debounce API call
      debounceTimer.current = setTimeout(async () => {
        try {
          const places = await searchPlacesAutocomplete(val);
          setResults(places);
          setIsOpen(places.length > 0);
        } catch (error) {
          console.error('Error searching places:', error);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  };

  const handleSelect = (place: PlaceResult) => {
    setQuery(place.description);
    setIsOpen(false);
    onSelect(place.description);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input 
          type="text" 
          value={query}
          onChange={handleInput}
          onFocus={() => { if(query.length > 1 && results.length > 0) setIsOpen(true); }}
          className="w-full border border-slate-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
          placeholder={placeholder}
          required={required}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden max-h-60 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 px-3 py-2 bg-slate-50">
            Suggestions
          </div>
          {results.map((place) => (
            <button
              key={place.placeId}
              onClick={() => handleSelect(place)}
              type="button"
              className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 transition-colors border-b border-slate-100 last:border-b-0"
            >
              <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-700">{place.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
