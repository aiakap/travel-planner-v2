"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Plane, Loader2 } from "lucide-react";

interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  displayName: string;
  hasIATA?: boolean;
}

interface AirportAutocompleteInputProps {
  onSelect: (airport: Airport) => void;
  placeholder?: string;
  className?: string;
}

export function AirportAutocompleteInput({
  onSelect,
  placeholder = "Search for an airport...",
  className = "",
}: AirportAutocompleteInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Search airports with debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      setError(null);
      return;
    }

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Searching airports for:", query);
        
        // Try Google Places first (more reliable)
        const googleResponse = await fetch(`/api/airports/search-google?q=${encodeURIComponent(query)}`);
        console.log("Google Places airport search status:", googleResponse.status);
        
        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          console.log("Google Places airport search data:", googleData);
          
          if (googleData.airports && googleData.airports.length > 0) {
            setResults(googleData.airports);
            setShowDropdown(true);
          } else {
            // Fallback to Amadeus if Google returns no results
            console.log("No Google results, trying Amadeus...");
            const amadeusResponse = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
            
            if (amadeusResponse.ok) {
              const amadeusData = await amadeusResponse.json();
              console.log("Amadeus fallback data:", amadeusData);
              setResults(amadeusData.airports || []);
              setShowDropdown(true);
              if (!amadeusData.airports || amadeusData.airports.length === 0) {
                setError("No airports found");
              }
            } else {
              setError("No airports found");
              setResults([]);
              setShowDropdown(true);
            }
          }
        } else {
          // If Google fails, try Amadeus
          console.log("Google failed, trying Amadeus...");
          const amadeusResponse = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
          
          if (amadeusResponse.ok) {
            const amadeusData = await amadeusResponse.json();
            setResults(amadeusData.airports || []);
            setShowDropdown(true);
            if (!amadeusData.airports || amadeusData.airports.length === 0) {
              setError("No airports found");
            }
          } else {
            setError("Failed to search airports");
            setResults([]);
            setShowDropdown(true);
          }
        }
      } catch (error) {
        console.error("Airport search error:", error);
        setError("Network error - please try again");
        setResults([]);
        setShowDropdown(true);
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

  const handleSelect = (airport: Airport) => {
    onSelect(airport);
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
          {results.map((airport, index) => (
            <button
              key={`${airport.iataCode}-${index}`}
              onClick={() => handleSelect(airport)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 ${
                index === selectedIndex ? "bg-gray-100" : ""
              }`}
            >
              <Plane className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-1.5">
                  <span>{airport.name} ({airport.iataCode})</span>
                  {airport.hasIATA === false && (
                    <span className="text-[10px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded">
                      estimated
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {airport.city}, {airport.country}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && !loading && query.trim().length >= 2 && (results.length === 0 || error) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3"
        >
          <p className={`text-sm text-center ${error ? 'text-red-500' : 'text-gray-500'}`}>
            {error || "No airports found"}
          </p>
        </div>
      )}
    </div>
  );
}
