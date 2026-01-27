"use client";

import { useState } from "react";
import { AirportAutocompleteInput } from "@/components/ui/airport-autocomplete-input";
import { addHomeAirport, removeHomeAirport, addPreferredAirport, removePreferredAirport } from "@/lib/actions/profile-actions";
import { X, Home, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

interface UnifiedAirportSectionProps {
  initialHomeAirports: Airport[];
  initialPreferredAirports: Airport[];
  autoAddAirports?: boolean;
  newlyAddedAirports?: string[];
}

type AirportType = "home" | "preferred";

export function UnifiedAirportSection({
  initialHomeAirports,
  initialPreferredAirports,
  autoAddAirports = false,
  newlyAddedAirports = [],
}: UnifiedAirportSectionProps) {
  const [homeAirports, setHomeAirports] = useState<Airport[]>(initialHomeAirports);
  const [preferredAirports, setPreferredAirports] = useState<Airport[]>(initialPreferredAirports);
  const [selectedType, setSelectedType] = useState<AirportType>("home");
  const { toast } = useToast();

  const handleAddAirport = async (airport: Airport) => {
    try {
      // Check if already added
      const alreadyHome = homeAirports.some(a => a.iataCode === airport.iataCode);
      const alreadyPreferred = preferredAirports.some(a => a.iataCode === airport.iataCode);
      
      if (selectedType === "home" && alreadyHome) {
        toast({
          title: "Already added",
          description: `${airport.iataCode} is already in your home airports`,
          variant: "destructive",
        });
        return;
      }
      
      if (selectedType === "preferred" && alreadyPreferred) {
        toast({
          title: "Already added",
          description: `${airport.iataCode} is already in your preferred airports`,
          variant: "destructive",
        });
        return;
      }
      
      if (selectedType === "home") {
        await addHomeAirport(airport);
        setHomeAirports([...homeAirports, airport]);
        toast({
          title: "Airport added",
          description: `${airport.name} added to home airports`,
        });
      } else {
        await addPreferredAirport(airport);
        setPreferredAirports([...preferredAirports, airport]);
        toast({
          title: "Airport added",
          description: `${airport.name} added to preferred airports`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add airport",
        variant: "destructive",
      });
    }
  };


  const handleRemoveHomeAirport = async (iataCode: string) => {
    try {
      await removeHomeAirport(iataCode);
      setHomeAirports(homeAirports.filter((a) => a.iataCode !== iataCode));
      toast({
        title: "Airport removed",
        description: "Airport removed from home airports",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove airport",
        variant: "destructive",
      });
    }
  };

  const handleRemovePreferredAirport = async (iataCode: string) => {
    try {
      await removePreferredAirport(iataCode);
      setPreferredAirports(preferredAirports.filter((a) => a.iataCode !== iataCode));
      toast({
        title: "Airport removed",
        description: "Airport removed from preferred airports",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove airport",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Airport Preferences</h3>
        <p className="text-sm text-gray-500">Manage your home and preferred airports</p>
      </div>

      {/* Airport type selector */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="airportType"
              value="home"
              checked={selectedType === "home"}
              onChange={(e) => setSelectedType(e.target.value as AirportType)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Home className="w-4 h-4" />
              Home Airports
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="airportType"
              value="preferred"
              checked={selectedType === "preferred"}
              onChange={(e) => setSelectedType(e.target.value as AirportType)}
              className="w-4 h-4 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-sm font-medium flex items-center gap-1.5">
              <Star className="w-4 h-4" />
              Preferred Airports
            </span>
          </label>
        </div>

        {/* Airport search input - always visible */}
        <AirportAutocompleteInput
          onSelect={handleAddAirport}
          placeholder={`Search for ${selectedType === "home" ? "home" : "preferred"} airports...`}
        />
      </div>

      {/* Home Airports Display */}
      {homeAirports.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Home className="w-4 h-4" />
            <span>Home Airports</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {homeAirports.map((airport, index) => {
              const isNewlyAdded = newlyAddedAirports.includes(airport.iataCode);
              return (
                <div
                  key={`home-${airport.iataCode}-${index}`}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-slate-100 transition-all duration-300 ${
                    isNewlyAdded 
                      ? 'bg-green-50 border-2 border-green-400 shadow-md animate-in fade-in' 
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className={`font-semibold ${isNewlyAdded ? 'text-green-900' : 'text-slate-900'}`}>
                      {airport.iataCode}
                    </span>
                    {isNewlyAdded && (
                      <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-semibold">
                        NEW
                      </span>
                    )}
                    <span className={`hidden sm:inline ${isNewlyAdded ? 'text-green-600' : 'text-slate-600'}`}>·</span>
                    <span className={`text-xs sm:text-sm ${isNewlyAdded ? 'text-green-800' : 'text-slate-700'}`}>
                      {airport.city}, {airport.country}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveHomeAirport(airport.iataCode)}
                    className={`opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 ml-1 ${
                      isNewlyAdded ? 'hover:bg-green-200' : 'hover:bg-slate-200'
                    }`}
                    aria-label="Remove airport"
                  >
                    <X className={`w-3.5 h-3.5 ${isNewlyAdded ? 'text-green-700' : 'text-slate-600'}`} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Preferred Airports Display */}
      {preferredAirports.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Star className="w-4 h-4" />
            <span>Preferred Airports</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferredAirports.map((airport, index) => (
              <div
                key={`preferred-${airport.iataCode}-${index}`}
                className="group flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-semibold text-amber-900">{airport.iataCode}</span>
                  <span className="text-amber-600 hidden sm:inline">·</span>
                  <span className="text-amber-800 text-xs sm:text-sm">{airport.city}, {airport.country}</span>
                </div>
                <button
                  onClick={() => handleRemovePreferredAirport(airport.iataCode)}
                  className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-200 rounded p-0.5 ml-1"
                  aria-label="Remove airport"
                >
                  <X className="w-3.5 h-3.5 text-amber-700" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty states */}
      {homeAirports.length === 0 && preferredAirports.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>No airports added yet. Search above to add your home or preferred airports.</p>
        </div>
      )}
    </div>
  );
}
