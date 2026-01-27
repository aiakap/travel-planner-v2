"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plane, Hotel, MapPin, DollarSign, Luggage, Users, Clock, AlertTriangle } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { ApiResponseViewer } from "../_components/api-response-viewer";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DetailSection } from "../_components/detail-section";
import { InfoGrid } from "../_components/info-grid";
import { Timeline } from "../_components/timeline";
import { 
  formatTime, 
  formatPrice, 
  formatDuration, 
  formatDate, 
  getAirlineName,
  formatCabinClass,
  formatCoordinates
} from "@/lib/format-helpers";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

interface TestResult {
  response: any;
  status?: number;
  duration?: number;
  error?: string;
}

// ============================================================================
// Flight Discovery Tab Component
// ============================================================================
function FlightDiscoveryTab() {
  const [inspirationOrigin, setInspirationOrigin] = useState("BOS");
  const [inspirationDate, setInspirationDate] = useState("2026-08-01");
  const [inspirationMaxPrice, setInspirationMaxPrice] = useState("500");
  const [inspirationResult, setInspirationResult] = useState<TestResult | null>(null);
  const [inspirationLoading, setInspirationLoading] = useState(false);

  const [cheapDateOrigin, setCheapDateOrigin] = useState("MAD");
  const [cheapDateDest, setCheapDateDest] = useState("BCN");
  const [cheapDateRange, setCheapDateRange] = useState("2026-08-01,2026-08-31");
  const [cheapDateResult, setCheapDateResult] = useState<TestResult | null>(null);
  const [cheapDateLoading, setCheapDateLoading] = useState(false);

  const testInspiration = async () => {
    setInspirationLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "flight-inspiration",
          params: {
            origin: inspirationOrigin,
            departureDate: inspirationDate,
            maxPrice: parseFloat(inspirationMaxPrice),
            oneWay: false,
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setInspirationResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setInspirationResult({ response: null, error: error.message });
    } finally {
      setInspirationLoading(false);
    }
  };

  const testCheapestDates = async () => {
    setCheapDateLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "flight-cheapest-dates",
          params: {
            origin: cheapDateOrigin,
            destination: cheapDateDest,
            departureDate: cheapDateRange,
            oneWay: false,
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setCheapDateResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setCheapDateResult({ response: null, error: error.message });
    } finally {
      setCheapDateLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Inspiration Search</CardTitle>
          <CardDescription>Find inspiring destinations from an origin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Origin (IATA)</Label>
              <Input value={inspirationOrigin} onChange={(e) => setInspirationOrigin(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Input type="date" value={inspirationDate} onChange={(e) => setInspirationDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Max Price</Label>
              <Input type="number" value={inspirationMaxPrice} onChange={(e) => setInspirationMaxPrice(e.target.value)} />
            </div>
          </div>
          <Button onClick={testInspiration} disabled={inspirationLoading}>
            {inspirationLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search Destinations
          </Button>
        </CardContent>
      </Card>
      {inspirationResult && <ApiResponseViewer response={inspirationResult.response} status={inspirationResult.status} duration={inspirationResult.duration} error={inspirationResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Flight Cheapest Date Search</CardTitle>
          <CardDescription>Find the cheapest dates to fly between two cities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input value={cheapDateOrigin} onChange={(e) => setCheapDateOrigin(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={cheapDateDest} onChange={(e) => setCheapDateDest(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Date Range (comma-separated)</Label>
              <Input value={cheapDateRange} onChange={(e) => setCheapDateRange(e.target.value)} placeholder="2026-08-01,2026-08-31" />
            </div>
          </div>
          <Button onClick={testCheapestDates} disabled={cheapDateLoading}>
            {cheapDateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Find Cheapest Dates
          </Button>
        </CardContent>
      </Card>
      {cheapDateResult && <ApiResponseViewer response={cheapDateResult.response} status={cheapDateResult.status} duration={cheapDateResult.duration} error={cheapDateResult.error} />}
    </div>
  );
}

// ============================================================================
// Flight Intelligence Tab Component
// ============================================================================
function FlightIntelligenceTab() {
  const [priceOrigin, setPriceOrigin] = useState("MAD");
  const [priceDest, setPriceDest] = useState("CDG");
  const [priceDate, setPriceDate] = useState("2026-08-15");
  const [priceResult, setPriceResult] = useState<TestResult | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const [delayOrigin, setDelayOrigin] = useState("NCE");
  const [delayDest, setDelayDest] = useState("IST");
  const [delayDepDate, setDelayDepDate] = useState("2026-08-01");
  const [delayDepTime, setDelayDepTime] = useState("18:20:00");
  const [delayArrDate, setDelayArrDate] = useState("2026-08-01");
  const [delayArrTime, setDelayArrTime] = useState("22:15:00");
  const [delayCarrier, setDelayCarrier] = useState("TK");
  const [delayFlightNum, setDelayFlightNum] = useState("1816");
  const [delayAircraft, setDelayAircraft] = useState("321");
  const [delayDuration, setDelayDuration] = useState("PT3H55M");
  const [delayResult, setDelayResult] = useState<TestResult | null>(null);
  const [delayLoading, setDelayLoading] = useState(false);

  const testPriceAnalysis = async () => {
    setPriceLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "flight-price-analysis",
          params: {
            originIataCode: priceOrigin,
            destinationIataCode: priceDest,
            departureDate: priceDate,
            currencyCode: "EUR",
            oneWay: true,
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setPriceResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setPriceResult({ response: null, error: error.message });
    } finally {
      setPriceLoading(false);
    }
  };

  const testDelayPrediction = async () => {
    setDelayLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "flight-delay-prediction",
          params: {
            originLocationCode: delayOrigin,
            destinationLocationCode: delayDest,
            departureDate: delayDepDate,
            departureTime: delayDepTime,
            arrivalDate: delayArrDate,
            arrivalTime: delayArrTime,
            aircraftCode: delayAircraft,
            carrierCode: delayCarrier,
            flightNumber: delayFlightNum,
            duration: delayDuration,
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setDelayResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setDelayResult({ response: null, error: error.message });
    } finally {
      setDelayLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Price Analysis</CardTitle>
          <CardDescription>Compare flight prices to historical data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input value={priceOrigin} onChange={(e) => setPriceOrigin(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={priceDest} onChange={(e) => setPriceDest(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Input type="date" value={priceDate} onChange={(e) => setPriceDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={testPriceAnalysis} disabled={priceLoading}>
            {priceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Price
          </Button>
        </CardContent>
      </Card>
      {priceResult && <ApiResponseViewer response={priceResult.response} status={priceResult.status} duration={priceResult.duration} error={priceResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Flight Delay Prediction</CardTitle>
          <CardDescription>Predict flight delay probability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input value={delayOrigin} onChange={(e) => setDelayOrigin(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={delayDest} onChange={(e) => setDelayDest(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Carrier Code</Label>
              <Input value={delayCarrier} onChange={(e) => setDelayCarrier(e.target.value.toUpperCase())} maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Flight Number</Label>
              <Input value={delayFlightNum} onChange={(e) => setDelayFlightNum(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Dep Date</Label>
              <Input type="date" value={delayDepDate} onChange={(e) => setDelayDepDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dep Time</Label>
              <Input value={delayDepTime} onChange={(e) => setDelayDepTime(e.target.value)} placeholder="18:20:00" />
            </div>
            <div className="space-y-2">
              <Label>Arr Date</Label>
              <Input type="date" value={delayArrDate} onChange={(e) => setDelayArrDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Arr Time</Label>
              <Input value={delayArrTime} onChange={(e) => setDelayArrTime(e.target.value)} placeholder="22:15:00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aircraft Code</Label>
              <Input value={delayAircraft} onChange={(e) => setDelayAircraft(e.target.value)} placeholder="321" />
            </div>
            <div className="space-y-2">
              <Label>Duration (ISO 8601)</Label>
              <Input value={delayDuration} onChange={(e) => setDelayDuration(e.target.value)} placeholder="PT3H55M" />
            </div>
          </div>
          <Button onClick={testDelayPrediction} disabled={delayLoading}>
            {delayLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Predict Delay
          </Button>
        </CardContent>
      </Card>
      {delayResult && <ApiResponseViewer response={delayResult.response} status={delayResult.status} duration={delayResult.duration} error={delayResult.error} />}
    </div>
  );
}

// ============================================================================
// Airport Data Tab Component
// ============================================================================
function AirportDataTab() {
  const [routesAirport, setRoutesAirport] = useState("MAD");
  const [routesResult, setRoutesResult] = useState<TestResult | null>(null);
  const [routesLoading, setRoutesLoading] = useState(false);

  const [nearbyLat, setNearbyLat] = useState("40.416775");
  const [nearbyLon, setNearbyLon] = useState("-3.703790");
  const [nearbyRadius, setNearbyRadius] = useState("500");
  const [nearbyResult, setNearbyResult] = useState<TestResult | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const [ontimeAirport, setOntimeAirport] = useState("JFK");
  const [ontimeDate, setOntimeDate] = useState("2026-08-15");
  const [ontimeResult, setOntimeResult] = useState<TestResult | null>(null);
  const [ontimeLoading, setOntimeLoading] = useState(false);

  const [airlineLookup, setAirlineLookup] = useState("BA");
  const [lookupResult, setLookupResult] = useState<TestResult | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [airlineRoutesCode, setAirlineRoutesCode] = useState("BA");
  const [airlineRoutesResult, setAirlineRoutesResult] = useState<TestResult | null>(null);
  const [airlineRoutesLoading, setAirlineRoutesLoading] = useState(false);

  const testAirportRoutes = async () => {
    setRoutesLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "airport-routes",
          params: { airportCode: routesAirport, max: 20 },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setRoutesResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setRoutesResult({ response: null, error: error.message });
    } finally {
      setRoutesLoading(false);
    }
  };

  const testNearbyAirports = async () => {
    setNearbyLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "airport-nearby",
          params: {
            latitude: parseFloat(nearbyLat),
            longitude: parseFloat(nearbyLon),
            radius: parseInt(nearbyRadius),
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setNearbyResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setNearbyResult({ response: null, error: error.message });
    } finally {
      setNearbyLoading(false);
    }
  };

  const testOnTimePerformance = async () => {
    setOntimeLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "airport-ontime",
          params: { airportCode: ontimeAirport, date: ontimeDate },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setOntimeResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setOntimeResult({ response: null, error: error.message });
    } finally {
      setOntimeLoading(false);
    }
  };

  const testAirlineLookup = async () => {
    setLookupLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "airline-lookup",
          params: { airlineCodes: airlineLookup },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setLookupResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setLookupResult({ response: null, error: error.message });
    } finally {
      setLookupLoading(false);
    }
  };

  const testAirlineRoutes = async () => {
    setAirlineRoutesLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "airline-routes",
          params: { airlineCode: airlineRoutesCode, max: 20 },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setAirlineRoutesResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setAirlineRoutesResult({ response: null, error: error.message });
    } finally {
      setAirlineRoutesLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Price Analysis</CardTitle>
          <CardDescription>Compare current prices to historical data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input value={priceOrigin} onChange={(e) => setPriceOrigin(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={priceDest} onChange={(e) => setPriceDest(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={priceDate} onChange={(e) => setPriceDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={testPriceAnalysis} disabled={priceLoading}>
            {priceLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Price
          </Button>
        </CardContent>
      </Card>
      {priceResult && <ApiResponseViewer response={priceResult.response} status={priceResult.status} duration={priceResult.duration} error={priceResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Flight Delay Prediction</CardTitle>
          <CardDescription>AI-powered delay probability predictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Origin</Label>
              <Input value={delayOrigin} onChange={(e) => setDelayOrigin(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Input value={delayDest} onChange={(e) => setDelayDest(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Carrier</Label>
              <Input value={delayCarrier} onChange={(e) => setDelayCarrier(e.target.value.toUpperCase())} maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Flight #</Label>
              <Input value={delayFlightNum} onChange={(e) => setDelayFlightNum(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Departure</Label>
              <Input type="date" value={delayDepDate} onChange={(e) => setDelayDepDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Dep Time</Label>
              <Input value={delayDepTime} onChange={(e) => setDelayDepTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Aircraft</Label>
              <Input value={delayAircraft} onChange={(e) => setDelayAircraft(e.target.value)} />
            </div>
          </div>
          <Button onClick={testDelayPrediction} disabled={delayLoading}>
            {delayLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Predict Delay
          </Button>
        </CardContent>
      </Card>
      {delayResult && <ApiResponseViewer response={delayResult.response} status={delayResult.status} duration={delayResult.duration} error={delayResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Airport Routes</CardTitle>
          <CardDescription>Find all destinations from an airport</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Airport Code</Label>
            <Input value={routesAirport} onChange={(e) => setRoutesAirport(e.target.value.toUpperCase())} maxLength={3} />
          </div>
          <Button onClick={testAirportRoutes} disabled={routesLoading}>
            {routesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Routes
          </Button>
        </CardContent>
      </Card>
      {routesResult && <ApiResponseViewer response={routesResult.response} status={routesResult.status} duration={routesResult.duration} error={routesResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Nearby Airports</CardTitle>
          <CardDescription>Find airports near coordinates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input value={nearbyLat} onChange={(e) => setNearbyLat(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input value={nearbyLon} onChange={(e) => setNearbyLon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Radius (km)</Label>
              <Input value={nearbyRadius} onChange={(e) => setNearbyRadius(e.target.value)} />
            </div>
          </div>
          <Button onClick={testNearbyAirports} disabled={nearbyLoading}>
            {nearbyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Find Nearby
          </Button>
        </CardContent>
      </Card>
      {nearbyResult && <ApiResponseViewer response={nearbyResult.response} status={nearbyResult.status} duration={nearbyResult.duration} error={nearbyResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Airport On-Time Performance</CardTitle>
          <CardDescription>Check airport delay predictions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Airport Code</Label>
              <Input value={ontimeAirport} onChange={(e) => setOntimeAirport(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={ontimeDate} onChange={(e) => setOntimeDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={testOnTimePerformance} disabled={ontimeLoading}>
            {ontimeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Check Performance
          </Button>
        </CardContent>
      </Card>
      {ontimeResult && <ApiResponseViewer response={ontimeResult.response} status={ontimeResult.status} duration={ontimeResult.duration} error={ontimeResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Airline Code Lookup</CardTitle>
          <CardDescription>Look up airline information by code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Airline Code(s)</Label>
            <Input value={airlineLookup} onChange={(e) => setAirlineLookup(e.target.value.toUpperCase())} placeholder="BA,AA,DL" />
          </div>
          <Button onClick={testAirlineLookup} disabled={lookupLoading}>
            {lookupLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lookup Airline
          </Button>
        </CardContent>
      </Card>
      {lookupResult && <ApiResponseViewer response={lookupResult.response} status={lookupResult.status} duration={lookupResult.duration} error={lookupResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Airline Routes</CardTitle>
          <CardDescription>Find all destinations for an airline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Airline Code</Label>
            <Input value={airlineRoutesCode} onChange={(e) => setAirlineRoutesCode(e.target.value.toUpperCase())} maxLength={2} />
          </div>
          <Button onClick={testAirlineRoutes} disabled={airlineRoutesLoading}>
            {airlineRoutesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Airline Routes
          </Button>
        </CardContent>
      </Card>
      {airlineRoutesResult && <ApiResponseViewer response={airlineRoutesResult.response} status={airlineRoutesResult.status} duration={airlineRoutesResult.duration} error={airlineRoutesResult.error} />}
    </div>
  );
}

// ============================================================================
// Hotel Discovery Tab Component
// ============================================================================
function HotelDiscoveryTab() {
  const [listCity, setListCity] = useState("PAR");
  const [listRadius, setListRadius] = useState("5");
  const [listResult, setListResult] = useState<TestResult | null>(null);
  const [listLoading, setListLoading] = useState(false);

  const [geocodeLat, setGeocodeLat] = useState("48.8566");
  const [geocodeLon, setGeocodeLon] = useState("2.3522");
  const [geocodeRadius, setGeocodeRadius] = useState("5");
  const [geocodeResult, setGeocodeResult] = useState<TestResult | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  const [hotelIds, setHotelIds] = useState("HLPAR001,HLPAR002");
  const [idsResult, setIdsResult] = useState<TestResult | null>(null);
  const [idsLoading, setIdsLoading] = useState(false);

  const [autocompleteKeyword, setAutocompleteKeyword] = useState("PARI");
  const [autocompleteResult, setAutocompleteResult] = useState<TestResult | null>(null);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);

  const [ratingsIds, setRatingsIds] = useState("TELONMFS,ADNYCCTB");
  const [ratingsResult, setRatingsResult] = useState<TestResult | null>(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  const testHotelListCity = async () => {
    setListLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "hotel-list-city",
          params: {
            cityCode: listCity,
            radius: parseInt(listRadius),
            radiusUnit: "KM",
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setListResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setListResult({ response: null, error: error.message });
    } finally {
      setListLoading(false);
    }
  };

  const testHotelListGeocode = async () => {
    setGeocodeLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "hotel-list-geocode",
          params: {
            latitude: parseFloat(geocodeLat),
            longitude: parseFloat(geocodeLon),
            radius: parseInt(geocodeRadius),
            radiusUnit: "KM",
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setGeocodeResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setGeocodeResult({ response: null, error: error.message });
    } finally {
      setGeocodeLoading(false);
    }
  };

  const testHotelListIds = async () => {
    setIdsLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "hotel-list-ids",
          params: { hotelIds },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setIdsResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setIdsResult({ response: null, error: error.message });
    } finally {
      setIdsLoading(false);
    }
  };

  const testHotelAutocomplete = async () => {
    setAutocompleteLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "hotel-autocomplete",
          params: {
            keyword: autocompleteKeyword,
            subType: "HOTEL_LEISURE",
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setAutocompleteResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setAutocompleteResult({ response: null, error: error.message });
    } finally {
      setAutocompleteLoading(false);
    }
  };

  const testHotelRatings = async () => {
    setRatingsLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "hotel-ratings",
          params: { hotelIds: ratingsIds },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setRatingsResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setRatingsResult({ response: null, error: error.message });
    } finally {
      setRatingsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Hotel List by City</CardTitle>
          <CardDescription>Get hotels in a city by IATA code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>City Code</Label>
              <Input value={listCity} onChange={(e) => setListCity(e.target.value.toUpperCase())} maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label>Radius (km)</Label>
              <Input value={listRadius} onChange={(e) => setListRadius(e.target.value)} />
            </div>
          </div>
          <Button onClick={testHotelListCity} disabled={listLoading}>
            {listLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search Hotels
          </Button>
        </CardContent>
      </Card>
      {listResult && <ApiResponseViewer response={listResult.response} status={listResult.status} duration={listResult.duration} error={listResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Hotel List by Geocode</CardTitle>
          <CardDescription>Get hotels near coordinates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input value={geocodeLat} onChange={(e) => setGeocodeLat(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input value={geocodeLon} onChange={(e) => setGeocodeLon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Radius (km)</Label>
              <Input value={geocodeRadius} onChange={(e) => setGeocodeRadius(e.target.value)} />
            </div>
          </div>
          <Button onClick={testHotelListGeocode} disabled={geocodeLoading}>
            {geocodeLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Search Hotels
          </Button>
        </CardContent>
      </Card>
      {geocodeResult && <ApiResponseViewer response={geocodeResult.response} status={geocodeResult.status} duration={geocodeResult.duration} error={geocodeResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Hotel List by IDs</CardTitle>
          <CardDescription>Get specific hotels by their IDs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Hotel IDs (comma-separated)</Label>
            <Input value={hotelIds} onChange={(e) => setHotelIds(e.target.value)} placeholder="HLPAR001,HLPAR002" />
          </div>
          <Button onClick={testHotelListIds} disabled={idsLoading}>
            {idsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Hotels
          </Button>
        </CardContent>
      </Card>
      {idsResult && <ApiResponseViewer response={idsResult.response} status={idsResult.status} duration={idsResult.duration} error={idsResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Hotel Name Autocomplete</CardTitle>
          <CardDescription>Get hotel suggestions by keyword</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Keyword (4-40 chars)</Label>
            <Input value={autocompleteKeyword} onChange={(e) => setAutocompleteKeyword(e.target.value)} />
          </div>
          <Button onClick={testHotelAutocomplete} disabled={autocompleteLoading}>
            {autocompleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Autocomplete
          </Button>
        </CardContent>
      </Card>
      {autocompleteResult && <ApiResponseViewer response={autocompleteResult.response} status={autocompleteResult.status} duration={autocompleteResult.duration} error={autocompleteResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Hotel Ratings</CardTitle>
          <CardDescription>Get sentiment analysis ratings for hotels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Hotel IDs (comma-separated)</Label>
            <Input value={ratingsIds} onChange={(e) => setRatingsIds(e.target.value)} />
          </div>
          <Button onClick={testHotelRatings} disabled={ratingsLoading}>
            {ratingsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Ratings
          </Button>
        </CardContent>
      </Card>
      {ratingsResult && <ApiResponseViewer response={ratingsResult.response} status={ratingsResult.status} duration={ratingsResult.duration} error={ratingsResult.error} />}
    </div>
  );
}

// ============================================================================
// Activities Tab Component
// ============================================================================
function ActivitiesTab() {
  const [activitiesLat, setActivitiesLat] = useState("40.41436995");
  const [activitiesLon, setActivitiesLon] = useState("-3.69170868");
  const [activitiesRadius, setActivitiesRadius] = useState("1");
  const [activitiesResult, setActivitiesResult] = useState<TestResult | null>(null);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  const [squareNorth, setSquareNorth] = useState("41.397158");
  const [squareWest, setSquareWest] = useState("2.160873");
  const [squareSouth, setSquareSouth] = useState("41.394582");
  const [squareEast, setSquareEast] = useState("2.177181");
  const [squareResult, setSquareResult] = useState<TestResult | null>(null);
  const [squareLoading, setSquareLoading] = useState(false);

  const testActivities = async () => {
    setActivitiesLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "tours-activities",
          params: {
            latitude: parseFloat(activitiesLat),
            longitude: parseFloat(activitiesLon),
            radius: parseInt(activitiesRadius),
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setActivitiesResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setActivitiesResult({ response: null, error: error.message });
    } finally {
      setActivitiesLoading(false);
    }
  };

  const testActivitiesSquare = async () => {
    setSquareLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "tours-activities-square",
          params: {
            north: parseFloat(squareNorth),
            west: parseFloat(squareWest),
            south: parseFloat(squareSouth),
            east: parseFloat(squareEast),
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setSquareResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setSquareResult({ response: null, error: error.message });
    } finally {
      setSquareLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tours & Activities (by Radius)</CardTitle>
          <CardDescription>Find activities near a location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input value={activitiesLat} onChange={(e) => setActivitiesLat(e.target.value)} placeholder="40.41436995" />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input value={activitiesLon} onChange={(e) => setActivitiesLon(e.target.value)} placeholder="-3.69170868" />
            </div>
            <div className="space-y-2">
              <Label>Radius (km)</Label>
              <Input value={activitiesRadius} onChange={(e) => setActivitiesRadius(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={testActivities} disabled={activitiesLoading} className="flex-1">
              {activitiesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search Activities
            </Button>
            <Button variant="outline" onClick={() => {
              setActivitiesLat("40.41436995");
              setActivitiesLon("-3.69170868");
              setActivitiesRadius("1");
            }}>
              Madrid Example
            </Button>
          </div>
        </CardContent>
      </Card>
      {activitiesResult && <ApiResponseViewer response={activitiesResult.response} status={activitiesResult.status} duration={activitiesResult.duration} error={activitiesResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>Tours & Activities (by Square)</CardTitle>
          <CardDescription>Find activities in a bounded area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>North</Label>
              <Input value={squareNorth} onChange={(e) => setSquareNorth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>West</Label>
              <Input value={squareWest} onChange={(e) => setSquareWest(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>South</Label>
              <Input value={squareSouth} onChange={(e) => setSquareSouth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>East</Label>
              <Input value={squareEast} onChange={(e) => setSquareEast(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={testActivitiesSquare} disabled={squareLoading} className="flex-1">
              {squareLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Search in Square
            </Button>
            <Button variant="outline" onClick={() => {
              setSquareNorth("41.397158");
              setSquareWest("2.160873");
              setSquareSouth("41.394582");
              setSquareEast("2.177181");
            }}>
              Barcelona Example
            </Button>
          </div>
        </CardContent>
      </Card>
      {squareResult && <ApiResponseViewer response={squareResult.response} status={squareResult.status} duration={squareResult.duration} error={squareResult.error} />}
    </div>
  );
}

// ============================================================================
// Transfers Tab Component
// ============================================================================
function TransfersTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer Search</CardTitle>
        <CardDescription>Search for transfer options (uses existing implementation)</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Transfer search is already implemented in the main client. See lib/flights/amadeus-client.ts searchTransfers() method.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Flight Services Tab Component
// ============================================================================
function FlightServicesTab() {
  const [checkinAirline, setCheckinAirline] = useState("BA");
  const [checkinResult, setCheckinResult] = useState<TestResult | null>(null);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const [statusCarrier, setStatusCarrier] = useState("IB");
  const [statusFlightNum, setStatusFlightNum] = useState("532");
  const [statusDate, setStatusDate] = useState("2026-08-23");
  const [statusResult, setStatusResult] = useState<TestResult | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const testCheckinLinks = async () => {
    setCheckinLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "flight-checkin-links",
          params: { airlineCode: checkinAirline, language: "en-GB" },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setCheckinResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setCheckinResult({ response: null, error: error.message });
    } finally {
      setCheckinLoading(false);
    }
  };

  const testFlightStatus = async () => {
    setStatusLoading(true);
    const startTime = Date.now();
    try {
      const response = await fetch("/api/amadeus/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiType: "flight-status",
          params: {
            carrierCode: statusCarrier,
            flightNumber: statusFlightNum,
            scheduledDepartureDate: statusDate,
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();
      setStatusResult({ response: data, status: response.status, duration });
    } catch (error: any) {
      setStatusResult({ response: null, error: error.message });
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Flight Check-in Links</CardTitle>
          <CardDescription>Get direct links to airline check-in pages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Airline Code</Label>
            <Input value={checkinAirline} onChange={(e) => setCheckinAirline(e.target.value.toUpperCase())} maxLength={2} />
          </div>
          <Button onClick={testCheckinLinks} disabled={checkinLoading}>
            {checkinLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Check-in Links
          </Button>
        </CardContent>
      </Card>
      {checkinResult && <ApiResponseViewer response={checkinResult.response} status={checkinResult.status} duration={checkinResult.duration} error={checkinResult.error} />}

      <Card>
        <CardHeader>
          <CardTitle>On-Demand Flight Status</CardTitle>
          <CardDescription>Get real-time flight status information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Carrier Code</Label>
              <Input value={statusCarrier} onChange={(e) => setStatusCarrier(e.target.value.toUpperCase())} maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label>Flight Number</Label>
              <Input value={statusFlightNum} onChange={(e) => setStatusFlightNum(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Departure Date</Label>
              <Input type="date" value={statusDate} onChange={(e) => setStatusDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={testFlightStatus} disabled={statusLoading}>
            {statusLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Get Flight Status
          </Button>
        </CardContent>
      </Card>
      {statusResult && <ApiResponseViewer response={statusResult.response} status={statusResult.status} duration={statusResult.duration} error={statusResult.error} />}
    </div>
  );
}

export default function AmadeusTestPage() {
  // Flight Search State
  const [flightOrigin, setFlightOrigin] = useState("JFK");
  const [flightDestination, setFlightDestination] = useState("LAX");
  const [flightDate, setFlightDate] = useState("2026-07-15");
  const [flightAdults, setFlightAdults] = useState("1");
  const [flightMaxResults, setFlightMaxResults] = useState("5");
  const [flightResult, setFlightResult] = useState<TestResult | null>(null);
  const [flightLoading, setFlightLoading] = useState(false);

  // Hotel Search State
  const [hotelCityCode, setHotelCityCode] = useState("NYC");
  const [hotelCheckIn, setHotelCheckIn] = useState("2026-07-15");
  const [hotelCheckOut, setHotelCheckOut] = useState("2026-07-18");
  const [hotelMaxResults, setHotelMaxResults] = useState("5");
  const [hotelResult, setHotelResult] = useState<TestResult | null>(null);
  const [hotelLoading, setHotelLoading] = useState(false);

  // Airport Search State
  const [airportKeyword, setAirportKeyword] = useState("New York");
  const [airportMaxResults, setAirportMaxResults] = useState("10");
  const [airportResult, setAirportResult] = useState<TestResult | null>(null);
  const [airportLoading, setAirportLoading] = useState(false);

  const testFlightSearch = async () => {
    setFlightLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/amadeus-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "flight",
          params: {
            originLocationCode: flightOrigin,
            destinationLocationCode: flightDestination,
            departureDate: flightDate,
            adults: parseInt(flightAdults),
            max: parseInt(flightMaxResults),
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();

      setFlightResult({
        response: data,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      setFlightResult({
        response: null,
        error: error.message,
      });
    } finally {
      setFlightLoading(false);
    }
  };

  const testHotelSearch = async () => {
    setHotelLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch("/api/amadeus-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hotel",
          params: {
            cityCode: hotelCityCode,
            checkInDate: hotelCheckIn,
            checkOutDate: hotelCheckOut,
            adults: 1,
          },
        }),
      });
      const duration = Date.now() - startTime;
      const data = await response.json();

      setHotelResult({
        response: data,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      setHotelResult({
        response: null,
        error: error.message,
      });
    } finally {
      setHotelLoading(false);
    }
  };

  const testAirportSearch = async () => {
    setAirportLoading(true);
    const startTime = Date.now();

    try {
      const response = await fetch(
        `/api/airports/search?keyword=${encodeURIComponent(airportKeyword)}`
      );
      const duration = Date.now() - startTime;
      const data = await response.json();

      setAirportResult({
        response: data,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      setAirportResult({
        response: null,
        error: error.message,
      });
    } finally {
      setAirportLoading(false);
    }
  };

  return (
    <ApiTestLayout
      title="Amadeus Travel APIs"
      description="Test flight search, hotel booking, and airport data APIs"
      breadcrumbs={[{ label: "Amadeus" }]}
    >
      <Alert className="mb-6">
        <Plane className="h-4 w-4" />
        <AlertDescription>
          These tests use your configured Amadeus API credentials. Data is from the Amadeus test environment and prices are not real.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">API Coverage Status</CardTitle>
          <CardDescription>Amadeus APIs implemented in this admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">Active</Badge>
              <span>Flight Search</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">Active</Badge>
              <span>Hotel Search</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">Active</Badge>
              <span>Airport Search</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">New</Badge>
              <span>Flight Discovery</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">New</Badge>
              <span>Flight Intelligence</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">New</Badge>
              <span>Airport Data</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">New</Badge>
              <span>Hotel Discovery</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">New</Badge>
              <span>Activities</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">Active</Badge>
              <span>Transfers</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-blue-600">New</Badge>
              <span>Flight Services</span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            <strong>SDK Version:</strong> 11.0.0 | <strong>Environment:</strong> Test | <strong>Total APIs:</strong> 25+
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="flights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="flights">Flight Search</TabsTrigger>
          <TabsTrigger value="hotels">Hotels</TabsTrigger>
          <TabsTrigger value="airports">Airports</TabsTrigger>
          <TabsTrigger value="discovery">Discovery</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="airport-data">Airport Data</TabsTrigger>
          <TabsTrigger value="hotel-discovery">Hotel Discovery</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Flight Search */}
        <TabsContent value="flights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flight Offers Search API</CardTitle>
              <CardDescription>
                Search for flight offers between two airports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flight-origin">Origin (IATA Code)</Label>
                  <Input
                    id="flight-origin"
                    value={flightOrigin}
                    onChange={(e) => setFlightOrigin(e.target.value.toUpperCase())}
                    placeholder="JFK"
                    maxLength={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flight-destination">Destination (IATA Code)</Label>
                  <Input
                    id="flight-destination"
                    value={flightDestination}
                    onChange={(e) => setFlightDestination(e.target.value.toUpperCase())}
                    placeholder="LAX"
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flight-date">Departure Date</Label>
                  <Input
                    id="flight-date"
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flight-adults">Adults</Label>
                  <Input
                    id="flight-adults"
                    type="number"
                    min="1"
                    max="9"
                    value={flightAdults}
                    onChange={(e) => setFlightAdults(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flight-max-results">Max Results</Label>
                  <Input
                    id="flight-max-results"
                    type="number"
                    min="1"
                    max="50"
                    value={flightMaxResults}
                    onChange={(e) => setFlightMaxResults(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testFlightSearch}
                  disabled={flightLoading || !flightOrigin || !flightDestination}
                  className="flex-1"
                >
                  {flightLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search Flights
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFlightOrigin("SFO");
                    setFlightDestination("NRT");
                    setFlightDate("2026-08-01");
                    setFlightResult(null);
                  }}
                >
                  Example: SFO → Tokyo
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /api/amadeus-test (type: flight)
              </div>
            </CardContent>
          </Card>

          {flightResult && (
            <div className="space-y-4">
              {flightResult.response?.success && flightResult.response.results?.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Found {flightResult.response.count} flights (showing {Math.min(flightResult.response.results.length, parseInt(flightMaxResults))})
                  </div>
                  
                  {flightResult.response.results.slice(0, parseInt(flightMaxResults)).map((flight: any, idx: number) => {
                    const itinerary = flight.itineraries?.[0];
                    const segments = itinerary?.segments || [];
                    const firstSegment = segments[0];
                    const lastSegment = segments[segments.length - 1];
                    const carrier = firstSegment?.carrierCode || "N/A";
                    const stops = segments.length - 1;
                    const price = flight.price;
                    const travelerPricings = flight.travelerPricings || [];
                    
                    return (
                      <Card key={idx} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Plane className="h-5 w-5 text-blue-600" />
                                <span className="font-bold text-lg">
                                  {getAirlineName(carrier)}
                                </span>
                                <Badge variant="outline">{carrier}</Badge>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span className="font-mono">
                                  {formatTime(firstSegment?.departure?.at)} → {formatTime(lastSegment?.arrival?.at)}
                                </span>
                                <Badge variant={stops === 0 ? "default" : "secondary"}>
                                  {stops === 0 ? "Nonstop" : `${stops} stop${stops > 1 ? 's' : ''}`}
                                </Badge>
                                <span>{formatDuration(itinerary?.duration)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {formatPrice(price?.total, price?.currency)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {price?.currency} total
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                <span>View Full Details</span>
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-3 mt-3">
                              
                              {/* Flight Segments */}
                              <DetailSection 
                                title="Flight Segments" 
                                defaultOpen 
                                icon={<Plane className="h-4 w-4" />}
                                badge={segments.length}
                              >
                                {segments.map((segment: any, segIdx: number) => (
                                  <div key={segIdx} className="space-y-3">
                                    {segIdx > 0 && (
                                      <div className="border-t pt-3">
                                        <Badge variant="secondary" className="mb-3">
                                          Connection {segIdx}
                                        </Badge>
                                      </div>
                                    )}
                                    
                                    <Timeline items={[
                                      {
                                        time: formatTime(segment.departure?.at),
                                        location: `${segment.departure?.iataCode} - ${segment.departure?.airport || 'Airport'}`,
                                        type: "departure",
                                        terminal: segment.departure?.terminal,
                                      },
                                      {
                                        time: formatTime(segment.arrival?.at),
                                        location: `${segment.arrival?.iataCode} - ${segment.arrival?.airport || 'Airport'}`,
                                        type: "arrival",
                                        terminal: segment.arrival?.terminal,
                                      }
                                    ]} />
                                    
                                    <InfoGrid 
                                      columns={3}
                                      items={[
                                        { 
                                          label: "Flight Number", 
                                          value: `${segment.carrierCode} ${segment.number}` 
                                        },
                                        { 
                                          label: "Aircraft", 
                                          value: segment.aircraft?.code || "N/A" 
                                        },
                                        { 
                                          label: "Duration", 
                                          value: formatDuration(segment.duration) 
                                        },
                                        ...(segment.operating?.carrierCode && segment.operating.carrierCode !== segment.carrierCode ? [{
                                          label: "Operated by",
                                          value: `${getAirlineName(segment.operating.carrierCode)} (${segment.operating.carrierCode})`,
                                          fullWidth: true
                                        }] : [])
                                      ]}
                                    />
                                  </div>
                                ))}
                              </DetailSection>

                              {/* Pricing Breakdown */}
                              {price && (
                                <DetailSection 
                                  title="Pricing Breakdown" 
                                  icon={<DollarSign className="h-4 w-4" />}
                                >
                                  <InfoGrid 
                                    columns={2}
                                    items={[
                                      { 
                                        label: "Base Fare", 
                                        value: formatPrice(price.base, price.currency) 
                                      },
                                      { 
                                        label: "Taxes & Fees", 
                                        value: formatPrice(
                                          parseFloat(price.total) - parseFloat(price.base), 
                                          price.currency
                                        ) 
                                      },
                                      { 
                                        label: "Total Price", 
                                        value: <span className="font-bold text-green-600">{formatPrice(price.total, price.currency)}</span>
                                      },
                                      { 
                                        label: "Grand Total", 
                                        value: formatPrice(price.grandTotal || price.total, price.currency) 
                                      },
                                    ]}
                                  />
                                  
                                  {travelerPricings.length > 0 && (
                                    <div className="mt-3 pt-3 border-t">
                                      <div className="text-sm font-medium mb-2">Per Traveler Breakdown</div>
                                      {travelerPricings.map((tp: any, tpIdx: number) => (
                                        <div key={tpIdx} className="text-sm text-muted-foreground">
                                          Traveler {tp.travelerId}: {formatPrice(tp.price?.total, price.currency)}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </DetailSection>
                              )}

                              {/* Cabin & Baggage */}
                              <DetailSection 
                                title="Cabin & Baggage" 
                                icon={<Luggage className="h-4 w-4" />}
                              >
                                {travelerPricings[0] && (
                                  <div className="space-y-3">
                                    <InfoGrid 
                                      columns={2}
                                      items={[
                                        { 
                                          label: "Cabin Class", 
                                          value: formatCabinClass(travelerPricings[0].fareDetailsBySegment?.[0]?.cabin || "ECONOMY")
                                        },
                                        { 
                                          label: "Fare Basis", 
                                          value: travelerPricings[0].fareDetailsBySegment?.[0]?.fareBasis || "N/A" 
                                        },
                                        { 
                                          label: "Booking Class", 
                                          value: travelerPricings[0].fareDetailsBySegment?.[0]?.class || "N/A" 
                                        },
                                        { 
                                          label: "Branded Fare", 
                                          value: travelerPricings[0].fareDetailsBySegment?.[0]?.brandedFare || "Standard" 
                                        },
                                      ]}
                                    />
                                    
                                    {travelerPricings[0].fareDetailsBySegment?.[0]?.includedCheckedBags && (
                                      <div className="pt-3 border-t">
                                        <div className="text-sm font-medium mb-2">Checked Baggage Allowance</div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Luggage className="h-4 w-4" />
                                          {travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity !== undefined ? (
                                            <span>{travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.quantity} bag(s)</span>
                                          ) : (
                                            <span>{travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.weight} {travelerPricings[0].fareDetailsBySegment[0].includedCheckedBags.weightUnit}</span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DetailSection>

                              {/* Booking Information */}
                              <DetailSection 
                                title="Booking Information" 
                                icon={<Users className="h-4 w-4" />}
                              >
                                <InfoGrid 
                                  columns={2}
                                  items={[
                                    { 
                                      label: "Seats Available", 
                                      value: flight.numberOfBookableSeats ? (
                                        <span className={flight.numberOfBookableSeats < 5 ? "text-orange-600 font-medium" : ""}>
                                          {flight.numberOfBookableSeats} {flight.numberOfBookableSeats < 5 && "⚠️"}
                                        </span>
                                      ) : "N/A"
                                    },
                                    { 
                                      label: "Last Ticketing Date", 
                                      value: flight.lastTicketingDate ? formatDate(flight.lastTicketingDate) : "N/A"
                                    },
                                    { 
                                      label: "Instant Ticketing", 
                                      value: flight.instantTicketingRequired ? "Required" : "Not Required" 
                                    },
                                    { 
                                      label: "Validating Airline", 
                                      value: flight.validatingAirlineCodes?.join(", ") || carrier 
                                    },
                                  ]}
                                />
                              </DetailSection>

                              {/* Restrictions & Warnings */}
                              {(flight.oneWay || flight.blacklistedInEU || flight.nonHomogeneous) && (
                                <DetailSection 
                                  title="Restrictions & Warnings" 
                                  icon={<AlertTriangle className="h-4 w-4" />}
                                >
                                  <div className="space-y-2">
                                    {flight.oneWay && (
                                      <div className="text-sm flex items-center gap-2">
                                        <Badge variant="secondary">One Way</Badge>
                                        <span className="text-muted-foreground">This is a one-way flight</span>
                                      </div>
                                    )}
                                    {flight.blacklistedInEU && (
                                      <div className="text-sm flex items-center gap-2">
                                        <Badge variant="destructive">EU Restricted</Badge>
                                        <span className="text-muted-foreground">Blacklisted in EU</span>
                                      </div>
                                    )}
                                    {flight.nonHomogeneous && (
                                      <div className="text-sm flex items-center gap-2">
                                        <Badge variant="outline">Non-Homogeneous</Badge>
                                        <span className="text-muted-foreground">Mixed cabin classes or carriers</span>
                                      </div>
                                    )}
                                  </div>
                                </DetailSection>
                              )}
                              
                            </CollapsibleContent>
                          </Collapsible>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              <ApiResponseViewer
                response={flightResult.response}
                status={flightResult.status}
                duration={flightResult.duration}
                error={flightResult.error}
              />
            </div>
          )}
        </TabsContent>

        {/* Hotel Search */}
        <TabsContent value="hotels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hotel Search API</CardTitle>
              <CardDescription>
                Search for hotel offers in a city
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hotel-city">City Code (IATA)</Label>
                <Input
                  id="hotel-city"
                  value={hotelCityCode}
                  onChange={(e) => setHotelCityCode(e.target.value.toUpperCase())}
                  placeholder="NYC"
                  maxLength={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hotel-checkin">Check-in Date</Label>
                  <Input
                    id="hotel-checkin"
                    type="date"
                    value={hotelCheckIn}
                    onChange={(e) => setHotelCheckIn(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-checkout">Check-out Date</Label>
                  <Input
                    id="hotel-checkout"
                    type="date"
                    value={hotelCheckOut}
                    onChange={(e) => setHotelCheckOut(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-max-results">Max Results</Label>
                  <Input
                    id="hotel-max-results"
                    type="number"
                    min="1"
                    max="50"
                    value={hotelMaxResults}
                    onChange={(e) => setHotelMaxResults(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testHotelSearch}
                  disabled={hotelLoading || !hotelCityCode}
                  className="flex-1"
                >
                  {hotelLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search Hotels
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setHotelCityCode("PAR");
                    setHotelCheckIn("2026-09-01");
                    setHotelCheckOut("2026-09-05");
                    setHotelResult(null);
                  }}
                >
                  Example: Paris
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> POST /api/amadeus-test (type: hotel)
              </div>
            </CardContent>
          </Card>

          {hotelResult && (
            <div className="space-y-4">
              {/* Error Display */}
              {hotelResult.response?.success === false && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Hotel search failed:</strong> {hotelResult.response.error?.userMessage || hotelResult.response.error?.message || "Unknown error"}
                  </AlertDescription>
                </Alert>
              )}

              {/* Success with Results */}
              {hotelResult.response?.success === true && hotelResult.response.results?.length > 0 && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Found {hotelResult.response.count} hotels (showing {Math.min(hotelResult.response.results.length, parseInt(hotelMaxResults))})
                  </div>
                  
                  {hotelResult.response.results.slice(0, parseInt(hotelMaxResults)).map((offer: any, idx: number) => {
                    const hotel = offer.hotel || {};
                    const offerData = offer.offers?.[0] || offer;
                    const price = offerData.price || {};
                    const room = offerData.room || {};
                    const policies = offerData.policies || {};
                    
                    // Calculate average per night
                    const checkIn = new Date(offerData.checkInDate || hotelCheckIn);
                    const checkOut = new Date(offerData.checkOutDate || hotelCheckOut);
                    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
                    const avgPerNight = nights > 0 ? parseFloat(price.total) / nights : parseFloat(price.total);
                    
                    return (
                      <Card key={idx} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Hotel className="h-5 w-5 text-blue-600" />
                                <span className="font-bold text-lg">
                                  {hotel.name || "Hotel"}
                                </span>
                                {hotel.rating && (
                                  <div className="flex items-center">
                                    {[...Array(parseInt(hotel.rating))].map((_, i) => (
                                      <span key={i} className="text-yellow-500">★</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {offer.available ? (
                                  <Badge variant="default">Available</Badge>
                                ) : (
                                  <Badge variant="secondary">Check Availability</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600">
                                {formatPrice(price.total, price.currency)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatPrice(avgPerNight, price.currency)} / night
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {nights} night{nights !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <Collapsible>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                <span>View Full Details</span>
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </Button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-3 mt-3">
                              
                              {/* Hotel Information */}
                              <DetailSection 
                                title="Hotel Information" 
                                defaultOpen 
                                icon={<MapPin className="h-4 w-4" />}
                              >
                                <InfoGrid 
                                  columns={2}
                                  items={[
                                    { 
                                      label: "Hotel ID", 
                                      value: <span className="font-mono text-xs">{hotel.hotelId || "N/A"}</span>
                                    },
                                    { 
                                      label: "Chain Code", 
                                      value: hotel.chainCode || "N/A" 
                                    },
                                    ...(hotel.address ? [
                                      { 
                                        label: "Address", 
                                        value: `${hotel.address.lines?.[0] || ''} ${hotel.address.cityName || ''}, ${hotel.address.countryCode || ''}`.trim(),
                                        fullWidth: true
                                      },
                                      ...(hotel.address.postalCode ? [{
                                        label: "Postal Code",
                                        value: hotel.address.postalCode
                                      }] : [])
                                    ] : []),
                                    ...(hotel.contact?.phone ? [{
                                      label: "Phone",
                                      value: hotel.contact.phone
                                    }] : []),
                                    ...(hotel.contact?.email ? [{
                                      label: "Email",
                                      value: hotel.contact.email
                                    }] : []),
                                    ...(hotel.latitude && hotel.longitude ? [{
                                      label: "Coordinates",
                                      value: formatCoordinates(parseFloat(hotel.latitude), parseFloat(hotel.longitude))
                                    }] : []),
                                  ]}
                                />
                              </DetailSection>

                              {/* Room Details */}
                              {room.type && (
                                <DetailSection 
                                  title="Room Details" 
                                  icon={<Hotel className="h-4 w-4" />}
                                >
                                  <InfoGrid 
                                    columns={2}
                                    items={[
                                      { 
                                        label: "Room Type", 
                                        value: room.type || "N/A" 
                                      },
                                      { 
                                        label: "Category", 
                                        value: room.typeEstimated?.category || "N/A" 
                                      },
                                      ...(room.description?.text ? [{
                                        label: "Description",
                                        value: room.description.text,
                                        fullWidth: true
                                      }] : []),
                                      ...(offerData.guests ? [{
                                        label: "Guests",
                                        value: `${offerData.guests.adults || 0} adult(s)`
                                      }] : []),
                                    ]}
                                  />
                                </DetailSection>
                              )}

                              {/* Amenities */}
                              {hotel.amenities && hotel.amenities.length > 0 && (
                                <DetailSection 
                                  title="Amenities" 
                                  icon={<Badge className="h-4 w-4" />}
                                  badge={hotel.amenities.length}
                                >
                                  <div className="flex flex-wrap gap-2">
                                    {hotel.amenities.map((amenity: string, i: number) => (
                                      <Badge key={i} variant="secondary">
                                        {amenity}
                                      </Badge>
                                    ))}
                                  </div>
                                </DetailSection>
                              )}

                              {/* Pricing Breakdown */}
                              <DetailSection 
                                title="Pricing Breakdown" 
                                icon={<DollarSign className="h-4 w-4" />}
                              >
                                <InfoGrid 
                                  columns={2}
                                  items={[
                                    { 
                                      label: "Base Price", 
                                      value: formatPrice(price.base, price.currency) 
                                    },
                                    { 
                                      label: "Taxes & Fees", 
                                      value: price.taxes && price.taxes.length > 0 
                                        ? formatPrice(price.taxes.reduce((sum: number, tax: any) => sum + parseFloat(tax.amount || 0), 0), price.currency)
                                        : "Included"
                                    },
                                    { 
                                      label: "Total Price", 
                                      value: <span className="font-bold text-green-600">{formatPrice(price.total, price.currency)}</span>
                                    },
                                    { 
                                      label: "Average / Night", 
                                      value: formatPrice(avgPerNight, price.currency) 
                                    },
                                    { 
                                      label: "Currency", 
                                      value: price.currency || "N/A" 
                                    },
                                  ]}
                                />
                                
                                {price.variations?.changes && price.variations.changes.length > 0 && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="text-sm font-medium mb-2">Price Variations by Date</div>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                      {price.variations.changes.slice(0, 5).map((change: any, i: number) => (
                                        <div key={i}>
                                          {formatDate(change.startDate)} - {formatDate(change.endDate)}: {formatPrice(change.total, price.currency)}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </DetailSection>

                              {/* Policies */}
                              <DetailSection 
                                title="Policies" 
                                icon={<AlertCircle className="h-4 w-4" />}
                              >
                                <InfoGrid 
                                  columns={2}
                                  items={[
                                    { 
                                      label: "Check-in", 
                                      value: formatDate(offerData.checkInDate || hotelCheckIn) 
                                    },
                                    { 
                                      label: "Check-out", 
                                      value: formatDate(offerData.checkOutDate || hotelCheckOut) 
                                    },
                                    ...(policies.cancellation ? [
                                      {
                                        label: "Cancellation Deadline",
                                        value: policies.cancellation.deadline ? formatDate(policies.cancellation.deadline) : "N/A"
                                      },
                                      ...(policies.cancellation.amount ? [{
                                        label: "Cancellation Fee",
                                        value: formatPrice(policies.cancellation.amount, price.currency)
                                      }] : []),
                                      ...(policies.cancellation.description?.text ? [{
                                        label: "Cancellation Policy",
                                        value: policies.cancellation.description.text,
                                        fullWidth: true
                                      }] : [])
                                    ] : []),
                                    ...(policies.paymentType ? [{
                                      label: "Payment Type",
                                      value: policies.paymentType
                                    }] : []),
                                    ...(policies.guarantee?.acceptedPayments?.methods ? [{
                                      label: "Accepted Payments",
                                      value: policies.guarantee.acceptedPayments.methods.join(", ")
                                    }] : []),
                                  ]}
                                />
                              </DetailSection>
                              
                            </CollapsibleContent>
                          </Collapsible>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              <ApiResponseViewer
                response={hotelResult.response}
                status={hotelResult.status}
                duration={hotelResult.duration}
                error={hotelResult.error}
              />
            </div>
          )}
        </TabsContent>

        {/* Flight Discovery Tab */}
        <TabsContent value="discovery" className="space-y-4">
          <FlightDiscoveryTab />
        </TabsContent>

        {/* Flight Intelligence Tab */}
        <TabsContent value="intelligence" className="space-y-4">
          <FlightIntelligenceTab />
        </TabsContent>

        {/* Airport Data Tab */}
        <TabsContent value="airport-data" className="space-y-4">
          <AirportDataTab />
        </TabsContent>

        {/* Hotel Discovery Tab */}
        <TabsContent value="hotel-discovery" className="space-y-4">
          <HotelDiscoveryTab />
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities" className="space-y-4">
          <ActivitiesTab />
        </TabsContent>

        {/* Transfers Tab */}
        <TabsContent value="transfers" className="space-y-4">
          <TransfersTab />
        </TabsContent>

        {/* Flight Services Tab */}
        <TabsContent value="services" className="space-y-4">
          <FlightServicesTab />
        </TabsContent>

        {/* Airport Search */}
        <TabsContent value="airports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Airport Search API</CardTitle>
              <CardDescription>
                Search for airports by keyword or city name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="airport-keyword">Search Keyword</Label>
                  <Input
                    id="airport-keyword"
                    value={airportKeyword}
                    onChange={(e) => setAirportKeyword(e.target.value)}
                    placeholder="Enter city or airport name..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="airport-max-results">Max Results</Label>
                  <Input
                    id="airport-max-results"
                    type="number"
                    min="1"
                    max="50"
                    value={airportMaxResults}
                    onChange={(e) => setAirportMaxResults(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={testAirportSearch}
                  disabled={airportLoading || !airportKeyword}
                  className="flex-1"
                >
                  {airportLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Search Airports
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setAirportKeyword("London");
                    setAirportResult(null);
                  }}
                >
                  Example: London
                </Button>
              </div>

              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <strong>Endpoint:</strong> GET /api/airports/search
              </div>
            </CardContent>
          </Card>

          {airportResult && (
            <div className="space-y-4">
              {airportResult.response?.airports && airportResult.response.airports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Airport Results ({airportResult.response.airports.length} found, showing {Math.min(airportResult.response.airports.length, parseInt(airportMaxResults))})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Region</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {airportResult.response.airports.slice(0, parseInt(airportMaxResults)).map((airport: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <Badge variant="outline" className="font-mono">
                                {airport.iataCode}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{airport.name}</TableCell>
                            <TableCell>{airport.address?.cityName || "N/A"}</TableCell>
                            <TableCell>{airport.address?.countryCode || "N/A"}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {airport.address?.regionCode || "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              <ApiResponseViewer
                response={airportResult.response}
                status={airportResult.status}
                duration={airportResult.duration}
                error={airportResult.error}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </ApiTestLayout>
  );
}
