"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plane, Clock, DollarSign } from "lucide-react";

export default function FlightSearchTestPage() {
  // Pre-filled default values
  const [formData, setFormData] = useState({
    origin: "JFK",
    destination: "LAX",
    departureDate: getNextWeekDate(),
    returnDate: getNextWeekDate(7),
    adults: "1",
    travelClass: "ECONOMY",
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          adults: parseInt(formData.adults),
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.flights || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Flight Search Test</h1>
      <p className="text-slate-600 mb-8">
        Test Amadeus API integration - search for real flights with prices
      </p>

      {/* Search Form */}
      <Card className="p-6 mb-8">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Origin (IATA Code)</Label>
            <Input
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              placeholder="JFK"
            />
          </div>
          <div>
            <Label>Destination (IATA Code)</Label>
            <Input
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="LAX"
            />
          </div>
          <div>
            <Label>Departure Date</Label>
            <Input
              type="date"
              value={formData.departureDate}
              onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Return Date (optional)</Label>
            <Input
              type="date"
              value={formData.returnDate}
              onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Passengers</Label>
            <Input
              type="number"
              min="1"
              max="9"
              value={formData.adults}
              onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
            />
          </div>
          <div>
            <Label>Cabin Class</Label>
            <Select
              value={formData.travelClass}
              onValueChange={(value) => setFormData({ ...formData, travelClass: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ECONOMY">Economy</SelectItem>
                <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
                <SelectItem value="FIRST">First Class</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSearch} disabled={loading} className="w-full">
          {loading ? "Searching..." : "Search Flights"}
        </Button>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 mb-4 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {/* Results Display */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            Found {results.length} flights
          </h2>
          
          {results.map((flight, idx) => (
            <FlightResultCard key={idx} flight={flight} />
          ))}
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <Card className="p-8 text-center text-slate-500">
          <Plane className="h-12 w-12 mx-auto mb-4 text-slate-300" />
          <p>Enter search parameters and click "Search Flights"</p>
        </Card>
      )}
    </div>
  );
}

function FlightResultCard({ flight }: { flight: any }) {
  const outbound = flight.itineraries[0];
  const firstSegment = outbound.segments[0];
  const lastSegment = outbound.segments[outbound.segments.length - 1];
  
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-2xl font-bold">
              {firstSegment.departure.iataCode}
            </span>
            <Plane className="h-5 w-5 text-slate-400" />
            <span className="text-2xl font-bold">
              {lastSegment.arrival.iataCode}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-600">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDuration(outbound.duration)}
            </span>
            <span>
              {outbound.segments.length === 1 ? 'Nonstop' : `${outbound.segments.length - 1} stop(s)`}
            </span>
            <span>
              {flight.validatingAirlineCodes.join(', ')}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1 text-3xl font-bold text-green-600">
            <DollarSign className="h-6 w-6" />
            {flight.price.total}
          </div>
          <div className="text-sm text-slate-500">{flight.price.currency}</div>
        </div>
      </div>
    </Card>
  );
}

// Helper functions
function getNextWeekDate(daysFromNow = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + 7 + daysFromNow);
  return date.toISOString().split('T')[0];
}

function formatDuration(isoDuration: string): string {
  // Convert PT5H30M to "5h 30m"
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?/);
  if (!match) return isoDuration;
  
  const hours = match[1] ? match[1].replace('H', 'h ') : '';
  const minutes = match[2] ? match[2].replace('M', 'm') : '';
  
  return (hours + minutes).trim();
}
