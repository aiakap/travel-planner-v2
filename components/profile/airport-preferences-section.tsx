"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AirportAutocompleteInput } from "@/components/ui/airport-autocomplete-input";
import { addHomeAirport, removeHomeAirport, addPreferredAirport, removePreferredAirport } from "@/lib/actions/profile-actions";
import { Plus, X, Plane } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
}

interface AirportPreferencesSectionProps {
  initialHomeAirports: Airport[];
  initialPreferredAirports: Airport[];
}

export function AirportPreferencesSection({
  initialHomeAirports,
  initialPreferredAirports,
}: AirportPreferencesSectionProps) {
  const [homeAirports, setHomeAirports] = useState<Airport[]>(initialHomeAirports);
  const [preferredAirports, setPreferredAirports] = useState<Airport[]>(initialPreferredAirports);
  const [isAddingHome, setIsAddingHome] = useState(false);
  const [isAddingPreferred, setIsAddingPreferred] = useState(false);
  const { toast } = useToast();

  const handleAddHomeAirport = async (airport: Airport) => {
    try {
      await addHomeAirport(airport);
      setHomeAirports([...homeAirports, airport]);
      setIsAddingHome(false);
      toast({
        title: "Airport added",
        description: `${airport.name} added to home airports`,
      });
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

  const handleAddPreferredAirport = async (airport: Airport) => {
    try {
      await addPreferredAirport(airport);
      setPreferredAirports([...preferredAirports, airport]);
      setIsAddingPreferred(false);
      toast({
        title: "Airport added",
        description: `${airport.name} added to preferred airports`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add airport",
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
      {/* Home Airports */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Home Airports</h3>
            <p className="text-sm text-gray-500">Airports near where you live</p>
          </div>
          {!isAddingHome && (
            <Button onClick={() => setIsAddingHome(true)} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {isAddingHome && (
          <div className="p-3 border rounded-lg space-y-3 bg-gray-50">
            <AirportAutocompleteInput
              onSelect={handleAddHomeAirport}
              placeholder="Search for your home airport..."
            />
            <Button
              onClick={() => setIsAddingHome(false)}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {homeAirports.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">No home airports added yet.</p>
          ) : (
            homeAirports.map((airport) => (
              <div
                key={airport.iataCode}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-sm group hover:bg-blue-100 transition-colors"
              >
                <Plane className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium text-blue-900">{airport.iataCode}</span>
                <span className="text-blue-700">-</span>
                <span className="text-blue-700">{airport.city}, {airport.country}</span>
                <button
                  onClick={() => handleRemoveHomeAirport(airport.iataCode)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-blue-600 hover:text-blue-800" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Preferred Airports */}
      <div className="space-y-3 pt-3 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Preferred Airports</h3>
            <p className="text-sm text-gray-500">Airports you prefer for connections or departures</p>
          </div>
          {!isAddingPreferred && (
            <Button onClick={() => setIsAddingPreferred(true)} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {isAddingPreferred && (
          <div className="p-3 border rounded-lg space-y-3 bg-gray-50">
            <AirportAutocompleteInput
              onSelect={handleAddPreferredAirport}
              placeholder="Search for a preferred airport..."
            />
            <Button
              onClick={() => setIsAddingPreferred(false)}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {preferredAirports.length === 0 ? (
            <p className="text-gray-500 text-sm py-2">No preferred airports added yet.</p>
          ) : (
            preferredAirports.map((airport) => (
              <div
                key={airport.iataCode}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full text-sm group hover:bg-green-100 transition-colors"
              >
                <Plane className="w-3.5 h-3.5 text-green-600" />
                <span className="font-medium text-green-900">{airport.iataCode}</span>
                <span className="text-green-700">-</span>
                <span className="text-green-700">{airport.city}, {airport.country}</span>
                <button
                  onClick={() => handleRemovePreferredAirport(airport.iataCode)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5 text-green-600 hover:text-green-800" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
