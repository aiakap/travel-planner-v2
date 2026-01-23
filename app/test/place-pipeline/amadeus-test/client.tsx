"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ArrowLeft, Plane, Hotel, AlertCircle, CheckCircle2, Clock, Code, Sparkles, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface TestMeta {
  sdkVersion: string;
  timing: {
    total: number;
    api?: number;
  };
  environment: string;
}

interface TestResult {
  success: boolean;
  type: string;
  params: any;
  results?: any[];
  count?: number;
  meta?: TestMeta;
  error?: {
    message: string;
    code: string;
    statusCode: number;
    details: any;
    userMessage: string;
    debugInfo?: any;
  };
}

// Quick test presets
const FLIGHT_PRESETS = {
  'JFK to Paris': {
    origin: "JFK",
    destination: "CDG",
    departureDate: "2026-02-15",
    returnDate: "2026-02-22",
    adults: "1",
    travelClass: "ECONOMY",
    currencyCode: "USD",
    max: "5",
  },
  'LAX to London': {
    origin: "LAX",
    destination: "LHR",
    departureDate: "2026-03-10",
    returnDate: "2026-03-17",
    adults: "2",
    travelClass: "BUSINESS",
    currencyCode: "USD",
    max: "5",
  },
  'SFO to Tokyo': {
    origin: "SFO",
    destination: "NRT",
    departureDate: "2026-04-01",
    returnDate: "2026-04-10",
    adults: "1",
    travelClass: "PREMIUM_ECONOMY",
    currencyCode: "USD",
    max: "5",
  },
  'Invalid Route (Error Test)': {
    origin: "XXX",
    destination: "YYY",
    departureDate: "2026-02-15",
    returnDate: "2026-02-22",
    adults: "1",
    travelClass: "ECONOMY",
    currencyCode: "USD",
    max: "5",
  },
};

const HOTEL_PRESETS = {
  'Paris Hotels': {
    cityCode: "PAR",
    cityName: "Paris",
    checkInDate: "2026-02-15",
    checkOutDate: "2026-02-18",
    adults: "2",
    rooms: "1",
    max: "5",
  },
  'London Hotels': {
    cityCode: "LON",
    cityName: "London",
    checkInDate: "2026-03-10",
    checkOutDate: "2026-03-13",
    adults: "2",
    rooms: "1",
    max: "5",
  },
  'Tokyo Weekend': {
    cityCode: "TYO",
    cityName: "Tokyo",
    checkInDate: "2026-04-04",
    checkOutDate: "2026-04-06",
    adults: "2",
    rooms: "1",
    max: "5",
  },
};

