"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, Loader2 } from "lucide-react";

interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface PlaceDetails {
  formattedAddress: string;
  location: {
    lat: number;
    lng: number;
  };
  addressComponents: AddressComponent[];
  name?: string;
  types?: string[];
}

interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
}

interface PlacesAutocompleteInputProps {
  onSelect: (place: PlaceDetails) => void;
  placeholder?: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function PlacesAutocompleteInput({
  onSelect,
  placeholder = "Search for an address...",
  className = "",
  value: controlledValue,
  onChange: controlledOnChange,
}: PlacesAutocompleteInputProps) {
  const [query, setQuery] = useState(controlledValue || "");
  const [results, setResults] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Sync with controlled value if provided
  useEffect(() => {
    if (controlledValue !== undefined) {
      setQuery(controlledValue);
    }
  }, [controlledValue]);

  // Search places with debounce
  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(query)}`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data.predictions || []);
          setShowDropdown(true);
        } else {
          setResults([]);
        }
      } catch (error) {
        console.error("Places search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = async (prediction: PlacePrediction) => {
    try {
      // Fetch place details to get address components
      const response = await fetch(
        `/api/places/details?placeId=${encodeURIComponent(prediction.placeId)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Extract address components from the result
        const addressComponents = data.result?.address_components || [];
        
        const placeDetails: PlaceDetails = {
          formattedAddress: data.formattedAddress || prediction.description,
          location: data.location,
          addressComponents: addressComponents,
          name: data.name,
          types: data.types,
        };
        
        onSelect(placeDetails);
        setQuery(prediction.description);
        if (controlledOnChange) {
          controlledOnChange(prediction.description);
        }
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
    } finally {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (controlledOnChange) {
      controlledOnChange(value);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {results.map((prediction, index) => (
            <button
              key={prediction.placeId}
              onClick={() => handleSelect(prediction)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                index === selectedIndex ? "bg-gray-100" : ""
              }`}
            >
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {prediction.mainText}
                </div>
                {prediction.secondaryText && (
                  <div className="text-xs text-gray-500 truncate">
                    {prediction.secondaryText}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && !loading && results.length === 0 && query.trim().length >= 3 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3"
        >
          <p className="text-sm text-gray-500 text-center">No places found</p>
        </div>
      )}
    </div>
  );
}
