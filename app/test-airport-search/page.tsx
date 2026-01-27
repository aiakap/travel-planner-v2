"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ApiSource = "amadeus" | "google" | "both";

export default function TestAirportSearchPage() {
  const [query, setQuery] = useState("Palo Alto");
  const [apiSource, setApiSource] = useState<ApiSource>("google");
  const [amadeusResults, setAmadeusResults] = useState<any>(null);
  const [googleResults, setGoogleResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSearch = async () => {
    setLoading(true);
    setError(null);
    setAmadeusResults(null);
    setGoogleResults(null);

    try {
      console.log("Testing airport search for:", query, "using:", apiSource);

      if (apiSource === "amadeus" || apiSource === "both") {
        console.log("Calling Amadeus API...");
        const amadeusResponse = await fetch(`/api/airports/search?q=${encodeURIComponent(query)}`);
        const amadeusData = await amadeusResponse.json();
        
        if (amadeusResponse.ok) {
          console.log("Amadeus Success!", amadeusData);
          setAmadeusResults(amadeusData);
        } else {
          console.error("Amadeus API Error:", amadeusData);
          setAmadeusResults({ error: amadeusData.error || "Failed", airports: [] });
        }
      }

      if (apiSource === "google" || apiSource === "both") {
        console.log("Calling Google Places API...");
        const googleResponse = await fetch(`/api/airports/search-google?q=${encodeURIComponent(query)}`);
        const googleData = await googleResponse.json();
        
        if (googleResponse.ok) {
          console.log("Google Success!", googleData);
          setGoogleResults(googleData);
        } else {
          console.error("Google API Error:", googleData);
          setGoogleResults({ error: googleData.error || "Failed", airports: [] });
        }
      }
    } catch (err: any) {
      console.error("Network error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const amadeusHasSFO = amadeusResults?.airports?.some((a: any) => a.iataCode === "SFO");
  const amadeusHasSJC = amadeusResults?.airports?.some((a: any) => a.iataCode === "SJC");
  const googleHasSFO = googleResults?.airports?.some((a: any) => a.iataCode === "SFO");
  const googleHasSJC = googleResults?.airports?.some((a: any) => a.iataCode === "SJC");

  const renderResults = (results: any, title: string, isPrimary: boolean = false) => {
    if (!results) return null;

    const hasSFO = results.airports?.some((a: any) => a.iataCode === "SFO");
    const hasSJC = results.airports?.some((a: any) => a.iataCode === "SJC");

    return (
      <div className={`${isPrimary ? "" : "border-l-4 border-blue-200 pl-4"}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg">{title}</h3>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {results.source || "unknown"}
          </span>
        </div>

        {results.error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-600 text-sm">{results.error}</p>
          </div>
        ) : (
          <>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h4 className="font-medium text-sm mb-2">Palo Alto Test Results</h4>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">SFO:</span>
                  <span className={hasSFO ? "text-green-600" : "text-red-600"}>
                    {hasSFO ? "✅ FOUND" : "❌ NOT FOUND"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">SJC:</span>
                  <span className={hasSJC ? "text-green-600" : "text-red-600"}>
                    {hasSJC ? "✅ FOUND" : "❌ NOT FOUND"}
                  </span>
                </div>
              </div>
              {hasSFO && hasSJC && (
                <p className="text-green-700 font-semibold mt-2 text-sm">
                  🎉 TEST PASSED!
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                Found {results.count} airport{results.count !== 1 ? "s" : ""}
              </h4>
              {results.airports?.map((airport: any, index: number) => (
                <div
                  key={airport.iataCode + index}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold">
                        {airport.iataCode} - {airport.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {airport.city}, {airport.country}
                      </div>
                      {airport.hasIATA === false && (
                        <div className="text-xs text-orange-600 mt-1">
                          ⚠️ IATA code extracted/estimated
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                      #{index + 1}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">Airport Search API Test</h1>
          <p className="text-gray-600 mb-8">
            Compare Amadeus and Google Places airport search APIs
          </p>

          <div className="space-y-6 mb-8">
            {/* API Source Selection */}
            <div>
              <label className="block text-sm font-medium mb-3">API Source:</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setApiSource("amadeus")}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    apiSource === "amadeus"
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Amadeus
                </button>
                <button
                  onClick={() => setApiSource("google")}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    apiSource === "google"
                      ? "border-green-500 bg-green-50 text-green-700 font-medium"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Google Places
                </button>
                <button
                  onClick={() => setApiSource("both")}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    apiSource === "both"
                      ? "border-purple-500 bg-purple-50 text-purple-700 font-medium"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Both (Compare)
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Search Query:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="e.g., Palo Alto, SFO, San Francisco"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") testSearch();
                  }}
                />
                <Button
                  onClick={testSearch}
                  disabled={loading || !query.trim()}
                  className="px-6"
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>

            {/* Quick Test Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setQuery("Palo Alto");
                  setTimeout(testSearch, 100);
                }}
                variant="outline"
                size="sm"
              >
                Test: Palo Alto
              </Button>
              <Button
                onClick={() => {
                  setQuery("SFO");
                  setTimeout(testSearch, 100);
                }}
                variant="outline"
                size="sm"
              >
                Test: SFO
              </Button>
              <Button
                onClick={() => {
                  setQuery("San Francisco");
                  setTimeout(testSearch, 100);
                }}
                variant="outline"
                size="sm"
              >
                Test: San Francisco
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <h3 className="text-red-800 font-semibold mb-1">Error</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Results Display */}
          {(amadeusResults || googleResults) && (
            <div className="space-y-6">
              {apiSource === "both" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    {renderResults(amadeusResults, "Amadeus API Results")}
                  </div>
                  <div>
                    {renderResults(googleResults, "Google Places Results")}
                  </div>
                </div>
              ) : (
                <div>
                  {amadeusResults && renderResults(amadeusResults, "Amadeus API Results", true)}
                  {googleResults && renderResults(googleResults, "Google Places Results", true)}
                </div>
              )}

              {/* Combined Raw JSON */}
              <div className="bg-gray-50 border rounded-lg p-4">
                <details>
                  <summary className="cursor-pointer font-semibold">
                    Raw JSON Response
                  </summary>
                  <div className="mt-2 space-y-2">
                    {amadeusResults && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Amadeus:</h4>
                        <pre className="text-xs overflow-auto bg-white p-3 rounded border">
                          {JSON.stringify(amadeusResults, null, 2)}
                        </pre>
                      </div>
                    )}
                    {googleResults && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Google Places:</h4>
                        <pre className="text-xs overflow-auto bg-white p-3 rounded border">
                          {JSON.stringify(googleResults, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </div>
          )}

          {!amadeusResults && !googleResults && !error && !loading && (
            <div className="text-center text-gray-500 py-12">
              Select an API source and enter a search query to test
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold mb-3">About This Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold mb-2 text-blue-600">Amadeus API</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Endpoint: <code className="bg-gray-100 px-1 rounded">/api/airports/search</code></li>
                <li>• Aviation-specific data</li>
                <li>• Native IATA codes</li>
                <li>• Has fallback to static list</li>
                <li>• May have rate limits</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2 text-green-600">Google Places API</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Endpoint: <code className="bg-gray-100 px-1 rounded">/api/airports/search-google</code></li>
                <li>• General place search</li>
                <li>• IATA codes extracted/mapped</li>
                <li>• More reliable uptime</li>
                <li>• Better city-to-airport mapping</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            <strong>Test Goal:</strong> Searching "Palo Alto" should return SFO (San Francisco) and SJC (San Jose) airports.
          </p>
        </div>
      </div>
    </div>
  );
}
