import { useState, useEffect } from "react"
import type { ViewItinerary, WeatherData } from "@/lib/itinerary-view-types"
import { Cloud, AlertCircle, RefreshCw } from "lucide-react"
import { Card } from "./card"
import { Button } from "@/components/ui/button"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"
import { useIntelligenceCache } from "../contexts/intelligence-context"
import { saveWeatherCache } from "@/lib/actions/batch-intelligence-actions"
import { IntelligenceLoading } from "./intelligence-loading"

interface WeatherViewProps {
  itinerary: ViewItinerary
}

// Helper function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9/5) + 32)
}

// Helper function to convert m/s to mph
function metersPerSecondToMph(ms: number): number {
  return Math.round(ms * 2.237)
}

// Generate a location key for caching
function getLocationKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)}:${lng.toFixed(4)}`
}

export function WeatherView({ itinerary }: WeatherViewProps) {
  const { cache, setCache, hasCache, isPreloaded } = useIntelligenceCache()
  
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [initialCheckComplete, setInitialCheckComplete] = useState(false)
  const [tempUnit, setTempUnit] = useState<'F' | 'C'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('weather-temp-unit') as 'F' | 'C') || 'F';
    }
    return 'F';
  })

  const formatTemp = (celsius: number): string => {
    if (tempUnit === 'F') {
      return `${celsiusToFahrenheit(celsius)}°F`
    }
    return `${Math.round(celsius)}°C`
  }

  const formatTempRange = (min: number, max: number): string => {
    if (tempUnit === 'F') {
      return `${celsiusToFahrenheit(min)}-${celsiusToFahrenheit(max)}°F`
    }
    return `${Math.round(min)}-${Math.round(max)}°C`
  }

  // Get weather locations from itinerary
  const getWeatherLocations = () => {
    return itinerary.segments.flatMap(seg => {
      if (!seg.startLat || !seg.startLng || !seg.endLat || !seg.endLng) {
        return [];
      }
      
      const isTravelSegment = seg.startTitle !== seg.endTitle
      
      if (isTravelSegment) {
        return [
          { 
            name: seg.startTitle, 
            lat: seg.startLat, 
            lng: seg.startLng, 
            dates: { start: seg.startDate, end: seg.startDate },
            segmentId: seg.id,
            position: 'departure' as const
          },
          { 
            name: seg.endTitle, 
            lat: seg.endLat, 
            lng: seg.endLng, 
            dates: { start: seg.endDate, end: seg.endDate },
            segmentId: seg.id,
            position: 'arrival' as const
          }
        ]
      } else {
        return [{
          name: seg.endTitle,
          lat: seg.endLat,
          lng: seg.endLng,
          dates: { start: seg.startDate, end: seg.endDate },
          segmentId: seg.id,
          position: 'stay' as const
        }]
      }
    })
  }

  useEffect(() => {
    async function initializeWeather() {
      // Check if we have cached weather data
      if (hasCache('weather')) {
        const cachedWeather = cache.weather
        if (cachedWeather?.locations && cachedWeather.locations.length > 0) {
          // Transform cached data back to WeatherData format
          const transformedData = cachedWeather.locations.map((loc: any) => ({
            ...loc.weatherData,
            segmentId: loc.locationKey,
          }))
          setWeatherData(transformedData)
          setLoading(false)
          setInitialCheckComplete(true)
          return
        }
      }

      // Show brief checking state if we weren't preloaded
      if (!isPreloaded) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      setInitialCheckComplete(true)
      // No cache or expired - fetch fresh data
      await fetchWeather()
    }
    
    initializeWeather()
  }, [itinerary.id])

  async function fetchWeather() {
    setLoading(true)
    
    const weatherLocations = getWeatherLocations()
    
    // Fetch weather for each location
    const weatherPromises = weatherLocations.map(async (loc) => {
      const locationKey = getLocationKey(loc.lat, loc.lng)
      
      try {
        const response = await fetch('/api/weather/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            lat: loc.lat, 
            lng: loc.lng,
            dates: loc.dates 
          })
        });
        
        const data = await response.json();
        const weatherResult = { ...data, segmentId: loc.segmentId, position: loc.position };
        
        // Save to cache with 1-hour TTL
        await saveWeatherCache(itinerary.id, locationKey, weatherResult)
        
        return weatherResult;
      } catch (err) {
        console.error(`Error fetching weather for ${loc.name}:`, err);
        return null;
      }
    })
    
    const results = await Promise.all(weatherPromises)
    const validResults = results.filter(Boolean)
    
    setWeatherData(validResults)
    
    // Update the context cache
    if (validResults.length > 0) {
      const cacheData = {
        locations: weatherLocations.map((loc, idx) => ({
          locationKey: getLocationKey(loc.lat, loc.lng),
          weatherData: validResults[idx],
        })).filter((_, idx) => validResults[idx])
      }
      setCache('weather', cacheData)
    }
    
    setLoading(false)
  }

  const handleRefresh = () => {
    setCache('weather', undefined)
    fetchWeather()
  }

  const handleTempUnitChange = (unit: 'F' | 'C') => {
    setTempUnit(unit)
    localStorage.setItem('weather-temp-unit', unit)
  }

  // Show checking state while initializing
  if (!initialCheckComplete) {
    return <IntelligenceLoading feature="weather" mode="checking" />
  }

  if (loading) {
    return <IntelligenceLoading feature="weather" mode="generating" />
  }

  if (weatherData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Cloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Weather data unavailable</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-4"
          onClick={handleRefresh}
        >
          <RefreshCw size={14} className="mr-2" />
          Retry
        </Button>
      </Card>
    )
  }

  // Extract unique locations from weather data
  const uniqueLocations = Array.from(
    new Map(
      weatherData.map(w => [`${w.location}-${w.country}`, w])
    ).values()
  );

  // Get next 5 days starting from today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const forecastDays = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Helper: Check if a date overlaps with any segment dates
  const isDateInSegments = (date: Date, location: string) => {
    return itinerary.segments.some(seg => {
      const segStart = new Date(seg.startDate);
      const segEnd = new Date(seg.endDate);
      segStart.setHours(0, 0, 0, 0);
      segEnd.setHours(0, 0, 0, 0);
      
      const matchesLocation = 
        seg.startTitle === location || 
        seg.endTitle === location;
      
      return matchesLocation && date >= segStart && date <= segEnd;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Temperature Unit Toggle and Refresh */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="text-xs"
        >
          <RefreshCw size={14} className="mr-2" />
          Refresh
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Temperature:</span>
          <div className="inline-flex rounded-md border border-border bg-background p-1">
            <Button
              variant={tempUnit === 'F' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTempUnitChange('F')}
              className="h-7 px-3 text-xs"
            >
              °F
            </Button>
            <Button
              variant={tempUnit === 'C' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleTempUnitChange('C')}
              className="h-7 px-3 text-xs"
            >
              °C
            </Button>
          </div>
        </div>
      </div>

      {/* Weather Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left p-3 font-semibold bg-muted/50 sticky left-0 z-10 min-w-[180px]">
                Location
              </th>
              {forecastDays.map((date, idx) => (
                <th key={idx} className="text-center p-3 font-semibold bg-muted/50 min-w-[160px]">
                  <div className="text-sm font-bold">
                    {idx === 0 ? 'Today' : `Day +${idx}`}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueLocations.map((locationData, locIdx) => {
              const locationName = locationData.location;
              
              return (
                <tr key={locIdx} className="border-b border-border hover:bg-muted/30">
                  <td className="p-3 font-medium bg-background sticky left-0 z-10">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">{locationName}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">
                        {locationData.country}
                      </span>
                    </div>
                  </td>
                  
                  {forecastDays.map((date, dayIdx) => {
                    // Find forecast for this day
                    const dayForecast = locationData.forecast?.find((f: any) => {
                      const forecastDate = new Date(f.date);
                      forecastDate.setHours(0, 0, 0, 0);
                      return forecastDate.getTime() === date.getTime();
                    });
                    
                    const isHighlighted = isDateInSegments(date, locationName);
                    
                    if (!dayForecast) {
                      return (
                        <td key={dayIdx} className="p-3 text-center">
                          <div className="text-xs text-muted-foreground py-2">
                            No data
                          </div>
                        </td>
                      )
                    }

                    // Determine side for hover card (left for last column, right for others)
                    const hoverSide = dayIdx === forecastDays.length - 1 ? 'left' : 'right';

                    return (
                      <td 
                        key={dayIdx}
                        className={`p-3 text-center align-top ${
                          isHighlighted 
                            ? 'bg-green-50/50 border-l-2 border-r-2 border-green-300' 
                            : ''
                        }`}
                      >
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <div className="cursor-help space-y-2 w-full">
                              {isHighlighted && (
                                <div className="flex justify-center mb-1">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                </div>
                              )}
                              
                              {/* Weather Icon */}
                              <div className="flex justify-center">
                                <img
                                  src={`https://openweathermap.org/img/wn/${dayForecast.icon}@2x.png`}
                                  alt={dayForecast.description}
                                  className="w-10 h-10"
                                />
                              </div>
                              
                              {/* High/Low Temperatures - Simplified */}
                              <div className="space-y-0.5">
                                <div className="text-lg font-bold text-slate-900">
                                  {formatTemp(dayForecast.temp_max)}
                                </div>
                                <div className="text-sm font-medium text-slate-600">
                                  {formatTemp(dayForecast.temp_min)}
                                </div>
                              </div>
                              
                              {/* Description */}
                              <div className="text-xs font-medium text-slate-700 capitalize pt-1">
                                {dayForecast.description}
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent 
                            className="w-64 p-3" 
                            side={hoverSide}
                            align="start"
                            sideOffset={8}
                          >
                            <div className="space-y-2.5">
                              {/* Header */}
                              <div className="border-b border-border pb-1.5">
                                <div className="font-semibold text-xs">
                                  {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {locationName}
                                </div>
                              </div>

                              {/* Daily Summary */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">High:</span>
                                  <span className="font-bold">{formatTemp(dayForecast.temp_max)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Low:</span>
                                  <span className="font-bold">{formatTemp(dayForecast.temp_min)}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Feels:</span>
                                  <span>{formatTemp(dayForecast.feels_like)}</span>
                                </div>
                              </div>

                              {/* Time Periods */}
                              {(dayForecast.morning || dayForecast.afternoon || dayForecast.evening) && (
                                <div className="space-y-1 pt-1.5 border-t border-border">
                                  {dayForecast.morning && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Morning:</span>
                                      <span className="font-medium">{formatTempRange(dayForecast.morning.temp_min, dayForecast.morning.temp_max)}</span>
                                    </div>
                                  )}
                                  {dayForecast.afternoon && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Afternoon:</span>
                                      <span className="font-medium">{formatTempRange(dayForecast.afternoon.temp_min, dayForecast.afternoon.temp_max)}</span>
                                    </div>
                                  )}
                                  {dayForecast.evening && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Evening:</span>
                                      <span className="font-medium">{formatTempRange(dayForecast.evening.temp_min, dayForecast.evening.temp_max)}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Additional Metrics */}
                              <div className="space-y-1 pt-1.5 border-t border-border">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Humidity:</span>
                                  <span>{dayForecast.humidity}%</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">Wind:</span>
                                  <span>{metersPerSecondToMph(dayForecast.wind_speed)} mph</span>
                                </div>
                                {dayForecast.precipitation > 0 && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Precip:</span>
                                    <span className="text-blue-600">{Math.round(dayForecast.precipitation)}%</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Forecast Availability Notice */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">Forecast Availability</h4>
          <p className="text-xs text-blue-700 mt-1">
            Weather data is cached for 1 hour. Click "Refresh" to get the latest forecast. Real-time data is available for the next 5 days.
          </p>
        </div>
      </div>
    </div>
  )
}
