"use client";

import React, { useState, useEffect, useRef } from 'react';
import { searchPlacesAutocomplete } from '../actions/google-places-autocomplete';

interface PlaceAutocompleteLiveProps {
  value: string;
  onChange: (value: string, imageUrl: string | null) => void;
  placeholder: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  className?: string;
}

export function PlaceAutocompleteLive({ 
  value, 
  onChange, 
  placeholder, 
  icon: Icon, 
  className 
}: PlaceAutocompleteLiveProps) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<Array<{
    name: string;
    image: string | null;
    placeId: string;
    lat: number;
    lng: number;
  }>>([]);
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
    
    onChange(val, null);
  };

  const handleSelect = (place: typeof results[0]) => {
    setQuery(place.name);
    setIsOpen(false);
    onChange(place.name, place.image);
  };

  return (
    <div ref={containerRef} className={`relative group ${className}`}>
      <div className="flex items-center gap-1.5 bg-white/50 focus-within:bg-white focus-within:shadow-sm p-1.5 rounded-md transition-all border border-transparent focus-within:border-indigo-200">
        {Icon && <Icon size={12} className="opacity-50 flex-shrink-0" />}
        <input 
          type="text" 
          value={query}
          onChange={handleInput}
          onFocus={() => { if(query.length > 1 && results.length > 0) setIsOpen(true); }}
          className="w-full bg-transparent border-none p-0 text-[11px] font-medium focus:ring-0 placeholder-black/40 text-gray-900"
          placeholder={placeholder}
        />
        {isLoading && (
          <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden max-h-48 overflow-y-auto">
          <div className="text-[9px] font-bold text-gray-400 px-3 py-1.5 uppercase tracking-wider bg-gray-50">Suggestions</div>
          {results.map((place, i) => (
            <button
              key={place.placeId}
              onClick={() => handleSelect(place)}
              className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex items-center gap-2 group/item transition-colors"
            >
              <div 
                className="w-6 h-6 rounded bg-gray-200 bg-cover bg-center flex-shrink-0" 
                style={place.image ? { backgroundImage: `url(${place.image})` } : {}}
              >
                {!place.image && (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">?</div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-gray-800">{place.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
