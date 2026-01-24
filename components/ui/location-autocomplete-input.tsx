"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { getPlaceAutocompleteSuggestions, getPlaceDetailsByPlaceId } from "@/lib/actions/address-validation";
import { PlaceAutocompleteSuggestion, PlaceAutocompleteResult } from "@/lib/types/place-suggestion";

interface LocationAutocompleteInputProps {
  value: string;
  onChange: (value: string, details?: PlaceAutocompleteResult) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}

export function LocationAutocompleteInput({
  value,
  onChange,
  placeholder = "Search for a location...",
  className = "",
  label,
}: LocationAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PlaceAutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(7));
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced search function
  const debouncedSearch = useCallback(async (searchInput: string) => {
    if (searchInput.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await getPlaceAutocompleteSuggestions(searchInput, sessionToken);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken]);

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Update parent with text value immediately

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for API call
    debounceTimerRef.current = setTimeout(() => {
      debouncedSearch(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = async (suggestion: PlaceAutocompleteSuggestion) => {
    setInputValue(suggestion.mainText);
    setIsOpen(false);
    setSuggestions([]);
    setIsLoading(true);

    try {
      // Fetch detailed place information
      const details = await getPlaceDetailsByPlaceId(suggestion.placeId);
      if (details) {
        onChange(details.name, details);
      } else {
        onChange(suggestion.mainText);
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      onChange(suggestion.mainText);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSuggestions([]);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle clear button
  const handleClear = () => {
    setInputValue("");
    onChange("");
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {label && (
        <label className="text-sm text-slate-700 font-medium block mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <MapPin className="h-4 w-4" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          className={`w-full text-sm border border-slate-300 rounded pl-9 pr-9 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${className}`}
          autoComplete="off"
        />
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
          )}
          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.placeId}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                index === selectedIndex ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {suggestion.mainText}
                  </div>
                  {suggestion.secondaryText && (
                    <div className="text-xs text-slate-500 truncate">
                      {suggestion.secondaryText}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && inputValue.length >= 3 && suggestions.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2.5"
        >
          <div className="text-sm text-slate-500 text-center">
            No locations found
          </div>
        </div>
      )}
    </div>
  );
}