// Error type color mapping
function getErrorTypeColor(code: string): { bg: string; text: string; border: string } {
  if (code.includes('AUTHENTICATION')) {
    return { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' };
  }
  if (code.includes('RATE_LIMIT')) {
    return { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' };
  }
  if (code.includes('VALIDATION') || code.includes('NOT_FOUND')) {
    return { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' };
  }
  if (code.includes('SERVER')) {
    return { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' };
  }
  return { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-400', border: 'border-red-200 dark:border-red-800' };
}

// Get error explanation
function getErrorExplanation(code: string): string {
  const explanations: Record<string, string> = {
    'AUTHENTICATION_ERROR': 'The API credentials are invalid or expired. Check your AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET environment variables.',
    'RATE_LIMIT_EXCEEDED': 'Too many requests have been made to the API. Wait a few seconds and try again.',
    'VALIDATION_ERROR': 'The request parameters are invalid. Check that IATA codes are correct and dates are in the future.',
    'NOT_FOUND': 'No results were found for the search criteria. Try different cities or dates.',
    'SERVER_ERROR': 'The Amadeus API is experiencing technical difficulties. This is not an issue with your code.',
    'NETWORK_ERROR': 'Unable to reach the Amadeus API. Check your internet connection.',
    'PARSE_ERROR': 'The API response was not in the expected format. This may indicate an API change.',
  };
  
  for (const [key, explanation] of Object.entries(explanations)) {
    if (code.includes(key)) {
      return explanation;
    }
  }
  
  return 'An unexpected error occurred. Check the debug info below for more details.';
}

// Simple Flight Test Component - Minimal debugging component
function SimpleFlightTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runSimpleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Absolute simplest flight search - MAD to NYC (known test data from Amadeus docs)
      const response = await fetch("/api/amadeus-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "flight",
          params: {
            origin: "MAD",           // Madrid (Amadeus test data example)
            destination: "NYC",      // New York (Amadeus test data example)
            departureDate: "2026-08-01",  // Far future date
            returnDate: "2026-08-08",     // 7 days later
            adults: 1,
            travelClass: "ECONOMY",
            currencyCode: "USD",
            max: 1,  // Just 1 result
          },
        }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        data: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      setResult({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="mb-6 border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          🔬 Simple API Test (Minimal Parameters)
        </CardTitle>
        <CardDescription>
          Tests: MAD→NYC, 2026-08-01, 1 adult, economy, max 1 result
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSimpleTest} 
          disabled={testing}
          variant="outline"
          className="w-full"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Run Simple Test"
          )}
        </Button>

        {result && (
          <div className="space-y-2">
            <div className={`p-3 rounded-lg ${
              result.status === 200 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="font-mono text-xs">
                <div><strong>HTTP Status:</strong> {result.status}</div>
                <div><strong>Time:</strong> {result.timestamp}</div>
              </div>
            </div>

            <details className="border rounded-lg p-3">
              <summary className="cursor-pointer font-semibold text-sm">
                Raw Response (click to expand)
              </summary>
              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-96">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>

            {result.data?.error && (
              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="font-semibold text-sm mb-2">Error Details:</div>
                <div className="text-xs space-y-1">
                  <div><strong>Code:</strong> {result.data.error.code}</div>
                  <div><strong>Status:</strong> {result.data.error.statusCode}</div>
                  <div><strong>Message:</strong> {result.data.error.message}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AmadeusTestClient() {
  // Flight test state
  const [flightParams, setFlightParams] = useState(FLIGHT_PRESETS['JFK to Paris']);
  const [flightLoading, setFlightLoading] = useState(false);
  const [flightResult, setFlightResult] = useState<TestResult | null>(null);

  // Hotel test state
  const [hotelParams, setHotelParams] = useState(HOTEL_PRESETS['Paris Hotels']);
  const [hotelLoading, setHotelLoading] = useState(false);
  const [hotelResult, setHotelResult] = useState<TestResult | null>(null);

  const testFlightAPI = async () => {
    setFlightLoading(true);
    setFlightResult(null);

    try {
      const response = await fetch("/api/amadeus-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "flight",
          params: {
            origin: flightParams.origin,
            destination: flightParams.destination,
            departureDate: flightParams.departureDate,
            returnDate: flightParams.returnDate,
            adults: parseInt(flightParams.adults),
            travelClass: flightParams.travelClass,
            currencyCode: flightParams.currencyCode,
            max: parseInt(flightParams.max),
          },
        }),
      });

      const data = await response.json();
      setFlightResult(data);
    } catch (error: any) {
      setFlightResult({
        success: false,
        type: "flight",
        params: flightParams,
        error: {
          message: "Request failed",
          code: "NETWORK_ERROR",
          statusCode: 0,
          details: error.message,
          userMessage: "Unable to connect to the API",
        },
      });
    } finally {
      setFlightLoading(false);
    }
  };

  const testHotelAPI = async () => {
    setHotelLoading(true);
    setHotelResult(null);

    try {
      const response = await fetch("/api/amadeus-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "hotel",
          params: {
            cityCode: hotelParams.cityCode,
            checkInDate: hotelParams.checkInDate,
            checkOutDate: hotelParams.checkOutDate,
            adults: parseInt(hotelParams.adults),
            rooms: parseInt(hotelParams.rooms),
            max: parseInt(hotelParams.max),
          },
        }),
      });

      const data = await response.json();
      setHotelResult(data);
    } catch (error: any) {
      setHotelResult({
        success: false,
        type: "hotel",
        params: hotelParams,
        error: {
          message: "Request failed",
          code: "NETWORK_ERROR",
          statusCode: 0,
          details: error.message,
          userMessage: "Unable to connect to the API",
        },
      });
    } finally {
      setHotelLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/test/place-pipeline" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Pipeline Test
        </Link>
        <h1 className="text-4xl font-bold mb-2">Amadeus API Test Dashboard</h1>
        <p className="text-muted-foreground">
          Test Amadeus Flight and Hotel APIs with best practices from Amadeus4Dev SDK
        </p>
      </div>

      {/* Simple Flight Test - Minimal debugging */}
      <SimpleFlightTest />

      {/* SDK Info Panel */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground mb-1">SDK Version</div>
              <div className="font-semibold">v11.0.0</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Environment</div>
              <div className="font-semibold flex items-center gap-2">
                Test
                <span className="inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Error Handling</div>
              <div className="font-semibold">Structured (Typed)</div>
            </div>
            <div>
              <div className="text-muted-foreground mb-1">Validation</div>
              <div className="font-semibold">Zod Schemas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Presets */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Test Presets
          </CardTitle>
          <CardDescription>
            Load pre-configured test scenarios with a single click
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-2 block">Flight Presets</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FLIGHT_PRESETS).map(([name, preset]) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={() => setFlightParams(preset)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Hotel Presets</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(HOTEL_PRESETS).map(([name, preset]) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={() => setHotelParams(preset)}
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Flight Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Flight Offers Search API
            </CardTitle>
            <CardDescription>
              Test the Amadeus Flight Offers Search endpoint with custom parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Flight Parameters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flight-origin">Origin (IATA)</Label>
                <Input
                  id="flight-origin"
                  value={flightParams.origin}
                  onChange={(e) => setFlightParams({ ...flightParams, origin: e.target.value.toUpperCase() })}
                  placeholder="JFK"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="flight-destination">Destination (IATA)</Label>
                <Input
                  id="flight-destination"
                  value={flightParams.destination}
                  onChange={(e) => setFlightParams({ ...flightParams, destination: e.target.value.toUpperCase() })}
                  placeholder="CDG"
                  maxLength={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flight-departure">Departure Date</Label>
                <Input
                  id="flight-departure"
                  type="date"
                  value={flightParams.departureDate}
                  onChange={(e) => setFlightParams({ ...flightParams, departureDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="flight-return">Return Date</Label>
                <Input
                  id="flight-return"
                  type="date"
                  value={flightParams.returnDate}
                  onChange={(e) => setFlightParams({ ...flightParams, returnDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flight-adults">Adults</Label>
                <Input
                  id="flight-adults"
                  type="number"
                  min="1"
                  value={flightParams.adults}
                  onChange={(e) => setFlightParams({ ...flightParams, adults: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="flight-class">Class</Label>
                <Select
                  value={flightParams.travelClass}
                  onValueChange={(value) => setFlightParams({ ...flightParams, travelClass: value })}
                >
                  <SelectTrigger id="flight-class">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ECONOMY">Economy</SelectItem>
                    <SelectItem value="PREMIUM_ECONOMY">Premium Economy</SelectItem>
                    <SelectItem value="BUSINESS">Business</SelectItem>
                    <SelectItem value="FIRST">First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="flight-currency">Currency</Label>
                <Select
                  value={flightParams.currencyCode}
                  onValueChange={(value) => setFlightParams({ ...flightParams, currencyCode: value })}
                >
                  <SelectTrigger id="flight-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="JPY">JPY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="flight-max">Max Results</Label>
                <Input
                  id="flight-max"
                  type="number"
                  min="1"
                  max="20"
                  value={flightParams.max}
                  onChange={(e) => setFlightParams({ ...flightParams, max: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={testFlightAPI} disabled={flightLoading} className="w-full">
              {flightLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Flight API"
              )}
            </Button>

            {/* Flight Results */}
            {flightResult && (
              <div className="mt-4 space-y-4">
                {/* Status Card */}
                {flightResult.success ? (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-green-900 dark:text-green-100 mb-1">
                          Success!
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Found {flightResult.count} flight offer{flightResult.count !== 1 ? 's' : ''}
                        </div>
                        {flightResult.meta && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-green-600 dark:text-green-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              API: {flightResult.meta.timing.api}ms
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Total: {flightResult.meta.timing.total}ms
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  flightResult.error && (
                    <div className={`p-4 rounded-lg border ${getErrorTypeColor(flightResult.error.code).bg} ${getErrorTypeColor(flightResult.error.code).border}`}>
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`h-5 w-5 mt-0.5 ${getErrorTypeColor(flightResult.error.code).text}`} />
                        <div className="flex-1">
                          <div className={`font-semibold mb-1 ${getErrorTypeColor(flightResult.error.code).text}`}>
                            {flightResult.error.code}
                          </div>
                          <div className="text-sm mb-2">
                            {flightResult.error.userMessage}
                          </div>
                          <details className="text-xs">
                            <summary className="cursor-pointer font-medium mb-2">
                              Why did this happen?
                            </summary>
                            <p className="mt-1 opacity-80">
                              {getErrorExplanation(flightResult.error.code)}
                            </p>
                          </details>
                          {flightResult.meta && (
                            <div className="flex items-center gap-4 mt-2 text-xs opacity-70">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {flightResult.meta.timing.total}ms
                              </span>
                              {flightResult.error.statusCode && (
                                <span>Status: {flightResult.error.statusCode}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer">Request Parameters</summary>
                  <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(flightResult.params, null, 2)}
                  </pre>
                </details>

                {flightResult.success && flightResult.results && flightResult.results.length > 0 && (
                  <details className="border rounded-lg p-4">
                    <summary className="font-semibold cursor-pointer">
                      Response Data ({flightResult.results.length} offers)
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                      {JSON.stringify(flightResult.results, null, 2)}
                    </pre>
                  </details>
                )}

                {flightResult.error?.debugInfo && (
                  <details className="border rounded-lg p-4">
                    <summary className="font-semibold cursor-pointer flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Debug Information
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                      {JSON.stringify(flightResult.error.debugInfo, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hotel Test Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Hotel Offers Search API
            </CardTitle>
            <CardDescription>
              Test the Amadeus Hotel Search endpoint with custom parameters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hotel Parameters */}
            <div>
              <Label htmlFor="hotel-city">City</Label>
              <Select
                value={hotelParams.cityCode}
                onValueChange={(value) => {
                  const cityMap: Record<string, string> = {
                    "PAR": "Paris",
                    "LON": "London",
                    "NYC": "New York",
                    "LAX": "Los Angeles",
                    "SFO": "San Francisco",
                    "MIA": "Miami",
                    "DXB": "Dubai",
                    "SIN": "Singapore",
                    "TYO": "Tokyo",
                    "BCN": "Barcelona",
                    "ROM": "Rome",
                    "AMS": "Amsterdam",
                  };
                  setHotelParams({ ...hotelParams, cityCode: value, cityName: cityMap[value] || value });
                }}
              >
                <SelectTrigger id="hotel-city">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAR">Paris (PAR)</SelectItem>
                  <SelectItem value="LON">London (LON)</SelectItem>
                  <SelectItem value="NYC">New York (NYC)</SelectItem>
                  <SelectItem value="LAX">Los Angeles (LAX)</SelectItem>
                  <SelectItem value="SFO">San Francisco (SFO)</SelectItem>
                  <SelectItem value="MIA">Miami (MIA)</SelectItem>
                  <SelectItem value="DXB">Dubai (DXB)</SelectItem>
                  <SelectItem value="SIN">Singapore (SIN)</SelectItem>
                  <SelectItem value="TYO">Tokyo (TYO)</SelectItem>
                  <SelectItem value="BCN">Barcelona (BCN)</SelectItem>
                  <SelectItem value="ROM">Rome (ROM)</SelectItem>
                  <SelectItem value="AMS">Amsterdam (AMS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hotel-checkin">Check-in Date</Label>
                <Input
                  id="hotel-checkin"
                  type="date"
                  value={hotelParams.checkInDate}
                  onChange={(e) => setHotelParams({ ...hotelParams, checkInDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hotel-checkout">Check-out Date</Label>
                <Input
                  id="hotel-checkout"
                  type="date"
                  value={hotelParams.checkOutDate}
                  onChange={(e) => setHotelParams({ ...hotelParams, checkOutDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hotel-adults">Adults</Label>
                <Input
                  id="hotel-adults"
                  type="number"
                  min="1"
                  value={hotelParams.adults}
                  onChange={(e) => setHotelParams({ ...hotelParams, adults: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hotel-rooms">Rooms</Label>
                <Input
                  id="hotel-rooms"
                  type="number"
                  min="1"
                  value={hotelParams.rooms}
                  onChange={(e) => setHotelParams({ ...hotelParams, rooms: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="hotel-max">Max Results</Label>
                <Input
                  id="hotel-max"
                  type="number"
                  min="1"
                  max="20"
                  value={hotelParams.max}
                  onChange={(e) => setHotelParams({ ...hotelParams, max: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={testHotelAPI} disabled={hotelLoading} className="w-full">
              {hotelLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Hotel API"
              )}
            </Button>

            {/* Hotel Results */}
            {hotelResult && (
              <div className="mt-4 space-y-4">
                {/* Status Card */}
                {hotelResult.success ? (
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-semibold text-green-900 dark:text-green-100 mb-1">
                          Success!
                        </div>
                        <div className="text-sm text-green-700 dark:text-green-300">
                          Found {hotelResult.count} hotel offer{hotelResult.count !== 1 ? 's' : ''}
                        </div>
                        {hotelResult.meta && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-green-600 dark:text-green-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              API: {hotelResult.meta.timing.api}ms
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Total: {hotelResult.meta.timing.total}ms
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  hotelResult.error && (
                    <div className={`p-4 rounded-lg border ${getErrorTypeColor(hotelResult.error.code).bg} ${getErrorTypeColor(hotelResult.error.code).border}`}>
                      <div className="flex items-start gap-3">
                        <AlertCircle className={`h-5 w-5 mt-0.5 ${getErrorTypeColor(hotelResult.error.code).text}`} />
                        <div className="flex-1">
                          <div className={`font-semibold mb-1 ${getErrorTypeColor(hotelResult.error.code).text}`}>
                            {hotelResult.error.code}
                          </div>
                          <div className="text-sm mb-2">
                            {hotelResult.error.userMessage}
                          </div>
                          <details className="text-xs">
                            <summary className="cursor-pointer font-medium mb-2">
                              Why did this happen?
                            </summary>
                            <p className="mt-1 opacity-80">
                              {getErrorExplanation(hotelResult.error.code)}
                            </p>
                          </details>
                          {hotelResult.meta && (
                            <div className="flex items-center gap-4 mt-2 text-xs opacity-70">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {hotelResult.meta.timing.total}ms
                              </span>
                              {hotelResult.error.statusCode && (
                                <span>Status: {hotelResult.error.statusCode}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}

                <details className="border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer">Request Parameters</summary>
                  <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                    {JSON.stringify(hotelResult.params, null, 2)}
                  </pre>
                </details>

                {hotelResult.success && hotelResult.results && hotelResult.results.length > 0 && (
                  <details className="border rounded-lg p-4">
                    <summary className="font-semibold cursor-pointer">
                      Response Data ({hotelResult.results.length} offers)
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                      {JSON.stringify(hotelResult.results, null, 2)}
                    </pre>
                  </details>
                )}

                {hotelResult.error?.debugInfo && (
                  <details className="border rounded-lg p-4">
                    <summary className="font-semibold cursor-pointer flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Debug Information
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto max-h-96">
                      {JSON.stringify(hotelResult.error.debugInfo, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Testing Tips & Common Issues
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Understanding Error Codes:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong className="text-red-600">AUTHENTICATION_ERROR (Red):</strong> API credentials issue - check environment variables</li>
              <li><strong className="text-blue-600">RATE_LIMIT_EXCEEDED (Blue):</strong> Too many requests - wait and retry</li>
              <li><strong className="text-yellow-600">VALIDATION_ERROR (Yellow):</strong> Invalid parameters - check IATA codes and dates</li>
              <li><strong className="text-purple-600">SERVER_ERROR (Purple):</strong> Amadeus API issue - not your code</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Test Environment Limitations:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Limited data:</strong> Test environment may not have all routes/cities available</li>
              <li><strong>Booking window:</strong> Keep dates within 2-11 months from today</li>
              <li><strong>Known working routes:</strong> JFK↔CDG, LAX↔LHR, SFO↔NRT</li>
              <li><strong>Known working cities:</strong> PAR, LON, NYC, LAX, TYO</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Features Implemented:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>✅ Typed error handling with user-friendly messages</li>
              <li>✅ Zod schema validation for API responses</li>
              <li>✅ Request timing metrics (API + total)</li>
              <li>✅ Quick test presets for instant testing</li>
              <li>✅ Color-coded error types with explanations</li>
              <li>✅ Debug information for developers</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
