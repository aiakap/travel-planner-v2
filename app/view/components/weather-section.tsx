"use client"

import { useState, useEffect } from "react"
import type { ViewItinerary, WeatherData } from "@/lib/itinerary-view-types"
import { Cloud } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

interface WeatherSectionProps {
  itinerary: ViewItinerary
}

export function WeatherSection({ itinerary }: WeatherSectionProps) {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'forecast'>('forecast')
  
  useEffect(() => {
    async function fetchWeather() {
      setLoading(true)
      
      // Get unique destinations with coordinates
      const destinations = itinerary.segments.map(seg => ({
        name: seg.endTitle,
        lat: seg.endLat,
        lng: seg.endLng,
        dates: { start: seg.startDate, end: seg.endDate }
      }))
      
      // Fetch weather for each destination
      const weatherPromises = destinations.map(dest =>
        fetch('/api/weather/forecast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            lat: dest.lat, 
            lng: dest.lng,
            dates: dest.dates 
          })
        }).then(r => r.json()).catch(() => null)
      )
      
      const results = await Promise.all(weatherPromises)
      setWeatherData(results.filter(Boolean))
      setLoading(false)
    }
    
    fetchWeather()
  }, [itinerary])
  
  return (
    <section id="weather" className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-6">
        <Cloud className="h-6 w-6 text-sky-500" />
        <h2 className="text-3xl font-bold">Weather & Climate</h2>
      </div>
      
      {loading ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading weather forecast...</p>
        </Card>
      ) : weatherData.length === 0 ? (
        <Card className="p-8 text-center">
          <Cloud className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Weather data unavailable</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {weatherData.map((data, index) => {
            const segment = itinerary.segments[index]
            const segmentColor = itinerary.segmentColors[segment?.id] || '#0EA5E9'
            
            return (
              <Card key={index} className="p-6" style={{ borderLeft: `4px solid ${segmentColor}` }}>
                <div className="mb-4">
                  <h3 className="font-semibold text-lg">{data.location}, {data.country}</h3>
                  <p className="text-sm text-muted-foreground">
                    {segment?.startDate} - {segment?.endDate}
                  </p>
                </div>
                
                {/* Forecast Cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {data.forecast.slice(0, 5).map((forecast, i) => {
                    const date = new Date(forecast.date)
                    
                    return (
                      <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-xs font-medium text-muted-foreground mb-2">
                          {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                        <img
                          src={`https://openweathermap.org/img/wn/${forecast.icon}@2x.png`}
                          alt={forecast.description}
                          className="w-12 h-12 mx-auto"
                        />
                        <div className="text-2xl font-bold">{forecast.temp}°C</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {forecast.description}
                        </div>
                        {forecast.precipitation > 30 && (
                          <div className="text-xs text-sky-600 mt-1">
                            {Math.round(forecast.precipitation)}% rain
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
