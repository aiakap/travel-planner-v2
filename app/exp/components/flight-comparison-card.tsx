"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/exp/ui/button";
import { Badge } from "@/app/exp/ui/badge";
import { 
  Plane, 
  Clock, 
  DollarSign, 
  Calendar,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Check,
  PlusCircle
} from "lucide-react";
import { addFlightsToTrip } from "@/lib/actions/add-flights-to-trip";

interface FlightOffer {
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    duration: string;
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      aircraft?: {
        code: string;
      };
    }>;
  }>;
  travelerPricings?: Array<{
    fareDetailsBySegment: Array<{
      cabin: string;
      includedCheckedBags?: {
        quantity: number;
      };
    }>;
  }>;
  validatingAirlineCodes?: string[];
}

interface FlightComparisonCardProps {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers?: number;
  // New props for integration with segment/trip
  segmentId?: string;
  tripId?: string;
  flights?: FlightOffer[]; // Pre-fetched flights from API
  onFlightAdded?: () => void; // Callback after adding flight
}

export function FlightComparisonCard({ 
  origin, 
  destination, 
  departDate, 
  returnDate,
  passengers = 1,
  segmentId,
  tripId,
  flights: prefetchedFlights,
  onFlightAdded
}: FlightComparisonCardProps) {
  const [loading, setLoading] = useState(!prefetchedFlights);
  const [error, setError] = useState<string | null>(null);
  const [flights, setFlights] = useState<FlightOffer[]>(prefetchedFlights || []);
  const [expandedFlight, setExpandedFlight] = useState<string | null>(null);
  const [selectingFlight, setSelectingFlight] = useState<string | null>(null);
  const [addedFlights, setAddedFlights] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only load flights if not provided via props
    if (!prefetchedFlights) {
      loadFlights();
    } else {
      setFlights(prefetchedFlights);
      setLoading(false);
    }
  }, [origin, destination, departDate, returnDate, passengers, prefetchedFlights]);

  const loadFlights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call Amadeus API
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          departureDate: departDate,
          returnDate,
          adults: passengers,
          max: 10
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search flights');
      }

      const data = await response.json();
      setFlights(data.flights || []);
    } catch (err: any) {
      console.error("Error loading flights:", err);
      setError(err.message || "Failed to load flights");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration: string): string => {
    const match = duration.match(/PT(\d+)H(\d+)M/);
    if (match) {
      return `${match[1]}h ${match[2]}m`;
    }
    return duration;
  };

  const formatTime = (dateTime: string): string => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getAirlineName = (code: string): string => {
    const airlines: Record<string, string> = {
      AA: "American Airlines",
      UA: "United Airlines",
      DL: "Delta Air Lines",
      BA: "British Airways",
      AF: "Air France",
    };
    return airlines[code] || code;
  };

  const handleSelectFlight = async (flight: FlightOffer) => {
    setSelectingFlight(flight.id);
    
    try {
      const flightSegment = flight.itineraries[0].segments[0];
      
      // Format time for display (extract HH:MM AM/PM from ISO datetime)
      const formatTimeFor12Hour = (isoString: string): string => {
        const date = new Date(isoString);
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      };

      // Format date as YYYY-MM-DD
      const formatDate = (isoString: string): string => {
        return isoString.split('T')[0];
      };

      // Build flight data for addFlightsToTrip
      const flightData = {
        flights: [{
          flightNumber: flightSegment.number,
          carrier: getAirlineName(flightSegment.carrierCode),
          departureAirport: flightSegment.departure.iataCode,
          arrivalAirport: flightSegment.arrival.iataCode,
          departureCity: flightSegment.departure.iataCode,
          arrivalCity: flightSegment.arrival.iataCode,
          departureDate: formatDate(flightSegment.departure.at),
          arrivalDate: formatDate(flightSegment.arrival.at),
          departureTime: formatTimeFor12Hour(flightSegment.departure.at),
          arrivalTime: formatTimeFor12Hour(flightSegment.arrival.at),
          cabin: flight.travelerPricings?.[0]?.fareDetailsBySegment[0]?.cabin || 'ECONOMY',
        }],
        totalCost: parseFloat(flight.price.total),
        currency: flight.price.currency,
        confirmationNumber: undefined,
      };

      if (tripId && segmentId) {
        // Use addFlightsToTrip to properly add to segment
        console.log('[FlightComparisonCard] Adding flight to trip:', tripId, 'segment:', segmentId);
        await addFlightsToTrip(tripId, segmentId, flightData);
      } else if (tripId) {
        // Add to trip without specific segment (will auto-match)
        console.log('[FlightComparisonCard] Adding flight to trip (auto-match):', tripId);
        await addFlightsToTrip(tripId, null, flightData);
      } else {
        // Fallback: create reservation via API
        console.log('[FlightComparisonCard] No tripId, using fallback API');
        const response = await fetch("/api/reservations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${getAirlineName(flightSegment.carrierCode)} ${flightSegment.number}`,
            vendor: getAirlineName(flightSegment.carrierCode),
            category: "Transport",
            type: "Flight",
            status: "SUGGESTED",
            startTime: flightSegment.departure.at,
            endTime: flightSegment.arrival.at,
            cost: parseFloat(flight.price.total),
            currency: flight.price.currency,
          }),
        });

        if (!response.ok) throw new Error("Failed to add flight");
      }
      
      console.log("Flight added successfully");
      setAddedFlights(prev => new Set(prev).add(flight.id));
      onFlightAdded?.();
    } catch (err: any) {
      console.error("Error adding flight:", err);
      alert("Failed to add flight to itinerary");
    } finally {
      setSelectingFlight(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Searching for flights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <Plane className="h-5 w-5 text-sky-600" />
          <h3 className="font-semibold text-slate-900">Flight Options</h3>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          {origin} → {destination} • {new Date(departDate).toLocaleDateString()} • {passengers} passenger{passengers > 1 ? 's' : ''}
        </p>
      </div>

      {/* Flight cards */}
      <div className="divide-y divide-slate-200">
        {flights.map((flight) => {
          const segment = flight.itineraries[0].segments[0];
          const isExpanded = expandedFlight === flight.id;
          const isSelecting = selectingFlight === flight.id;
          const cabin = flight.travelerPricings?.[0]?.fareDetailsBySegment[0]?.cabin || "ECONOMY";
          const bags = flight.travelerPricings?.[0]?.fareDetailsBySegment[0]?.includedCheckedBags?.quantity || 0;

          return (
            <div key={flight.id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                {/* Airline */}
                <div className="w-20 flex-shrink-0">
                  <div className="text-sm font-medium text-slate-900">
                    {segment.carrierCode}
                  </div>
                  <div className="text-xs text-slate-500">
                    {segment.number}
                  </div>
                </div>

                {/* Route and times */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-900">
                      {formatTime(segment.departure.at)}
                    </div>
                    <div className="text-sm text-slate-500">{origin}</div>
                  </div>

                  <div className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-slate-500 mb-1">
                      {formatDuration(flight.itineraries[0].duration)}
                    </div>
                    <div className="w-full h-px bg-slate-300 relative">
                      <ArrowRight className="h-4 w-4 text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white" />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {flight.itineraries[0].segments.length === 1 ? "Direct" : `${flight.itineraries[0].segments.length - 1} stop${flight.itineraries[0].segments.length > 2 ? 's' : ''}`}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-slate-900">
                      {formatTime(segment.arrival.at)}
                    </div>
                    <div className="text-sm text-slate-500">{destination}</div>
                  </div>
                </div>

                {/* Price and action */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">
                      ${flight.price.total}
                    </div>
                    <div className="text-xs text-slate-500">{cabin.replace('_', ' ')}</div>
                  </div>

                  <Button
                    onClick={() => handleSelectFlight(flight)}
                    disabled={isSelecting || addedFlights.has(flight.id)}
                    className="whitespace-nowrap"
                    variant={addedFlights.has(flight.id) ? "outline" : "default"}
                  >
                    {isSelecting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Adding...
                      </>
                    ) : addedFlights.has(flight.id) ? (
                      <>
                        <Check className="h-4 w-4 mr-1 text-green-600" />
                        Added
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add to Journey
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Details section */}
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-600">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  <span>{bags} checked bag{bags !== 1 ? 's' : ''}</span>
                </div>
                {segment.aircraft && (
                  <div>Aircraft: {segment.aircraft.code}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {flights.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No flights found for these dates
        </div>
      )}
    </div>
  );
}
