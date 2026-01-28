import { useState, useEffect } from "react"
import type { ViewItinerary } from "@/lib/itinerary-view-types"
import { Cloud, Snowflake, CloudRain, AlertCircle } from "lucide-react"
import { Card } from "./card"
import { Badge } from "./badge"

interface WeatherViewProps {
  itinerary: ViewItinerary
}

interface WeatherData {
  location: string
  country: string
  forecast: Array<{
    date: string
    temp: number
    description: string
    icon: string
    precipitation?: number
  }>
}

export function WeatherView({ itinerary }: WeatherViewProps) {
  const [weatherData, setWeatherData] = useState<{origin?: WeatherData, destination?: WeatherData}>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWeather = async () => {
      // Get origin and destination
      const firstSegment = itinerary.segments[0]
      const mainDestination = itinerary.segments.find(s => s.segmentType.toLowerCase().includes('stay')) || itinerary.segments[1]

      if (firstSegment && mainDestination) {
        try {
          const [originRes, destRes] = await Promise.all([
            fetch('/api/weather/forecast', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lat: firstSegment.startLat,
                lng: firstSegment.startLng,
                dates: { start: firstSegment.startDate, end: firstSegment.startDate }
              })
            }),
            fetch('/api/weather/forecast', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lat: mainDestination.endLat,
                lng: mainDestination.endLng,
                dates: { start: mainDestination.startDate, end: mainDestination.endDate }
              })
            })
          ])

          const origin = await originRes.json()
          const dest = await destRes.json()

          setWeatherData({
            origin: {
              location: firstSegment.startTitle,
              country: 'US',
              forecast: origin.forecast || []
            },
            destination: {
              location: mainDestination.endTitle,
              country: dest.country || 'JP',
              forecast: dest.forecast || []
            }
          })
        } catch (error) {
          console.error('Weather fetch error:', error)
        }
      }
      setLoading(false)
    }

    fetchWeather()
  }, [itinerary])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">Forecast Availability</h4>
          <p className="text-xs text-blue-700 mt-1">
            Real-time weather data is currently available for the next 5 days. Long-range forecasts are based on historical averages.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Origin Weather */}
        {weatherData.origin && (
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{weatherData.origin.location}</h3>
                    <Badge variant="default" className="bg-slate-100">Departure</Badge>
                  </div>
                  <p className="text-slate-500 text-sm">{new Date(itinerary.startDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                </div>
                <Cloud size={32} className="text-slate-400" />
              </div>
              
              {weatherData.origin.forecast[0] && (
                <>
                  <div className="flex items-end gap-4 mb-8">
                    <span className="text-5xl font-bold text-slate-900">{Math.round(weatherData.origin.forecast[0].temp)}°C</span>
                    <span className="text-lg font-medium text-slate-500 mb-2">{weatherData.origin.forecast[0].description}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold w-8 text-slate-400">TODAY</span>
                        <div className="flex items-center gap-2">
                          <Cloud size={16} className="text-slate-400" />
                          <span className="text-sm font-semibold">{Math.round(weatherData.origin.forecast[0].temp)}°C</span>
                        </div>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">You're Here</Badge>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* Destination Weather */}
        {weatherData.destination && (
          <Card className="border-t-4 border-t-blue-500">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{weatherData.destination.location}</h3>
                    <Badge variant="info">Arrival</Badge>
                  </div>
                  <p className="text-slate-500 text-sm">
                    {new Date(itinerary.segments[1]?.startDate || itinerary.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(itinerary.segments[1]?.endDate || itinerary.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <Snowflake size={32} className="text-blue-400" />
              </div>
              
              {weatherData.destination.forecast[0] && (
                <>
                  <div className="flex items-end gap-4 mb-8">
                    <span className="text-5xl font-bold text-slate-900">{Math.round(weatherData.destination.forecast[0].temp)}°C</span>
                    <span className="text-lg font-medium text-blue-500 mb-2">{weatherData.destination.forecast[0].description}</span>
                  </div>

                  <div className="space-y-2">
                    {weatherData.destination.forecast.slice(0, 4).map((day, idx) => {
                      const date = new Date(day.date)
                      const isToday = idx === 0
                      
                      return (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isToday ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="text-center w-8">
                              <span className={`text-xs font-bold block ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>
                                {date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                              </span>
                              <span className={`text-xs font-bold ${isToday ? 'text-blue-900' : 'text-slate-900'}`}>
                                {date.getDate()}
                              </span>
                            </div>
                            <Snowflake size={18} className={isToday ? 'text-blue-500' : 'text-slate-400'} />
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{Math.round(day.temp)}°C</p>
                              <p className={`text-xs ${isToday ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                                {day.description}{day.precipitation ? ` • ${day.precipitation}%` : ''}
                              </p>
                            </div>
                          </div>
                          {isToday && (
                            <Badge className="bg-blue-200 text-blue-800 border-blue-300">You're Here</Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
