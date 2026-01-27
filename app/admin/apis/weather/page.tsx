"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, AlertTriangle, MapPin } from "lucide-react";
import { ApiTestLayout } from "../_components/api-test-layout";
import { AdminMultiLocationMap } from "../_components/admin-map-components";
import { cachedFetch, CacheTTL } from "@/lib/admin/api-cache";
import { trackCost } from "@/lib/admin/cost-tracker";

interface WeatherData {
  coord?: { lat: number; lon: number };
  weather?: Array<{ main: string; description: string; icon: string }>;
  main?: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility?: number;
  wind?: { speed: number; deg: number };
  clouds?: { all: number };
  name?: string;
  sys?: { country: string };
}

interface ForecastData {
  list?: Array<{
    dt: number;
    dt_txt: string;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
    };
    weather: Array<{ main: string; description: string; icon: string }>;
    wind: { speed: number };
  }>;
  city?: {
    name: string;
    coord: { lat: number; lon: number };
  };
}

export default function WeatherAPIPage() {
  // Current Weather State
  const [currentLocation, setCurrentLocation] = useState("London");
  const [currentLoading, setCurrentLoading] = useState(false);
  const [currentData, setCurrentData] = useState<WeatherData | null>(null);
  const [showCurrentMap, setShowCurrentMap] = useState(false);

  // Forecast State
  const [forecastLocation, setForecastLocation] = useState("Paris");
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [showForecastMap, setShowForecastMap] = useState(false);

  // Multi-City Comparison State
  const [cities, setCities] = useState("London,Paris,New York,Tokyo");
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<WeatherData[]>([]);
  const [showComparisonMap, setShowComparisonMap] = useState(false);

  // Travel Advisory State
  const [advisoryLocation, setAdvisoryLocation] = useState("Barcelona");
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryData, setAdvisoryData] = useState<any>(null);

  const fetchCurrentWeather = async () => {
    setCurrentLoading(true);
    try {
      const data = await cachedFetch(
        "/api/admin/test/weather",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: currentLocation, type: "current" }),
        },
        { location: currentLocation, type: "current" },
        CacheTTL.WEATHER
      );

      setCurrentData(data.data);
      trackCost("openweather", "current", { location: currentLocation });
    } catch (error) {
      console.error(error);
    } finally {
      setCurrentLoading(false);
    }
  };

  const fetchForecast = async () => {
    setForecastLoading(true);
    try {
      const data = await cachedFetch(
        "/api/admin/test/weather",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: forecastLocation, type: "forecast" }),
        },
        { location: forecastLocation, type: "forecast" },
        CacheTTL.WEATHER
      );

      setForecastData(data.data);
      trackCost("openweather", "forecast", { location: forecastLocation });
    } catch (error) {
      console.error(error);
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchComparison = async () => {
    setComparisonLoading(true);
    try {
      const cityList = cities.split(",").map(c => c.trim());
      const results = await Promise.all(
        cityList.map(async (city) => {
          const data = await cachedFetch(
            "/api/admin/test/weather",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ location: city, type: "current" }),
            },
            { location: city, type: "current" },
            CacheTTL.WEATHER
          );
          trackCost("openweather", "current", { location: city });
          return data.data;
        })
      );

      setComparisonData(results);
    } catch (error) {
      console.error(error);
    } finally {
      setComparisonLoading(false);
    }
  };

  const generateAdvisory = async () => {
    setAdvisoryLoading(true);
    try {
      // First get weather data
      const weatherData = await cachedFetch(
        "/api/admin/test/weather",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ location: advisoryLocation, type: "current" }),
        },
        { location: advisoryLocation, type: "current" },
        CacheTTL.WEATHER
      );

      // Mock AI advisory (in production, call OpenAI API)
      const advisory = {
        location: advisoryLocation,
        weather: weatherData.data,
        suitability: Math.random() > 0.5 ? "Excellent" : "Good",
        score: Math.floor(Math.random() * 30) + 70,
        recommendations: [
          "Pack light layers for variable temperatures",
          "Bring an umbrella for occasional showers",
          "Sunscreen recommended for outdoor activities",
        ],
        bestTimeToVisit: "Morning and late afternoon",
        activities: [
          "Outdoor sightseeing",
          "Walking tours",
          "Café culture",
        ],
      };

      setAdvisoryData(advisory);
      trackCost("openweather", "current", { location: advisoryLocation });
    } catch (error) {
      console.error(error);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const getWeatherIcon = (main?: string) => {
    switch (main?.toLowerCase()) {
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case "clouds":
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case "rain":
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      default:
        return <Cloud className="h-8 w-8 text-gray-400" />;
    }
  };

  return (
    <ApiTestLayout
      title="Weather API"
      description="OpenWeatherMap integration for current weather, forecasts, and travel advisories"
      breadcrumbs={[{ label: "Weather" }]}
    >
      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Current Weather</TabsTrigger>
          <TabsTrigger value="forecast">5-Day Forecast</TabsTrigger>
          <TabsTrigger value="comparison">Multi-City</TabsTrigger>
          <TabsTrigger value="advisory">Travel Advisory</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        {/* Current Weather Tab */}
        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Weather</CardTitle>
              <CardDescription>Real-time weather data for any location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="current-location">Location</Label>
                  <Input
                    id="current-location"
                    placeholder="Enter city name"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={fetchCurrentWeather} disabled={currentLoading}>
                {currentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Current Weather
              </Button>

              {currentData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold">
                      {currentData.name}, {currentData.sys?.country}
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCurrentMap(!showCurrentMap)}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {showCurrentMap ? "Hide" : "Show"} Map
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Temperature</p>
                            <p className="text-3xl font-bold">{currentData.main?.temp.toFixed(1)}°C</p>
                            <p className="text-xs text-muted-foreground">
                              Feels like {currentData.main?.feels_like.toFixed(1)}°C
                            </p>
                          </div>
                          {getWeatherIcon(currentData.weather?.[0]?.main)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Humidity</p>
                            <p className="text-3xl font-bold">{currentData.main?.humidity}%</p>
                          </div>
                          <Droplets className="h-8 w-8 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Wind Speed</p>
                            <p className="text-3xl font-bold">{currentData.wind?.speed.toFixed(1)} m/s</p>
                          </div>
                          <Wind className="h-8 w-8 text-gray-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Pressure</p>
                            <p className="text-3xl font-bold">{currentData.main?.pressure} hPa</p>
                          </div>
                          <Gauge className="h-8 w-8 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Condition</span>
                          <Badge>{currentData.weather?.[0]?.main}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Description</span>
                          <span className="text-sm capitalize">{currentData.weather?.[0]?.description}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Visibility</span>
                          <span className="text-sm">{((currentData.visibility || 0) / 1000).toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Cloud Cover</span>
                          <span className="text-sm">{currentData.clouds?.all}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {showCurrentMap && currentData.coord && (
                    <AdminMultiLocationMap
                      locations={[
                        {
                          lat: currentData.coord.lat,
                          lng: currentData.coord.lon,
                          name: currentData.name || "Location",
                          description: `${currentData.main?.temp.toFixed(1)}°C - ${currentData.weather?.[0]?.description}`,
                          category: "weather",
                        },
                      ]}
                      title="Weather Location"
                      showDebug={true}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>5-Day Forecast</CardTitle>
              <CardDescription>3-hour interval forecast data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="forecast-location">Location</Label>
                  <Input
                    id="forecast-location"
                    placeholder="Enter city name"
                    value={forecastLocation}
                    onChange={(e) => setForecastLocation(e.target.value)}
                  />
                </div>
              </div>

              <Button onClick={fetchForecast} disabled={forecastLoading}>
                {forecastLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get Forecast
              </Button>

              {forecastData?.list && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{forecastData.city?.name}</h3>
                    <Badge variant="secondary">{forecastData.list.length} data points</Badge>
                  </div>

                  <div className="grid gap-2">
                    {forecastData.list.slice(0, 8).map((item, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {getWeatherIcon(item.weather[0]?.main)}
                              <div>
                                <p className="font-medium">
                                  {new Date(item.dt * 1000).toLocaleString()}
                                </p>
                                <p className="text-sm text-muted-foreground capitalize">
                                  {item.weather[0]?.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{item.main.temp.toFixed(1)}°C</p>
                              <p className="text-sm text-muted-foreground">
                                Humidity: {item.main.humidity}%
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-City Comparison Tab */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Multi-City Comparison</CardTitle>
              <CardDescription>Compare weather across multiple cities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cities">Cities (comma-separated)</Label>
                <Input
                  id="cities"
                  placeholder="London, Paris, New York, Tokyo"
                  value={cities}
                  onChange={(e) => setCities(e.target.value)}
                />
              </div>

              <Button onClick={fetchComparison} disabled={comparisonLoading}>
                {comparisonLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Compare Cities
              </Button>

              {comparisonData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">Comparison Results</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowComparisonMap(!showComparisonMap)}
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      {showComparisonMap ? "Hide" : "Show"} Map
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {comparisonData.map((data, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {data.name}, {data.sys?.country}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              {getWeatherIcon(data.weather?.[0]?.main)}
                              <span className="text-3xl font-bold">
                                {data.main?.temp.toFixed(1)}°C
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground capitalize">
                              {data.weather?.[0]?.description}
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                              <div>
                                <p className="text-muted-foreground">Humidity</p>
                                <p className="font-medium">{data.main?.humidity}%</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Wind</p>
                                <p className="font-medium">{data.wind?.speed.toFixed(1)} m/s</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {showComparisonMap && (
                    <AdminMultiLocationMap
                      locations={comparisonData
                        .filter(d => d.coord)
                        .map((data) => ({
                          lat: data.coord!.lat,
                          lng: data.coord!.lon,
                          name: data.name || "Location",
                          description: `${data.main?.temp.toFixed(1)}°C - ${data.weather?.[0]?.description}`,
                          category: "weather",
                          rating: data.main?.temp ? Math.min(5, Math.max(1, data.main.temp / 10)) : undefined,
                        }))}
                      title="Weather Comparison Map"
                      showDebug={true}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Travel Advisory Tab */}
        <TabsContent value="advisory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Travel Advisory</CardTitle>
              <CardDescription>AI-generated travel recommendations based on weather</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="advisory-location">Destination</Label>
                <Input
                  id="advisory-location"
                  placeholder="Enter destination"
                  value={advisoryLocation}
                  onChange={(e) => setAdvisoryLocation(e.target.value)}
                />
              </div>

              <Button onClick={generateAdvisory} disabled={advisoryLoading}>
                {advisoryLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Advisory
              </Button>

              {advisoryData && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{advisoryData.location}</CardTitle>
                        <Badge
                          variant={advisoryData.suitability === "Excellent" ? "default" : "secondary"}
                        >
                          {advisoryData.suitability}
                        </Badge>
                      </div>
                      <CardDescription>Travel Suitability Score: {advisoryData.score}/100</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {advisoryData.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <span className="text-blue-500">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Best Time to Visit</h4>
                        <p className="text-sm text-muted-foreground">{advisoryData.bestTimeToVisit}</p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">Recommended Activities</h4>
                        <div className="flex flex-wrap gap-2">
                          {advisoryData.activities.map((activity: string, i: number) => (
                            <Badge key={i} variant="outline">
                              {activity}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weather Alerts</CardTitle>
              <CardDescription>Severe weather warnings and advisories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-5 w-5" />
                <p>No active weather alerts at this time</p>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Weather alerts will appear here when severe weather conditions are detected.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ApiTestLayout>
  );
}
