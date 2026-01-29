"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary, WeatherData } from "@/lib/itinerary-view-types"
import { Cloud, MessageCircle, AlertTriangle } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { buildChatUrl } from "../lib/chat-integration"

interface WeatherSectionProps {
  itinerary: ViewItinerary
}

// Helper function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius: number): number {
  return Math.round((celsius * 9/5) + 32)
}

export function WeatherSection({ itinerary }: WeatherSectionProps) {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'forecast'>('forecast')
  
  // INSTRUMENTATION: Component lifecycle
  console.log('🌤️  WeatherSection MOUNTED/RENDERED');
  console.log('Props - itinerary:', {
    id: itinerary.id,
    title: itinerary.title,
    segmentCount: itinerary.segments.length
  });
  console.log('State - loading:', loading);
  console.log('State - weatherData.length:', weatherData.length);
  
  useEffect(() => {
    async function fetchWeather() {
      setLoading(true)
      
      console.log('=== WEATHER FETCH DEBUG ===');
      console.log('Total segments:', itinerary.segments.length);
      console.log('Segments:', itinerary.segments.map(s => ({
        id: s.id,
        title: s.title,
        startLat: s.startLat,
        startLng: s.startLng,
        endLat: s.endLat,
        endLng: s.endLng,
        startDate: s.startDate,
        endDate: s.endDate
      })));
      
      // Get weather locations - for travel segments fetch both start and end
      const weatherLocations = itinerary.segments.flatMap(seg => {
        // Skip segments with invalid coordinates
        if (!seg.startLat || !seg.startLng || !seg.endLat || !seg.endLng) {
          console.warn(`⚠️  Skipping weather for segment ${seg.id} (${seg.title}): Invalid coordinates`, {
            startLat: seg.startLat,
            startLng: seg.startLng,
            endLat: seg.endLat,
            endLng: seg.endLng
          });
          return [];
        }
        
        const isTravelSegment = seg.startTitle !== seg.endTitle
        
        if (isTravelSegment) {
          // For travel segments, get weather for both departure and arrival
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
          // For stay segments, just get the location weather for the full duration
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
      
      console.log('Weather locations to fetch:', weatherLocations.length);
      console.log('Weather locations:', weatherLocations);
      
      // Fetch weather for each location
      const weatherPromises = weatherLocations.map(async (loc, index) => {
        try {
          console.log(`[${index + 1}/${weatherLocations.length}] Fetching weather for:`, loc.name, { lat: loc.lat, lng: loc.lng });
          
          const response = await fetch('/api/weather/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              lat: loc.lat, 
              lng: loc.lng,
              dates: loc.dates 
            })
          });
          
          console.log(`[${index + 1}/${weatherLocations.length}] Response status for ${loc.name}:`, response.status, response.ok);
          
          const data = await response.json();
          console.log(`[${index + 1}/${weatherLocations.length}] Data for ${loc.name}:`, {
            location: data.location,
            country: data.country,
            forecastCount: data.forecast?.length || 0
          });
          
          return { ...data, segmentId: loc.segmentId, position: loc.position };
        } catch (err) {
          console.error(`[${index + 1}/${weatherLocations.length}] ERROR for ${loc.name}:`, err);
          return null;
        }
      })
      
      const results = await Promise.all(weatherPromises)
      console.log('=== WEATHER FETCH COMPLETE ===');
      console.log('Total results:', results.length);
      console.log('Valid results:', results.filter(Boolean).length);
      console.log('Null results:', results.filter(r => r === null).length);
      console.log('Results by segment:', results.map((r, i) => ({
        index: i,
        location: weatherLocations[i]?.name,
        segmentId: r?.segmentId,
        hasData: !!r,
        forecastCount: r?.forecast?.length || 0
      })));
      setWeatherData(results.filter(Boolean))
      setLoading(false)
    }
    
    // Call async function with error handling
    fetchWeather().catch((error) => {
      console.error('❌ CRITICAL: Weather fetch failed with unhandled error:', error);
      setLoading(false);
      setWeatherData([]);
    });
  }, [itinerary])
  
  // INSTRUMENTATION: Track state changes
  useEffect(() => {
    console.log('🔄 WeatherSection STATE CHANGED:', {
      loading,
      weatherDataLength: weatherData.length,
      hasSegments: itinerary.segments.length > 0
    });
  }, [loading, weatherData, itinerary.segments.length])
  
  // INSTRUMENTATION: Window debug helper
  useEffect(() => {
    (window as any).__debugWeather = {
      loading,
      weatherDataLength: weatherData.length,
      weatherData,
      itinerary: {
        id: itinerary.id,
        title: itinerary.title,
        segments: itinerary.segments.map(s => ({
          id: s.id,
          title: s.title,
          hasCoords: !!(s.startLat && s.endLat)
        }))
      }
    };
  }, [loading, weatherData, itinerary]);
  
  return (
    <section id="weather" className="scroll-mt-32 max-w-5xl mx-auto px-4 py-12">
      {loading ? (
        (() => {
          console.log('🔄 Rendering: LOADING state');
          return (
            <Card className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading weather forecast...</p>
            </Card>
          );
        })()
      ) : weatherData.length === 0 ? (
        (() => {
          console.log('⚠️  Rendering: EMPTY DATA state', {
            segmentCount: itinerary.segments.length,
            loading: false
          });
          return (
            <Card className="p-8 text-center">
              <Cloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Weather data unavailable</p>
            </Card>
          );
        })()
      ) : (
        (() => {
          console.log('✅ Rendering: WEATHER DATA state', {
            weatherDataLength: weatherData.length,
            segmentCount: itinerary.segments.length
          });
          
          // Extract unique locations from weather data
          const uniqueLocations = Array.from(
            new Map(
              weatherData.map(w => [`${w.location}-${w.country}`, w])
            ).values()
          );
          
          // Get next 6 days starting from today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const forecastDays = Array.from({ length: 6 }, (_, i) => {
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
            <div className="space-y-6">
              {/* Header with legend */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  5-day weather forecast for your destinations
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                    <span>Your trip dates</span>
                  </div>
                </div>
              </div>
              
              {/* Weather Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-border">
                      <th className="text-left p-3 font-semibold bg-muted/50">
                        Location
                      </th>
                      {forecastDays.map((date, idx) => (
                        <th key={idx} className="text-center p-3 font-semibold bg-muted/50 min-w-[120px]">
                          <div className="text-sm">
                            {idx === 0 ? 'Today' : `Day +${idx}`}
                          </div>
                          <div className="text-xs font-normal text-muted-foreground">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-3 font-semibold bg-muted/50 min-w-[140px]">
                        Future
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueLocations.map((locationData, locIdx) => {
                      const locationName = locationData.location;
                      
                      return (
                        <tr key={locIdx} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3 font-medium">
                            <div className="flex items-center gap-2">
                              <span>{locationName}</span>
                              <span className="text-xs text-muted-foreground">
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
                            
                            return (
                              <td 
                                key={dayIdx} 
                                className={`p-3 text-center relative ${
                                  isHighlighted 
                                    ? 'bg-green-50 border-l-2 border-r-2 border-green-300' 
                                    : ''
                                }`}
                              >
                                {dayForecast ? (
                                  <div className="space-y-1">
                                    {isHighlighted && (
                                      <div className="absolute top-1 right-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      </div>
                                    )}
                                    <img
                                      src={`https://openweathermap.org/img/wn/${dayForecast.icon}@2x.png`}
                                      alt={dayForecast.description}
                                      className="w-10 h-10 mx-auto"
                                    />
                                    <div className="text-lg font-bold">
                                      {celsiusToFahrenheit(dayForecast.temp)}°F
                                    </div>
                                    <div className="text-sm font-medium text-muted-foreground">
                                      {Math.round(dayForecast.temp)}°C
                                    </div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                      {dayForecast.description}
                                    </div>
                                    {dayForecast.precipitation > 30 && (
                                      <div className="text-xs text-blue-600">
                                        💧 {Math.round(dayForecast.precipitation)}%
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    No data
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          
                          {/* Future column */}
                          <td className="p-3 text-center bg-muted/50">
                            <div className="text-xs text-muted-foreground">
                              Available<br/>closer to<br/>the time
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Footer note */}
              <div className="text-xs text-muted-foreground text-center mb-6">
                Weather forecasts are updated every 10 minutes. 
                Forecasts beyond 5 days will become available as your trip approaches.
              </div>

              {/* Forecast Availability Notice */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Forecast Availability</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Real-time weather data is currently available for the next 5 days. Long-range forecasts are based on historical averages.
                  </p>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </section>
  )
}
